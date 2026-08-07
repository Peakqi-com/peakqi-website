# -*- coding: utf-8 -*-
"""Allen 工作間的剪紙動畫素材產生器 ── 冪等,跑幾次結果都一樣
    python tools/gen-allen-room-assets.py

輸入:assets/svg/robot_workshop_strict_source_package/
        source_original_embedded.png   原始場景圖 1254×1254
        components_png/<id>.png        22 個切片(含 alpha)
        manifest_strict.json           每個切片的 bbox
輸出:assets/allen/room/stage.webp     底板
      assets/allen/room/parts/<id>.webp  會動的元件

這支不是網站建置流程的一部分,是換素材時手動跑一次。之所以留在 repo 裡,是因為
底板的做法有三個非直覺的決定,忘記了會做壞:

1) 不用套件附的 background_plate_strict.png。
   那張把 22 個元件全部挖掉再修補,大面積的地方留下明顯拖曳痕 —— 洞洞板那塊直接
   變成一片咖啡色楔形,板手只要擺動幾度就會露餡。

2) 只挖「會動的那幾個」,而且要一次挖完再擴散。
   一個一個處理的話,還沒處理到的元件仍是原始像素,會變成隔壁元件的種子 ——
   洞洞板那四支工具就是這樣互相把灰色餵給對方,修補完留下一團灰。

3) 擴散用的洞要外擴幾 px(種子才不會沾到元件自己的抗鋸齒邊),但最後只把
   「元件靜止時蓋得到」的像素換成修補結果,外面那一圈還原成原圖。
   不還原的話,那一圈修補過的環在靜止時就露在外面(盆栽左邊會多一道紅色拖痕)。

驗收:底板 + 全部元件貼回原位,和原圖比 RMSE 應該在 4 以下(剩下的是 webp 量化)。
本檔最後會自己算一次並印出來。
"""
import io
import json
import os
import sys

try:
    import numpy as np
    from PIL import Image
except ImportError:                                    # pragma: no cover
    sys.exit('需要 numpy 與 Pillow:pip install numpy pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKG = os.path.join(ROOT, 'assets/svg/robot_workshop_strict_source_package')
OUT = os.path.join(ROOT, 'assets/allen/room')
CANVAS = 1254
GROW = 5                                               # 擴散用的洞外擴量

# 會動的元件。改這裡就要同步改 allen-room.js 的 PARTS。
MOVERS = [
    'wrench_left', 'wrench_right', 'screwdriver_left', 'screwdriver_right',
    'lamp', 'mug', 'left_plant', 'shelf_plant',
    'red_button', 'green_button', 'poster', 'screen',
]


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


def diffuse(rgb, hole, iters=800):
    """把 hole 填掉,只從 hole 以外的真實像素向內擴散(邊界最準,深處是猜的,
    但深處永遠被元件蓋著,看不到)。"""
    img = rgb.astype(np.float64).copy()
    known = ~hole
    img[hole] = 0.0
    for _ in range(iters):
        if known.all():
            break
        k = known.astype(np.float64)
        s = np.zeros_like(img)
        c = np.zeros_like(k)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            w = 1.0 if abs(dy) + abs(dx) == 1 else 0.5
            s += np.stack([shift(img[:, :, i] * k, dy, dx) for i in range(3)], axis=2) * w
            c += shift(k, dy, dx) * w
        fill = (~known) & (c > 0)
        if not fill.any():
            break
        img[fill] = s[fill] / c[fill][..., None]
        known |= fill
    return np.clip(img, 0, 255)


def main():
    man = json.load(io.open(os.path.join(PKG, 'manifest_strict.json'), encoding='utf-8'))
    byid = {c['id']: c for c in man['components']}
    missing = [m for m in MOVERS if m not in byid]
    if missing:
        sys.exit('manifest 裡找不到這些元件:' + ', '.join(missing))
    if man['canvas']['width'] != CANVAS:
        sys.exit('畫布尺寸變了(%d),allen-room.js 的座標要跟著改' % man['canvas']['width'])

    src = np.asarray(Image.open(os.path.join(PKG, 'source_original_embedded.png'))
                     .convert('RGB')).astype(float)
    hole = np.zeros((CANVAS, CANVAS), dtype=bool)      # 擴散用(外擴)
    cover = np.zeros((CANVAS, CANVAS), dtype=bool)     # 真正要換掉的(元件蓋得到的)
    for cid in MOVERS:
        c = byid[cid]
        a = np.asarray(Image.open(os.path.join(PKG, 'components_png', c['file']))
                       .convert('RGBA'))[:, :, 3]
        x0, y0, x1, y1 = c['bbox']
        sil = np.zeros((CANVAS, CANVAS), dtype=bool)
        sil[y0:y1, x0:x1] = a > 10
        cover |= sil
        hole |= dilate(sil, GROW)

    print('擴散中(%d 個元件,%d px 的洞)…' % (len(MOVERS), int(hole.sum())))
    plate = np.where(cover[..., None], diffuse(src, hole), src)

    os.makedirs(os.path.join(OUT, 'parts'), exist_ok=True)
    Image.fromarray(plate.astype('uint8')).save(os.path.join(OUT, 'stage.webp'),
                                                quality=88, method=6)
    total = 0
    for cid in MOVERS:
        im = Image.open(os.path.join(PKG, 'components_png', byid[cid]['file'])).convert('RGBA')
        p = os.path.join(OUT, 'parts', cid + '.webp')
        im.save(p, quality=90, method=6)
        total += os.path.getsize(p)

    # ---- 驗收:貼回去要和原圖幾乎一樣 ----
    comp = Image.open(os.path.join(OUT, 'stage.webp')).convert('RGBA')
    for cid in MOVERS:
        part = Image.open(os.path.join(OUT, 'parts', cid + '.webp')).convert('RGBA')
        b = byid[cid]['bbox']
        comp.alpha_composite(part, (b[0], b[1]))
    d = np.abs(np.asarray(comp.convert('RGB')).astype(int) - src.astype(int))
    rmse = float(np.sqrt((d ** 2).mean()))
    print('stage.webp %d bytes,%d 個元件共 %d bytes'
          % (os.path.getsize(os.path.join(OUT, 'stage.webp')), len(MOVERS), total))
    print('靜止合成 vs 原圖 RMSE = %.2f' % rmse)
    if rmse > 4.5:
        sys.exit('RMSE 太高 —— 底板或切片對不上,不要就這樣上線')


if __name__ == '__main__':
    main()
