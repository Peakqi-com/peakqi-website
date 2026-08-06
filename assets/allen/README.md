# Allen 的美術資產

| 檔案 | 來源 | 用途 |
|---|---|---|
| `workshop.webp` | `assets/svg/robot_removed_web_background.svg` 裡內嵌的 PNG | 第一幕的背景 |

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
