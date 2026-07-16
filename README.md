# 奇鋒國際 PeakQi — 品牌網站

六路由 SPA-feel 多頁站:`Home` / `Solutions` / `Cases` / `Pricing` / `About` / `Demo`(+`404.dc.html`)。
內容唯一來源:`content.js`(依「AI 方案 Sales Kit」整理,所有價格、案例數字、保證條款都在這一個檔)。

## 檔案地圖
- `content.js` — 全站文案/價格/案例/FAQ/表單設定(改內容改這裡)
- `Nav.dc.html` / `Footer.dc.html` — 共用元件(Nav 含手機選單、Sticky CTA、事件)
- `hero-engine.js` — 首頁 Hero 捲動分鏡(Canvas 2D,7 幕)
- `sections-engine.js` — 痛點/損失/三層敘事/功能軌道
- `interactions-engine.js` — 案例 reveal+count-up、作品展廊、比較 sweep、時間軸
- `gl-engine.js` — WebGL 增強層(單一 renderer,可整檔停用)
- `micro-engine.js` — CTA 微互動/tilt/cursor/spotlight
- `seo.js` — canonical/OG/Twitter/schema 注入;`analytics.js` — 事件 adapter
- `sequence/manifest.js` — Hero 影格序列設定;`robots.txt`、`sitemap.xml`

## 如何替換 Hero sequence(影格版分鏡)
1. 把影格放進 `sequence/desktop|tablet|mobile/`,命名 `frame-0001.webp` 起連號。
2. 編輯 `sequence/manifest.js`:`enabled: true`,設定各 tier 的 `frameCount/path/prefix/pad/ext`。
3. 引擎自動:目前幀 ±6 預載、±24 之外釋放、最多 3 併發、失敗自動回退程序式 Canvas。
詳見 `sequence/README.md`。

## 如何替換案例/作品圖片
1. 新圖放 `assets/works/`(建議寬 1200、上緣即畫面重點;WebP/AVIF 佳,PNG 可)。
2. `content.js` 裡改對應項的 `img` 與 `alt`(`caseStudies`、`worksFeatured`、`portfolioAI/Web`)。

## 如何設定表單 API
`content.js` → `export const submitConfig = { endpoint: null }`。
填入正式 URL 後,表單以 `POST JSON`(欄位見 `Demo.dc.html` `_payload()`)送出;`null` 時為預覽 demo submission(畫面會明示,並提供 Email/電話備援)。失敗文案已符合品牌語氣。

## 如何修改方案資料
`content.js` → `plans`(價格/項目/featured)、`planModules`(方案↔模組範圍)、`customRanges`、`usage`、`timeline`、`risk`、`faq`。改完全站(首頁+價格頁)同步。

## 如何啟用/停用 WebGL
- 停用:`Home.dc.html` 邏輯裡刪掉 `import('./gl-engine.js')` 那段(或在 `gl-engine.js` `start()` 開頭 `return`)。
- 引擎本身在 reduced-motion / save-data / deviceMemory<4 / 寬<900 / context lost / shader 失敗時自動停用,底層敘事完整保留。

## Analytics
`analytics.js` 是可替換 adapter:部署時 `import { setSink } from './analytics.js'` 並 `setSink((name, data) => 你的平台.track(...))`。
事件:nav_demo_click、hero_demo_click、hero_case_click、sticky_demo_view/click、case_view、case_cta_click、pricing_plan_view、pricing_cta_click、demo_form_start/error/submit/success、contact_click。
預設只存 `window.__pqEvents`(無第三方追蹤、無 cookie);`?pqdebug=1` 才輸出 console。

## 正式部署前建議
1. 網域:`seo.js` 的 `SITE`、`sitemap.xml`、`robots.txt` 換正式網址;`.dc.html` 對應乾淨路由(/, /solutions⋯)。
2. 圖片:PNG 轉 AVIF/WebP 雙格式;`assets/og-image.png` 換正式社群圖(1200×630)。
3. 表單:接 `submitConfig.endpoint`(建議加 serverless 轉寄信箱)+ 伺服器端 rate limit。
4. 追蹤:如需分析,接 `setSink` 並補同意機制(cookie banner)後再啟用。
5. Hero:若要影視級影格,產出序列後照上面步驟開 `enabled`。
6. 字體:如要自託管 Noto Sans TC/Space Grotesk 子集化可再省 ~100ms。

## 尚需人工提供的正式素材
- 正式 LOGO 向量檔(現為程式繪製雙峰線條)
- 各作品實際高解析截圖或現場照(現用 Sales Kit 簡報截圖,已裁標題列)
- OG 社群圖如需攝影素材
- 正式網域與表單後端 endpoint
- 如需啟用追蹤:分析平台選型+隱私聲明頁
