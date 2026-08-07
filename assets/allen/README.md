# Allen 的美術資產

| 檔案 | 來源 | 用途 |
|---|---|---|
| `workshop.webp` | `assets/svg/robot_removed_web_background.svg` 裡內嵌的 PNG | 第一幕的背景 |
| `turnaround.webp` | `assets/svg/robot_turnaround_8_views_exact.svg` 裡內嵌的 PNG | 轉身那一段的六格精靈圖 |

## workshop.webp 怎麼來的
原稿是一張 3.8 MB 的 SVG,裡面包著一張 1254×1254 的 base64 PNG(機器人已被去掉的工作間)。
那個尺寸不能上線,所以轉成同解析度的 WebP:

```
magick <原始 PNG> -strip -resize 1254x1254 -define webp:method=6 -quality 86 workshop.webp
```

3.8 MB → 103 KB,平塗卡通畫面在 q86 下與原圖肉眼無差(RMSE 1.3%,全落在邊緣抗鋸齒上)。

## 機器人本體不在這裡
角色是向量,直接編成 `allen-art.js`(見根目錄 README「如何替換 Allen」)。
原稿與分解圖留在 `assets/svg/`,只是素材備份,線上不會載入。

## turnaround.webp 怎麼來的
原稿是 2048×682 的八視角 PNG(一樣包在 SVG 殼裡)。處理了三件事:

1. **去背**:不能直接砍白色 —— 眼白、胸板、鞋底也是白的。改成先找出所有白色連通區塊,
   碰到畫面邊界的算背景;另外「又高又大」的封閉白色口袋(135° 與 225° 兩格的雙腿之間,
   高 160+ px)也算背景,而圖形自己的白最高只有胸板約 40px,兩者分得很開。
2. **對齊**:每一格量出「最底下 34 列(鞋子)的水平中心」當重心軸,再把八格都以那條軸
   置中重排。原圖的八個圖形既不是等距也不是置中的。
3. **裁格**:只留 45°–270° 六格。理由見根目錄 README。

換圖的話這三步要重跑,腳本沒有留在 repo 裡(一次性的資料清理,留著反而會誤導成建置流程)。
