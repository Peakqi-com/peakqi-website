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
  assets/allen/room/stage.webp       底板
  assets/allen/room/parts/<id>.webp  會動的元件
  allen-room-parts.js                每個元件的貼圖框(產生檔,不要手改)

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

# 關燈版:檯燈的光是個以燈頭為中心的衰減場,關燈就是把這份暖光減掉。
# 這是打光運算不是重畫,像素全部來自原圖。
LAMP = {'x': 975, 'y': 648, 'r': 340, 'amount': 0.30, 'warm': (1.0, 0.80, 0.52)}


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


def lights_off(img):
    """把檯燈的暖光從畫面裡減掉 —— 打光運算,像素全部來自原圖。"""
    h, w, _ = img.shape
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - LAMP['x']) ** 2 + (yy - LAMP['y']) ** 2) / LAMP['r']
    fall = np.clip(1.0 - d, 0, 1) ** 1.6                     # 以燈頭為中心的衰減
    warm = np.array(LAMP['warm'], dtype=float)
    out = img * (1.0 - LAMP['amount'] * fall[..., None] * warm[None, None, :])
    return np.clip(out, 0, 255)


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
    # ---- 關燈版:同一張底板減掉檯燈的暖光 ----
    Image.fromarray(lights_off(plate).astype('uint8')).save(os.path.join(OUT, 'stage-off.webp'),
                                                            quality=88, method=6)

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
    io.open(JS_OUT, 'w', encoding='utf-8').write('\n'.join(lines))

    # ---- 驗收:貼回去要等於原圖 ----
    comp = Image.open(os.path.join(OUT, 'stage.webp')).convert('RGBA')
    for cid in part_ids:
        part = Image.open(os.path.join(OUT, 'parts', cid + '.webp')).convert('RGBA')
        comp.alpha_composite(part, (boxes[cid][0], boxes[cid][1]))
    d = np.abs(np.asarray(comp.convert('RGB')).astype(int) - src.astype(int))
    rmse = float(np.sqrt((d ** 2).mean()))
    print('stage.webp %d bytes,%d 個元件共 %d bytes'
          % (os.path.getsize(os.path.join(OUT, 'stage.webp')), len(part_ids), total))
    print('靜止合成 vs 原圖 RMSE = %.2f' % rmse)
    if rmse > 3.0:
        sys.exit('RMSE 太高 —— 遮罩或底板對不上,不要就這樣上線')


if __name__ == '__main__':
    main()
