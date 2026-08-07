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
- `allen-art.js`、`allen-room-parts.js`(產生檔)/ `allen-bot.js` / `allen-workshop.js` / `allen-room.js` / `allen-sky.js` — About 團隊卡的 Allen 與他的工作間

## 如何替換 Hero sequence(影格版分鏡)
1. 把影格放進 `sequence/desktop|tablet|mobile/`,命名 `frame-0001.webp` 起連號。
2. 編輯 `sequence/manifest.js`:`enabled: true`,設定各 tier 的 `frameCount/path/prefix/pad/ext`。
3. 引擎自動:目前幀 ±6 預載、±24 之外釋放、最多 3 併發、失敗自動回退程序式 Canvas。
詳見 `sequence/README.md`。

## 如何替換案例/作品圖片
1. 新圖放 `assets/works/`(建議寬 1200、上緣即畫面重點;WebP/AVIF 佳,PNG 可)。
2. `content.js` 裡改對應項的 `img` 與 `alt`(`caseStudies`、`worksFeatured`、`portfolioAI/Web`)。

## 如何替換 Allen(About 團隊卡的機器人角色)
角色分成三層,要改哪一層就只動哪一層:
- `allen-art.js` — **產生檔,不要手改**。Recraft 原稿的 194 條路徑,依原稿附的分解圖歸位
  成九塊剛體(頭/頸/軀幹/雙臂/雙腿/雙腳)加臉部零件(眼白/瞳孔/嘴)。
  換原稿:新的姿勢表放進 `assets/svg/`,跑 `node tools/gen-allen-art.mjs`。
  產生器會擋下路徑數量或色值對不上的情況 —— 那代表部位歸屬(`PARTS`)要重新核對。
- `allen-bot.js` — 綁定與演出。只認 `data-p` 名字與 `J` 錨點,不認顏色。
  `POSE` 的五個姿勢(站/揮手/走路/歡呼/坐)角度直接抄自原稿分解圖。
- `allen-workshop.js` — About 卡片上的第一幕:站位、演出排程、轉身;背景與房間互動在 `allen-room.js`。
- `allen-room.js` — 工作間的互動層,**剪紙動畫式:會動的每一樣東西都是原圖裡那個物件本身**。
  素材來自 `assets/svg/robot_workshop_strict_source_package`(場景圖的 22 個切片 + bbox)。
  底板挖掉會動的 12 個、其餘保留原始像素;元件貼回自己的 bbox,繞物理上真正的轉軸動:
  盆栽從土面搖、洞洞板的板手與起子從掛孔擺、馬克杯與檯燈繞底座微晃、按鈕按下去是位移、
  螢幕不做幾何只把自己的像素疊亮(screen 混合,不新增任何形狀)。
  六個地方可以點(窗戶、檯燈開關、馬克杯、海報、控制台、工具排),點下去 Allen 會轉頭看過去。
  `?roomdebug=1` 會把命中範圍畫出來。
  窗外有三朵雲會飄(產生器自己從天空分出來的,雲在城市後面)。**只有輪廓完整的雲會動** ——
  原稿裡有幾朵被畫布左緣或前面那座塔切掉一半,那些留在底板上不動:靜止的話那條切線只是
  原稿的構圖,一動就變成一刀切口。雲進出視野是靠遮罩在窗緣的柔邊淡出,不是硬切。
  螢幕與檯燈的光用軟邊的放射遮罩,不用硬邊矩形 —— 矩形在白天疊在同樣亮的底板上剛好
  消失,天色一暗就整個現形,變成一個發亮的方塊(實測夜裡的邊界跳躍是白天的 6.3 倍)。
  另外有三個「只會亮不會動」的地方(牆上小螢幕、頂上藍螢幕、地上機台燈條):不另外切圖,
  直接把底板自己的像素在那塊矩形上用 screen 混合疊亮,零新增檔案。
  還有一個不定時排程,每 5–12 秒挑一件事做大一點(陣風 / 螢幕跑資料 / 燈條連閃 / 檯燈閃一下 /
  只有工具排晃)—— 全部一起慢慢晃的話畫面沒有起伏。
- `allen-sky.js` — 天色:白天 / 黃昏 / 夜晚。開場看訪客自己的時鐘(6–16 白天、17–19 黃昏、
  20–5 夜晚),**戳窗戶會推到下一段**(順便起一陣風)。`?allentime=day|dusk|night` 可指定。

  做法不是「另外三張底板」,是**兩張分級圖疊在整疊最上面**:multiply 壓暗 + screen 提亮。
  任何一組「原圖 → 目標」都可以精確拆成這兩層(推導寫在產生器檔頭),而 CSS 的混合是在
  sRGB 直接算的,所以瀏覽器算出來的和產生器解出來的一樣(實測平均差 0.3 階、最大 3 階)。
  換底板的話只有底板會變,會動的 12 個元件、飄的雲、還有**站在房間裡的 Allen** 全都
  還是白天的顏色,人會浮在夜景上。分級圖蓋過角色,一次把所有東西調到同一個時段。

  分級必須是「位置的函數」不是「像素值的函數」:雲飄過去、元件擺動時露出來的底板,
  才不會被套上前一個物件的分級而留下鬼影。只有畫死不動的城市才按像素值分(那排藍色
  窗格要變霓虹),而且城市是「重打光」不是「每個通道各乘一個係數」—— 乘係數的話藍色的
  東西會變成黑洞、原稿的明暗關係被壓平,窗外就會粗糙沒有形體。檯燈與螢幕是自己會發光
  的東西,所以它們那一層疊在分級**之上** ——
  夜裡它們不該跟著環境一起暗,反而該變成主角。關燈也是分級圖(每個時段一張),
  所以夜裡關檯燈的落差比白天大得多,而且元件與 Allen 會一起暗下來:
  量出來是 白天暗 41 階 → 黃昏 50 → 夜晚 72。白天也算了檯燈的散射與暖色偏移 ——
  只扣直射的話白天只暗 18 階,戳下去等於沒反應。

  重量:白天 + 開燈是原圖本身,**零額外請求**;黃昏 47KB、夜晚 48KB、三張關燈圖共 57KB,
  全部用到才載。舊的 `stage-off.webp`(91KB)已經被關燈分級圖取代。
  reduced-motion 的靜態卡也吃同一份天色(不能動不等於永遠是白天),但它沒有切換。

  幅度為什麼都壓得很小:底板的填補只有「輪廓往外一圈」是準的,再深就是猜的,所以每個
  元件的位移上限都控制在露出量不超過約 10 個原圖像素(換算到卡片尺寸是 2–3px)。
  素材產生器:`python tools/gen-allen-room-assets.py`,同時產生 `allen-room-parts.js`
  (每個元件的貼圖框,產生檔不要手改),並自己驗「底板+元件貼回去 vs 原圖」的 RMSE,
  超過 3.0 就中止。底板來自美術重畫的空房間 `robot_workshop_background_filled.svg`;
  元件遮罩是用「原圖 vs 空房間」的差異算的,連描邊與投影一起帶走 —— 不這樣做的話,
  那圈深色會留在底板上不動,物件一擺動就變成雙重輪廓。

  **不要再用自己畫的圖形去代替房間裡的東西** —— 第一版畫了假的準星、假的葉子、假的眼皮
  疊在畫死的同一個物件上,筆觸與色階對不上,而且變成兩份。

配色:`createAllenBot(el, { palette: 'brand' })` 可換成站上的橘藍,只換色票不動路徑;
預設 `'original'` 是原稿的紅藍。

驗收頁(不在網站路由上):`.peakops-audit/allen-preview.html`(表情/配色)、
`allen-poses.html`(五個姿勢)、`allen-stage.html`(正式掛載路徑)、
`allen-sky.html`(分級圖驗算:只放底板 + 分級圖,原尺寸,拿去和產生器的目標逐像素比)。
無頭瀏覽器幾乎不跑 rAF,所以後兩頁支援 `?step=N`:把 rAF 換成固定 dt 的手動時鐘推 N 幀,
截圖因此可重現。

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
