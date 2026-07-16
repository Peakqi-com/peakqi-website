# PeakQi Hero 影格序列替換說明

目前首頁 Hero 使用「程序式 Canvas 動畫」(hero-engine.js 內建),
沒有任何空白 placeholder;正式影格完成後可無痛切換。

## 替換步驟
1. 將影格放入:
   - `sequence/desktop/frame_0001.webp` … `frame_0120.webp`(建議 1600×900,100–120 幀)
   - `sequence/tablet/frame_0001.webp` … `frame_0080.webp`(約 70–90 幀)
   - `sequence/mobile/frame_0001.webp` … `frame_0048.webp`(約 40–60 幀,直式可用 828×1200)
2. 開啟 `sequence/manifest.js`,把 `enabled: false` 改為 `true`;
   如幀數或命名不同,同步修改 `frameCount / prefix / pad / ext / path`。
3. 重新整理首頁即生效。

## 載入行為(hero-engine.js 已內建)
- `createImageBitmap` 預解碼,不支援時回退 `HTMLImageElement`
- 先載入目前幀附近(±6),其餘依捲動分批載入,同時最多 3 個請求
- 快取目前幀前後約 24 幀,超出範圍自動釋放(bitmap.close())
- `frameIndex = round(clamp(progress,0,1) × (frameCount − 1))`
- 任一層載入連續失敗 → 自動回退程序式動畫,不會破圖

## 降級
- `prefers-reduced-motion`:取消 pinned/視差,顯示靜態關鍵畫面與完整文字、CTA
- Canvas 不可用:純 DOM 靜態 Hero(文字與 CTA 皆在 DOM,Canvas 為 aria-hidden)
