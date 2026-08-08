# -*- coding: utf-8 -*-
"""Allen 工作間的剪紙動畫素材產生器 ── 冪等,跑幾次結果都一樣
    python tools/gen-allen-room-assets.py

輸入
  assets/svg/test.svg      美術手工拆好的 40 個圖層(1500×1500)
      每一層的結構是轉檔工具的標準輸出:
          <g clip-path><g mask="#m"><g transform="matrix"><image 彩色/></g></g></g>
      而 #m 裡面是同尺寸的灰階遮罩。彩色 × 遮罩 = 這一層真正的樣子。
      每層的原生像素在 1254 座標系裡是 1:1(轉檔時整體放大成 1500),
      所以全部換算回 1254 就沒有重新取樣的損失。

輸出
  assets/allen/room/stage.webp        底板 = 空房間 + 所有不會動的東西
  assets/allen/room/parts/<id>.webp   會動的元件(含 alpha)
  assets/allen/room/sky-mask.webp     雲的可見範圍
  assets/allen/room/grade/*.webp      天色分級圖(黃昏 / 夜晚 / 夜晚的關燈版)
  allen-room-parts.js                 每個元件的貼圖框(產生檔,不要手改)

這支不是網站建置流程的一部分,是換素材時手動跑一次。

── 為什麼整個重寫過 ──────────────────────────────────────────────
上一版沒有拆好的圖層,只能用「原圖 vs 美術重畫的空房間」的『差異』去猜每個物件的
遮罩。那條路每一步都要調參數,而且永遠有殘留:物件的柔邊與軟陰影只要色差低於門檻
就留在底板上,元件一擺動,那一圈淡淡的自己就現形。雲更慘 —— 得從天空裡用白色門檻
分出來,分不乾淨的就被切成半塊。

現在美術把 40 層都拆好了,上面那些全部不需要:
  · 底板 = 第 00 層(完全空的房間,連投影都沒有)+ 所有不會動的層疊上去。
    零修補、零擴散、零門檻 —— 也就零殘影。
  · 每個會動的元件就是它自己那一層,alpha 是畫出來的不是算出來的。
  · 窗口開口 = 天空那一層的 alpha,精確到像素(上一版是擬合出來的圓,差 1–3px)。
  · 城市 = 03/04/05/34 四層,天色分級不必再用顏色去猜哪裡是天空哪裡是建築。

美術唯一沒拆掉的是「光」:檯燈打在洞洞板與工作檯上的暖光還畫在那兩層裡
(量到 59% 在洞洞板層、24% 在工作檯層,只有 1.8% 在檯燈層)。所以關燈時那道光
還是在。要拿掉它得請美術再補一張「沒開燈的洞洞板 + 桌面」。

── 天色為什麼是兩張分級圖不是三張底板 ────────────────────────────
另外三張底板只會換掉底板,會動的元件、飄的雲、還有站在房間裡的 Allen 全都還是
白天的顏色,人會浮在夜景上。分級圖疊在「房間 + Allen」整疊的最上面,一次把所有
東西一起調到同一個時段。

任何一組「原圖 → 目標」都可以拆成這兩層,而且是精確的(不是近似):
    B = 原圖 × M                 M = clamp(目標 / 原圖, 0, 1)   ← multiply 只能壓暗
    輸出 = 1 − (1 − B)(1 − S)     S = 1 − (1 − 目標) / (1 − B)   ← screen 負責提亮
選 screen 不選 plus-lighter 是因為 screen 各家瀏覽器都有,而且上面這組解是閉式的。

分級要「位置的函數」不能是「像素值的函數」,凡是會動的地方都一樣:雲飄過去、元件
擺動的時候,底下露出來的像素才不會被套上前一個物件的分級而留下鬼影。所以室內是
位置場(檯燈衰減 + 窗光灑落),天空是垂直漸層,只有畫死不動的城市才按像素值分。

城市要「重打光」不能「每個通道各乘一個係數」—— 乘係數的話藍色的東西會直接變成
黑洞(圓頂在黃昏會變成一片黑鰭),而且原稿的明暗關係整個被壓平。改成把明度與色度
拆開:明度重新映射到這個時段的區間(保住立體感),色度變淡並整體偏向這個時段的色溫。

還有一道數學上的必要條件:室內任何一點都不可以比白天亮。一旦某個像素在「開燈」時
被推到滿格,那裡的 screen 值就是 1,而 screen(任何東西, 1) 恆等於 1 —— 關燈那一層
再怎麼乘都壓不下來。所以有一道柔性上限。
"""
import base64
import io
import json
import os
import re
import sys
from collections import deque
import xml.etree.ElementTree as ET

try:
    import numpy as np
    from PIL import Image
except ImportError:                                    # pragma: no cover
    sys.exit('需要 numpy 與 Pillow:pip install numpy pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG = os.path.join(ROOT, 'assets/svg/test.svg')
# 原稿。拆解難免會掉東西(窗口的天空層沒接到窗框、海報上的 BUILD 整個不見),
# 所以最後有一道「拿原稿補回來」——來源是美術自己的畫,補不出新東西。
SRC_REF = os.path.join(ROOT, 'assets/svg/robot_workshop_strict_source_package',
                       'source_original_embedded.png')
OUT = os.path.join(ROOT, 'assets/allen/room')
JS_OUT = os.path.join(ROOT, 'allen-room-parts.js')
CANVAS = 1254
SVG_SCALE = 1500 / 1254.0      # 轉檔工具把整張放大成 1500,換算回來就是原生像素
N_LAYERS = 40

# 圖層編號 → 這是什麼。換素材時整份要重對一次(數量對不上產生器會擋下來)。
#   00 空房間      01 窗框        02 天空        03 遠處的塔    04 樹
#   05 圓頂建築    06 頂上藍螢幕  07 牆上面板    08 藍色柱子    09 海報
#   10 右上角紅框  11 右上層架    12 層架+小盆栽 13 洞洞板+工具 14 大盆栽
#   15 控制台      16 洞洞板      17/18 小零件   19 工作檯+抽屜 20 地上機台
#   21 控制台面板  22 準星        23 長條圖      24 紅按鈕      25 綠按鈕
#   26 灰面板      27 通風柵      28 馬克杯      29/30 板手     31/32 起子
#   33 海報上的機器人  34 高塔    35 檯燈        36–39 雲
MOVERS = {
    'poster': [9, 33],               # 海報與海報上的機器人是同一件事,要一起走
    'left_plant': [14],
    'screen': [21, 22, 23],          # 控制台的畫面(面板 + 準星 + 長條圖)
    'red_button': [24],
    'green_button': [25],
    'mug': [28],
    'wrench_left': [29],
    'wrench_right': [30],
    'screwdriver_left': [31],
    'screwdriver_right': [32],
    'lamp': [35],
}
# 會飄的雲。原稿裡四朵都被切過(36/38 被畫布左緣,37/39 被窗框的弧),所以要補全
# (見 complete_cloud)。38 補出來的形狀不好看,留在底板上不動 —— 靜止的雲不需要完整。
CLOUDS = [36, 37, 39]
CLOUD_CUT = {36: 'L', 37: 'R', 38: 'L', 39: 'R'}
CLOUD_PAD = 200        # 補全要有空間:雲在 x=0 被切,補出來的部分在畫布外
# 唯一「畫在會動的層前面」的不動層:右上那排層架蓋到海報一角(量到 520 px)。
FRONT = [11]
SKY_L, CITY_L = 2, [3, 4, 5, 34]     # 天空;城市(遠塔 / 樹 / 圓頂 / 高塔)

# 疊圖順序。**不是** 00→39:轉檔工具把窗景那一組排錯了,照編號疊的話
#   · 雲會蓋掉左側高塔(量到 3577 px,佔塔身 22%)
#   · 圓頂建築會蓋掉灌木叢(891/1523 px,58%)
#   · 天空會蓋掉窗框的內圈
# 正確的是「天空 → 雲 → 塔 → 灌木 → 窗框」,其餘維持編號順序。
ORDER = [0, 2] + [36, 37, 38, 39] + [34, 3, 5, 4, 1] + [i for i in range(6, 36) if i != 34]

REPAIR_T = 40        # 和原稿差這麼多以上就補回來(三通道相加)

LAMP = {'x': 975, 'y': 648, 'r': 340, 'amount': 0.30, 'warm': (1.0, 0.80, 0.52)}
WIN = {'x': 96, 'y': 372, 'rx': 760, 'ry': 700}     # 窗光灑進室內的範圍

TIMES = {
    'dusk': {
        'sky': [(40, (108, 116, 196)), (200, (206, 146, 168)), (360, (248, 168, 128)),
                (520, (255, 206, 128)), (680, (255, 224, 150))],
        # 逆光的日落:建築要比天空暗一點才有形體(白天是比天空亮 50 階,黃昏倒過來)
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
        # 夜裡的城市是「暗的建築 + 窗內有光」,不是霓虹。整片點成螢光色很醜,
        # 而且那是把顏色蓋上去,不是打光。所以 neon 全部關掉(amt 0、bloom 0),
        # 建築壓成剪影(明度 14–72,天空是 14–47,塔身還浮得起來),
        # 窗格的光改成獨立的一張貼圖在網頁端疊亮 + 閃動,見 city_light_*。
        'city_lo': 14, 'city_hi': 72, 'city_gamma': 1.25,
        'city_cast': (188, 206, 255), 'city_sat': 0.30,
        'neon_blue': (96, 214, 238), 'neon_blue_amt': 0.0,
        'neon_red': (255, 132, 74), 'neon_red_amt': 0.0, 'bloom': 0.0,
        'tint': (0.415, 0.41, 0.50), 'amb': 0.68,
        'spill': (12, 22, 48), 'lamp': 1.45, 'room_off': True,
        # 夜裡檯燈是主光,它打到牆面再散回來的那一份要算進去,不然房間又黑又冷
        'scatter': 0.72, 'warm': (54, 30, 5), 'warm_r': 1.95,
    },
}
GRADE_TIMES = ['day'] + list(TIMES)


# ── 形態學 ───────────────────────────────────────────────────────
def shift(a, dy, dx):
    o = np.zeros_like(a)
    h, w = a.shape[:2]
    o[max(0, dy):min(h, h + dy), max(0, dx):min(w, w + dx)] = \
        a[max(0, -dy):min(h, h - dy), max(0, -dx):min(w, w - dx)]
    return o


def dilate(m, r, diag=False):
    nb = ((1, 0), (-1, 0), (0, 1), (0, -1))
    if diag:
        nb = nb + ((1, 1), (1, -1), (-1, 1), (-1, -1))
    o = m.copy()
    for _ in range(r):
        d = o.copy()
        for dy, dx in nb:
            d |= shift(o, dy, dx)
        o = d
    return o


def erode(m, r, diag=False):
    return ~dilate(~m, r, diag)


def opening(m, r=1):
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


def solid_blobs(m, r=2, min_px=45, max_px=None):
    """只留下「成片」的色塊:寬度撐得過 2r+1 的、而且面積在範圍內的。

    霓虹只認成片的窗格。不做開運算的話,建築白色本體與深色描邊之間那一圈抗鋸齒
    像素(色相偏藍)會整條被點亮,整座城市變成一團閃爍的線框。上限則是擋掉大片的
    藍色斜面(圓頂的高光)——把整片斜面點成霓虹會變成一塊貼上去的螢光色。"""
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
    return dilate(out, r) & m


# ── 圖層 ─────────────────────────────────────────────────────────
def _mul(a, b):
    return (a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
            a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
            a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5])


def _tr(t):
    out = (1, 0, 0, 1, 0, 0)
    if not t:
        return out
    for m in re.finditer(r'(matrix|translate|scale)\(([-\d.eE, ]+)\)', t):
        v = [float(x) for x in re.split(r'[ ,]+', m.group(2).strip()) if x]
        if m.group(1) == 'matrix':
            cur = tuple(v)
        elif m.group(1) == 'translate':
            cur = (1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0)
        else:
            cur = (v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0)
        out = _mul(out, cur)
    return out


def load_layers():
    """把 test.svg 解成 40 張 RGBA + 它們在 1254 畫布上的位置。"""
    root = ET.fromstring(io.open(SVG, encoding='utf-8', errors='replace').read())
    NSM = '{http://www.w3.org/2000/svg}'

    def href(n):
        return n.get('{http://www.w3.org/1999/xlink}href') or n.get('href')

    masks = {}
    for mk in root.iter(NSM + 'mask'):
        for im in mk.iter(NSM + 'image'):
            masks[mk.get('id')] = href(im)
            break
    body = []

    def walk(node, T, mid):
        T = _mul(T, _tr(node.get('transform')))
        mu = node.get('mask')
        if mu:
            mid = mu[mu.index('#') + 1:-1]
        if node.tag == NSM + 'image':
            body.append((href(node), float(node.get('width', 0)),
                         float(node.get('height', 0)), T, mid))
        for ch in node:
            walk(ch, T, mid)

    for ch in root:
        if ch.tag != NSM + 'defs':
            walk(ch, (1, 0, 0, 1, 0, 0), None)
    if len(body) != N_LAYERS:
        sys.exit('test.svg 有 %d 層,不是 %d 層 —— 上面的圖層編號表要重對' % (len(body), N_LAYERS))
    out = []
    for h, w, ht, T, mid in body:
        col = Image.open(io.BytesIO(base64.b64decode(h.split(',', 1)[1]))).convert('RGB')
        if mid not in masks:
            sys.exit('有一層沒有遮罩 —— test.svg 的結構和預期不同')
        m = Image.open(io.BytesIO(base64.b64decode(masks[mid].split(',', 1)[1]))).convert('L')
        if m.size != col.size:
            m = m.resize(col.size, Image.LANCZOS)
        rgba = col.convert('RGBA')
        rgba.putalpha(m)
        x, y = T[4] / SVG_SCALE, T[5] / SVG_SCALE
        W, H = T[0] * w / SVG_SCALE, T[3] * ht / SVG_SCALE
        if abs(W - col.width) > 1.5 or abs(H - col.height) > 1.5:
            rgba = rgba.resize((max(1, round(W)), max(1, round(H))), Image.LANCZOS)
        out.append((rgba, round(x), round(y)))
    return out


def place(layers, ids):
    """把幾層疊成一張整幅的 RGBA,依 ORDER 的順序(不是編號順序,見上面的註解)。"""
    o = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    ids = [i for i in ORDER if i in set(ids)]
    for i in ids:
        im, x, y = layers[i]
        t = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
        t.paste(im, (x, y))
        o = Image.alpha_composite(o, t)
    return o


def alpha_of(layers, ids):
    return np.asarray(place(layers, ids))[:, :, 3] > 10


def repair(img, keep, src, label, force=None):
    """拆解掉的東西,用原稿補回來。

    只在 keep 之內動手,而且只補「和原稿差 REPAIR_T 以上」的像素 —— 來源是美術
    自己的畫,所以補不出新東西。實際救回來的:窗口天空層沒接到窗框而露出的那一圈牆
    (49k px),還有海報上整個不見的 BUILD 字(2.7k px)。"""
    a = np.asarray(img).astype(float)
    d = np.abs(a[:, :, :3] - src).sum(2)
    # 外擴 2px 再夾回 keep:硬門檻的邊界會留一條鋸齒(窗框內圈那一圈看得到)
    m = dilate(keep & (d > REPAIR_T), 2) & keep
    if force is not None:
        m |= force & keep
    if m.any():
        out = np.asarray(img).copy()
        out[:, :, :3][m] = src[m].astype('uint8')
        out[:, :, 3][m] = 255
        print('    修補 %-12s %6d px' % (label, int(m.sum())))
        return Image.fromarray(out, 'RGBA')
    return img


def crop_save(img, path, q=93):
    a = np.asarray(img)[:, :, 3]
    ys, xs = np.nonzero(a > 0)
    b = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    img.crop(b).save(path, quality=q, method=6)
    return [b[0], b[1], b[2] - b[0], b[3] - b[1]], os.path.getsize(path)


def complete_cloud(mask, side):
    """把被切掉的雲補成完整的一朵。

    原稿裡四朵雲都被切過:兩朵被畫布左緣、兩朵被窗框的弧。切口是「遮擋物的邊」
    不是雲自己的邊,所以雲一飄離那個遮擋物,那條邊就走進開闊的天空變成一刀切口。

    補法是把靠近切口那 70% 鏡射到外面、往下錯開幾 px 再疊上去,最後做形態學閉合。
    雲是純白(255,255,255,標準差 0.2),所以補的只有輪廓,沒有發明任何明暗;
    而且鏡射用的是這朵雲自己的弧,和原稿是同一種語彙(卡通雲就是一堆圓疊出來的)。
    也試過「往切口外面長一圈再磨圓」,長出來是方塊不是雲,不用。

    回傳的是加了邊界的畫布(補出來的部分可能落在畫布外,那是對的 —— 雲飄進來才看得到)。
    """
    W = CANVAS + 2 * CLOUD_PAD
    p = np.zeros((W, W), bool)
    p[CLOUD_PAD:CLOUD_PAD + CANVAS, CLOUD_PAD:CLOUD_PAD + CANVAS] = mask
    ys, xs = np.nonzero(p)
    x0, x1 = xs.min(), xs.max()
    ax = x0 if side == 'L' else x1
    mir = np.zeros_like(p)
    for k in range(0, int((x1 - x0 + 1) * 0.70)):
        s_ = ax + k if side == 'L' else ax - k
        d_ = ax - k if side == 'L' else ax + k
        if 0 <= s_ < W and 0 <= d_ < W:
            mir[:, d_] = p[:, s_]
    full = p | shift(mir, 3, -10 if side == 'L' else 10)
    return erode(dilate(full, 20, True), 20, True)


# ── 打光 ─────────────────────────────────────────────────────────
def light_fields(sky_vis, city, aperture):
    """分級要用到的幾何。上一版這裡要擬合一個圓才知道窗口在哪;現在天空與城市
    各自就是一層,開口精確到像素。"""
    h, w = sky_vis.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    w_out = np.clip((np.clip(boxblur(aperture.astype(float), 4), 0, 1) - 0.34) / 0.44, 0, 1)
    ld = np.sqrt((xx - LAMP['x']) ** 2 + (yy - LAMP['y']) ** 2) / LAMP['r']
    fall = np.clip(1.0 - ld, 0, 1) ** 1.6
    wd = np.sqrt(((xx - WIN['x']) / WIN['rx']) ** 2 + ((yy - WIN['y']) / WIN['ry']) ** 2)
    spill = np.clip(1.0 - wd, 0, 1) ** 1.5
    return {'w_out': w_out, 'city': city, 'sky': sky_vis, 'fall': fall,
            'spill': spill, 'yy': yy, 'ld': ld}


def lamp_share(A, L, G, cfg, tint=1.0):
    """檯燈開著時多出來的那一份:直射 + 打到牆面再散回來的散射 + 暖色偏移。
    三份都跟著檯燈一起熄,所以它就是「開燈 − 關燈」。

    白天與黃昏的 scatter / warm 都是 0:那兩個時段檯燈不影響房間,只把原圖裡本來
    就畫著的那一份加回去。散射一開,關燈就會在畫面上留下一團放射狀的黑色光暈 ——
    那不是關燈,那是憑空多出來的陰影。"""
    glow = np.clip(1.0 - G['ld'] / cfg['warm_r'], 0, 1) ** 1.4
    return (L * cfg['lamp']
            + A * tint * (glow * cfg['scatter'])[..., None]
            + glow[..., None] * np.array(cfg['warm'], float)[None, None, :])


def time_target(src, G, key):
    """這個時段「靜止合成」該有的樣子。回傳 (檯燈亮著, 檯燈關著)。"""
    warm = np.array(LAMP['warm'], dtype=float)[None, None, :]
    L = src * LAMP['amount'] * G['fall'][..., None] * warm     # 原圖裡屬於檯燈的那份光
    A = src - L                                                # 白天的環境光
    if key == 'day':
        # 白天 + 開燈就是原圖本身 —— 這條不變式不能破(白天沒有分級圖)。
        return src, src
    cfg = TIMES[key]
    r, g, b = src[:, :, 0], src[:, :, 1], src[:, :, 2]

    # ---- 室外:天空是位置漸層,城市按像素值分級(它畫死不動,可以這樣做) ----
    ys = np.array([s[0] for s in cfg['sky']], float)
    cs = np.array([s[1] for s in cfg['sky']], float)
    sky_t = np.stack([np.interp(G['yy'], ys, cs[:, i]) for i in range(3)], axis=2)
    Y = 0.299 * r + 0.587 * g + 0.114 * b
    chroma = src - Y[..., None]
    cast = np.array(cfg['city_cast'], float)
    cast = cast / (0.299 * cast[0] + 0.587 * cast[1] + 0.114 * cast[2])
    Yn = cfg['city_lo'] + (cfg['city_hi'] - cfg['city_lo']) * (Y / 255.0) ** cfg['city_gamma']
    city_t = Yn[..., None] * cast[None, None, :] + chroma * cfg['city_sat']
    # 門檻 60:city 藍色像素的 b−r 是雙峰的,20~50 那一峰是塔身的藍灰陰影,
    # 65 以上那一峰才是真正的窗格。用 35 的話整片陰影會長出螢光斑。
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
    tint = np.array(cfg['tint'])[None, None, :]
    amb = cfg['amb'] + (1 - cfg['amb']) * G['spill'][..., None]
    in_off = A * tint * amb + G['spill'][..., None] * np.array(cfg['spill'])[None, None, :]
    lit = lamp_share(A, L, G, cfg, tint)

    K = 0.80

    def softcap(v):
        u = v / np.maximum(src, 1.0)
        u = np.where(u < K, u, 0.98 - (0.98 - K) * np.exp(-(u - K) / (0.98 - K)))
        return u * src

    in_on = softcap(in_off + lit)
    in_off = softcap(in_off) if cfg['room_off'] else in_on
    wo = G['w_out'][..., None]
    return (np.clip(wo * out_t + (1 - wo) * in_on, 0, 255),
            np.clip(wo * out_t + (1 - wo) * in_off, 0, 255))


def split_maps(ref, t_on, t_off):
    """把 ref → t_on 拆成 multiply + screen,再把「關燈」拆成另一張 multiply。"""
    s = ref / 255.0
    on = np.clip(t_on / 255.0, 0, 1)
    off = np.clip(t_off / 255.0, 0, 1)
    M = np.clip(on / np.maximum(s, 1e-4), 0, 1)
    B = s * M
    # 只有「multiply 之後還不夠亮」的地方才需要 screen。少了這個判斷,純白像素會
    # 算出 S=1(0/0),那一層就把輸出釘死在白色,關燈那一層再怎麼乘都壓不下來。
    S = np.where(on > B + 1e-6,
                 np.clip(1 - (1 - on) / np.maximum(1 - B, 1e-4), 0, 1), 0.0)
    want = 1 - (1 - off) / np.maximum(1 - S, 1e-4)
    Off = np.where(B > 1e-4, np.clip(want, 0, 1) / np.maximum(B, 1e-4), 1.0)
    return M, S, np.clip(Off, 0, 1)


def save_map(arr, path):
    """有損與無損各壓一次,留小的那個。夜晚的 screen 圖幾乎全黑只有霓虹,無損反而
    又小又準;黃昏的 screen 圖整片天空都有值,有損才划算。"""
    im = Image.fromarray(np.clip(arr * 255, 0, 255).astype('uint8'))
    a, b = path + '.a.webp', path + '.b.webp'
    im.save(a, quality=84, method=6)
    im.save(b, lossless=True, quality=90, method=6)
    keep, drop = (a, b) if os.path.getsize(a) <= os.path.getsize(b) else (b, a)
    os.replace(keep, path)
    os.remove(drop)
    return os.path.getsize(path)


def main():
    if not os.path.exists(SVG):
        sys.exit('找不到拆好的圖層:' + SVG)
    layers = load_layers()
    print('讀到 %d 層' % len(layers))
    src_ref = np.asarray(Image.open(SRC_REF).convert('RGB')).astype(float)
    used = {i for v in MOVERS.values() for i in v} | set(CLOUDS) | set(FRONT)
    os.makedirs(os.path.join(OUT, 'parts'), exist_ok=True)
    os.makedirs(os.path.join(OUT, 'grade'), exist_ok=True)

    # ---- 底板 = 空房間 + 所有不會動的層 ----
    plate_rgba = place(layers, [i for i in range(N_LAYERS) if i not in used])
    # 會動的東西不能補進底板(會變兩份),其餘缺的都拿原稿補回來
    moving = np.zeros((CANVAS, CANVAS), bool)
    for ids in list(MOVERS.values()) + [[i] for i in CLOUDS] + [FRONT]:
        moving |= alpha_of(layers, ids)
    # 窗框與天空的交界整條直接用原稿:兩層的 alpha 在那裡對不齊,差幾階但看得到
    # 一條鋸齒(門檻補不到,因為色差不夠大)。
    sky0 = alpha_of(layers, [SKY_L])
    rim = dilate(sky0, 7) & ~erode(sky0, 7)
    plate_rgba = repair(plate_rgba, ~dilate(moving, 3), src_ref, '底板', force=rim)
    if (np.asarray(plate_rgba)[:, :, 3] < 250).mean() > 0.001:
        sys.exit('底板有透明的地方 —— 空房間那一層沒有蓋滿整張畫布')
    plate_rgba.convert('RGB').save(os.path.join(OUT, 'stage.webp'), quality=88, method=6)
    plate = np.asarray(plate_rgba.convert('RGB')).astype(float)
    n_plate = os.path.getsize(os.path.join(OUT, 'stage.webp'))
    print('  底板 %d bytes' % n_plate)

    # ---- 會動的元件 ----
    boxes, total = {}, 0
    for name, ids in MOVERS.items():
        g = place(layers, ids)
        g = repair(g, alpha_of(layers, ids), src_ref, name)   # 海報的 BUILD 字在這裡救回來
        b, sz = crop_save(g, os.path.join(OUT, 'parts', name + '.webp'))
        boxes[name] = b
        total += sz
        print('  %-16s %3dx%-3d @(%4d,%4d) %6d bytes' % (name, b[2], b[3], b[0], b[1], sz))
    b, sz = crop_save(repair(place(layers, FRONT), alpha_of(layers, FRONT), src_ref, 'front_shelf'),
                      os.path.join(OUT, 'parts', 'front_shelf.webp'))
    boxes['front_shelf'] = b
    total += sz
    print('  %-16s %3dx%-3d @(%4d,%4d) %6d bytes  ← 畫在會動的層前面'
          % ('front_shelf', b[2], b[3], b[0], b[1], sz))

    # ---- 雲:補成完整的一朵,純白所以只補輪廓 ----
    W = CANVAS + 2 * CLOUD_PAD
    cloud_ids = []
    for k, i in enumerate(CLOUDS):
        m = alpha_of(layers, [i])
        full = complete_cloud(m, CLOUD_CUT[i])
        soft = np.clip(boxblur(full.astype(float), 2) * 1.35, 0, 1)
        rgba = np.zeros((W, W, 4), 'uint8')
        rgba[:, :, :3] = 255                       # 雲是純白的,標準差 0.2
        rgba[:, :, 3] = (soft * 255).astype('uint8')
        ys, xs = np.nonzero(soft > 0.004)
        im = Image.fromarray(rgba, 'RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        cid = 'cloud_%d' % k
        p = os.path.join(OUT, 'parts', cid + '.webp')
        im.save(p, quality=93, method=6)
        sz = os.path.getsize(p)
        boxes[cid] = [int(xs.min()) - CLOUD_PAD, int(ys.min()) - CLOUD_PAD, im.width, im.height]
        total += sz
        cloud_ids.append(cid)
        print('  %-16s %3dx%-3d @(%4d,%4d) %6d bytes  原本 %d px → 補完 %d px'
              % (cid, im.width, im.height, boxes[cid][0], boxes[cid][1], sz, m.sum(), full.sum()))
    print('  元件共 %d bytes' % total)

    # ---- 城市窗格的光:夜裡在網頁端疊亮並閃動 ----
    # 分三組是為了讓它們各閃各的 —— 整座城市一起明滅會像在呼吸,不像有人在裡面。
    # 貼圖用的是窗格自己的像素(原稿畫的那面藍窗),screen 疊上去就是「窗內有光」。
    comp0 = place(layers, list(range(N_LAYERS)))
    src0 = np.asarray(comp0.convert('RGB')).astype(float)
    city0 = np.zeros((CANVAS, CANVAS), bool)
    for i in CITY_L:
        city0 |= alpha_of(layers, [i])
    r0, b0 = src0[:, :, 0], src0[:, :, 2]
    win = solid_blobs(city0 & (b0 - r0 > 60) & (b0 > 118), max_px=520)
    groups = [np.zeros((CANVAS, CANVAS), bool) for _ in range(3)]
    lab = np.zeros((CANVAS, CANVAS), np.int32)
    nid = 0
    for y0, x0 in zip(*np.nonzero(win)):
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
                if 0 <= ny < CANVAS and 0 <= nx < CANVAS and win[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = nid
                    q.append((ny, nx))
        gi = nid % 3
        for y, x in cells:
            groups[gi][y, x] = True
    light_ids = []
    for gi, gm in enumerate(groups):
        if not gm.any():
            continue
        rgba = np.zeros((CANVAS, CANVAS, 4), 'uint8')
        rgba[:, :, :3] = src0.astype('uint8')
        rgba[:, :, 3] = (dilate(gm, 1) * 255).astype('uint8')
        cid = 'city_light_%d' % gi
        b, sz = crop_save(Image.fromarray(rgba, 'RGBA'), os.path.join(OUT, 'parts', cid + '.webp'))
        boxes[cid] = b
        total += sz
        light_ids.append(cid)
        print('  %-16s %3dx%-3d @(%4d,%4d) %6d bytes  %d 個窗格'
              % (cid, b[2], b[3], b[0], b[1], sz, int(gm.sum())))

    # ---- 雲的可見範圍 = 天空那一層減掉城市 ----
    # 硬邊:窗框與每一棟建築都要確實擋住雲。上一版的窗口是擬合出來的圓,差 1–3px,
    # 所以得靠柔邊去藏;現在開口就是天空那一層的 alpha,精確到像素,硬邊才是對的。
    sky = alpha_of(layers, [SKY_L])
    city = np.zeros((CANVAS, CANVAS), bool)
    for i in CITY_L:
        city |= alpha_of(layers, [i])
    vis = sky & ~city
    ys_, xs_ = np.nonzero(vis)
    mb = (max(0, xs_.min() - 2), max(0, ys_.min() - 2),
          min(CANVAS, xs_.max() + 3), min(CANVAS, ys_.max() + 3))
    Image.fromarray((vis[mb[1]:mb[3], mb[0]:mb[2]] * 255).astype('uint8'), 'L') \
        .save(os.path.join(OUT, 'sky-mask.webp'), lossless=True, quality=100, method=6)
    print('  可見天空遮罩 %d×%d px @(%d,%d)' % (mb[2] - mb[0], mb[3] - mb[1], mb[0], mb[1]))

    # ---- 建築的形狀 ----
    # 月亮升起時,月光要打在建築上並隨月亮移動,所以得知道建築在哪。
    # city 就是四個城市圖層的 alpha 聯集(遠塔 / 樹 / 圓頂 / 高塔)= 天際線本身。
    # 只當遮罩用,不參與疊圖 —— 建築本體仍然烘在底板裡,這裡不會多畫任何東西出來。
    cys_, cxs_ = np.nonzero(city)
    cb = (max(0, cxs_.min() - 2), max(0, cys_.min() - 2),
          min(CANVAS, cxs_.max() + 3), min(CANVAS, cys_.max() + 3))
    Image.fromarray((city[cb[1]:cb[3], cb[0]:cb[2]] * 255).astype('uint8'), 'L') \
        .save(os.path.join(OUT, 'city-mask.webp'), lossless=True, quality=100, method=6)
    print('  建築遮罩 %d×%d px @(%d,%d)' % (cb[2] - cb[0], cb[3] - cb[1], cb[0], cb[1]))

    # ---- 天色分級 ----
    # 參考影格 = 靜止合成。天空區改用底板(雲是獨立的層,底板那裡是乾淨的天空),
    # 這樣雲飄到哪裡分級都對得上。
    comp = place(layers, list(range(N_LAYERS)))
    src = np.asarray(comp.convert('RGB')).astype(float)
    ref = np.where(sky[..., None], plate, src)
    G = light_fields(vis, city, sky | city)
    gtotal, grade_off = 0, []
    for key in GRADE_TIMES:
        t_on, t_off = time_target(src, G, key)
        M, S, Off = split_maps(ref, t_on, t_off)
        back = (1 - (1 - ref / 255.0 * M) * (1 - S)) * 255
        e_on = float(np.abs(back - t_on).max())
        e_off = float(np.abs((1 - (1 - ref / 255.0 * M * Off) * (1 - S)) * 255 - t_off).max())
        if max(e_on, e_off) > 1.0:
            sys.exit('%s 的分級圖拆不乾淨(誤差 %.1f / %.1f)' % (key, e_on, e_off))
        line = '  %-5s' % key
        if float(np.abs(t_on - t_off).max()) > 0.5:
            n = save_map(Off, os.path.join(OUT, 'grade', '%s-off.webp' % key))
            gtotal += n
            grade_off.append(key)
            line += ' 關燈 %6d' % n
        else:
            p_ = os.path.join(OUT, 'grade', '%s-off.webp' % key)
            if os.path.exists(p_):
                os.remove(p_)
            line += ' 關燈 —— 不影響房間,不出圖'
        if key != 'day':
            for nm, arr in (('m', M), ('s', S)):
                k2 = save_map(arr, os.path.join(OUT, 'grade', '%s-%s.webp' % (key, nm)))
                gtotal += k2
                line += '  %s %6d' % (nm, k2)
        print(line + ' bytes')

    # ---- 產生 JS 的貼圖框表 ----
    lines = ['// 產生檔,不要手改:python tools/gen-allen-room-assets.py',
             '// 素材來自 assets/svg/test.svg —— 美術手工拆好的 40 個圖層。',
             '// 每個元件的貼圖框 [x, y, w, h](1254×1254 座標)。雲的 x 可能是負的:',
             '// 補全出來的部分落在畫布外,雲飄進來才看得到。',
             'export const PART_BOX = {']
    for k in list(MOVERS) + cloud_ids + light_ids + ['front_shelf']:
        lines.append("  '%s': [%d, %d, %d, %d]," % (k, *boxes[k]))
    lines += ['};', '',
              '// 雲的可見範圍 = 天空那一層減掉城市。窗框與每一棟建築都會確實擋住雲。',
              'export const SKY_MASK = [%d, %d, %d, %d];'
              % (mb[0], mb[1], mb[2] - mb[0], mb[3] - mb[1]), '',
              '// 建築的形狀(四個城市圖層的 alpha 聯集)。月光打在建築上時當遮罩用,',
              '// 不參與疊圖 —— 建築本體仍然烘在底板裡。',
              'export const CITY_MASK = [%d, %d, %d, %d];'
              % (cb[0], cb[1], cb[2] - cb[0], cb[3] - cb[1]), '',
              '// 夜裡會亮起來的城市窗格。分三組各閃各的 —— 整座一起明滅會像在呼吸。',
              "export const CITY_LIGHTS = [%s];" % ', '.join("'%s'" % t for t in light_ids), '',
              '// 有分級圖的時段。白天就是原圖,所以它不會有 m/s 兩張。',
              "export const GRADE_TIMES = [%s];" % ', '.join("'%s'" % t for t in GRADE_TIMES), '',
              '// 有「關燈分級圖」的時段 —— 只有這幾個時段關燈會影響整個房間。',
              "export const GRADE_OFF = [%s];" % ', '.join("'%s'" % t for t in grade_off), '']
    io.open(JS_OUT, 'w', encoding='utf-8').write('\n'.join(lines))

    # ---- 驗收:底板 + 元件貼回去 = 逐層疊起來(雲除外,它被補過) ----
    got = Image.open(os.path.join(OUT, 'stage.webp')).convert('RGBA')
    for name in list(MOVERS) + ['front_shelf']:
        got.alpha_composite(Image.open(os.path.join(OUT, 'parts', name + '.webp')).convert('RGBA'),
                            (boxes[name][0], boxes[name][1]))
    # 和「原稿」比,不是和逐層疊起來比 —— 補過之後原稿才是基準。
    # 關卡不看 RMSE 看「有沒有整塊不見」:轉檔把整張放大成 1500 再換算回來,
    # 每一條描邊都會差個 1px,那種差異 RMSE 看得到、眼睛看不到。真正要擋的是
    # 「一整塊東西沒了」(BUILD 字、窗口的天空沒接到窗框)。
    keep = np.ones((CANVAS, CANVAS), bool)
    for i in CLOUDS:
        keep &= ~dilate(alpha_of(layers, [i]), 3)          # 雲被補全過,不比
    d = np.abs(np.asarray(got.convert('RGB')).astype(int) - src_ref.astype(int)).sum(2)
    rmse = float(np.sqrt((np.abs(np.asarray(got.convert('RGB')).astype(float)
                                 - src_ref)[keep] ** 2).mean()))
    bad = (d > 60) & keep
    lab = np.zeros(bad.shape, np.int32)
    nid, worst = 0, []
    for y0, x0 in zip(*np.nonzero(bad)):
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
                if 0 <= ny < CANVAS and 0 <= nx < CANVAS and bad[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = nid
                    q.append((ny, nx))
        if n >= 400:
            ys, xs = np.nonzero(lab == nid)
            worst.append((n, int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())))
    worst.sort(reverse=True)
    print('stage.webp %d bytes,元件共 %d bytes,分級圖共 %d bytes(全部延後載入)'
          % (n_plate, total, gtotal))
    print('靜止合成(不含雲)vs 原稿 RMSE = %.2f;差 >60 的成塊區域 %d 處' % (rmse, len(worst)))
    for n, x0, y0, x1, y1 in worst[:6]:
        print('   %7d px  x%d-%d y%d-%d' % (n, x0, x1, y0, y1))
    if worst:
        sys.exit('有整塊東西和原稿對不上 —— 拆解掉了什麼,或疊圖順序錯了')


if __name__ == '__main__':
    main()
