# -*- coding: utf-8 -*-
"""Allen 工作間的剪紙動畫素材產生器 ── 冪等,跑幾次結果都一樣
    python tools/gen-allen-room-assets.py

輸入
  assets/svg/robot_workshop_strict_source_package/
      source_original_embedded.png   原始場景圖 1254×1254
      components_png/<id>.png        22 個切片(只當種子用,見下)
      manifest_strict.json           每個切片的 bbox
  assets/svg/robot_workshop_background_filled.svg
      美術重畫的「空房間」—— 所有可動物件都拿掉、洞補好的乾淨底板
      (副檔名是 .svg,裡面其實是一張內嵌的 PNG,本檔自己解出來)

輸出
  assets/allen/room/stage.webp        底板
  assets/allen/room/parts/<id>.webp   會動的元件
  assets/allen/room/grade/*.webp      天色分級圖(黃昏 / 夜晚 / 各時段的關燈版)
  allen-room-parts.js                 每個元件的貼圖框(產生檔,不要手改)

這支不是網站建置流程的一部分,是換素材時手動跑一次。留在 repo 裡是因為做法有幾個
非直覺的決定,忘記了就會做壞:

1) 元件的遮罩「不」直接用套件的 components_png 的 alpha。
   那些切片系統性偏小:物件右側的暗面與投影沒收進去。用它當遮罩的話,那圈深色會
   留在底板上不動,物件一擺動就變成雙重輪廓 —— 在 300px 的實際顯示尺寸看得出來。
   改成用「原圖 vs 空房間」的差異當遮罩:凡是兩張圖不一樣的地方,就是這個物件
   (含描邊與投影)佔到的地方,整組跟著物件走。套件的 alpha 只留著當種子,
   用來挑出差異圖裡屬於這個物件的那一團。

2) 底板只在「元件遮罩內」換成空房間的像素,其餘保留原圖。
   空房間那張是重畫的、不是原圖的還原 —— 牆面接縫的位置差幾 px、亮度差幾階。
   整張換掉的話,沒被拿走的東西會集體位移。

3) 換進去之前要做色調補償,而取樣的那一圈必須排除「其他元件」佔到的地方。
   不排除的話,洞洞板上的板手會取樣到隔壁那支板手(原圖是深灰、空房間是淺木板),
   算出來的偏移會把整塊補丁壓成一團咖啡色。

因為遮罩是二值的(不做羽化),底板 + 元件貼回原位在數學上等於原圖,只差 webp 量化。
本檔最後會自己驗一次 RMSE,超標就中止。

4) 天色不做成「另外三張底板」,做成兩張分級圖(multiply + screen)。
   理由不是省流量(雖然也省很多),是正確性:另外三張底板只會換掉底板,會動的
   12 個元件、飄的雲、還有站在房間裡的 Allen 全都還是白天的顏色,人會浮在夜景上。
   分級圖疊在「房間 + Allen」整疊的最上面,一次把所有東西一起調到同一個時段。

   任何一組「原圖 → 目標」都可以拆成這兩層,而且是精確的(不是近似):
       B = 原圖 × M                 M = clamp(目標 / 原圖, 0, 1)   ← multiply 只能壓暗
       輸出 = 1 − (1 − B)(1 − S)     S = 1 − (1 − 目標) / (1 − B)   ← screen 負責提亮
   選 screen 不選 plus-lighter 是因為 screen 各家瀏覽器都有,而且上面這組解是閉式的。

   分級要「位置的函數」不能是「像素值的函數」,凡是會動的地方都一樣:
   雲飄過去、元件擺動的時候,底下露出來的像素才不會被套上前一個物件的分級而留下鬼影。
   所以室內是位置場(檯燈衰減 + 窗光灑落),天空是垂直漸層,只有畫死不動的城市
   才按像素值分(那排霓虹窗格要發光)。天空區的參考影格取「底板」不取原圖 ——
   底板的雲已經拿掉了,分級才會是平滑的天空,雲飄到哪都對。
"""
import io
import json
import os
import sys
from collections import deque

try:
    import numpy as np
    from PIL import Image
except ImportError:                                    # pragma: no cover
    sys.exit('需要 numpy 與 Pillow:pip install numpy pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKG = os.path.join(ROOT, 'assets/svg/robot_workshop_strict_source_package')
FILLED = os.path.join(ROOT, 'assets/svg/robot_workshop_background_filled.svg')
OUT = os.path.join(ROOT, 'assets/allen/room')
JS_OUT = os.path.join(ROOT, 'allen-room-parts.js')
CANVAS = 1254
PAD_MAX = 18      # 遮罩可以長到 bbox 外面(投影),貼圖框往外放這麼多
DIFF_T = 34       # 原圖與空房間的色差門檻(三通道相加)

# 會動的元件。改這裡要同步改 allen-room.js 的 MOTION。
MOVERS = [
    'wrench_left', 'wrench_right', 'screwdriver_left', 'screwdriver_right',
    'lamp', 'mug', 'left_plant', 'shelf_plant',
    'red_button', 'green_button', 'poster', 'screen',
]

# 窗外的雲不在套件裡(它是畫死在背景的),自己從天空分出來。
# 平塗白雲配平滑漸層的天空是分割最容易的情況,而且雲後面的天空用邊界擴散補幾乎完美。
SKY = {'cx': -5, 'cy': 368, 'rx': 282, 'ry': 297}    # 圓窗開口,圓心被畫面左緣切掉
CLOUD_MIN_PX = 1800                                   # 比這小的白塊當遠方薄霧,不動
CLOUD_SKY_FRAC = 0.60                                 # 四周至少這麼多比例是天空才算雲
CLOUD_SOFT = 6                                        # 雲的柔邊最多往外收這麼多 px

# 檯燈的光是個以燈頭為中心的衰減場,關燈就是把這份暖光減掉。
# 這是打光運算不是重畫,像素全部來自原圖。
LAMP = {'x': 975, 'y': 648, 'r': 340, 'amount': 0.30, 'warm': (1.0, 0.80, 0.52)}
# 窗光灑進室內的範圍(圓窗中心往房間裡放射)。夜裡是城市的冷光,黃昏是夕陽的金色。
WIN = {'x': 96, 'y': 372, 'rx': 760, 'ry': 700}

# 三個時段。白天就是原圖,不需要分級圖 —— 所以預設狀態零額外請求。
#   sky        窗外天空的垂直漸層(位置的函數,雲飄過去不會有鬼影)
#   city_*     城市:先整體調,再把「成片的藍色窗格」和「紅色帶」點成霓虹
#   crush      夜裡把城市壓成剪影的力道(0 = 不壓)
#   tint/amb   室內環境光的顏色與「離窗越遠越暗」的程度
#   spill      窗口灑進來的光(加法)
#   lamp       檯燈相對環境光的強度 —— 夜裡它是主光,所以要比白天更有存在感
TIMES = {
    'dusk': {
        'sky': [(40, (108, 116, 196)), (200, (206, 146, 168)), (360, (248, 168, 128)),
                (520, (255, 206, 128)), (680, (255, 224, 150))],
        'city_mul': (1.00, 0.80, 0.63), 'city_lift': (16, 4, 0), 'crush': 0.0,
        'neon_blue': (255, 196, 104), 'neon_blue_amt': 0.34,
        'neon_red': (255, 132, 72), 'neon_red_amt': 0.45, 'bloom': 0.16,
        'tint': (0.86, 0.805, 0.795), 'amb': 0.70,
        'spill': (104, 46, -6), 'lamp': 1.18,
    },
    'night': {
        'sky': [(40, (11, 18, 46)), (240, (14, 24, 58)), (420, (20, 32, 72)),
                (560, (30, 46, 92)), (680, (40, 58, 104))],
        'city_mul': (0.10, 0.12, 0.21), 'city_lift': (4, 6, 16), 'crush': 1.4,
        'neon_blue': (74, 226, 246), 'neon_blue_amt': 0.92,
        'neon_red': (255, 108, 52), 'neon_red_amt': 0.88, 'bloom': 0.40,
        'tint': (0.315, 0.35, 0.485), 'amb': 0.66,
        'spill': (12, 26, 58), 'lamp': 1.46,
    },
}
GRADE_TIMES = ['day'] + list(TIMES)


def shift(a, dy, dx):
    o = np.zeros_like(a)
    h, w = a.shape[:2]
    ys0, ys1 = max(0, dy), min(h, h + dy)
    xs0, xs1 = max(0, dx), min(w, w + dx)
    o[ys0:ys1, xs0:xs1] = a[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
    return o


def dilate(mask, r):
    out = mask.copy()
    for _ in range(r):
        d = out.copy()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            d |= shift(out, dy, dx)
        out = d
    return out


def keep_connected(raw, seed):
    """留下 raw 裡「碰得到 seed」的連通塊,其餘丟掉。
    空房間是重畫的,牆面接縫會有幾 px 的位移差,不篩的話那些線也會被當成物件。"""
    h, w = raw.shape
    out = np.zeros_like(raw)
    q = deque(zip(*np.nonzero(raw & seed)))
    for y, x in q:
        out[y, x] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and raw[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                q.append((ny, nx))
    return out


def fill_holes(m):
    """補起不與邊界相連的洞 —— 物件內部剛好和空房間同色的地方不該被挖掉。"""
    h, w = m.shape
    free = ~m
    seen = np.zeros_like(m)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if free[y, x] and not seen[y, x]:
                seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if free[y, x] and not seen[y, x]:
                seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and free[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    return m | (free & ~seen)


def load_filled(path):
    """空房間那張的副檔名是 .svg,但裡面只有一張 base64 內嵌的 PNG,自己解出來。"""
    if path.lower().endswith('.png'):
        return Image.open(path)
    import base64, re
    txt = io.open(path, encoding='utf-8').read()
    m = re.search(r'href="data:image/png;base64,([A-Za-z0-9+/=]+)"', txt)
    if not m:
        sys.exit('空房間的 SVG 裡找不到內嵌 PNG:' + path)
    return Image.open(io.BytesIO(base64.b64decode(m.group(1))))


def sky_mask(shape):
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w]
    return ((xx - SKY['cx']) / SKY['rx']) ** 2 + ((yy - SKY['cy']) / SKY['ry']) ** 2 < 1.0


def grow_into(seed, allowed):
    """從 seed 往 allowed 裡做連通擴張(用來把雲的柔邊收進來)。"""
    h, w = seed.shape
    out = seed & allowed | seed
    q = deque(zip(*np.nonzero(out)))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and allowed[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                q.append((ny, nx))
    return out


def find_clouds(src):
    """把窗外的雲從天空裡分出來。

    篩選條件是「四周幾乎都是天空」—— 城市的建築也是白的,但它們周圍有灰、有紅、有描邊,
    只有真正浮在天空裡的雲四周才會是一片藍。"""
    h, w, _ = src.shape
    sky = sky_mask((h, w))
    r, g, b = src[:, :, 0], src[:, :, 1], src[:, :, 2]
    white = (r > 225) & (g > 228) & (b > 230) & ((b - r) < 26) & sky
    blue = (b - r > 45) & (b > 190) & sky
    lab = np.zeros((h, w), np.int32)
    out = []
    nid = 0
    for y0, x0 in zip(*np.nonzero(white)):
        if lab[y0, x0]:
            continue
        nid += 1
        q = deque([(y0, x0)]); lab[y0, x0] = nid; n = 0
        while q:
            y, x = q.popleft(); n += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = nid; q.append((ny, nx))
        if n < CLOUD_MIN_PX:
            continue
        m = lab == nid
        ring = dilate(m, 3) & ~m
        if (blue & ring).sum() / max(ring.sum(), 1) <= CLOUD_SKY_FRAC:
            continue
        # 白色門檻只抓得到雲的核心,雲的柔邊(白往藍過渡的那一圈)會被留下 ——
        # 雲飄走之後那圈就變成一條直線切口。所以從核心往外長到真正的天空藍為止。
        # 兩個限制:亮度要夠(建築的深色描邊會擋住),而且最多只能長 CLOUD_SOFT px ——
        # 沒有距離上限的話會沿著白色建築整片長出去(城市的塔也是白的)。
        soft = sky & ((b - r) < 48) & (0.299 * r + 0.587 * g + 0.114 * b > 205)
        m = grow_into(m, soft & dilate(m, CLOUD_SOFT))
        out.append(m)
    out.sort(key=lambda m: -m.sum())
    return out, blue


def bleed(rgb, mask, rounds=6):
    """把物件自己的顏色往透明區外擴幾圈。

    透明區如果留著原本的房間像素,有損壓縮與縮放取樣會把那些顏色吸到邊緣造成暈邊 ——
    素材的背景必須是乾淨的。alpha 不動,只換 RGB。"""
    out = rgb.astype(np.float64).copy()
    known = mask.copy()
    for _ in range(rounds):
        k = known.astype(np.float64)
        s_ = np.zeros_like(out); c = np.zeros_like(k)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            w_ = 1.0 if abs(dy) + abs(dx) == 1 else 0.5
            s_ += np.stack([shift(out[:, :, i] * k, dy, dx) for i in range(3)], axis=2) * w_
            c += shift(k, dy, dx) * w_
        fill = (~known) & (c > 0)
        if not fill.any():
            break
        out[fill] = s_[fill] / c[fill][..., None]
        known |= fill
    return np.clip(out, 0, 255)


def erode(mask, r):
    out = mask.copy()
    for _ in range(r):
        e = out.copy()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            e &= shift(out, dy, dx)
        out = e
    return out


def opening(m, r=1):
    """先侵蝕再膨脹。霓虹只認成片的色塊 —— 不開運算的話連抗鋸齒的邊也會發光,
    城市會變成一團閃爍的雜訊。"""
    return dilate(erode(m, r), r)


def boxblur(a, r):
    """cumsum 的方框模糊,跑兩次當高斯用(不引入 scipy)。"""
    if r < 1:
        return a.astype(float)
    out = a.astype(float)
    rest = ((0, 0),) * (out.ndim - 2)
    for _ in range(2):
        c = np.cumsum(np.pad(out, ((r + 1, r), (0, 0)) + rest, mode='edge'), axis=0)
        out = (c[2 * r + 1:] - c[:-(2 * r + 1)]) / (2 * r + 1)
        c = np.cumsum(np.pad(out, ((0, 0), (r + 1, r)) + rest, mode='edge'), axis=1)
        out = (c[:, 2 * r + 1:] - c[:, :-(2 * r + 1)]) / (2 * r + 1)
    return out


def light_fields(sky_vis):
    """分級要用到的幾何:窗口內外、城市、檯燈衰減、窗光灑落。"""
    h, w = sky_vis.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    d = np.sqrt(((xx - SKY['cx']) / SKY['rx']) ** 2 + ((yy - SKY['cy']) / SKY['ry']) ** 2)
    # 窗口開口 = 橢圓 ∪ 看得到的天空。橢圓只是近似(圓心被畫面左緣切掉,差幾 px),
    # 天空遮罩是精確的,兩個聯集再柔化約 8px,接縫就藏在窗框的圓角裡。
    ap = ((d < 1.0) | sky_vis).astype(float)
    w_out = np.clip((np.clip(boxblur(ap, 4), 0, 1) - 0.22) / 0.56, 0, 1)
    city = (ap > 0.5) & ~sky_vis
    ld = np.sqrt((xx - LAMP['x']) ** 2 + (yy - LAMP['y']) ** 2) / LAMP['r']
    fall = np.clip(1.0 - ld, 0, 1) ** 1.6
    wd = np.sqrt(((xx - WIN['x']) / WIN['rx']) ** 2 + ((yy - WIN['y']) / WIN['ry']) ** 2)
    spill = np.clip(1.0 - wd, 0, 1) ** 1.5
    return {'w_out': w_out, 'city': city, 'sky': sky_vis, 'fall': fall, 'spill': spill, 'yy': yy}


def lamp_light(img, G):
    """原圖裡屬於檯燈的那一份光。關燈就是把它減掉,換時段就是把它單獨加回去。"""
    warm = np.array(LAMP['warm'], dtype=float)[None, None, :]
    return img * LAMP['amount'] * G['fall'][..., None] * warm


def time_target(src, G, key):
    """這個時段「靜止合成」該有的樣子。回傳 (檯燈亮著, 檯燈關著)。"""
    L = lamp_light(src, G)
    A = src - L                                            # 白天的環境光
    if key == 'day':
        return src, np.clip(A, 0, 255)
    cfg = TIMES[key]
    r, g, b = src[:, :, 0], src[:, :, 1], src[:, :, 2]

    # ---- 室外:天空是位置漸層,城市按像素值分級(它畫死不動,可以這樣做) ----
    ys = np.array([s[0] for s in cfg['sky']], float)
    cs = np.array([s[1] for s in cfg['sky']], float)
    sky_t = np.stack([np.interp(G['yy'], ys, cs[:, i]) for i in range(3)], axis=2)
    city_t = src * np.array(cfg['city_mul'])[None, None, :] \
        + np.array(cfg['city_lift'])[None, None, :]
    if cfg['crush']:
        lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
        city_t = city_t * (0.42 + 0.58 * (lum ** cfg['crush'])[..., None])
    neon_b = opening(G['city'] & (b - r > 35) & (b > 118))
    neon_r = opening(G['city'] & (r - b > 45) & (r > 120))
    for m, col, amt in ((neon_b, cfg['neon_blue'], cfg['neon_blue_amt']),
                        (neon_r, cfg['neon_red'], cfg['neon_red_amt'])):
        c = np.array(col, float)[None, None, :]
        city_t = np.where(m[..., None], city_t * (1 - amt) + c * amt, city_t)
    if cfg['bloom']:
        halo = boxblur((neon_b | neon_r).astype(float), 7)[..., None]
        hue = np.array(cfg['neon_blue'], float) * 0.6 + np.array(cfg['neon_red'], float) * 0.4
        city_t = city_t + halo * hue[None, None, :] * cfg['bloom']
    out_t = np.where(G['sky'][..., None], sky_t, city_t)

    # ---- 室內:環境光離窗越遠越暗,檯燈最後單獨加回去 ----
    # 不這樣拆的話整個房間會被同一個係數壓下去,看起來像「白天的圖調了色」;
    # 拆開之後才有「一邊靠窗光、一邊靠檯燈、中間暗下去」的層次。
    amb = cfg['amb'] + (1 - cfg['amb']) * G['spill'][..., None]
    in_off = A * np.array(cfg['tint'])[None, None, :] * amb \
        + G['spill'][..., None] * np.array(cfg['spill'])[None, None, :]
    wo = G['w_out'][..., None]
    return (np.clip(wo * out_t + (1 - wo) * (in_off + L * cfg['lamp']), 0, 255),
            np.clip(wo * out_t + (1 - wo) * in_off, 0, 255))


def split_maps(ref, t_on, t_off):
    """把 ref → t_on 拆成 multiply + screen,再把「關燈」拆成另一張 multiply。
    三張都是精確解,不是近似(驗算見 main 的還原誤差)。"""
    s = ref / 255.0
    on = np.clip(t_on / 255.0, 0, 1)
    off = np.clip(t_off / 255.0, 0, 1)
    M = np.clip(on / np.maximum(s, 1e-4), 0, 1)
    B = s * M
    # 只有「multiply 之後還不夠亮」的地方才需要 screen。少了這個判斷,純白像素會算出
    # S=1(0/0),那一層就把輸出釘死在白色,關燈那一層再怎麼乘都壓不下來。
    S = np.where(on > B + 1e-6,
                 np.clip(1 - (1 - on) / np.maximum(1 - B, 1e-4), 0, 1), 0.0)
    # 關燈那一層疊在 multiply 這一段(screen 之後才提亮),所以要解 screen 之前的值
    want = 1 - (1 - off) / np.maximum(1 - S, 1e-4)
    Off = np.where(B > 1e-4, np.clip(want, 0, 1) / np.maximum(B, 1e-4), 1.0)
    return M, S, np.clip(Off, 0, 1)


def save_map(arr, path):
    """有損與無損各壓一次,留小的那個。夜晚的 screen 圖幾乎全黑只有霓虹,
    無損反而又小又準;黃昏的 screen 圖整片天空都有值,有損才划算。"""
    im = Image.fromarray(np.clip(arr * 255, 0, 255).astype('uint8'))
    a, b = path + '.a.webp', path + '.b.webp'
    im.save(a, quality=84, method=6)
    im.save(b, lossless=True, quality=90, method=6)
    keep, drop = (a, b) if os.path.getsize(a) <= os.path.getsize(b) else (b, a)
    os.replace(keep, path)
    os.remove(drop)
    return os.path.getsize(path)


def main():
    if not os.path.exists(FILLED):
        sys.exit('找不到重畫的空房間:' + FILLED)
    man = json.load(io.open(os.path.join(PKG, 'manifest_strict.json'), encoding='utf-8'))
    byid = {c['id']: c for c in man['components']}
    missing = [m for m in MOVERS if m not in byid]
    if missing:
        sys.exit('manifest 裡找不到這些元件:' + ', '.join(missing))
    if man['canvas']['width'] != CANVAS:
        sys.exit('畫布尺寸變了(%d),allen-room.js 的座標要跟著改' % man['canvas']['width'])

    src = np.asarray(Image.open(os.path.join(PKG, 'source_original_embedded.png'))
                     .convert('RGB')).astype(float)
    fil = np.asarray(load_filled(FILLED).convert('RGB')).astype(float)
    if fil.shape != src.shape:
        sys.exit('空房間尺寸和原圖對不上:%s vs %s' % (fil.shape, src.shape))
    diff = np.abs(src - fil).sum(axis=2)

    # 22 個元件全部佔到的地方 —— 色調補償取樣時要避開
    occupied = np.zeros((CANVAS, CANVAS), dtype=bool)
    for c in man['components']:
        a = np.asarray(Image.open(os.path.join(PKG, 'components_png', c['file']))
                       .convert('RGBA'))[:, :, 3]
        x0, y0, x1, y1 = c['bbox']
        occupied[y0:y1, x0:x1] |= a > 10
    occupied = dilate(occupied, 4)

    # 每個元件的種子(套件 alpha)。之後互相排除要用。
    seeds = {}
    for cid in MOVERS + [c['id'] for c in man['components']]:
        if cid in seeds:
            continue
        c = byid[cid]
        a = np.asarray(Image.open(os.path.join(PKG, 'components_png', c['file']))
                       .convert('RGBA'))[:, :, 3]
        s0 = np.zeros((CANVAS, CANVAS), dtype=bool)
        x0, y0, x1, y1 = c['bbox']
        s0[y0:y1, x0:x1] = a > 128
        seeds[cid] = s0

    masks, boxes = {}, {}
    for cid in MOVERS:
        c = byid[cid]
        x0, y0, x1, y1 = c['bbox']
        # 小元件不能用大 pad:紅綠按鈕只有 36px,放 18px 等於把整個控制台圈進來
        pad = int(min(PAD_MAX, max(5, 0.3 * min(x1 - x0, y1 - y0))))
        bx0, by0 = max(0, x0 - pad), max(0, y0 - pad)
        bx1, by1 = min(CANVAS, x1 + pad), min(CANVAS, y1 + pad)
        seed = seeds[cid]
        roi = np.zeros((CANVAS, CANVAS), dtype=bool)
        roi[by0:by1, bx0:bx1] = True
        # 排除「別人的地盤」。空房間把 22 個全拿掉了,所以差異圖在相鄰元件之間是連通的:
        # 不排除的話,按鈕的連通塊會沿著控制台整片淹出去(按鈕 418px → 5052px)。
        # 自己種子附近保留,不然貼著控制台的按鈕會被自己的鄰居切掉。
        others = np.zeros((CANVAS, CANVAS), dtype=bool)
        for oid, os_ in seeds.items():
            if oid != cid:
                others |= os_
        allowed = ~(others & ~dilate(seed, 6))
        m = keep_connected((diff > DIFF_T) & roi & allowed, seed)
        m = fill_holes(m) | seed
        masks[cid] = m
        boxes[cid] = (bx0, by0, bx1, by1)
        print('  %-18s 遮罩 %6d px(套件 alpha %6d px,pad %d)'
              % (cid, int(m.sum()), int(seed.sum()), pad))

    # ---- 底板:遮罩內換成空房間(先做色調補償),其餘保留原圖 ----
    plate = src.copy()
    clean = ~occupied
    for cid in MOVERS:
        m = masks[cid]
        ring = dilate(m, 12) & ~m & clean
        off = (src[ring].mean(axis=0) - fil[ring].mean(axis=0)) if ring.sum() >= 60 else 0.0
        plate = np.where(m[..., None], np.clip(fil + off, 0, 255), plate)

    os.makedirs(os.path.join(OUT, 'parts'), exist_ok=True)

    # ---- 窗外的雲:自己從天空分出來,雲後面的天空用「只從天空取樣」的擴散補 ----
    clouds, blue = find_clouds(src)
    clouds = clouds[:3]
    # 雲的可見範圍 = 「原本看得到天空的地方」。用它當遮罩一次解掉兩件事:
    #   1. 雲不會飄到窗框和牆上(橢圓怎麼調都會差幾 px,遮罩是精確的)
    #   2. 雲不會蓋住城市 —— 雲在城市後面,遮罩到建築輪廓就自然被擋住
    sky_vis = blue.copy()
    for cm in clouds:
        sky_vis |= cm
    # 只閉合小縫,不做 fill_holes —— fill_holes 會把圓頂上的白色高光當成洞補進來,
    # 雲飄過去時就會有一塊白露在圓頂上(雲應該被建築擋住)。
    sky_vis = ~dilate(~dilate(sky_vis, 2), 2)
    ys_, xs_ = np.nonzero(sky_vis)
    mb = (max(0, xs_.min() - 2), max(0, ys_.min() - 2),
          min(CANVAS, xs_.max() + 3), min(CANVAS, ys_.max() + 3))
    Image.fromarray((sky_vis[mb[1]:mb[3], mb[0]:mb[2]] * 255).astype('uint8'), 'L')         .save(os.path.join(OUT, 'sky-mask.webp'), quality=95, method=6)
    print('  可見天空遮罩 %d×%d px @(%d,%d)' % (mb[2] - mb[0], mb[3] - mb[1], mb[0], mb[1]))
    print('  雲 %d 朵(%s px)' % (len(clouds), ', '.join(str(int(c.sum())) for c in clouds)))
    for i, cm in enumerate(clouds):
        cid = 'cloud_%d' % i
        grown = dilate(cm, 2)
        # 種子只取天空:雲有的貼著窗框,從窗框取樣會把灰色拉進來
        img = plate.copy()
        known = blue & ~grown
        tmp = img.copy(); tmp[grown] = 0
        for _ in range(400):
            if not (grown & ~known).any():
                break
            k = known.astype(np.float64)
            s_ = np.zeros_like(tmp); c = np.zeros_like(k)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                w_ = 1.0 if abs(dy) + abs(dx) == 1 else 0.5
                s_ += np.stack([shift(tmp[:, :, i2] * k, dy, dx) for i2 in range(3)], axis=2) * w_
                c += shift(k, dy, dx) * w_
            fill = (~known) & grown & (c > 0)
            if not fill.any():
                break
            tmp[fill] = s_[fill] / c[fill][..., None]
            known |= fill
        plate = np.where(grown[..., None], tmp, plate)
        ys, xs = np.nonzero(cm)
        bx0, by0 = max(0, xs.min() - 6), max(0, ys.min() - 6)
        bx1, by1 = min(CANVAS, xs.max() + 7), min(CANVAS, ys.max() + 7)
        masks[cid] = cm
        boxes[cid] = (bx0, by0, bx1, by1)
    part_ids = MOVERS + ['cloud_%d' % i for i in range(len(clouds))]

    os.makedirs(os.path.join(OUT, 'parts'), exist_ok=True)
    Image.fromarray(plate.astype('uint8')).save(os.path.join(OUT, 'stage.webp'),
                                                quality=88, method=6)

    # ---- 天色分級:黃昏 / 夜晚,外加每個時段的關燈版 ----
    # 參考影格 = 靜止合成(底板 + 元件貼回去 = 原圖),但天空區改用底板 ——
    # 底板的雲已經拿掉,天空是平滑的,雲飄到哪裡分級都對得上。
    os.makedirs(os.path.join(OUT, 'grade'), exist_ok=True)
    G = light_fields(sky_vis)
    ref = np.where(sky_vis[..., None], plate, src)
    gtotal = 0
    for key in GRADE_TIMES:
        t_on, t_off = time_target(src, G, key)
        M, S, Off = split_maps(ref, t_on, t_off)
        # 先驗算:multiply + screen 這條路要能精確還原,不然後面全都是猜的
        back = (1 - (1 - ref / 255.0 * M) * (1 - S)) * 255
        e_on = float(np.abs(back - t_on).max())
        e_off = float(np.abs((1 - (1 - ref / 255.0 * M * Off) * (1 - S)) * 255 - t_off).max())
        if max(e_on, e_off) > 1.0:
            sys.exit('%s 的分級圖拆不乾淨(誤差 %.1f / %.1f)' % (key, e_on, e_off))
        n = save_map(Off, os.path.join(OUT, 'grade', '%s-off.webp' % key))
        gtotal += n
        line = '  %-5s 關燈 %6d' % (key, n)
        if key != 'day':                       # 白天就是原圖,不需要分級圖
            for nm, arr in (('m', M), ('s', S)):
                k = save_map(arr, os.path.join(OUT, 'grade', '%s-%s.webp' % (key, nm)))
                gtotal += k
                line += '  %s %6d' % (nm, k)
        print(line + ' bytes')
    for stale in ('stage-off.webp',):          # 舊做法:整張底板換掉,已被分級圖取代
        p = os.path.join(OUT, stale)
        if os.path.exists(p):
            os.remove(p)
            print('  移除舊資產 %s' % stale)

    # ---- 元件:原圖的像素 + 二值遮罩。遮罩不羽化,靜止合成才會等於原圖 ----
    total = 0
    for cid in part_ids:
        bx0, by0, bx1, by1 = boxes[cid]
        m = masks[cid][by0:by1, bx0:bx1]
        rgb = bleed(src[by0:by1, bx0:bx1], m)          # 透明區換成物件自己的顏色,避免暈邊
        rgba = np.dstack([rgb.astype('uint8'), (m * 255).astype('uint8')])
        p = os.path.join(OUT, 'parts', cid + '.webp')
        Image.fromarray(rgba, 'RGBA').save(p, quality=93, method=6)
        total += os.path.getsize(p)

    # ---- 產生 JS 的貼圖框表 ----
    lines = ['// 產生檔,不要手改:python tools/gen-allen-room-assets.py',
             '// 每個會動元件的貼圖框 [x, y, w, h](原圖 1254×1254 座標)。',
             '// 框比套件的 bbox 大一圈 —— 遮罩是用「原圖 vs 空房間」的差異算的,',
             '// 會把物件的描邊與投影一起收進來,那些常常長到 bbox 外面。',
             'export const PART_BOX = {']
    for cid in part_ids:
        bx0, by0, bx1, by1 = boxes[cid]
        lines.append("  '%s': [%d, %d, %d, %d]," % (cid, bx0, by0, bx1 - bx0, by1 - by0))
    lines.append('};')
    lines.append('')
    lines.append('// 雲的可見範圍(= 原圖看得到天空的地方)。用它當遮罩,雲就不會飄到窗框上,')
    lines.append('// 也不會蓋住城市 —— 雲在城市後面。')
    lines.append('export const SKY_MASK = [%d, %d, %d, %d];'
                 % (mb[0], mb[1], mb[2] - mb[0], mb[3] - mb[1]))
    lines.append('')
    lines.append('// 有分級圖的時段。白天就是原圖(不需要分級圖),所以它只出現在關燈版。')
    lines.append('export const GRADE_TIMES = [%s];'
                 % ', '.join("'%s'" % t for t in GRADE_TIMES))
    lines.append('')
    io.open(JS_OUT, 'w', encoding='utf-8').write('\n'.join(lines))

    # ---- 驗收:貼回去要等於原圖 ----
    comp = Image.open(os.path.join(OUT, 'stage.webp')).convert('RGBA')
    for cid in part_ids:
        part = Image.open(os.path.join(OUT, 'parts', cid + '.webp')).convert('RGBA')
        comp.alpha_composite(part, (boxes[cid][0], boxes[cid][1]))
    d = np.abs(np.asarray(comp.convert('RGB')).astype(int) - src.astype(int))
    rmse = float(np.sqrt((d ** 2).mean()))
    print('stage.webp %d bytes,%d 個元件共 %d bytes,分級圖共 %d bytes(全部延後載入)'
          % (os.path.getsize(os.path.join(OUT, 'stage.webp')), len(part_ids), total, gtotal))
    print('靜止合成 vs 原圖 RMSE = %.2f' % rmse)
    if rmse > 3.0:
        sys.exit('RMSE 太高 —— 遮罩或底板對不上,不要就這樣上線')


if __name__ == '__main__':
    main()
