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

5) 城市要「重打光」不能「每個通道各乘一個係數」(見 time_target 的 city 段)。
   乘係數的話藍色的東西會直接變成黑洞(圓頂在黃昏變成一片黑鰭),而且原稿的
   明暗關係整個被壓平。改成把明度與色度拆開:明度重新映射到這個時段的區間,
   色度變淡並整體偏向這個時段的色溫。量得出來的差別:
       白天  建築比描邊亮 118 階、比天空亮 40 階
       第一版夜晚  建築比「描邊」暗 108 階 ← 完全反過來,整座城市變成閃爍的線框
       現在夜晚    建築比描邊亮 11 階、比天空亮 71 階
   霓虹只認「成片的色塊」:門檻 b−r>60(city 藍色像素的 b−r 是雙峰的,20~50 那一峰
   是塔身的藍灰陰影、65 以上才是窗格)、開運算 r=2、面積 45–520 px。

6) 窗口的圓自己量(fit_aperture),不要手填。以前那個橢圓系統性小 13–38 px,
   一個數字同時造成三個看得見的缺陷:雲在真正的窗緣之前就被切成平口、最外圈的
   天空拿不到室外分級(黃昏沿著窗框一條薄荷色的邊)、還有底板上殘留半朵雲。

7) 只有「輪廓完整」的雲會動(find_clouds 分兩堆)。雲在靜止畫面裡看得到的形狀,
   是「雲」和「擋住它的東西」的交集;貼圖會動、擋住它的東西不會動,那條交線就
   走進開闊天空變成一刀切口。所以帶著人造直邊的雲留在底板上當畫的一部分,
   但仍然算進可見天空,好讓會飄的雲從它前面過去而不是被它咬一口。
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

# 圓窗的開口。以前這裡是手填的橢圓,量出來系統性偏小 13–38 px —— 那一個數字同時
# 造成兩個看得見的缺陷:天空與雲在真正的窗緣之前就被切掉(雲飄到那裡會被削成平口),
# 而且最外圈真正的天空拿不到室外的分級,黃昏時會沿著窗框留下一條薄荷色的邊。
# 現在改成 fit_aperture() 自己從畫面量,量不準就中止。下面是量之前的初值。
SKY = {'cx': -28.3, 'cy': 374.0, 'r': 318.5}
CLOUD_MIN_PX = 600      # 比這小的白塊當遠方薄霧,留在底板上不動
CLOUD_OPEN = 0.45       # 四周至少這麼多比例是開闊天空才算雲(建築的白色本體只有 0.00–0.28)
CLOUD_STRAIGHT = 0.30   # 輪廓的人造直邊超過這個比例就不讓它動 —— 一動那條線就變成刀切
CLOUD_SOFT = 6          # 雲的柔邊最多往外收這麼多 px

# 檯燈的光是個以燈頭為中心的衰減場,關燈就是把這份暖光減掉。
# 這是打光運算不是重畫,像素全部來自原圖。
LAMP = {'x': 975, 'y': 648, 'r': 340, 'amount': 0.30, 'warm': (1.0, 0.80, 0.52)}
# 白天與黃昏:檯燈「不影響房間」。房間亮的時候關掉一盞桌燈,房間不會變暗 ——
# 任何放射狀的暗場都會被看成憑空多出來的黑色光暈,收得再小都一樣(試過 143px 還是
# 看得出來)。所以這兩個時段乾脆不出關燈分級圖:切換時只有檯燈自己的像素會變
# (燈罩不再發亮、燈身暗一階),房間一動也不動。夜裡才是主光,才有整室的變化。
#   lamp   把原圖裡本來就畫著的那份檯燈光加回去(A = 原圖 − L 已經把它扣掉了,
#          不加回去的話工作檯在黃昏會變成沒被照到)
DAY_LAMP = {'lamp': 1.0, 'scatter': 0.0, 'warm': (0, 0, 0), 'warm_r': 1.0}
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
        # 逆光的日落:建築要比天空暗一點才有形體(白天是比天空亮 50 階,
        # 黃昏應該倒過來)。明度區間壓到 54–166,色度留 55% 並整體偏暖。
        'city_lo': 54, 'city_hi': 166, 'city_gamma': 1.0,
        'city_cast': (255, 214, 176), 'city_sat': 0.55,
        'neon_blue': (255, 206, 120), 'neon_blue_amt': 0.42,
        'neon_red': (255, 150, 84), 'neon_red_amt': 0.42, 'bloom': 0.10,
        'tint': (0.86, 0.805, 0.795), 'amb': 0.70,
        'spill': (104, 46, -6), 'lamp': 1.24, 'room_off': False,
        'scatter': 0.0, 'warm': (0, 0, 0), 'warm_r': 1.0,
    },
    'night': {
        'sky': [(40, (11, 18, 46)), (240, (14, 24, 58)), (420, (20, 32, 72)),
                (560, (30, 46, 92)), (680, (40, 58, 104))],
        # 建築本體要留得住:第一版把塔身壓到比天空還暗(只差 13 階),剩下的就
        # 只有霓虹在描邊上閃。明度區間 26–104,天空底部是 47,所以塔身明顯浮得起來,
        # 而且塔身內部還有 40 階的明暗差 —— 立體感沒有被壓掉。
        'city_lo': 26, 'city_hi': 104, 'city_gamma': 1.15,
        'city_cast': (188, 206, 255), 'city_sat': 0.42,
        'neon_blue': (96, 214, 238), 'neon_blue_amt': 0.72,
        'neon_red': (255, 132, 74), 'neon_red_amt': 0.70, 'bloom': 0.22,
        'tint': (0.415, 0.41, 0.50), 'amb': 0.68,
        'spill': (12, 22, 48), 'lamp': 1.45, 'scatter': 0.72, 'room_off': True,
        # 檯燈的暖光在夜裡會整片散開(牆面、天花板都在幫忙反射),
        # 只給燈頭那一小圈的話房間會又黑又冷。這是加法,半徑比燈本身大得多。
        'warm': (54, 30, 5), 'warm_r': 1.95, 'off_r': None,
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


SKY_COLOR_T = 60          # 和同一列的天空差這麼多以上,就不是天空


def real_sky(m, src):
    """從「顏色夠藍」的像素裡挑出真正的天空。

    建築上那些「夠藍」的窗格會通過顏色門檻變成孤島(量到 78 個),而孤島會被當成
    天空塗上天空漸層 —— 黃昏是一塊塊土黃、夜裡是一塊塊深藍,那就是塔身上看起來
    很髒的斑點。但也不能只留最大塊:塔與塔之間的天空被建築切成好幾塊,那些是真的。

    判準是顏色:拿最大那塊(一定是天空)算出「每一列的天空色」當參考,再看每個
    孤島和同一列的天空差多遠。量出來塔間的天空差 22,建築窗格差 118 以上 ——
    中間空得很乾淨。"""
    h, w = m.shape
    lab = np.zeros((h, w), np.int32)
    comps = []
    nid = 0
    for y0, x0 in zip(*np.nonzero(m)):
        if lab[y0, x0]:
            continue
        nid += 1
        q = deque([(y0, x0)])
        lab[y0, x0] = nid
        n = 0
        while q:
            y, x = q.popleft()
            n += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = nid
                    q.append((ny, nx))
        comps.append((n, nid))
    if not comps:
        return np.zeros_like(m)
    comps.sort(reverse=True)
    main = lab == comps[0][1]
    ref = np.zeros((h, 3))
    last = None
    for y in range(h):
        row = main[y]
        if row.sum() >= 8:
            ref[y] = src[y][row].mean(axis=0)
            last = ref[y]
        elif last is not None:
            ref[y] = last
    out = main.copy()
    for n, i in comps[1:]:
        c = lab == i
        ys = np.nonzero(c)[0]
        if np.abs(src[c].mean(axis=0) - ref[ys].mean(axis=0)).sum() < SKY_COLOR_T:
            out |= c
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


def sky_dist(shape):
    """到窗口圓心的距離,單位是半徑(1.0 就是窗緣)。"""
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w]
    return np.sqrt((xx - SKY['cx']) ** 2 + (yy - SKY['cy']) ** 2) / SKY['r']


def sky_mask(shape):
    return sky_dist(shape) < 1.0


def fit_aperture(src):
    """量出圓窗開口的圓心與半徑,寫回 SKY。

    做法:沿著每一列往右找「最後一個天空像素」,而且它右邊幾格內要有深色的窗框輪廓線;
    上下緣同理掃每一行。再用最小平方擬合圓,反覆丟掉離群點(被建築擋住的那些列量到的
    是建築邊緣不是窗緣)。窗是圓的不是橢圓的 —— 擬合殘差 1.3 px 就是證據。"""
    h, w, _ = src.shape
    lum = 0.299 * src[:, :, 0] + 0.587 * src[:, :, 1] + 0.114 * src[:, :, 2]
    sky = (src[:, :, 2] - src[:, :, 0] > 45) & (src[:, :, 2] > 170)
    lim = int(SKY['cx'] + SKY['r'] + 60)
    pts = []
    for y in range(30, min(h, int(SKY['cy'] + SKY['r'] + 60)), 2):
        xs = np.nonzero(sky[y, :lim])[0]
        if len(xs) < 10:
            continue
        x = xs.max()
        if x + 6 < w and lum[y, x + 1:x + 6].min() < 180:
            pts.append((x + 1.0, y))
    for x in range(0, min(w, lim), 2):
        ys = np.nonzero(sky[:int(SKY['cy'] + SKY['r'] + 60), x])[0]
        if len(ys) < 10:
            continue
        if ys.min() >= 5 and lum[ys.min() - 5:ys.min(), x].min() < 180:
            pts.append((x, ys.min() - 1.0))
        if ys.max() + 6 < h and lum[ys.max() + 1:ys.max() + 6, x].min() < 180:
            pts.append((x, ys.max() + 1.0))
    P = np.array(pts, float)
    if len(P) < 60:
        sys.exit('量不到窗口的邊界(只有 %d 個點)—— 換圖了嗎?' % len(P))

    def fit(p):
        a = np.c_[p[:, 0], p[:, 1], np.ones(len(p))]
        d, e, f = np.linalg.lstsq(a, -(p[:, 0] ** 2 + p[:, 1] ** 2), rcond=None)[0]
        return -d / 2, -e / 2, np.sqrt((d / 2) ** 2 + (e / 2) ** 2 - f)

    for _ in range(8):
        cx, cy, rad = fit(P)
        res = np.abs(np.sqrt((P[:, 0] - cx) ** 2 + (P[:, 1] - cy) ** 2) - rad)
        keep = res < max(3.0, 2.0 * np.median(res))
        if keep.all():
            break
        P = P[keep]
    cx, cy, rad = fit(P)
    res = np.abs(np.sqrt((P[:, 0] - cx) ** 2 + (P[:, 1] - cy) ** 2) - rad)
    if float(np.percentile(res, 95)) > 5.0 or len(P) < 60:
        sys.exit('窗口擬合不出圓(p95 殘差 %.1f px,%d 點)' % (np.percentile(res, 95), len(P)))
    SKY.update(cx=float(cx), cy=float(cy), r=float(rad))
    print('  窗口開口 圓心(%.1f, %.1f) 半徑 %.1f —— 殘差 平均 %.2f p95 %.2f px(%d 點)'
          % (cx, cy, rad, res.mean(), np.percentile(res, 95), len(P)))


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


def _straightness(m):
    """輪廓裡「人造直邊」的比例:左右邊界連續好幾列剛好落在同一個 x,就是被別的
    東西切出來的,不是雲自己的形狀。(卡通雲的底部本來就是平的,所以只看左右。)"""
    ys, xs = np.nonzero(m)
    left, right = [], []
    for y in range(ys.min(), ys.max() + 1):
        row = np.nonzero(m[y])[0]
        left.append(row.min() if len(row) else None)
        right.append(row.max() if len(row) else None)

    def longest(a):
        best = cur = 0
        prev = None
        for v in a:
            if v is None:
                prev, cur = None, 0
                continue
            cur = cur + 1 if (prev is not None and v == prev) else 1
            prev = v
            best = max(best, cur)
        return best

    return max(longest(left), longest(right)) / max(ys.max() - ys.min() + 1, 1)


def find_clouds(src):
    """把窗外的雲從天空裡分出來,並且分成「會飄的」與「只能留在原地的」兩堆。

    分兩堆是這一版的重點。雲在靜止畫面裡看得到的形狀,是「雲」和「擋住它的東西」
    的交集 —— 畫布左緣、前面那座白塔,都會在 alpha 上烤出一條直線。貼圖會動、
    擋住它的東西不會動,那條線就走進開闊的天空變成一刀切口:使用者說的
    「雲被切一半」就是這個。所以輪廓帶著人造直邊的雲不讓它動,留在底板上當畫的
    一部分(靜止的話那條線只是原稿的構圖,一點問題也沒有),但仍然算進可見天空,
    好讓會飄的雲可以從它前面過去而不是被它咬掉一塊。

    兩道關卡量出來分得很開:
      四周開闊度   真的雲 0.56–1.00,建築的白色本體 0.00–0.28
      人造直邊比例 完整的雲 0.13–0.23,被切的 0.85 / 0.99
    """
    h, w, _ = src.shape
    sky = sky_mask((h, w))
    r, g, b = src[:, :, 0], src[:, :, 1], src[:, :, 2]
    white = (r > 225) & (g > 228) & (b > 230) & ((b - r) < 26) & sky
    blue = (b - r > 45) & (b > 190) & sky
    # 白色門檻只抓得到雲的核心,柔邊(白往藍過渡的那一圈)會被留下 —— 雲飄走之後
    # 那圈就是一條直線切口。所以從核心往外長到真正的天空藍為止。兩個限制:亮度要夠
    # (建築的深色描邊會擋住),而且最多只能長 CLOUD_SOFT px —— 沒有距離上限的話
    # 會沿著白色建築整片長出去(城市的塔也是白的)。
    soft = sky & ((b - r) < 48) & (0.299 * r + 0.587 * g + 0.114 * b > 205)
    lab = np.zeros((h, w), np.int32)
    movers, statics = [], []
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
        if n < 250:
            continue
        m = grow_into(lab == nid, soft & dilate(lab == nid, CLOUD_SOFT))
        ring = dilate(m, 3) & ~m
        # 「開闊」= 藍天,或是窗框外面(貼著窗緣的雲一樣是雲)
        if ((blue | ~sky) & ring).sum() / max(ring.sum(), 1) < CLOUD_OPEN:
            continue                                   # 建築的白色本體
        (movers if (m.sum() >= CLOUD_MIN_PX and _straightness(m) < CLOUD_STRAIGHT)
         else statics).append(m)
    movers.sort(key=lambda m: -m.sum())
    return movers, statics, blue


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


def solid_blobs(m, r=2, min_px=45, max_px=None):
    """只留下「成片」的色塊:寬度撐得過 2r+1 的、而且面積夠大的。

    這是夜景城市那一版做壞的根因。原本只做 r=1 的開運算,結果建築白色本體與深色
    描邊之間那一圈抗鋸齒像素(色相偏藍)整條被當成霓虹點亮 —— 量出來是「描邊比
    建築本體還亮 108 階」,整座城市變成一團閃爍的線框。真正該亮的是塔身上那排
    成片的藍色窗格。"""
    keep = opening(m, r)
    out = np.zeros_like(m)
    lab = np.zeros(m.shape, np.int32)
    nid = 0
    for y0, x0 in zip(*np.nonzero(keep)):
        if lab[y0, x0]:
            continue
        nid += 1
        q = deque([(y0, x0)])
        lab[y0, x0] = nid
        cells = []
        while q:
            y, x = q.popleft()
            cells.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < m.shape[0] and 0 <= nx < m.shape[1] and keep[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = nid
                    q.append((ny, nx))
        if len(cells) >= min_px and (max_px is None or len(cells) <= max_px):
            for y, x in cells:
                out[y, x] = True
    # 長回原本的形狀,但只長回自己那一塊(不會沿著描邊擴散出去)
    return dilate(out, r) & m


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
    d = sky_dist((h, w))
    # 窗口開口 = 量出來的圓 ∪ 看得到的天空,再柔化約 8px,接縫藏在窗框的暗線裡。
    ap = ((d < 1.0) | sky_vis).astype(float)
    w_out = np.clip((np.clip(boxblur(ap, 4), 0, 1) - 0.34) / 0.44, 0, 1)
    city = (ap > 0.5) & ~sky_vis
    ld = np.sqrt((xx - LAMP['x']) ** 2 + (yy - LAMP['y']) ** 2) / LAMP['r']
    fall = np.clip(1.0 - ld, 0, 1) ** 1.6
    wd = np.sqrt(((xx - WIN['x']) / WIN['rx']) ** 2 + ((yy - WIN['y']) / WIN['ry']) ** 2)
    spill = np.clip(1.0 - wd, 0, 1) ** 1.5
    # 檯燈的「散射」:同一個燈,但半徑放大好幾倍。夜裡光會打到牆和天花板再散回來,
    # 只給燈頭那一圈的話房間會是一個亮點配一片黑。
    return {'w_out': w_out, 'city': city, 'sky': sky_vis, 'fall': fall, 'spill': spill,
            'yy': yy, 'ld': ld}


def lamp_light(img, G):
    """原圖裡屬於檯燈的那一份光。關燈就是把它減掉,換時段就是把它單獨加回去。"""
    warm = np.array(LAMP['warm'], dtype=float)[None, None, :]
    return img * LAMP['amount'] * G['fall'][..., None] * warm


def lamp_share(src, A, L, G, cfg, tint=1.0):
    """檯燈開著時多出來的那一份:直射 + 打到牆面再散回來的散射 + 暖色偏移。
    三份都跟著檯燈一起熄,所以它就是「開燈 − 關燈」。

    白天與黃昏的 scatter / warm 都是 0:那兩個時段檯燈不影響房間,只把原圖裡
    本來就畫著的那一份加回去。散射一開,關燈就會在畫面上留下一團放射狀的黑色
    光暈 —— 那不是關燈,那是憑空多出來的陰影。"""
    glow = np.clip(1.0 - G['ld'] / cfg['warm_r'], 0, 1) ** 1.4
    lit = (L * cfg['lamp']
           + A * tint * (glow * cfg['scatter'])[..., None]
           + glow[..., None] * np.array(cfg['warm'], float)[None, None, :])
    return lit


def time_target(src, G, key):
    """這個時段「靜止合成」該有的樣子。回傳 (檯燈亮著, 檯燈關著)。"""
    L = lamp_light(src, G)
    A = src - L                                            # 白天的環境光
    if key == 'day':
        # 白天 + 開燈就是原圖本身 —— 這條不變式不能破(白天的分級層完全不存在,
        # 所以「開燈」那一格必須逐像素等於原圖)。關燈就是把檯燈那三份減掉。
        return src, src         # 白天:關燈不影響房間,所以沒有關燈分級圖
    cfg = TIMES[key]
    r, g, b = src[:, :, 0], src[:, :, 1], src[:, :, 2]

    # ---- 室外:天空是位置漸層,城市按像素值分級(它畫死不動,可以這樣做) ----
    ys = np.array([s[0] for s in cfg['sky']], float)
    cs = np.array([s[1] for s in cfg['sky']], float)
    sky_t = np.stack([np.interp(G['yy'], ys, cs[:, i]) for i in range(3)], axis=2)
    # 城市要「重打光」不能「每個通道各乘一個係數」。乘係數的話藍色的東西會直接變成
    # 黑洞(圓頂的藍在黃昏會變成一片黑色的鰭),而且原稿的明暗關係整個被壓平 ——
    # 使用者指的「粗糙、爆掉」跟「不夠飽滿」都是這裡來的。
    # 改成把明度和色度拆開:明度重新映射到這個時段的區間(保住原稿的立體感),
    # 色度只是變淡並整體偏向這個時段的色溫。
    Y = 0.299 * r + 0.587 * g + 0.114 * b
    chroma = src - Y[..., None]
    cast = np.array(cfg['city_cast'], float)
    cast = cast / (0.299 * cast[0] + 0.587 * cast[1] + 0.114 * cast[2])   # 正規化成不改明度
    Yn = cfg['city_lo'] + (cfg['city_hi'] - cfg['city_lo']) * (Y / 255.0) ** cfg['city_gamma']
    city_t = Yn[..., None] * cast[None, None, :] + chroma * cfg['city_sat']
    # 門檻 60 不是隨便挑的:city 藍色像素的 b−r 是雙峰的 —— 20~50 那一峰(11890 px)
    # 是塔身的藍灰陰影,65 以上那一峰(4373 px)才是真正的窗格。第一版用 35,
    # 等於把整片陰影也點亮,塔身就長出一塊一塊的螢光斑。
    # 上限 520 是要擋掉「大片的藍色斜面」(圓頂的高光、整面藍牆)。真正的窗格是
    # 70–350 px 的長條與小方塊;把整片斜面點成霓虹會變成一塊貼上去的螢光色。
    neon_b = solid_blobs(G['city'] & (b - r > 60) & (b > 118), max_px=520)
    neon_r = solid_blobs(G['city'] & (r - b > 45) & (r > 120))
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
    tint = np.array(cfg['tint'])[None, None, :]
    amb = cfg['amb'] + (1 - cfg['amb']) * G['spill'][..., None]
    # 只靠窗光的那一份 —— 關燈時房間就剩這個
    in_off = A * tint * amb + G['spill'][..., None] * np.array(cfg['spill'])[None, None, :]
    # 檯燈開著時多出來的三份:
    #   direct  原圖裡本來就有的那圈直射光
    #   scatter 打到牆面、天花板再散回來的(用表面自己的顏色算,所以是 A × tint × 係數)
    #   warm    暖色偏移。少了這一份,夜裡整間都是冷藍,檯燈只是一個孤立的亮點
    # 三份都跟著檯燈一起熄,所以只加在 in_on。
    lit = lamp_share(src, A, L, G, cfg, tint)
    # 室內任何一點都不可以比白天的原圖亮 —— 夜裡不會比白天亮,這是物理;
    # 但更要緊的是數學:一旦某個像素在「開燈」時被推到滿格,那裡的 screen 值就是 1,
    # 而 screen(任何東西, 1) 恆等於 1,關燈那一層再怎麼乘都壓不下來(檯燈那一圈
    # 會關不掉)。所以在 0.8 倍原圖之後平滑收斂到 0.98,不用硬切(硬切會留下邊)。
    K = 0.80
    def softcap(v):
        u = v / np.maximum(src, 1.0)
        u = np.where(u < K, u, 0.98 - (0.98 - K) * np.exp(-(u - K) / (0.98 - K)))
        return u * src
    in_on = softcap(in_off + lit)
    # room_off 決定「關燈會不會影響房間」。白天與黃昏是 False —— 房間還是亮的,
    # 切換時只有檯燈自己的像素會變(那一份在網頁端,不在分級圖裡)。
    in_off = softcap(in_off) if cfg['room_off'] else in_on
    wo = G['w_out'][..., None]
    return (np.clip(wo * out_t + (1 - wo) * in_on, 0, 255),
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
    fit_aperture(src)                       # 窗口的圓自己量,不要手填
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
    clouds, still_clouds, blue = find_clouds(src)
    clouds = clouds[:3]
    # 雲的可見範圍 = 「原本看得到天空的地方」。用它當遮罩一次解掉兩件事:
    #   1. 雲不會飄到窗框和牆上(橢圓怎麼調都會差幾 px,遮罩是精確的)
    #   2. 雲不會蓋住城市 —— 雲在城市後面,遮罩到建築輪廓就自然被擋住
    # 天空是一整片:用顏色篩掉建築上那些「夠藍」的窗格,但塔間真正的天空要留住
    sky_vis = real_sky(blue, src)
    # 會飄的雲要算進去(它們原本佔的位置本來就是天空);留在原地的雲也要算進去 ——
    # 不然會飄的那幾朵經過它們的時候會被咬掉一塊。
    for cm in clouds + still_clouds:
        sky_vis |= cm
    # 只閉合小縫,不做 fill_holes —— fill_holes 會把圓頂上的白色高光當成洞補進來,
    # 雲飄過去時就會有一塊白露在圓頂上(雲應該被建築擋住)。
    # 閉合完再篩一次,免得補縫的過程又長出新的孤島。
    sky_vis = keep_connected(~dilate(~dilate(sky_vis, 2), 2), sky_vis)
    ys_, xs_ = np.nonzero(sky_vis)
    mb = (max(0, xs_.min() - 2), max(0, ys_.min() - 2),
          min(CANVAS, xs_.max() + 3), min(CANVAS, ys_.max() + 3))
    # 遮罩在「建築的輪廓」那一側要硬(雲被塔擋住就該乾淨俐落),在「窗緣」那一側要軟:
    # 硬邊的話雲飄到窗框就被削成一個平口,看起來像半塊方形的雲。軟邊是慢慢隱沒進窗框,
    # 那才是雲飄出視野該有的樣子。畫面左緣同理(圓窗被畫面切掉一半,雲從那裡進場)。
    dd = sky_dist((CANVAS, CANVAS))
    xx = np.mgrid[0:CANVAS, 0:CANVAS][1].astype(float)
    fade = np.minimum(np.clip((1.0 - dd) / 0.05, 0, 1), np.clip(xx / 18.0, 0, 1))
    mval = sky_vis.astype(float) * fade
    Image.fromarray((mval[mb[1]:mb[3], mb[0]:mb[2]] * 255).astype('uint8'), 'L')         .save(os.path.join(OUT, 'sky-mask.webp'), quality=95, method=6)
    print('  可見天空遮罩 %d×%d px @(%d,%d)' % (mb[2] - mb[0], mb[3] - mb[1], mb[0], mb[1]))
    print('  會飄的雲 %d 朵(%s px);留在原地的 %d 朵(%s px,輪廓被畫布或塔切過)'
          % (len(clouds), ', '.join(str(int(c.sum())) for c in clouds),
             len(still_clouds), ', '.join(str(int(c.sum())) for c in still_clouds)))
    for i, cm0 in enumerate(clouds):
        cid = 'cloud_%d' % i
        # 貼圖要「自己帶著柔邊走」:遮罩往外放 3px,底板挖掉的洞再往外 2px。
        # 只挖不帶的話,雲飄走之後會在原地留下一圈自己的輪廓(鬼影);
        # 帶了但底板沒挖乾淨的話,靜止時那圈會露在雲的外緣。兩邊都要對齊。
        cm = dilate(cm0, 3)
        grown = dilate(cm0, 5)
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
    grade_off = []
    for key in GRADE_TIMES:
        t_on, t_off = time_target(src, G, key)
        M, S, Off = split_maps(ref, t_on, t_off)
        # 先驗算:multiply + screen 這條路要能精確還原,不然後面全都是猜的
        back = (1 - (1 - ref / 255.0 * M) * (1 - S)) * 255
        e_on = float(np.abs(back - t_on).max())
        e_off = float(np.abs((1 - (1 - ref / 255.0 * M * Off) * (1 - S)) * 255 - t_off).max())
        if max(e_on, e_off) > 1.0:
            sys.exit('%s 的分級圖拆不乾淨(誤差 %.1f / %.1f)' % (key, e_on, e_off))
        # 關燈分級圖只有「關燈真的會影響房間」的時段才出(目前只有夜晚)。
        # 白天與黃昏出了反而是害處:切換時房間會多一團黑色光暈。
        has_off = float(np.abs(t_on - t_off).max()) > 0.5
        line = '  %-5s' % key
        if has_off:
            n = save_map(Off, os.path.join(OUT, 'grade', '%s-off.webp' % key))
            gtotal += n
            grade_off.append(key)
            line += ' 關燈 %6d' % n
        else:
            p_ = os.path.join(OUT, 'grade', '%s-off.webp' % key)
            if os.path.exists(p_):
                os.remove(p_)
            line += ' 關燈 —— 不影響房間,不出圖'
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
    lines.append('// 有分級圖的時段。白天就是原圖,所以它不會有 m/s 兩張。')
    lines.append('export const GRADE_TIMES = [%s];'
                 % ', '.join("'%s'" % t for t in GRADE_TIMES))
    lines.append('')
    lines.append('// 有「關燈分級圖」的時段 —— 只有這幾個時段關燈會影響整個房間。')
    lines.append('// 白天與黃昏不在裡面:那時候關燈只有檯燈自己會變,房間維持原樣。')
    lines.append('export const GRADE_OFF = [%s];'
                 % ', '.join("'%s'" % t for t in grade_off))
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
