# 文章後台 `/admin`

Sveltia CMS(Git-based)。它只讀寫 `content/blog/*.md` 並 commit 進 `main`,
**不碰網站本身** —— 站仍然是純靜態,沒有資料庫、沒有伺服器渲染。

## 怎麼登入

1. GitHub → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token
2. Repository access 選 `Peakqi-com/peakqi-website`
3. Permissions → Repository permissions → **Contents: Read and write**
4. 開 https://www.peakqi.com/admin → 點「**使用存取權杖登入**」→ 貼上

沒有用 OAuth(「使用 GitHub 登入」那顆)是因為那需要另外部署一台 OAuth proxy。
要改成多人可用、不必自己產 token 的模式:部署
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) 到 Cloudflare Workers,
然後在 `config.yml` 的 `backend` 加一行 `base_url: <proxy 網址>`。其餘設定都不用動。

## 存檔之後會發生什麼

```
後台存檔 → commit content/blog/<slug>.zh.md 進 main
        → .github/workflows/build-blog.yml 重建產物並 commit 回來
        → Vercel 部署
```

產物是 `blog/*.dc.html`、`Blog.dc.html`、`posts.js`、`sitemap.xml`、`feed.xml`。
這個專案的 Vercel **沒有 buildCommand**,所以產物一定要進版控,線上才看得到。

「草稿」打開(`draft: true`)就完全不產出網頁,可以安心存檔。

## 改設定時要注意的兩件事

**一、欄位要對得上 `tools/md.mjs` 的 parseFrontMatter**

那支不是真的 YAML parser,是逐行 `indexOf(':')`。所以:

- `date` / `updated` 一律 `YYYY-MM-DD`,不要帶時間
- `draft` 是布林,下游用字串比對 `meta.draft === 'true'`
- `tags` 會被寫成 YAML 區塊清單,parseFrontMatter 已特別支援(會併回逗號分隔字串);
  標籤選項必須跟 `tools/build-blog.mjs` 的 `TAGS` 一致,填別的重建時會警告並被丟掉

**二、`/admin` 的 CSP 是獨立的一條規則**

`vercel.json` 裡全站規則的 source 是 `/((?!admin).*)` —— 刻意把後台排除。
因為 Vercel 的 headers 規則是**累加**的,兩條同時命中時 CSP 會取交集,
全站那條沒有 `api.github.com`,後台就會連不上 GitHub。

所以動 `vercel.json` 的 headers 時,不要把那個 `(?!admin)` 拿掉。
`tools/gen-csp.mjs` 也是靠這個 source 字串找到全站規則的。

## 本機預覽

```bash
node tools/serve.mjs      # → http://localhost:8000/admin
```

`serve.mjs` 會套用 `vercel.json` 的 redirects / rewrites / headers,
所以 CSP 的分流在本機就驗得到。後台在本機可以用「使用本機倉庫」直接讀寫磁碟上的檔案,
不需要 token —— 但那會直接改本機檔案,記得自己 commit。
