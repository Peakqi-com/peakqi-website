# 部落格寫作說明

這個資料夾是**唯一的內容來源**。網頁(`/blog/*.dc.html`、`Blog.dc.html`、`posts.js`、
`sitemap.xml`、`feed.xml`)全部由 `node tools/build-blog.mjs` 產生 —— 不要手改產出的檔案,
下次重建就會被蓋掉。

## 發一篇文章

```bash
# 1. 開草稿(--en 會同時開英文稿;只寫中文就別加)
node tools/new-post.mjs line-inquiry-handoff "LINE 詢問接不住的三個斷點" --en

# 2. 編輯 content/blog/line-inquiry-handoff.zh.md,寫完後把 front matter 的 draft: true 刪掉

# 3. 重建(每次都是全站重建,冪等,跑幾次結果都一樣)
node tools/build-blog.mjs

# 4. 本機看一眼(會實際套用 vercel.json 的路由,和正式站一致)
node tools/serve.mjs        # → http://localhost:8000/blog

# 5. commit → push → 部署
```

## front matter 欄位

| 欄位 | 必填 | 說明 |
|---|---|---|
| `title` | ✅ | 文章標題,也是 `<title>` 與分享預覽標題 |
| `summary` | ✅ | 一句話。同時當列表摘要與 `og:description`,中文 60 字 / 英文 155 字內 |
| `date` | ✅ | `YYYY-MM-DD`,決定排序 |
| `tags` | | 逗號分隔,可用值見 `tools/build-blog.mjs` 的 `TAGS`;要加新標籤請先加進去 |
| `cover` | | 封面圖絕對路徑,例 `/assets/blog/xxx.webp`。留空會自動配一塊莫蘭迪色帶 |
| `coverAlt` | | 封面圖替代文字 |
| `updated` | | 大幅改寫時填,會顯示「更新於」並更新 sitemap 的 lastmod |
| `draft` | | `true` 就完全不產出網頁(草稿安全預設) |

## 檔名規則

```
content/blog/<slug>.zh.md   →  /blog/<slug>
content/blog/<slug>.en.md   →  /en/blog/<slug>
```

`slug` 只能用小寫英數與連字號,它會直接變成網址,**上線之後不要再改**(改了等於換網址,
原本累積的排名會歸零)。

## 只寫中文完全可以

沒有 `<slug>.en.md` 就代表這篇沒有英文版:英文列表不列出、不輸出 hreflang、
該頁的語言切換鈕不會出現 —— 不會產生任何死連結。之後補上英文稿再重建即可。

反過來只有英文沒有中文則不會產出(中文是主站),重建時會在終端機提醒。

## 可以用的 Markdown

`## / ###` 標題、段落、`- ` 清單、`1. ` 有序清單、`> ` 引言、` ``` ` 程式碼、
表格、`---` 分隔線、`**粗體**`、`*斜體*`、`` `行內程式碼` ``、`[連結](/path)`、`![圖說](/assets/...)`。

- 文章大標由 `title` 提供,**內文請從 `##` 開始**,不要用 `#`
- 圖片路徑一律用絕對路徑 `/assets/blog/...`(相對路徑在 `/blog/` 這層會找錯位置,重建時會警告)
- 表格與程式碼在手機上會自己橫向捲動,不會撐爆版面
- 需要塞原生 HTML(例如嵌影片)時,讓那一段從 `<` 開頭,整段會原樣輸出

## 內容規範(和全站一致)

- 不給任何保證,不出現「不綁約」「保證」「零風險」這類字樣(英文的 guarantee / SLA / risk-free 同樣不行)
- 不捏造數字、客戶名、資安認證。要用數字就要有可查來源;沒有就不要寫
- 情境估算一定要標明是估算,並附上算式
