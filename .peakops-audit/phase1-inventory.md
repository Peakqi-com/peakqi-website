# PeakOps Phase 1 盤點結果(唯讀,機器產出)

> 由 16 個平行 agent 產出並經反駁式複查。每條結論皆附檔案:行號。

## A. BLOCKER / HIGH(動了會壞或不實陳述)

### container / 間距 / 區塊高度(PeakOps.dc.html 唯讀盤點)

- **[high]** 1280px 視窗結論:主要內容佔 92.5%(1360/1400 容器);#flow 佔 90.6%。計算式:左右 padding = clamp(20px,5vw,48px) → 5vw=64px 超過上限,取 48px;可用寬 = 1280-96 = 1184px。1360 與 1400 都大於 1184 → 兩者在 1280 下完全等價,1400 這個值在桌機常見寬度是無效差異。
  - 證據:`padding 來源 PeakOps.dc.html:283 等 19 處 `clamp(20px,5vw,48px)`;容器 :174 `max-width:1360px` → min(1360,1184)=1184 → 1184/1280 = 92.5%;:451 `max-width:1160px` → 1160/1280 = 90.6%;:159 `max-width:1400px` → 同樣被 1184 卡住`
  - 對策:1360 只有在視窗 ≥1456px 才會真的生效。若目標是「桌機不要滿版」,該調的是 padding(clamp 上限 48px 太小),不是 max-width。

### 建置與驗證手段(build / verification tooling inventory)— 唯讀盤點

- **[high]** support.js 是 dc-runtime 的 build 產物,且來源 dc-runtime/ 不在本 repo → 無法重建、也不該手改。它是整個 .dc.html 的框架 runtime(parser + 編譯器 + React renderer + helmet + CDN loader),全站 16 個 .dc.html 都靠它。
  - 證據:`support.js:1 `// GENERATED from dc-runtime/src/*.ts — do not edit. Rebuild with \`cd dc-runtime && bun run build\`.`;`ls -d dc-runtime` → `No such file or directory`;`grep -ln "support.js" *.dc.html` 命中 16 檔含 PeakOps.dc.html;PeakOps.dc.html:6 `<script src="./support.js"></script>``
  - 對策:support.js 列入禁改。真要改行為只能改 .dc.html 側或各 engine .js。
- **[high]** 驗證必須用「靜態 HTTP 伺服器」,file:// 開啟會壞:runtime 會 fetch(location.href) 重抓自己的原始碼、並對每個 <dc-import> 兄弟檔發 fetch。PeakOps 有 Nav / Footer 兩個 dc-import,file:// 下會被 CORS 擋掉變成空 placeholder。
  - 證據:`support.js:158-164 `if (!window.__resources) { fetch(location.href).then(...) => runtime.updateHtml(rootName, raw.template) }`;support.js:1520-1541 sibling fetch 失敗時 `console.error('[dc-runtime] sibling fetch for "' + name + '" threw:', url, e)`;PeakOps.dc.html:67 `<dc-import name="Nav" ...>`、PeakOps.dc.html:1249 `<dc-import name="Footer" ...>``
  - 對策:驗證流程固定為:在 repo 根起一個靜態 server(例如 `python -m http.server 8000`),再用 http://127.0.0.1:8000/PeakOps.dc.html 量測。禁止用 file:// 截圖下結論。
- **[high]** 【SEO 錯誤】PeakOps.dc.html 呼叫 applySEO('home'),但 seo.js 的 ROUTES 根本沒有 peakops 這個 key。key 不存在時 applySEO 會 fallback 到 home,結果 PeakOps 頁被打上 canonical=https://peakqi.com/ 與 og:url=https://peakqi.com/,等同宣告「本頁的正規版本是首頁」,搜尋引擎會把 PeakOps 頁併入首頁而不獨立收錄。
  - 證據:`PeakOps.dc.html:1270 `import('./seo.js').then(m => m.applySEO('home')).catch(() => {});`;seo.js:4-11 `const ROUTES = { home:{path:'/'...}, solutions, cases, pricing, about, demo }` 六個 key,無 peakops;seo.js:22-24 `export function applySEO(key){ const r = ROUTES[key] || ROUTES.home; const url = SITE + r.path;`;seo.js:28 `if (!document.head.querySelector('link[rel="canonical"]')) document.head.appendChild(el('link', { rel:'canonical', href: url }));`;seo.js:36 `upsertMeta('meta[property="og:url"]', { property:'og:url', content: url });`;對照 Home.dc.html:2838 同樣是 `applySEO('home')` → 兩頁 canonical 完全相同`
  - 對策:在 seo.js:4-11 的 ROUTES 補一個 peakops 條目(path 需與實際部署路由一致,例如 '/peakops'、file 'PeakOps.dc.html'、name 'Peak Ops'),再把 PeakOps.dc.html:1270 改成 applySEO('peakops')。注意這牽動 seo.js 的共用結構,屬於跨頁改動,建議先問使用者要用哪個路由。
- **[blocker]** 【DC 地雷 1,最重要】{{ }} 不是 JavaScript。support.js 自寫的 resolve() 只支援:變數路徑、`.` 屬性、`[...]` 索引、字串/數字/true/false/null/undefined 字面量、前置 `!`、括號、以及 == != === !== 四個相等運算子。函式呼叫、四則運算、三元 ?:、&&、||、樣板字串一律不支援。
  - 證據:`support.js:205-236 resolve() 全部分支僅涵蓋 parensWrapWhole / findTopLevelEquality / `!` / true / false / null / undefined / NUMBER_RE / 引號字面量 / resolvePath;support.js:248-262 findTopLevelEquality 只偵測 `=`,`!` 開頭的兩字元運算子,無 `&&`/`||`/`?`;support.js:263-293 resolvePath 只處理 `.` 與 `[`,`else { return void 0; }`(第 289-291 行)代表其餘任何字元直接放棄回傳 undefined`
  - 對策:改版時任何新的顯示邏輯都要在 Logic 的 renderVals() 算好、以扁平變數餵給模板;模板端只能寫純路徑。PeakOps 現況正是這個寫法(grep 出來的 bindings 全是 {{ cases }}、{{ c.title }}、{{ cc.cardStyle }} 這類純路徑),不要破壞這個慣例。
- **[blocker]** 【DC 地雷 1 的殺傷力】上述寫錯不會報錯、不會紅字,只會 render 成空字串 + console.warn 一次(同一個 hole 只警告一次)。純看截圖抓不到,必須看 console。
  - 證據:`support.js:517-531 `const v = resolve(vals, p); if (v === void 0) { ... warnUnresolved(ctx, "{{ " + p.trim() + " }} never resolved — rendered as empty"); return null; }`;support.js:498-504 `var warnedHoles = new Set(); function warnUnresolved(ctx, what){ const key=...; if (warnedHoles.has(key)) return; warnedHoles.add(key); console.warn(...) }``
  - 對策:驗證腳本一定要同時收 console。shot*.mjs 目前只 `await send('Runtime.enable')` 沒有訂 Runtime.consoleAPICalled,建議在 extra probe 裡自行覆寫 console.warn/error 收集後 return,或改用 .gstack 的 browse-console.log 流程。
- **[blocker]** 【DC 地雷 2】sc-for 的 list 綁到非陣列時同樣靜默:非 streaming 狀態直接被換成空陣列,整個列表消失,只留一行 console.warn。
  - 證據:`support.js:553-567 `let list = listGet(vals); if (!Array.isArray(list)) { if (!ctx?.__streamingNow) { if (list !== void 0 && list !== null) { warnUnresolved(ctx, 'sc-for list="' + listSrc + '" is not an array (' + typeof list + ")"); } list = []; }``
  - 對策:PeakOps 的 {{ cases }}(:841)、{{ compareCards }}(:961)、{{ compareRows }}(:950)、{{ customs }}(:1056)、{{ faqs }}(:1169)都是 sc-for 來源;改 content.js 或 renderVals 時若這些變成 undefined,整區會無聲消失,截圖上只看到空白。
- **[high]** 【DC 地雷 3】自訂標籤不可自我閉合。support.js 只對 x-import / dc-import 做 `<tag/>` → `<tag></tag>` 的補救,sc-if / sc-for / helmet 寫成自我閉合會被 HTML parser 當成未閉合標籤,吞掉其後所有兄弟節點。
  - 證據:`support.js:360-364 `var ATTRS = \`(?:[^>"']|"[^"]*"|'[^']*')*\`; var IMPORT_SELF_CLOSE_RE = new RegExp("<(x-import|dc-import)(" + ATTRS + ")/>", "gi");`;support.js:372-376 `html = html.replace(IMPORT_SELF_CLOSE_RE, (_, t, a) => "<" + t + a + "></" + t + ">");` — replace 清單裡沒有 sc-if / sc-for`
  - 對策:新增 sc-if / sc-for 一律寫完整開閉標籤。
- **[high]** 【DC 地雷 5】parseDcText 用 lastIndexOf('</x-dc>') 找結尾。若模板或後面的 script 內任何地方(字串、註解)再出現字面 `</x-dec>` 以外的 `</x-dc>`,模板切割點會跑掉,整頁編譯錯位。
  - 證據:`support.js:38-43 `const openMatch = /<x-dc(?:\s[^>]*)?>/.exec(src); if (!openMatch) return null; const close = src.lastIndexOf("</x-dc>"); if (close === -1 || close < openMatch.index) return null; const template = src.slice(openMatch.index + openMatch[0].length, close);`;PeakOps.dc.html 目前乾淨:`grep -n "x-dc"` 僅 3 處 → :9 `<x-dc>`、:1254 `</x-dc>`、:1255 `<script type="text/x-dc" data-dc-script ...>``
  - 對策:改版時絕不可在 PeakOps.dc.html 任何位置(含 JS 字串)再寫出 `</x-dc>` 字面量。注意 :1255 的 `type="text/x-dc"` 是安全的(沒有 `</`)。
- **[high]** 【DC 地雷 6】邏輯 script 必須是 `class Component extends DCLogic`,而且它是被 new Function 執行、只注入 DCLogic / StreamableLogic / React 三個名字,沒有模組作用域,也拿不到外部 import 的東西(要用動態 import())。
  - 證據:`support.js:772-781 `function evalDcLogic(src){ const fn = new Function("DCLogic","StreamableLogic","React", src + '\n;return (typeof Component!=="undefined"&&Component)||undefined;'); return fn(StreamableLogic, StreamableLogic, getReact()); }`;support.js:1564-1565 `if (typeof Cls !== "function") { r.logicError = name + ".dc.html: <script data-dc-script> must define \`class Component extends DCLogic\`"; }`;support.js:1755 `DCLogic: runtime.StreamableLogic`;PeakOps 因此全部靠動態 import,見 PeakOps.dc.html:1259 `import('./content.js')`、:1294 `import('./home2-engine.js')`、:1301 gl-engine、:1308 interactions-engine、:1315 sections-engine、:1322 `Promise.all([import('./hero-engine.js'), import('./sequence/manifest.js')])``
  - 對策:新增引擎一律沿用 `import('./xxx.js').then(...).catch(...)` 模式,不要改成頂層 import(new Function 環境不支援)。
- **[blocker]** 【DC 地雷 7】模板編譯失敗只被 try/catch 吞掉印 console.error,舊的 render 會殘留或整塊空掉,HTTP 仍是 200。也就是說沒有任何「失敗會讓流程紅燈」的機制存在。
  - 證據:`support.js:1551-1556 `try { r.tpl = compileTemplate(html, host); } catch (e) { console.error("[dc-runtime] template compile FAILED for", name, e); } registry.bump(name);`;support.js:1570-1579 updateJs 的 catch 同樣只 `console.error("[dc-runtime] logic class eval FAILED for", name, "— the template renders with props only.", e)``
  - 對策:這是本專案「可行驗證方式」的結論依據:唯一可靠的 gate 是「靜態 server + headless Chrome + 抓 console 有無 [dc-runtime] 開頭訊息 + 截圖比對 + scrollWidth 不爆版」。任何 checklist 都應該以這四項為準,而不是 npm 指令。

### 數字與承諾的真實性(PeakOps.dc.html + 其內容資料層 content.js)

- **[blocker]** 「不綁約」與「最低三個月」自相矛盾:風險區主標與 Hero/CTA 都寫『不綁約』,但同一區卡片內文寫『最低三個月,之後可按月取消』。同頁互相打臉,屬合約條件不實陳述風險。
  - 證據:`content.js:196 `{ n: '02', t: '不綁約', d: '最低三個月,之後可按月取消。' }`;PeakOps.dc.html:148 「不推銷・不綁約・30 天內覺得沒效,月費全額退」;PeakOps.dc.html:1142 「不推銷、不綁約,降低你的風險。」;PeakOps.dc.html:1189 「不推銷、不綁約,30 天內覺得沒效,月費全額退。」`
  - 對策:先向使用者確認真實合約:到底有無最短承諾期。若有三個月最低期,全頁『不綁約』字樣都要改成『無長約・最低三個月後可按月取消』之類一致寫法;若真的沒有,content.js:196 的『最低三個月』要刪。這是文案一致性問題,兩處必須同時改。
- **[blocker]** 退費承諾在不同位置條件不一致:Hero 與 CTA 寫『30 天內覺得沒效,月費全額退』(無條件),風險卡片才寫『依約定條件月費全額退』。且『約定條件』從未在頁面上定義。
  - 證據:`PeakOps.dc.html:148 與 1189 皆為無條件版本;content.js:197 `{ n: '03', t: '30 天保證', d: '30 天內覺得沒效,依約定條件月費全額退。' }``
  - 對策:統一為同一句話,並在頁面上寫明:30 天起算點(簽約日/上線日)、退的是月費而非建置費、由誰認定『沒效』、排除情形(如客戶未提供資料導致無法上線)。條款未確認前不要自行編造內容。
- **[blocker]** 退費/保證條款完全沒有適用範圍與排除條件:沒有寫起算日、沒有寫退款範圍是否含建置費、沒有寫『沒效』的判定方式、沒有寫申請程序與退款時程。
  - 證據:`content.js:197(全文僅一句);PeakOps.dc.html:1144-1152 風險卡片模板只渲染 r.n / r.t / r.d 三個欄位,沒有任何條款連結或註腳`
  - 對策:需要使用者提供真實合約條款後再補;或在卡片下加一行「完整退費條件以合約為準」並連到條款頁(條款頁目前不存在,需先確認要不要做)。
- **[high]** Hero 主數字帶四個統計(30+、8+、10 天、24h)完全沒有指標定義、統計截止日、資料來源或免責說明。整段 #hero-stats 與 #handoff 都只渲染 v 與 l 兩欄,沒有任何註腳。
  - 證據:`content.js:24-29 `stats = [{v:'30+',l:'已上線系統與網站案例'},{v:'8+',l:'產業別實戰經驗'},{v:'10 天',l:'最快上線(工作天)'},{v:'24h',l:'AI 全天候在線接客'}]`;PeakOps.dc.html:161-166(#hero-stats 模板);PeakOps.dc.html:201-207(#handoff 重複同一組數字)`
  - 對策:每個數字補『定義+截止日』:例如「30+ 已上線系統與網站(累計至 2026/07,含客製系統與品牌官網)」。需先向使用者要實際盤點數。
- **[high]** 「30+ 實績」與網站自己的作品清單對不上:content.js 內可列名的作品約 27 筆(worksFeatured 7 筆、portfolioAI 11 筆、portfolioWeb 13 筆,其中 4 筆重複),數不到 30。
  - 證據:`content.js:114-121(worksFeatured 7 筆)、content.js:124-135(portfolioAI 11 筆)、content.js:137-151(portfolioWeb 13 筆);PeakOps.dc.html:901 「瀏覽全部 30+ 實績 →」`
  - 對策:要嘛請使用者提供完整 30+ 清單並補進 portfolio,要嘛把『30+』改成可被清單驗證的數字。不要自行湊數。
- **[high]** 精選作品區(#portfolio)直接顯示成效數字,卻沒有任何免責或『該案例』標註 —— 相對地 #cases 區有 caseNote。同一頁兩套標準。
  - 證據:`content.js:115-117 results 陣列:『客服人力 ↓約 70%』『成交率 5 倍』『8+ AI 模組』『提案效率 ↑約 90%』『3 天工作 3 小時完成』『10+ 風格一鍵切換』『回覆縮短至 30 秒內』『每週省約 8 小時排程』『名單轉化 ↑約 20%』;渲染於 PeakOps.dc.html:922-924;整個 #portfolio(887-934)無任何註腳;對照 PeakOps.dc.html:876 `※ {{ caseNote }}``
  - 對策:在 #portfolio 底部補上與 #cases 相同的註腳(content.js:111 caseNote),或在每張卡的 results 前加『該案例』。
- **[high]** 案例成效數字沒有指標定義與量測情境:『提案效率提升約 90%』『成交率 5 倍』『報價速度提升 3 倍』『決策時間縮短約 60%』『名單轉化 ↑約 20%』都沒有寫基準期、對照組、量測方法、期間長度;『5 倍』『3 倍』甚至連『約』都沒有。
  - 證據:`content.js:80 `metrics: [{v:'約 90%',l:'提案效率提升(該案例)'},{v:'3天→3hr',...},{v:'10+',...}]`;content.js:90 `{v:'↓約 70%',l:'客服人力(該案例)'},{v:'5 倍',l:'成交率提升'}`;content.js:98 `{v:'3 倍',l:'報價速度提升(該案例)'},{v:'↓約 60%',l:'決策時間縮短'}`;content.js:108 `{v:'30 秒內',...},{v:'約 8hr/週',...},{v:'↑約 20%',l:'名單轉化'}`;唯一免責在 content.js:111 / PeakOps.dc.html:876`
  - 對策:每個 metric 補量測定義(分母是什麼、比較基準是導入前幾個月)。至少把沒有『約』『該案例』的三個(5 倍、3 倍、多次)補齊標註。實際數字需向使用者確認出處。
- **[high]** 營運控制台的 KPI 是寫死的假資料,卻標示 LIVE 且配即時脈動綠點,沒有任何『示意』字樣 —— 同頁 #diagnostic 有寫『非成效數據』,#liveops / #demo-cta 卻沒有。
  - 證據:`PeakOps.dc.html:577 `LIVE`、580-582 `12 今日新客` / `28s 平均回覆` / `18% 本週轉換`;PeakOps.dc.html:1215 `LIVE`、1219-1228 `12 今日新客` / `28s 平均回覆速度` / `18% 本週轉換率`;對照 PeakOps.dc.html:260 「即時診斷(流程示意)」與 274 「※ 指標為流程視覺示意,非成效數據。」`
  - 對策:在兩個控制台加上與 274 同樣的示意註記(或把 LIVE 標籤改成 DEMO / 介面示意)。DOM 結構不必動,只加一行 span 即可。
- **[high]** 「最快 10 個工作天上線」在全頁出現 6 次,但從未寫明前提條件(客戶何時交付資料、知識庫素材是否齊全、需求是否落在標準模組內)。時程表本身即假設 DAY 0 簽約當天就拿到資料。
  - 證據:`PeakOps.dc.html:12(meta description)、143(Hero)、1115(#timeline 主標);content.js:27、69、158(比較表)、205(FAQ);時程步驟 content.js:185-190 `DAY 0 簽約、提供資料 … DAY 10 正式上線`;唯一補充是 content.js:192 timelineNote(只講大型客製約六週,沒講前提)`
  - 對策:在 timelineNote 補上前提條件,例如『前提:標準模組範圍、資料於 DAY 0 提供完成』。實際前提須向使用者確認。
- **[high]** 「24h / 24 小時全天候在線」等同可用性承諾,但沒有任何 SLA:沒有可用率(%)、沒有維護窗口、沒有中斷補償、沒有客服回應時間承諾。全頁找不到 SLA 字樣。
  - 證據:`content.js:28 `{v:'24h',l:'AI 全天候在線接客'}`;PeakOps.dc.html:776 「24h 在線」;PeakOps.dc.html:1048 「還幫你 24 小時顧前線。」;content.js:168 humanCompare.rightD 同句;全檔 grep 無 SLA / 可用率 / 服務水準`
  - 對策:若無正式 SLA,建議改成『AI 全天候值班(依第三方平台與 LINE 服務狀態)』並加註;若有 SLA,補可用率與維護窗口。需要使用者提供。
- **[high]** 「30 秒內被接住」是效能承諾,出現在產品說明與流程站點(非案例語境),沒有量測定義、沒有排除條件(LINE / 模型 API 延遲、離峰尖峰、圖片訊息)。
  - 證據:`PeakOps.dc.html:474 「半夜的詢問,30 秒內被接住。」;content.js:53(flow3 接客)、content.js:59 「客人 30 秒內被接住,不再漏單。」、content.js:248 「客人訊息進來,AI 30 秒內接住」;案例版本另見 content.js:108「30 秒內 回覆時間,原本數小時(該案例)」`
  - 對策:改成『一般情況下數十秒內回應』或補『依平台與網路狀況』註記。是否有實測 p50/p95 數據要問使用者。
- **[high]** 「不再漏單」「不會硬答」「資料不外流」「不用學新軟體,也不用改變現在的做事方式」屬絕對化保證,沒有任何排除條件。
  - 證據:`content.js:59 「客人 30 秒內被接住,不再漏單。」;content.js:203 「遇到判斷不了的問題,馬上轉真人,不會硬答。」;content.js:202 「資料不外流,也不會拿去訓練別人的模型。」;content.js:201 「不用學新軟體,也不用改變現在的做事方式。」`
  - 對策:軟化為『大幅降低漏單』『判斷信心不足時轉真人』等可執行敘述。資安句需以實際政策為準(見下條)。
- **[high]** 資安宣稱沒有任何可驗證細節,也沒有任何認證:只有『獨立存放、加密保護』『安全穩定』『雲端架構』,全頁找不到 ISO / SOC2 / 個資法 / DPA / 資料落地地區 / 子處理者名單。
  - 證據:`content.js:202 「獨立存放、加密保護。資料不外流,也不會拿去訓練別人的模型。」;content.js:66 `baseSupport = ['安全穩定','雲端架構','資料整合','開放整合','彈性擴充']`(渲染於 PeakOps.dc.html:824-826);全檔 grep『ISO / 認證』無結果`
  - 對策:要嘛補上真實的加密方式(傳輸/靜態)、資料存放地區、模型供應商是否關閉訓練,要嘛把句子降級為『不會用於訓練公開模型(依供應商設定)』。事實需使用者確認,不可自行填。
- **[high]** 「文字類包含在月費內、不限量」是絕對用語,沒有任何公平使用上限、濫用條款或速率限制說明;同時頁面標題宣稱『不用怕隱形收費』。
  - 證據:`content.js:180 「文字類:包含在月費內,不限量」、content.js:206 FAQ 同義;PeakOps.dc.html:1412 usageTips[0] 「包含在月費、不限量:AI 對話、文案、報告、SEO 分析。不會因為文字用量多而加價。」;PeakOps.dc.html:1428 meterLabel 『不限量』;PeakOps.dc.html:1076 「AI 使用量,不用怕隱形收費」`
  - 對策:補一句公平使用條款(如『一般商用範圍內不限量,異常大量使用另議』)。實際是否真的無上限必須問使用者。
- **[high]** 「大部分客戶光是 AI 幫忙接客就回本」是 ROI 宣稱,沒有樣本數、沒有回本期間定義、沒有『大部分』的比例依據。
  - 證據:`content.js:183 `usageNote = '大部分客戶光是 AI 幫忙接客就回本,圖片影片是加分。'`;渲染於 PeakOps.dc.html:1077`
  - 對策:沒有統計資料就不要用『大部分/回本』,可改為敘述性的『多數客戶最先感受到的效益是接客不漏單』。

### 動畫保護範圍盤點(PeakOps.dc.html + 6 支引擎的 DOM 契約)

- **[high]** 間接第 7 支:micro-engine.js 由 <dc-import name="Nav"> 帶進來(不在 PeakOps 的 componentDidMount 裡),它在本頁上仍會作用於 [data-cta] / [data-arrow] / [data-tilt] / #demo-cta [data-spot]。
  - 證據:`PeakOps.dc.html:67 <dc-import name="Nav" …>;Nav.dc.html:106 import('./micro-engine.js');micro-engine.js:24-28 '[data-cta]…' '[data-arrow]…';micro-engine.js:68 document.querySelectorAll('[data-tilt]');micro-engine.js:114-115 document.querySelector('#demo-cta') / sec.querySelector('[data-spot]');本頁存在數量 data-cta:7 data-arrow:5 data-tilt:2 data-spot:1`
  - 對策:改 CTA 按鈕或作品卡/方案卡時,保留 data-cta、data-arrow、data-tilt 屬性,否則按壓縮放與箭頭位移會靜默消失(不會報錯)。
- **[blocker]** hero-engine.js 只驅動 #hero,靠的是 ref 而非 id/class:refs.wrap/stage/canvas/t1..t5/hint。DOM 巢狀 section#hero > div[ref=heroWrap](height:360vh) > div[ref=heroStage](position:sticky;top:0;height:100vh) 是進度計算的根本,拆掉就整段失效。
  - 證據:`hero-engine.js:711 wrap = refs.wrap; stage = refs.stage; canvas = refs.canvas;:628 p = clamp(-r0.top / Math.max(1, wrapH - vh), 0, 1);:576 wrapH = wrap.offsetHeight;PeakOps.dc.html:70 <div ref="{{ heroWrap }}" style="position:relative;height:360vh">;:71 <div ref="{{ heroStage }}" style="position:sticky;top:0;height:100vh;overflow:hidden">;renderVals 綁定於 PeakOps.dc.html:1545-1553`
  - 對策:heroWrap 的 height:360vh 與 heroStage 的 sticky/top:0/height:100vh 屬於 pin 契約;若要改 Hero 高度,改的是 360vh 這個數字(motion-config.js:13 SCROLL.heroPin 也記著 '360vh'),不要把 sticky 拿掉或多包一層 div。
- **[blocker]** hero-engine 另外硬抓三組子選擇器:stage 內的 [data-scrim]、refs.t3 內的 [data-st]、refs.t4 內的 [data-chip]。這三個是「子元素選擇器」,搬動巢狀層級會直接失效。
  - 證據:`hero-engine.js:618 const scrim = stage.querySelector('[data-scrim]');:547 const rows = refs.t3.querySelectorAll('[data-st]');:558 const chips = refs.t4.querySelectorAll('[data-chip]');:685 el.querySelectorAll('[data-chip]');PeakOps.dc.html:74 data-scrim="1";:86,91,96,101 data-st="1..4";本頁 data-chip 共 6 處`
  - 對策:data-st 的四行 CAPTURED/CLASSIFIED/ASSIGNED/FOLLOW-UP 依 index 逐條點亮,增刪行數會改變節奏但不會壞;但它們必須留在 heroT3 的直接查詢範圍內。
- **[blocker]** sections-engine.js 驅動 4 個區塊:#pain(refs.pain)、#loss(refs.lossWrap/lossStage)、#flow(refs.flowWrap/flowStage)、#features 的 #pq-orbit(refs.orbitBox/orbitCore)。全部走 ref,不走 id。
  - 證據:`sections-engine.js:22 const root = refs.pain;:90 const wrap = refs.lossWrap, stage = refs.lossStage;:122 const wrap = refs.flowWrap, stage = refs.flowStage;:238 const box = refs.orbitBox, core = refs.orbitCore;PeakOps.dc.html:304 ref="{{ pain }}";:370-371 lossWrap/lossStage;:449-450 flowWrap/flowStage;:767 id="pq-orbit" ref="{{ orbitBox }}";:773 ref="{{ orbitCore }}"`
  - 對策:這 8 個 ref 名稱是 renderVals(PeakOps.dc.html:1527-1538)回傳的 key,改 ref 名要兩邊同步改。
- **[blocker]** sections-engine 在 #pain 內依賴 7 種子選擇器,且 [data-win] 額外讀 data-dep / data-rot 數值屬性做視差與旋轉。
  - 證據:`sections-engine.js:26 q(root,'[data-win]') + el.getAttribute('data-dep');:56 el.getAttribute('data-rot');:28-32 [data-badge] [data-break] [data-gap] [data-leak] [data-cursor] [data-ba];PeakOps.dc.html:316,325,334,345,349 data-win data-dep data-rot;:320 data-badge;:339 data-break;:312 data-gap;:313-315 data-leak;:357 data-cursor;:360 data-ba`
  - 對策:data-dep 是視差深度(0.85~1.3)、data-rot 是靜態傾角,改版時可以調數值,但屬性不能刪。data-badge 的 textContent 會被引擎覆寫成 1~5,別在那裡放要保留的文案。
- **[blocker]** sections-engine 在 #loss 內依賴 [data-lossv](+data-t 目標數值)、[data-lgap]、[data-drop];data-t 就是 count-up 的終值來源。
  - 證據:`sections-engine.js:94 q(wrap,'[data-lossv]').map(el => ({el, t: parseInt(el.getAttribute('data-t')||'0',10)}));:112 [data-lgap];:113 loss.drops;PeakOps.dc.html:383 data-lossv data-t="100";:392 data-t="30";:401 data-t="1";:410 data-t="30";:435 data-t="360"`
  - 對策:要改損失數字,改 data-t 與同元素的初始 textContent 兩處(reduced-motion 時引擎直接 return,顯示的是 textContent)。最後一個 data-lossv 被當成「總計」用不同時間軸,順序不能亂。
- **[blocker]** sections-engine 對 #flow 會「以 JS 強制寫入 inline style」建立 pin:flowWrap.height='265vh'、flowStage 變 sticky/top:0/height:100vh/overflow:hidden,並把 [data-layer=0|1|2|m] 全部改成 position:absolute;left:50%;top:50%。這是本頁破壞性最高的一段。
  - 證據:`sections-engine.js:136-145 wrap.style.height='265vh'; stage.style.position='sticky'; …;:151-158 flow.layers.concat([flow.merged]).forEach(el => { el.style.position='absolute'; el.style.left='50%'; el.style.top='50%'; el.style.width='min(760px, 96%)'; });:127-128 q1(wrap,'[data-layer="0|1|2"]') 與 '[data-layer="m"]';:131 [data-rail];:130 [data-mcap];:131 [data-noise];PeakOps.dc.html:466,486,510 data-layer="0|1|2";:532 data-layer="m";:460-462 data-rail ×3;:531 data-mcap;:546 data-noise`
  - 對策:三張卡的 data-layer 必須是字串 "0"/"1"/"2",合併卡必須是 "m";[data-rail] 必須剛好 3 個且第一個子元素是圓點 span(引擎用 el.firstElementChild 上色,sections-engine.js:217)。要改排版請改 unpinFlow()(:167)還原的那組 key,不要在 HTML 寫死跟引擎打架的 position。
- **[high]** sections-engine 手機視差用的是「id 選擇器 + data 屬性」的組合:#pq-orbitrow [data-orbcard] 與 #flow [data-layer]。#pq-orbitrow 這個 id 只有這一個用途。
  - 證據:`sections-engine.js:276 document.querySelectorAll('#pq-orbitrow [data-orbcard], #flow [data-layer]');PeakOps.dc.html:801 <div id="pq-orbitrow">;:809 <div data-orbcard …>`
  - 對策:重排功能總覽時保留 id="pq-orbitrow" 與 data-orbcard,否則手機端輕視差靜默消失。
- **[blocker]** home2-engine.js 驅動 4 個區塊(#handoff / #diagnostic / #liveops / #relay),全部走 id + data-wrap/data-stage 的固定兩層巢狀;另外對 #demo-cta [data-echo] 掛浮動動畫。
  - 證據:`home2-engine.js:21 q('#handoff [data-wrap]') / q('#handoff [data-stage]');:65 '#diagnostic [data-wrap]';:120 '#liveops [data-wrap]';:177 '#relay [data-wrap]';:229 qa('#demo-cta [data-echo]');PeakOps.dc.html:171-173 / 221-223 / 561-563 / 728-730 皆為 section#id > div[data-wrap] > div[data-stage];:1200,1204,1208 data-echo`
  - 對策:section 的 id 與內層 data-wrap/data-stage 三件缺一不可:StickyProductStage(motion-kit.js:104-111)會把 wrap 的 height 與 stage 的 sticky 寫成 inline,少了任一層 pin 就不成立。
- **[blocker]** home2-engine 各區塊的細部選擇器:#handoff 用 [data-hpath](SVG path,呼叫 getTotalLength/getPointAtLength)、[data-hpack]、[data-hnum]、[data-hnote];#diagnostic 用 [data-dtool](+data-rot)、[data-dmeter](靠 firstElementChild 當 fill)、[data-dcount](+data-max、data-u)、[data-dtake]、[data-dclose]、[data-dscan]。
  - 證據:`home2-engine.js:23-26 data-hpath/hpack/hnum/hnote;:33 p2.getTotalLength();:49 path.getPointAtLength();:67-72 data-dtool/dmeter/dcount/dtake/dclose/dscan;:82 el.getAttribute('data-rot');:87 const fill = m.firstElementChild;:100 c.getAttribute('data-max');:103 c.getAttribute('data-u');PeakOps.dc.html:181-186 data-hpath/data-hpack;:202 data-hnum;:208 data-hnote;:235-251 data-dtool data-rot;:267 data-dcount data-max data-u;:269 data-dmeter;:229 data-dtake;:277 data-dclose;:234 data-dscan`
  - 對策:[data-hpath] 必須是 <path>(SVG 幾何 API);[data-dmeter] 的第一個子元素就是進度條本體,不能在中間插 wrapper;[data-dcount] 的文字會被整段覆寫(接管後寫成『AI 已接手 ✓』)。
- **[blocker]** #liveops 的章節數 = [data-live-panel] 的個數(目前 6),右側 [data-live-item] 依 index 與左側面板一一對應,並用 data-name 餵標題;引擎還會替 item 加上 role=button/tabindex=0 與點擊捲動。
  - 證據:`home2-engine.js:122-125 qa('#liveops [data-live-panel]') / [data-live-item] / [data-live-link] / [data-live-name];:144 items[idx].getAttribute('data-name');:147 const n = panels.length;:157-163 it.setAttribute('role','button'); tabindex;:170 Math.floor(sub(p,0.04,0.96)*panels.length);PeakOps.dc.html:586,614,625,662,680,691 data-live-panel="0..5";:713 data-live-item="{{ m.i }}" data-name="{{ m.name }}";:709 data-live-link`
  - 對策:panel 數與 item 數必須維持一致(目前皆 6,item 由 sc-for 依 content.js 的 features 產生)。改功能數量會同時改動 pin 距離節奏;要加減面板必須同步加減 features。
- **[high]** #relay 依賴 [data-rstation](+ 內含 [data-rchip])、[data-rfill]、[data-rpack];站點數量由 sc-for 的 relay 清單決定,引擎用 sts.length 均分進度。
  - 證據:`home2-engine.js:179-181 [data-rstation]/[data-rfill]/[data-rpack];:186 st.querySelector('[data-rchip]');:194-196 const n = sts.length; const on = k >= (i+0.5)/n - 0.5/n;PeakOps.dc.html:735 data-rfill;:736 data-rpack;:741 data-rstation;:742 data-rchip`
  - 對策:[data-rchip] 必須是 [data-rstation] 的後代;站點增減安全(引擎自動均分),但 [data-rfill] 需保持 transform-origin:left center。
- **[blocker]** gl-engine.js 是本頁唯一的 WebGL(原生 WebGL,非 three.js/R3F),自建 fixed canvas 覆蓋全屏 z-index:60,不吃頁面既有 DOM 當畫布。它抓 4 個目標:#flow > div(注意是子代選擇器,靠 DOM 順序)、#flow [data-deck]、#demo-cta [data-console]、#cases [data-caseimg][data-src]。
  - 證據:`gl-engine.js:270 canvas.getContext('webgl', …);:266 'position:fixed;inset:0;…z-index:60';:284 flowWrap = document.querySelector('#flow > div');:285 flowDeck = document.querySelector('#flow [data-deck]');:286 endCons = document.querySelector('#demo-cta [data-console]');:287 document.querySelectorAll('#cases [data-caseimg][data-src]');PeakOps.dc.html:449 #flow 的第一個 div(=flowWrap);:465 data-deck;:1211 data-console;:847 data-caseimg data-src`
  - 對策:'#flow > div' 是位置依賴:只要在 #flow 內、flowWrap 之前插入任何 <div>,gl 的 flow dissolve 就會綁錯元素。要改就改成給 flowWrap 一個 data 屬性(需同時改 gl-engine.js:284)。
- **[blocker]** gl-engine 的 fxOrbit 靠 refs.orbitBox.firstElementChild 定位光環,也就是 #pq-orbit 的「第一個子元素必須是那個 role=tablist 的軌道盤」;而且環的半徑寫死對應 SVG viewBox 600×460 與 rx=238/ry=164。
  - 證據:`gl-engine.js:149-160 const box = refs.orbitBox; const tab = box.firstElementChild; … const s = Math.min(r.w/600, r.h/460); gl.uniform2f(u(pr,'uRxy'), 238*s, 164*s);PeakOps.dc.html:767 id="pq-orbit" ref="{{ orbitBox }}";:768 <div role="tablist" … style="position:relative;height:470px">;:769-770 viewBox="0 0 600 460" 與 <ellipse rx="238" ry="164">`
  - 對策:#pq-orbit 的兩欄 grid 順序(左=軌道盤、右=說明)不能對調;viewBox 600×460 與 rx/ry 238/164 若改,gl-engine.js:155,160 的常數要一起改,否則光環與 SVG 橢圓會錯位。另 renderVals 的 orbPts(PeakOps.dc.html:1492)也是同一組座標系。
- **[blocker]** interactions-engine.js 驅動 4 塊:#cases(count-up + 圖片 mask reveal + 視差)、#portfolio 展廊(走 ref:galWrap/galStage/galScroller/galTrack)、#compare 的 [data-sweeper]、#timeline 的 [data-tline]/#pq-tl/[data-dot]。
  - 證據:`interactions-engine.js:32 '#cases [data-count]';:46 '#cases [data-caseimg]';:80 refs.galWrap/galStage/galScroller/galTrack;:99 gal.wrap.querySelectorAll('[data-bg]');:149 '#compare [data-sweeper]';:162-166 '#timeline' / [data-tline] / getElementById('pq-tl') / [data-dot];PeakOps.dc.html:866 data-count;:847 data-caseimg;:905-908 galWrap/galStage/galScroller/galTrack;:912 data-bg;:949 data-sweeper;:1119 id="pq-tl";:1120 data-tline;:1123 data-dot`
  - 對策:galWrap>galStage>galScroller>galTrack 這四層巢狀是 sticky 橫向捲動的算式基礎(galMeasure:107-122 會寫 wrap.height / stage.sticky / track.transform),中間不能插層也不能合併。
- **[blocker]** 作品圖是 lazy-load 的:[data-bg] 的 URL 在進入視窗前不會被套上 backgroundImage,初始 opacity 由 renderVals 的 imgInnerStyle 設為 0。誤刪 data-bg 會讓整排作品圖永遠空白。
  - 證據:`interactions-engine.js:99-105 gal.wrap.querySelectorAll('[data-bg]') → im.onload → el.style.backgroundImage = 'url("'+src+'")'; el.style.opacity='1';PeakOps.dc.html:912 <div data-bg="{{ w.img }}" style="{{ w.imgInnerStyle }}">;:1392 imgInnerStyle: { … opacity: 0, transition: 'opacity 320ms …' }`
  - 對策:若要改成一般 <img>,必須同時處理 interactions-engine.js:96-106 的 loadImgs(),否則圖片顯示不出來且不會報錯。
- **[high]** #timeline 的桌機/手機切換是由「引擎讀 computed flex-direction」決定軸向,直接耦合到 CSS media query 裡的 #pq-tl 規則。改 timeline 排版必須兩邊一起改。
  - 證據:`interactions-engine.js:178-180 const vertical = getComputedStyle(tl.cont).flexDirection === 'column'; tl.line.style.transform = vertical ? 'scaleY(…)' : 'scaleX(…)';PeakOps.dc.html:55 @media (max-width:899px){ … #pq-tl{flex-direction:column!important;…} #pq-tl>[data-tstep]{…} #pq-tl [data-dot]{…} #pq-tl [data-tline]{…} }`
  - 對策:#pq-tl 的 id、[data-tstep]、[data-dot]、[data-tline] 四者被 55 行那條 media query 與 interactions-engine 同時依賴。改成 grid 會讓 flexDirection 檢查失效(回傳 'row'),線條方向就錯。
- **[blocker]** motion-kit.js + motion/home.motion.js 是「頁面級」動畫層:注入右側章節導覽 nav#pq-rail(桌機圓點 / 手機頂部 3px 進度條),並掃描 [data-divider] 掛切面動畫。它靠 chapters 裡的 8 個 section id 做 getElementById。
  - 證據:`motion-kit.js:275-284 initPageMotion → PageProgressRail / CinematicDivider / [data-maskreveal] / [data-dataline] / [data-parallax];:208 if (document.getElementById('pq-rail')) return;:245,258 document.getElementById(items[i].ch.id);motion/home.motion.js:5-12 chapters ids = hero, diagnostic, flow, liveops, relay, cases, pricing, demo-cta;:15 flags {rail:true, pageIntro:false, dividers:true}`
  - 對策:這 8 個 section id 是章節導覽的唯一來源:改 id 不會報錯,只會讓右側圓點永遠停在第一顆。要增刪章節請只改 motion/home.motion.js:4-13。
- **[high]** [data-divider] 有三種型別,各自要求不同的子元素結構,型別值寫在屬性裡:line 需 [data-line]+[data-label];shutter 需 [data-shut-l]+[data-shut-r];aperture 需 [data-ap]。本頁三種各一。
  - 證據:`motion-kit.js:143-148 const type = el.getAttribute('data-divider') || 'line'; el.querySelector('[data-line]'/'[data-label]'/'[data-shut-l]'/'[data-shut-r]'/'[data-ap]');:168 threshold: type === 'aperture' ? 0.6 : 0.5;PeakOps.dc.html:214 data-divider="line" + :216 data-label + :217 data-line;:553 data-divider="shutter" + :557-558 data-shut-l/data-shut-r;:882 data-divider="aperture" + :883 data-ap`
  - 對策:divider 是純視覺分隔,可整塊刪(引擎會自動略過),但不能只刪內層子元素留外殼——那會變成永遠停在初始態(scaleX(0) / scale(.12) 的隱藏狀態)。
- **[high]** 六支引擎都把除錯把手掛到 window:__pqHero / __pqGL / __pqInteractions / __pqSections / __pqHome2 / __pqMicro,其中 __pqHero.cons() 是 gl-engine 的資料來源、__pqInteractions.galNav 是 HTML 按鈕的實際實作,屬於跨檔契約不是純除錯。
  - 證據:`hero-engine.js:739-748 window.__pqHero = { … cons: () => …};gl-engine.js:114-116 const hp = window.__pqHero; const c = hp.cons();gl-engine.js:306 window.__pqGL;interactions-engine.js:238-241 window.__pqInteractions = { galNav, … };PeakOps.dc.html:1399 if (window.__pqInteractions) { window.__pqInteractions.galNav(dir); return; };sections-engine.js:332 window.__pqSections;home2-engine.js:239 window.__pqHome2`
  - 對策:不要為了「清理全域變數」刪掉 __pqHero / __pqInteractions——前者一刪 hero 的 WebGL 光暈就沒了,後者一刪展廊左右鍵會退化成 fallback 的 scrollBy(PeakOps.dc.html:1400-1401)。
- **[blocker]** reduced-motion / mobile(<900px)分歧會走完全不同的程式路徑,而且多數區塊的『HTML 預設樣式』就是動畫的完成態。改 HTML 初始 style 等於同時改了降級版的最終畫面。
  - 證據:`home2-engine.js:73 if (ctx.reduced || ctx.mobile) return; // 模板預設=接管後狀態+結語;:182 // 模板預設=全站完成;:211 // 模板預設=完整矩陣;sections-engine.js:99 if (reduced) { loss = null; return; } // 模板預設即最終數字;:134 if (reduced || mobile || vh < 640) { flow = null; return; } // 模板預設:垂直堆疊+合併卡;interactions-engine.js:168 if (reduced) return; // 模板預設 = 完成線;motion-config.js:20-29 capabilityTier()`
  - 對策:例:#relay 的 [data-rchip] 在 HTML 裡寫的是「已點亮」的深底綠字(PeakOps.dc.html:742),桌機動畫會先把它改暗再點回來。改版時若把 HTML 改成暗的,手機/reduced 使用者就永遠看到暗的。每改一處初始 style,先確認對應引擎的 reduced 分支。

### 文案來源與 CTA(PeakOps.dc.html 唯讀盤點)

- **[high]** content.js 有三個 export 已被 renderVals 取出、但模板從頭到尾沒有 {{ }} 使用 → 死綁定;對應區塊的文案其實是硬寫死的
  - 證據:`PeakOps.dc.html:1559 `loss: (d?.lossSteps ?? []).map(...)`、:1561 `flow: d?.flow3 ?? []`、:1575 `wall: (d?.worksFeatured ?? []).filter(...)`;`grep '{{ loss' / '{{ flow' / '{{ wall'` 在模板內零命中(只命中 ref 用的 lossWrap/lossStage/flowWrap/flowStage 與 :1560 lossNote)`
  - 對策:二選一:把 loss/flow 區塊改回 sc-for 綁 content.js,或把 renderVals 這三個 key 刪掉。但注意 loss 數字被引擎動畫抓,見下一條
- **[high]** CTA 用語分裂成 5 個語意家族、共 20 種說法,其中「同一件事(進 Demo.dc.html)」就有 7 種不同講法 → 訊息不一致、無法做 A/B 也難追成效
  - 證據:`預約類 4 種:「預約 15 分鐘場景 Demo」(PeakOps:145,1191 / Nav:82)、「預約 Demo」(PeakOps:1166 / Footer:31)、「預約諮詢」(PeakOps:1021)、「預約 AI 導入評估」(Nav:45 / Footer:47 / Nav:226 home 分支)。『用我的場景』類 3 種:「用我的場景跑一遍」(544)、「用我的場景試一次」(1034)、「用我的場景看 Demo」(Nav:226)。案例/作品類 5 種:「查看實際案例」(146)、「看完整案例與更多實績」(877)、「瀏覽全部 30+ 實績」(901)、「查看案例 →」「造訪網站 ↗」(1397)。Solutions 導流類 5 種:「看 AI 怎麼分擔這些事」(302)、「看接客細節」(471)、「看追客細節」(491)、「看養客細節」(515)、「看功能怎麼搭配」(798,827)。其他 3 種:「把這個流程套用到我的公司」(870)、電話(1192)、email(1195)。上述 7 個指向 Demo.dc.html 的說法:145/544/1021/1034/1166/1191 + Nav sticky`
  - 對策:收斂成「主 CTA 一種說法(建議統一為『預約 15 分鐘場景 Demo』)+ 次級 CTA 一種說法」,把差異放在上下文句而不是按鈕文字;若要保留變體,至少讓 Nav sticky 與頁面主 CTA 同字串
- **[high]** 【誤解風險 #1・最強】hero 第二幕直接說「不用再開五個軟體」,是全頁最像「叫企業換掉現有工具」的一句
  - 證據:`PeakOps.dc.html:81 `<p ...>行銷、客服、報價、CRM、專案管理,<br>不用再開五個軟體切來切去。</p>``
  - 對策:改成「不用在五個軟體之間切來切去」或「串起你已經在用的工具」——把訴求從『取代』移到『整合/減少切換』
- **[blocker]** 【誤解風險 #3・AI 取代人最直接】價格區塊把系統跟「請一位真人助理」做成本 VS,還強調 24 小時
  - 證據:`PeakOps.dc.html:1040-1041「請一位真人助理」/「月薪＋招募與管理成本」;:1045-1046「這套系統」/「一次導入,持續運作」;:1048「還幫你 <span>24 小時</span>顧前線。」(同義文案另存於 content.js:168 humanCompare)`
  - 對策:這是唯一把『系統 vs 人』做成替換式對比的區塊。建議改成『系統 + 你的團隊 vs 只有你的團隊』,或改講『讓現有同事不用值夜班』
- **[blocker]** 【誤解風險 #4】案例成果第一格就是「客服人力 ↓約 70%」,而 content.js 為每個案例寫好的『AI 與人分工』說明(human 欄位)在本頁完全沒有被渲染出來
  - 證據:`content.js:90 `metrics: [{ v: '↓約 70%', l: '客服人力(該案例)' }, ...]`、content.js:115 worksFeatured results `'客服人力 ↓約 70%'`;content.js:79/89/97/107 四個案例都有 `human:` 平衡說明(例:107『物件資訊與帶看時段由 AI 自動回覆與預約;議價、屋況說明與成交交由業務處理。』);但 PeakOps.dc.html:841-873 案例卡只渲染 c.industry / c.title / c.img / c.stuck / c.did / c.metrics,`grep 'c.human'` 在 PeakOps.dc.html 零命中`
  - 對策:案例卡補上 {{ c.human }}(資料已在 renderVals :1562 的 ...c spread 裡,零成本);這是最划算的一條——現成的『AI 與人分工』誠實說明被砍掉,只剩人力數字裸露

### 字級與閱讀層級(Typography scale & reading hierarchy)— PeakOps.dc.html 唯讀盤點

- **[high]** 無任何 typography token / CSS 變數。全頁 <style> 區(第17-68行)沒有 :root、沒有任何 --var 宣告;`var(--` 全檔只出現 1 次且是背景座標(第1184行 --sx/--sy),與字級無關。字級 100% 是 inline style:367 個固定 px 的 `font:` 宣告 + 23 種各自獨立的 inline clamp() 運算式。結論:無 token,全部 inline clamp/px。
  - 證據:`PeakOps.dc.html:17-68(<style> 內只有 #pq-skip / html / body / a / keyframes / @media,body 只設 font-family 不設 font-size);PeakOps.dc.html:1184 唯一的 var(--sx,62%) 是 radial-gradient 座標;`grep -c "var(--"` = 1;`grep -oE "font:[0-9]+ [0-9.]+px"` = 367 筆`
  - 對策:若要收斂,先在 <style> 建立 :root{--fs-h1/--fs-h2/--fs-h3/--fs-body/--fs-label} 一組 clamp token,再逐 section 把 inline font: 換成 var()。但因為引擎(sections-engine/home2-engine)大量用 [style*="..."] 與 data-* 選字,替換時不要動 style 屬性以外的結構。
- **[blocker]** HERO h1 兩端都不達標。`clamp(2rem,4.6vw,3.8rem)` = min 32px / 4.6vw / max 60.8px。換算:390px→32.0px、768px→35.3px、1280px→58.9px、1440px→60.8px(封頂)、1920px→60.8px。桌面 60.8px < 64px 基準;手機 32.0px < 40px 基準。
  - 證據:`PeakOps.dc.html:77 `<h1 style="margin:0;font:900 clamp(2rem,4.6vw,3.8rem)/1.3 'Noto Sans TC',sans-serif;letter-spacing:.01em">讓 AI 接住<br>每一個客戶。</h1>``
  - 對策:下限 2rem→2.5rem(40px)、上限 3.8rem→4.25rem(68px),中段 vw 需一併提高(約 5.3vw)才能在 1280px 就達 68px。注意 hero 是 heroT1~T5 絕對定位疊層(第75-150行),改字級會影響 max-width:580px 的換行,需一起確認。
- **[high]** HERO 其餘層級:輔助 eyebrow 11.5px(<14px 違規)、副標 14px(違規邊界,恰好 =14 但顏色 .55 低對比)、T2 主張 clamp(1.4rem,2.9vw,2.4rem)=22.4/22.4/37.1/38.4/38.4px、T2 內文固定 15px(桌面<17、手機<16 皆違規)、T3 狀態標 clamp(15px,1.7vw,20px)=15/15/20/20/20px、T5 主張 clamp(1.55rem,3.2vw,2.6rem)=24.8/24.8/41.0/41.6/41.6px、T5 保證文字 12.5px(<14 違規)。
  - 證據:`PeakOps.dc.html:76 `font:600 11.5px`;:78 `font:400 14px ... color:rgba(242,239,232,.55)`;:81 `font:900 clamp(1.4rem,2.9vw,2.4rem)/1.6`;:82 `font:400 15px/1.85 ... rgba(242,239,232,.6)`;:88,93,98,103 `font:700 clamp(15px,1.7vw,20px)`;:143 `font:900 clamp(1.55rem,3.2vw,2.6rem)/1.55`;:145 `font:700 15.5px`(主 CTA);:148 `font:400 12.5px ... rgba(242,239,232,.5)``
  - 對策:11.5px/12.5px 的 eyebrow 與保證文字提到 14px 起跳;第82行 15px 內文提到 17px。
- **[high]** HANDOFF:無 h2(只有 12px eyebrow),統計數字 clamp(1.9rem,3.4vw,2.8rem)=30.4/30.4/43.5/44.8/44.8px,數字標籤 13px(違規),段落 15px(桌面<17、手機<16 違規)。SVG 上的三個定位標籤 10.5px/10px 更小。
  - 證據:`PeakOps.dc.html:177 `font:600 12px ... color:rgba(242,239,232,.5)`;:203 `font:700 clamp(1.9rem,3.4vw,2.8rem)/1`;:204 `font:400 13px/1.6 ... rgba(242,239,232,.6)`;:208 `font:500 15px/1.8 ... rgba(242,239,232,.7)`;:196,198 `font:600 10.5px`;:197 `font:700 10px``
  - 對策:第208行段落 15px→17px;第204行標籤 13px→14.5px。此區段被 home2-engine 用 data-hnum/data-hnote 驅動,勿改 data-* 與 <span> 層級。
- **[blocker]** DIAGNOSTIC h2 是全頁最小的 h2:clamp(1.7rem,3.4vw,2.8rem)=27.2/27.2/43.5/44.8/44.8px。桌面 44.8px < 48px 基準、手機 27.2px < 32px 基準,兩端皆違規。此同一組 clamp 也用在 LIVEOPS 與 RELAY 兩個 h2。
  - 證據:`PeakOps.dc.html:228 `<h2 style="margin:12px 0 0;font:900 clamp(1.7rem,3.4vw,2.8rem)/1.25 ...">先照一張 X 光`;PeakOps.dc.html:568 同式(同一個控制台);PeakOps.dc.html:733 同式(一筆詢問,在系統裡跑完全程)`
  - 對策:三處統一改成主 h2 的 clamp(2.2rem,4.4vw,3.9rem),或至少 clamp(2rem,3.8vw,3rem)(=32/32/48.6/48/48px)。三行必須一起改,否則同層 h2 會出現兩種級距。
- **[high]** PAIN 是唯一 h2 達標的樣板:clamp(2.2rem,4.4vw,3.9rem)=35.2/35.2/56.3/62.4/62.4px(桌面 62.4≥48 ✓、手機 35.2≥32 ✓)。但內文全數不達標:導言 15.5px、痛點列表 16.5px、收尾 clamp(1.25rem,2.2vw,1.75rem)=20/20/28/28/28px。
  - 證據:`PeakOps.dc.html:291 h2 clamp(2.2rem,4.4vw,3.9rem)/1.18;:292 `font:400 15.5px/1.9 ... rgba(9,11,14,.65)`;:297 `font:500 16.5px/1.7`;:301 `font:900 clamp(1.25rem,2.2vw,1.75rem)/1.6`;:302 `font:700 15px`(CTA 連結)`
  - 對策:痛點列表 16.5px→17.5px(手機已達 16,只差桌面);導言 15.5px→17px。
- **[high]** LOSS:h2 用主樣板(達標);但四個 STEP 標籤 10.5px + alpha .4(對比約 3.3:1)、單位 13px、說明 13px、情境試算註記 13px 皆低於 14px 基準。大數字 clamp(4rem,9vw,8.6rem)=64/69.1/115.2/129.6/137.6px 是全頁最大值,與旁邊 13px 說明形成 10 倍級距落差。
  - 證據:`PeakOps.dc.html:378 h2;:381,390,399,408 `font:600 10.5px ... color:rgba(242,239,232,.4)`;:384,393,402,411 `font:600 13px ... rgba(242,239,232,.55)`;:386,395,404,413 `font:400 13px/1.6 ... rgba(242,239,232,.6)`;:435 `font:700 clamp(4rem,9vw,8.6rem)/1`;:436 `font:700 clamp(1.3rem,2.4vw,1.9rem)`;:439 `font:400 13px/1.8 ... rgba(242,239,232,.6)`;:441 `font:900 clamp(1.4rem,2.6vw,2.1rem)/1.55``
  - 對策:STEP 說明 13px→15px、STEP 標籤 10.5px→12px 並把 alpha .4→.6。sections-engine 用 data-lossv/data-lgap/data-drop 驅動,勿動這些屬性。
- **[high]** FLOW:h2 clamp(2rem,4vw,3.4rem)=32/32/51.2/54.4/54.4px(桌面 ✓;手機恰好 32.0 卡在基準線,無餘裕)。卡片標題 h3 固定 22px(桌面恰好 =22 ✓、手機 22 ✓,是全頁唯一達標的卡片標題)。但三段卡片內文都是 15px(桌面<17、手機<16 違規),右上三個 rail 標籤 13.5px 且 alpha .4。
  - 證據:`PeakOps.dc.html:458 `font:900 clamp(2rem,4vw,3.4rem)/1.2`;:469,489,513 `<h3 style="margin:0;font:900 22px 'Noto Sans TC',sans-serif">`;:474,494,518 `font:400 15px/1.85 ... rgba(9,11,14,.7)`;:460,461,462 `font:700 13.5px ... color:rgba(9,11,14,.4)`;:543 `font:500 15px/1.8 ... rgba(242,239,232,.8)``
  - 對策:三段內文 15px→17px。第460-462 行 rail 標籤 alpha .4 在米色底(#F2EFE8)對比僅約 2.6:1,需提到 .65 以上。data-rail 是 sections-engine 的選擇器,勿改。
- **[high]** LIVEOPS 是全頁字級最小的區塊:整個 console 模擬介面 60+ 個宣告落在 9-12.5px,最小到 9px。h2 用不達標的小型 clamp(見上一則),副說明僅 500 13px。
  - 證據:`PeakOps.dc.html:568 h2 clamp(1.7rem,3.4vw,2.8rem);:570 `font:500 13px ... color:rgba(9,11,14,.5)`;:645 `font:600 9px`;:650,651,652 `font:700 9px sans-serif`;:655,656 `font-size:10px`;:663 `font:400 10.5px`;:694,695,696 `font:400 10px ... rgba(242,239,232,.5)`;:638,639,640 `font:15px sans-serif` / `font:12px sans-serif`(未指定 font-family,會 fallback 到系統 sans-serif,與全頁 Noto Sans TC 不一致)`
  - 對策:9px 文字(645,650-652)在任何裝置上都不可讀,至少提到 11px。另外 638-640 行的 `font:15px sans-serif` 缺 font-family 指定,會掉出 Noto Sans TC。此區有 #pq-live-grid / #pq-live-console / #pq-live-items 三個 id 被第55行 @media 綁定,勿改 id 與 data-live-item。
- **[high]** RELAY:h2 用不達標小 clamp;卡片標題僅 800 16px(桌面 16<22、手機 16<20,兩端違規);卡片說明 12.5px、收尾 13px 皆 <14。
  - 證據:`PeakOps.dc.html:733 h2 clamp(1.7rem,3.4vw,2.8rem)/1.25;:744 `font:700 10px`(站點 chip);:745 `font:800 16px 'Noto Sans TC'`(卡片標題);:746 `font:400 12.5px/1.65 ... rgba(9,11,14,.65)`;:750 `font:400 13px ... rgba(9,11,14,.5)``
  - 對策:卡片標題 16px→20px、說明 12.5px→15px。此區 data-rstation 被第46-51行 CSS ::after 動畫與 home2-engine 同時使用,勿改 DOM 順序(用了 :nth-child)。
- **[high]** FEATURES:h2 主樣板達標;桌面 orbit 面板 h3 clamp(1.5rem,2.2vw,1.9rem)=24/24/28.2/30.4/30.4px(達標)。但手機版 #pq-orbitrow 卡片 h3 只有 800 18px(手機 18<20 違規),卡片項目 12.5px,導言 15.5px、面板 tagline 15.5px、bullets 14.5px 全部 <17。
  - 證據:`PeakOps.dc.html:764 h2;:765 `font:400 15.5px/1.85 ... rgba(9,11,14,.65)`;:787 `<h3 ... font:900 clamp(1.5rem,2.2vw,1.9rem)>`;:788 `font:700 15.5px/1.7`;:793 `font:400 14.5px/1.65 ... rgba(9,11,14,.75)`;:797 `font:400 12px ... rgba(9,11,14,.45)`(鍵盤提示);:811 `<h3 ... font:800 18px>`(手機卡片標題);:815 `font:400 12.5px/1.6 ... rgba(9,11,14,.72)`;:823 `font:600 12px ... rgba(9,11,14,.5)``
  - 對策:手機卡片 h3 18px→20px、卡片項目 12.5px→15px、bullets 14.5px→17px。#pq-orbit / #pq-orbitrow 被第60-61行 @media 互斥控制,且 #pq-orbitrow 是 sections-engine 的選擇器,勿改 id。
- **[high]** CASES:h2 主樣板達標;案例標題 h3 800 20px/1.4(桌面 20<22 違規、手機 20 恰好達標);BEFORE/SYSTEM 段落 14.5px(桌面<17、手機<16 違規);三個小標 11px + alpha .45(對比約 2.9:1);成果標籤 13px;免責註記 12.5px + alpha .5。
  - 證據:`PeakOps.dc.html:839 h2;:845 `<h3 style="margin:0;font:800 20px/1.4 'Noto Sans TC',sans-serif">{{ c.title }}</h3>`;:854,858 `font:600 11px ... color:rgba(9,11,14,.45)`;:855,859 `font:400 14.5px/1.75`;:863 `font:600 11px ... rgba(9,11,14,.45)`;:866 `font:700 21px 'Space Grotesk'`(數字);:867 `font:400 13px ... rgba(9,11,14,.6)`;:876 `font:400 12.5px/1.7 ... rgba(9,11,14,.5)``
  - 對策:h3 20px→22px、段落 14.5px→17px、BEFORE/SYSTEM/RESULT 小標 11px→13px 且 alpha .45→.65。data-caseimg 被 gl-engine 與 interactions-engine 兩支同時使用,勿改。
- **[high]** PORTFOLIO 是卡片標題最小的一區:作品標題僅 800 17px/1.35(桌面 17<22、手機 17<20,兩端違規);說明 12.5px + alpha .6;編號 12px + alpha .4;連結標籤 12px + alpha .45;分類標 10.5px。
  - 證據:`PeakOps.dc.html:895 h2(主樣板,達標);:916 `font:700 12px ... color:rgba(242,239,232,.4)`;:917 `font:600 10.5px ... color:#FF6B2C`;:919 `font:800 17px/1.35 'Noto Sans TC'`(作品標題);:920 `font:400 12.5px/1.7 ... rgba(242,239,232,.6)`;:926 `font:500 12px 'Space Grotesk' ... rgba(242,239,232,.45)``
  - 對策:作品標題 17px→20px、說明 12.5px→15px。卡片是 min-width:300px 的橫向 scroll-snap 卡,放大字級會影響 galTrack 寬度計算,改前先確認 sections/gl-engine 的 galScroller 邏輯。
- **[high]** COMPARE:h2 主樣板達標;桌面表頭 700 15px、維度欄 600 13.5px + alpha .55、儲存格 14.5px,全部低於 17px 內文基準。手機卡(JS 產生)標題 800 17px(手機<20 違規)、維度 12.5px、值 14px。
  - 證據:`PeakOps.dc.html:943 h2;:947,948,949 `font:700 15px ... rgba(9,11,14,.7)`(表頭);:949 `font:700 10.5px`(推薦徽章);:952 `font:600 13.5px ... rgba(9,11,14,.55)`;:953,954 `font:400 14.5px/1.65 ... rgba(9,11,14,.72)`;:955 `font:600 14.5px/1.65`;PeakOps.dc.html:1447 `nameStyle: { font: "800 17px 'Noto Sans TC',sans-serif" }`;:1449 `dimStyle: { font: "600 12.5px ...", color: ... 'rgba(9,11,14,.5)' }`;:1450 `valStyle: { font: "500 14px/1.6 ..." }``
  - 對策:表格儲存格 14.5px→16px、維度欄 13.5px→14.5px。注意 #pq-cmp-desk / #pq-cmp-mob 被第55-56行 @media 互斥,兩套要同步改。
- **[high]** PRICING:h2 主樣板達標;但方案卡標題(JS nameStyle)只有 900 19px(桌面<22、手機<20,兩端違規),方案項目 14.5px、方案註記 15px、客製系統 h3 900 20px(桌面<22)、客製說明 13.5px、標籤 12px/12.5px。報價數字 clamp(1.3rem,2.1vw,1.7rem)=20.8/20.8/26.9/27.2/27.2px。
  - 證據:`PeakOps.dc.html:989 h2;:990 `font:400 15px/1.8 ... rgba(9,11,14,.6)`;:999 `font:600 12px ... rgba(9,11,14,.5)`;:1004 `font:700 12.5px`;:1020 `font:700 clamp(1.3rem,2.1vw,1.7rem)/1`;:1041,1046 `font:700 clamp(1.05rem,1.9vw,1.4rem)`(=16.8/16.8/24.3/22.4/22.4px);:1048 `font:700 clamp(15px,1.6vw,18px)`(=15/15/18/18/18px);:1052 `<h3 ... font:900 20px>`;:1053 `font:400 12.5px ... rgba(9,11,14,.55)`;:1063 `font:400 13.5px/1.75 ... rgba(9,11,14,.6)`;PeakOps.dc.html:1366 `nameStyle: { font: "900 19px 'Noto Sans TC',sans-serif" }`;:1372 `itemStyle: { font: "500 14.5px/1.6 ..." }``
  - 對策:nameStyle 19px→22px、itemStyle 14.5px→16px。這些是 JS 物件字串,改動 PeakOps.dc.html 的 <script> 段而非 markup。
- **[high]** USAGE:h2 clamp(2.2rem,4.4vw,3.6rem)=35.2/35.2/56.3/57.6/57.6px(達標);但卡片 h3 只有 800 18px(桌面<22、手機<20 違規);導言 16px(桌面<17)、卡片說明 14.5px、提示框 13px、Esc 提示 11.5px + alpha .5。
  - 證據:`PeakOps.dc.html:1076 h2 clamp(2.2rem,4.4vw,3.6rem)/1.2;:1077 `font:400 16px/1.9 ... rgba(9,11,14,.65)`;:1085 `<h3 style="margin:0;font:800 18px 'Noto Sans TC',sans-serif">{{ u.t }}</h3>`;:1088 `font:400 14.5px/1.8 ... rgba(9,11,14,.68)`;:1098 `font:400 13px/1.7` 與同行 `color:rgba(242,239,232,.5);font-size:11.5px`;PeakOps.dc.html:1429 `meterLabelStyle: { font: "700 12px ..." }``
  - 對策:h3 18px→22px、導言 16px→17px、說明 14.5px→17px。第1098行是全頁唯一用獨立 font-size 覆寫 shorthand 的地方,改的時候注意順序。
- **[high]** TIMELINE:h2 主樣板達標;但每一步的說明文字固定 400 14px/1.75 且 alpha .72(桌面<17、手機<16 違規),右上註記 400 14px + alpha .55,步驟日期標 700 14px。整區內文最大只有 14px。
  - 證據:`PeakOps.dc.html:1115 h2;:1116 `font:400 14px 'Noto Sans TC',sans-serif;color:rgba(242,239,232,.55)`;:1124 `font:700 14px 'Space Grotesk',sans-serif;letter-spacing:.1em;color:#FF6B2C`;:1125 `font:400 14px/1.75 ... color:rgba(242,239,232,.72);max-width:200px``
  - 對策:步驟說明 14px→16px(此處 max-width:200px 會導致換行變多,改字級要一併放寬)。#pq-tl 與 data-tstep/data-dot/data-tline 被第55行 @media 與 interactions-engine 綁定,勿改結構。
- **[high]** FAQ:h2 clamp(2.2rem,4.4vw,3.6rem)=35.2/35.2/56.3/57.6/57.6px(達標);問題 summary 700 17px(桌面恰好 =17 ✓、手機 ✓);但答案內文 15px、導言 15.5px(桌面<17、手機<16 皆違規)。
  - 證據:`PeakOps.dc.html:1164 h2;:1165 `font:400 15.5px/1.85 ... rgba(9,11,14,.62)`;:1166 `font:700 15px`(CTA);:1171 `font:700 17px 'Noto Sans TC'`(summary);:1173 `font:500 22px 'Space Grotesk'`(+ 號);:1175 `font:400 15px/1.9 ... rgba(9,11,14,.68);max-width:620px``
  - 對策:答案 15px→17px。這是全頁閱讀量最大的區塊之一,優先度應高於裝飾區。
- **[high]** DEMO-CTA:h2 clamp(2rem,4.2vw,3.8rem)=32/32.3/53.8/60.5/60.8px(桌面 ✓,手機 32.0 卡在基準線);內文 16px(桌面<17);次要 CTA 15px、聯絡資訊 13.5px + alpha .5;右側 console 模擬 UI 為 9.5-12.5px,含全頁最小的 9.5px。
  - 證據:`PeakOps.dc.html:1188 `font:900 clamp(2rem,4.2vw,3.8rem)/1.3`;:1189 `font:400 16px/1.9 ... rgba(242,239,232,.65)`;:1191 `font:700 16px`(主 CTA);:1192 `font:500 15px 'Space Grotesk'`(電話);:1194 `font:400 13.5px 'Space Grotesk' ... rgba(242,239,232,.5)`(email/網址列);:1206 `font:400 9.5px ... rgba(9,11,14,.55)`;:1220,1224,1228 `font:400 11px ... rgba(242,239,232,.5)``
  - 對策:第1194行的 email/PEAKQI.COM 是可點擊的實際聯絡資訊卻只有 13.5px + alpha .5,應提到 15px + alpha .75。內文 16px→17px。data-echo 被第62行 @media 隱藏於手機,data-spot 被 motion 用,勿改。
- **[blocker]** 跨區:全頁 367 個固定 px 字級宣告中,289 個(78.7%)低於 14px 輔助文字基準。分布:9px×4、9.5px×1、10px×25、10.5px×56、11px×40、11.5px×20、12px×39、12.5px×34、13px×59、13.5px×11。達到桌面內文基準 17px 以上的只有 20 個(17px×5、18px×6、20px×6、21px×3),22px 以上僅 7 個。
  - 證據:``grep -oE "font:[0-9]+ [0-9.]+px" PeakOps.dc.html` 統計:總數 367,<14px 者 289;最小值出現在 PeakOps.dc.html:645,650,651,652(`font:600 9px` / `font:700 9px sans-serif`)與 PeakOps.dc.html:1206(`font:400 9.5px`)`
  - 對策:整體字階需要重建,不是逐點微調能解。建議先定 6 階 token(label 14 / body-sm 15 / body 17 / card-title 22 / h3 clamp / h2 clamp / h1 clamp),再把 289 個小字分成「裝飾 mock(可豁免)」與「真內容(必須升級)」兩類。
- **[blocker]** 低對比灰字共 77 處(alpha ≤ .5):.5 ×43、.45 ×14、.4 ×19、.38 ×1。實測合成對比:深底 #090B0E 上 rgba(242,239,232,.4) 約 3.3:1、.45 約 4.0:1、.38 約 3.1:1(皆不足 4.5:1);米底 #F2EFE8 上 rgba(9,11,14,.5) 僅約 3.5:1、.45 約 2.9:1、.4 約 2.6:1 —— 淺色區的 .5 也全數不合格。
  - 證據:`alpha .4 於 PeakOps.dc.html:216,274,364(.38),381,390,399,408,460,461,462,470,490,514,536,577,590,609,617,916,1215;alpha .45 於 :115,119,123,127,131,135,139,332,355,555,797,854,863,926;alpha .5 於 :85,148,151,177,196,198,248,289,346,347,376,455,531,570,580,581,582,615,654,663,681,683,694,695,696,750,761,823,837,876,892,941,986,999,1074,1098,1112,1138,1162,1194,1220,1224,1228`
  - 對策:米底(#F2EFE8)區的所有 rgba(9,11,14,.4~.5) 至少提到 .62;深底(#090B0E)區的 rgba(242,239,232,.4~.45) 至少提到 .62。特別優先:PeakOps.dc.html:460-462(可讀 rail 標籤 alpha .4 在米底)、:876(案例免責 12.5px+.5)、:1194(聯絡 email 13.5px+.5)。
- **[high]** h2 級距在同一頁有 5 種不同 clamp,視覺層級不一致:主樣板 clamp(2.2rem,4.4vw,3.9rem)(9 次)、clamp(2.2rem,4.4vw,3.6rem)(2 次)、clamp(2rem,4vw,3.4rem)(1 次)、clamp(2rem,4.2vw,3.8rem)(1 次)、clamp(1.7rem,3.4vw,2.8rem)(3 次,不達標)。在 1440px 下產生 62.4 / 57.6 / 54.4 / 60.5 / 44.8px 五種尺寸,同層標題最大差 17.6px。
  - 證據:`主樣板於 PeakOps.dc.html:291,378,764,839,895,943,989,1115,1141;3.6rem 版於 :1076,1164;3.4rem 版於 :458;4.2vw 版於 :1188;1.7rem 版於 :228,568,733`
  - 對策:收成 2 階:大 section h2 一律 clamp(2.4rem,4.6vw,4.25rem),劇場型 section(diagnostic/liveops/relay)一律 clamp(2rem,3.8vw,3.25rem)。改動只在 style 屬性內的 font 值,不動 <h2> 標籤與 margin。
- **[blocker]** 卡片標題在同一頁有 8 種尺寸且無 clamp:22px(flow)、21px(risk)、20px(cases/pricing custom)、19px(pricing plan,JS)、18px(features 手機 / usage)、17px(portfolio / compare 手機,JS)、16.5px(orbit core)、16px(relay)。只有 flow 的 22px 同時達到桌面 22 與手機 20 基準,其餘 7 種皆違規。
  - 證據:`22px 於 PeakOps.dc.html:469,489,513;21px 於 :1148;20px 於 :845,1052;19px 於 :1366(JS nameStyle);18px 於 :811,1085;17px 於 :919,1447(JS);16.5px 於 :775;16px 於 :745`
  - 對策:統一為一個 card-title 級距(建議 clamp(1.25rem,1.6vw,1.5rem) = 20/20/20.5/23/24px,手機 20 ✓ 桌面 23 ✓)。JS 端(1366、1447)與 markup 端要同步。

### responsive-與-breakpoint(PeakOps.dc.html 唯讀盤點)

- **[high]** JS 的 mobile 旗標只在載入當下算一次,resize / 裝置旋轉都不會重算,導致跨越 900px 之後行為與 CSS 佈局脫節。sections-engine 的 onResize 只更新 vh,完全沒有重算 mobile,也沒有重跑 setupOrbit / setupMobileParallax;motion-kit 的 ctx.mobile 是模組初始化時的一次性值,home2-engine 全部的 `ctx.reduced || ctx.mobile` 判斷都吃這個值。
  - 證據:`sections-engine.js:305-313 `const onResize = () => { ... vh = window.innerHeight || 1; if (pain) pain.cursorIdx = -1; lastPain = lastLoss = lastFlow = -1; }`(無 mobile 重算);sections-engine.js:317 `mobile = (window.innerWidth || 1200) < 900;`(僅 start() 內);motion-kit.js:30 `mobile: (window.innerWidth || 0) < BP.mobile,`;home2-engine.js:165 `if (ctx.reduced || ctx.mobile) { setActive(0, false); return; }``
  - 對策:改用 matchMedia('(max-width:899px)') 的 change 事件重算並重跑對應 setup/teardown;或在 onResize 內偵測跨界時 destroy+re-init。注意 home2-engine.js:148 已經有 isCompact() 做即時查詢,可以當作既有模式參考。
- **[high]** `style-hover` 屬性在整個 repo 的任何 .js 檔案裡都找不到實作,只出現在 .dc.html。本頁 12 處 hover 樣式很可能完全沒有生效(不只是手機無法觸發,桌機也沒有)。
  - 證據:`PeakOps.dc.html 共 12 處,如 1191 行 `style-hover="background:#F2EFE8"`、898/899 行 `style-hover="border-color:#FF6B2C;color:#FF6B2C"`;`grep -rn "style-hover\|styleHover" --include=*.js .` 回傳空;`grep -c "hover" support.js` = 0;含 style-hover 的檔案清一色是 .dc.html(404/About/Case/Cases/Contact/Demo/Footer/Home/Nav/PeakOps/Pricing/Solutions)`
  - 對策:先在瀏覽器實測一個 style-hover 是否真的生效(可能由線上 DC runtime 而非本地 support.js 處理)。若確實無效,改成 CSS `@media (hover:hover){...}` 規則;若有效,仍需確認它是用 JS mouseenter 綁定(手機不觸發)還是產生 :hover 規則。
- **[high]** 觸控區小於 44px 的元件(依 style 內寫死的尺寸/padding 推算):usage 區的「i」說明鈕 26×26px(最小、最該修);精選作品左右鈕 42×42px;方案切換 tab padding 9px 18px + 13.5px 字 ≈ 36px 高;Nav 浮動 CTA 的關閉鈕 30×30px。
  - 證據:`PeakOps.dc.html:1086 `<button onClick="{{ u.tipToggle }}" ... aria-label="計費說明" style="width:26px;height:26px;border-radius:50%;...">`;PeakOps.dc.html:898-899 `style="width:42px;height:42px;border-radius:50%;..."`;PeakOps.dc.html:1460 `cursor: 'pointer', borderRadius: '999px', padding: '9px 18px', border: 'none',` + 1459 `font: "700 13.5px 'Noto Sans TC',sans-serif"`;Nav.dc.html:96 `style="margin-left:8px;width:30px;height:30px;border-radius:50%;..."``
  - 對策:對 26/30/42px 的圓鈕加 `::after` 透明擴張命中區(position:absolute;inset:-9px)或直接把 min-width/min-height 提到 44px;方案 tab 把 padding 改成 12px 18px。不要用放大 width/height 的方式改 42px 圓鈕,會影響既有排版。


## B. 其他發現(medium/low/info)

### reduced-motion 與無障礙(PeakOps.dc.html + 相關引擎,唯讀盤點)

- reduced-motion 的降級策略是「引擎整條關掉 + 模板靜態完成態」,而不是把時長設為 0。共 5 個 JS 入口讀 prefers-reduced-motion:motion-config.capabilityTier() 回傳 'static'(motion-config.js:20-29,被 motion-kit.createMotionContext 的 ctx.reduced 使用 → home2-engine 全部場景走這條)、gl-engine 直接不建立 canvas、interactions-engine / sections-engine 不啟動 rAF、hero-engine 走 applyStatic()。
  - 證據:`motion-config.js:20-29 `export function capabilityTier(){ const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); ... if (reduced || save) return 'static'; }` / motion-kit.js:29 `reduced: capabilityTier() === 'static'` / gl-engine.js:260-263 `if (reduced || save || lowMem || innerWidth<900) { disabled = true; return; }` / interactions-engine.js:223,237 `reduced = !!(...matches)` … `if (!reduced) raf = requestAnimationFrame(loop);` / sections-engine.js:318,331 同上 / hero-engine.js:721-722 `if (!ctx || reduced) { measure0(); applyStatic(); return; }``

### container / 間距 / 區塊高度(PeakOps.dc.html 唯讀盤點)

- 本專案沒有 package.json,repo 根目錄無任何 bundler 設定 → 確認不存在 lint / typecheck / test / build 指令,任何驗證只能靠瀏覽器實測。
  - 證據:``ls C:/Users/User/Documents/GitHub/peakqi-website/package.json` → "No such file or directory";根目錄只有 *.dc.html + 裸 *.js`
- 主容器 max-width 共 3 種值:1400px(1 處)、1360px(19 處)、1160px(1 處)。1400 與 1160 是全頁唯二的例外,其餘 section 一律 1360。
  - 證據:`PeakOps.dc.html:159 `max-width:1400px`(#hero-stats)｜1160px 只在 :451(#flow)｜1360px 在 :174,:215,:224,:284,:372,:564,:731,:757,:833,:888,:907,:937,:982,:1069,:1108,:1134,:1157,:1185`
  - 對策:若要統一節奏,把 :159 的 1400 與 :451 的 1160 都收斂成 1360;但 :451 縮窄是為了 pin 住的三層卡片可讀性,改之前要先確認 sections-engine.js:150 的 `min(760px,96%)` 是否要跟著調。
- 依 section 分組的 max-width(主容器):hero 無主容器(絕對定位文字塊 580/600/640px)、hero-stats 1400、handoff 1360、divider 1360、diagnostic 1360、pain 1360、loss 1360、flow 1160、liveops 1360、relay 1360、features 1360、cases 1360、portfolio 1360(含 gallery scroller 1360)、compare 1360、pricing 1360、usage 1360、timeline 1360、risk 1360、faq 1360、demo-cta 1360。
  - 證據:`section 起始行:69 hero / 158 hero-stats / 171 handoff / 214 divider / 221 diagnostic / 283 pain / 369 loss / 448 flow / 561 liveops / 728 relay / 756 features / 832 cases / 887 portfolio / 936 compare / 981 pricing / 1068 usage / 1107 timeline / 1133 risk / 1156 faq / 1182 demo-cta;對應 max-width 行號見上一條`
- section 水平 padding 全頁一致:clamp(20px,5vw,48px),共 19 處,無例外。垂直 padding 有 6 種節奏。
  - 證據:`水平:PeakOps.dc.html:158,173,214,223,283,371,450,563,730,756,832,887,936,981,1068,1107,1133,1156,1182 全為 `clamp(20px,5vw,48px)`；垂直:clamp(72px,9vw,128px)(:283,:756,:832,:887,:936,:981,:1068,:1107,:1133,:1156)、clamp(80px,10vw,140px)(:1182)、clamp(72px,9vw,120px)(:450)、clamp(64px,8vw,104px)(:371)、clamp(56px,7vw,96px)(:173)、clamp(56px,7vw,88px)(:223,:563,:730)、`0 … 10px`(:158)、`0 … 34px`(:214)`
- 卡片內層 padding 有 5 種:clamp(18px,2.4vw,28px)、clamp(20px,2.6vw,30px)、clamp(24px,2.6vw,32px)、26px clamp(20px,3vw,36px)、以及大量硬編碼 px(如 30px 28px、28px 26px、13px 15px)。
  - 證據:`PeakOps.dc.html:256, :466/:486/:510/:532, :785, :1038/:1050;硬編碼例:1352 行 renderVals 內 `padding: '30px 28px'`、:1147 `padding:28px 26px`、:235 `padding:13px 15px``
- 整頁 HTML 內只有 2 處使用 vh,其餘 6 處 sticky runway 全部由 JS 在執行期注入,靜態讀 HTML 完全看不到頁面真實高度。
  - 證據:`PeakOps.dc.html:70 `height:360vh`(hero wrap)、:71 `height:100vh`(hero sticky stage);grep `svh|dvh` 在 PeakOps.dc.html 中 0 筆(找不到,全頁未用 svh/dvh)`
  - 對策:若要修行動版 100vh 位址列問題,需同時改 :71 與 motion-kit.js:110(`stage.style.minHeight='100vh'`)、sections-engine.js:139(`stage.style.height='100vh'`)。
- vh 用途分類:PeakOps.dc.html:70 的 360vh 是「為了撐動畫距離」(hero-engine.js:628 用 `-r0.top/(wrapH-vh)` 換算進度,260vh runway);:71 的 100vh 是「內容需要」(sticky 舞台要填滿視窗)。
  - 證據:`hero-engine.js:576 `wrapH = wrap.offsetHeight||1`;hero-engine.js:628 `p = clamp(-r0.top / Math.max(1, wrapH - vh), 0, 1)``
- 全頁 sticky 區塊共 6 個實際生效(hero 為靜態 inline,其餘 5 個由 JS 注入),runway 高度分別為 hero 260vh、handoff 45vh、diagnostic 100vh、liveops 180vh、relay 120vh、flow 165vh。
  - 證據:`hero:PeakOps.dc.html:70-71(360vh wrap / 100vh sticky stage)｜handoff:home2-engine.js:31 `pin(wrap,stage,45)` → motion-kit.js:107 `wrap.style.height=(vh+vh*45/100)+'px'` = 145vh｜diagnostic:home2-engine.js:74 `pin(...,100)` = 200vh｜liveops:home2-engine.js:166 `pin(...,180)` = 280vh｜relay:home2-engine.js:183 `pin(...,120)` = 220vh｜flow:sections-engine.js:136 `wrap.style.height='265vh'` + :137-139 sticky/100vh`
- 第 7 個 sticky(portfolio 精選作品橫向展廊)是「橫向捲動長度換算成縱向 runway」,runway = track.scrollWidth - scroller.clientWidth(像素,非 vh),且 extra<60px 時整個 sticky 會退回一般捲動。
  - 證據:`interactions-engine.js:110-121 `const extra = Math.max(0, track.scrollWidth - scroller.clientWidth); if (extra<60){galReset();return;} … stage.style.position='sticky'; stage.style.top=gal.top+'px'; wrap.style.height=(sh+extra)+'px'`;綁定的 DOM 在 PeakOps.dc.html:905-908`
- home2-engine.js 的 5 個 pin 高度是「掛載當下的 innerHeight 換算成固定 px」寫死,而且 home2-engine.js / motion-kit.js 都沒有 resize 監聽 → 使用者改變視窗高度後,handoff/diagnostic/liveops/relay 的 runway 不會重算。sections-engine 的 flow 反而用 CSS `265vh` 且有 resize handler,兩套行為不一致。
  - 證據:`motion-kit.js:106-107 `const vh = window.innerHeight||1; wrap.style.height=(vh+vh*distanceVh/100)+'px'`;`grep resize motion-kit.js home2-engine.js` → 0 筆;sections-engine.js:329 `window.addEventListener('resize', onResize)``
  - 對策:把 motion-kit.js:107 改成寫 `calc()` / vh 單位,或在 createMotionContext 內加 resize 重算。屬 JS 行為,不在本次唯讀範圍。
- home2-engine.js 註解標示的 runway 與實際 pin 值不符:註解寫 HANDOFF(140vh),實際是 145vh;RESULT WALL(150vh) 這段在本頁根本是死碼,因為 PeakOps.dc.html 完全沒有 #resultwall。
  - 證據:`home2-engine.js:19 `// 一、SYSTEM HANDOFF(140vh)` vs :31 `pin(wrap,stage,45)` → 145vh;home2-engine.js:205-212 `wall()` 查 `#resultwall [data-wrap]`,但 `grep -c resultwall PeakOps.dc.html` = 0`
- #loss 看起來像 pin 結構(有 lossWrap/lossStage 包裝)但其實沒有 pin,sections-engine 永遠給 pinned:false,走的是 traverse 進度,不佔任何額外 runway。
  - 證據:`PeakOps.dc.html:370-371 `ref="{{ lossWrap }}"` / `ref="{{ lossStage }}"`;sections-engine.js:92-98 `loss = { … pinned: false }`,之後無任何 `loss.pinned = true`;sections-engine.js:266 `lossUpdate(loss.pinned ? pinP(...) : traverseP(...))``
- 真正的左右雙欄(非 auto-fit)只有 2 組:#liveops 62.5/37.5、#features orbit 57.5/42.5。
  - 證據:`PeakOps.dc.html:572 `grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr)` → 1.25/2 = 62.5%,.75/2 = 37.5%｜:767 `minmax(420px,1.15fr) minmax(320px,.85fr)` → 1.15/2 = 57.5%,.85/2 = 42.5%`
- 其餘所有「雙欄」都是 auto-fit,在 1280px 下實際渲染成 50/50 等寬,沒有任何主副欄層級差。共 6 處版面級雙欄。
  - 證據:`PeakOps.dc.html:232(#diagnostic, minmax(min(100%,340px),1fr), gap clamp(20px,3vw,40px)=38.4px → 572.8/572.8)、:284(#pain, 380px, gap 64px → 560/560)、:432(#loss, 360px, gap clamp(24px,4vw,56px)=51.2px → 566.4/566.4)、:1069(#usage, 320px, gap 64px → 560/560)、:1157(#faq, 320px, gap clamp(32px,5vw,72px)=64px → 560/560)、:1185(#demo-cta, 380px, gap 64px → 560/560)`
  - 對策:若想做出「主 60 / 副 40」的節奏,這 6 處要改成顯式 fr 比例(如 1.25fr .75fr)並加 @media 降級;但 :284/:432 兩側都有絕對定位子元素,改欄寬會連動 pain 視覺與 loss SVG 的百分比座標。
- 多欄(非雙欄)比例:#compare 表格 120px / 1fr / 1fr / 1.15fr,在 1280 下換算為 10.1% / 28.5% / 28.5% / 32.8%;#hero 客戶卡與 #liveops 主控台頂列均為 1fr 1fr 1fr(33.3 三等分)。
  - 證據:`PeakOps.dc.html:945 `grid-template-columns:120px 1fr 1fr 1.15fr`(容器 1184,扣 120 → 1064 分 3.15fr);:113 / :579 / :693 / :1217 `1fr 1fr 1fr``
- 沒有任何區塊的內容真的只佔「螢幕正中央 30-40%」——最窄的置中內容是 #flow pin 住時的三層卡片 min(760px,96%),在 1280 下 = 59.4%。
  - 證據:`sections-engine.js:148-153 `flow.deck.style.height=Math.max(340,vh-330)+'px'` 與 `el.style.width='min(760px, 96%)'; el.style.left='50%'; el.style.top='50%'`;760/1280 = 59.4%`
- 但有 7 處「文字寬度只佔視窗 15-33%」的窄欄內文(靠左/靠右對齊,非置中),是全頁最接近 30-40% 問題的地方。
  - 證據:`PeakOps.dc.html:1125 `max-width:200px`(timeline 每步說明,15.6%)、:1090 `max-width:220px`(usage 用量條,17.2%)、:990 `max-width:380px`(pricing planNote,29.7%)、:1165 `max-width:380px`(faq 引言,29.7%)、:765 `max-width:400px`(features 引言,31.3%)、:292 `max-width:420px`(pain 引言,32.8%)、:1077 `max-width:420px`(usage 引言,32.8%)`
  - 對策:這些 max-width 都疊在已經是 560px 的 50/50 欄上(雙重收窄:欄 560 → 文字 380/420),右側 140-180px 是純空白。要嘛拿掉內層 max-width 讓文字吃滿欄,要嘛把欄本身改窄。
- 另有 4 處中段寬度內文(43-56%),視覺上會出現「左半段有字、右半段空」的斷裂感,尤其 :208 與 :277 是在 1184px 滿寬容器裡直接放 560/720px 文字。
  - 證據:`PeakOps.dc.html:208 `max-width:560px`(handoff 結語,佔容器 47.3% / 視窗 43.8%)、:277 `max-width:720px`(diagnostic 結語,56.3%)、:439 `max-width:560px`(loss 註記)、:876 `max-width:560px`(case 註記)、:1189 `max-width:520px`(demo-cta 內文)、:1175 `max-width:620px`(faq 答案,但所在欄僅 560px,此值不生效)`
  - 對策::1175 的 620px 在 1280 下永遠不生效(欄寬 560),屬冗餘宣告。
- 固定 min-height 共 7 處,全部是「內容需要」而非動畫 runway,其中 3 處是主控台面板高度,在 1280 下不會被撐爆但在窄視窗會硬撐。
  - 證據:`PeakOps.dc.html:233 `min-height:300px`(diagnostic 左側工具堆)、:304 `min-height:560px`(pain 右側視覺盒)、:573 `min-height:460px`(#pq-live-console)、:584 `min-height:340px`(live panel 容器)、:632 `min-height:120px`、:698 `min-height:80px`、:785 `min-height:320px`(features 模組卡);另 :55 media query 內 `min-height:440px!important``
- #flow pin 的高度是像素硬算 `Math.max(340, vh-330)`,並帶一個「裝不下就退回堆疊」的保險,代表這區在矮視窗(vh<640)會整個放棄 pin。這是全頁唯一有自動降級的 sticky。
  - 證據:`sections-engine.js:134 `if (reduced || mobile || vh < 640) { flow = null; return; }`;:148 `flow.deck.style.height = Math.max(340, vh - 330) + 'px'`;:161-164 `requestAnimationFrame(() => { if (stage.scrollHeight > vh + 12) unpinFlow(); })``
- 桌機捲動總長度粗估:hero 360vh + handoff 145vh + diagnostic 200vh + liveops 280vh + relay 220vh + flow 265vh = 1470vh 的 pin 區,加上 13 個一般 section(各約 115px×2 padding + 內容),整頁極長。任何「加高 runway」的需求都要先確認這個既有總量。
  - 證據:`PeakOps.dc.html:70;home2-engine.js:31,74,166,183 + motion-kit.js:107;sections-engine.js:136`

### 建置與驗證手段(build / verification tooling inventory)— 唯讀盤點

- repo 根目錄無 package.json / tsconfig / eslint 設定 / 測試檔 → 本專案「無 lint、無 typecheck、無 test、無 build 指令」。已用 Glob(**/package.json、**/tsconfig*.json、**/.eslintrc*)與 ls -a 實查,不是推測。
  - 證據:`Glob '**/package.json' 僅回傳 peakqi-vision-architecture\package.json 與 peakqi-vision-architecture_V2\package.json;Glob '**/.eslintrc*' = No files found;`ls -a C:/Users/User/Documents/GitHub/peakqi-website` 根目錄清單無 package.json / tsconfig.json / node_modules / .eslintrc,只有 vercel.json、peakqi-camera-parts.json、hero-config.js、motion-config.js`
  - 對策:不要在報告或 PR 描述裡寫「跑 npm run lint/build 驗證」——這些指令不存在,寫了就是假的。改版後的唯一驗證途徑是靜態伺服器 + headless 瀏覽器(見下面幾條)。
- 唯二的 package.json 屬於 peakqi-vision-architecture / _V2 兩個獨立 Next.js 16 + Cloudflare Vite 專案,與 .dc.html 網站完全無關;它們的 npm run lint/test/build 不驗證 PeakOps.dc.html 任何一行。
  - 證據:`peakqi-vision-architecture/package.json:1-19 `"name": "peakqi-vision-architecture"`、`"build": "bash scripts/build-verified.sh"`、`"test": "npm run build && node --test tests/rendered-html.test.mjs"`、`"lint": "bash scripts/sites-env.sh -- eslint . ..."`;其唯一測試 peakqi-vision-architecture/tests/rendered-html.test.mjs:7-13 是對 `../dist/server/index.js` 這個 Cloudflare Worker 打 `worker.fetch()` 驗 `<meta name="codex-preview" content="development">`,和 .dc.html 無關`
  - 對策:盤點/回報時明確排除這兩個目錄,避免誤以為「專案有測試」。
- 驗證還需要「對外網路」:React 18 是 runtime 從 unpkg CDN 抓的,不是本地檔。離線或 CDN 被擋 → 整頁空白(getReact() 直接 throw),這會被誤判成「我剛剛改壞了」。
  - 證據:`support.js:1073-1077 `var REACT_URL = "https://unpkg.com/react@18.3.1/umd/react.production.min.js"`、`REACT_DOM_URL = "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"`;support.js:9-13 `function getReact(){ const R = window.React; if (!R) throw new Error("dc-runtime: window.React is not available yet"); return R; }`;PeakOps.dc.html:1-8 head 內只有 `<script src="./support.js">`,無任何 React script 標籤`
  - 對策:截圖出現整頁空白時,先看 console 有沒有 `window.React is not available yet` 或 unpkg 的 network failure,再判斷是不是自己改壞。
- 專案既有的驗證腳本是 C:/tmp/shot.mjs 與 C:/tmp/shot2.mjs(兩者內容幾乎相同,只差 --user-data-dir:shot.mjs 用 C:/tmp/cdpprof、shot2.mjs 用 C:/tmp/cdpprof2,可並行跑)。它們自己 spawn headless Chrome + CDP,截圖並回傳 DOM 量測 JSON。
  - 證據:`C:/tmp/shot.mjs 第 4 行 `const [,,url,out,wS,hS,pStr,extra]=process.argv;` → 用法為 `node C:/tmp/shot.mjs <url> <out.png> <W> <H> <progress0..1> [extra.js|expr]`;同檔 `const W=+wS||1920,H=+hS||919,P=parseFloat(pStr||'0'); const mobile = W<600;`;啟動參數 `'--headless=new','--remote-debugging-port=9333','--use-gl=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--force-device-scale-factor=1'`;C:/tmp/shot2.mjs 同段唯一差異為 `'--user-data-dir=C:/tmp/cdpprof2'``
  - 對策:標準用法:桌機 `node C:/tmp/shot.mjs http://127.0.0.1:8000/PeakOps.dc.html C:/tmp/po-d.png 1920 919 0.5`;手機 `... 390 844 0.5`(W<600 會自動開 mobile emulation + touch)。第 6 個參數是捲動百分比;第 7 個參數傳 .js 檔路徑會被 readFileSync 塞進頁面 async 函式尾巴當 probe,必須以 `return` 回傳字串。
- shot*.mjs 有兩個會影響判讀的內建時序:固定 sleep 4500ms 才開始動作,捲動後固定 pump 90 個 rAF。對 PeakOps 這種捲動分鏡頁,這是「等動畫收斂」的機制,不要以為截圖是即時的。
  - 證據:`C:/tmp/shot.mjs `await sleep(4500);` 位於 setDeviceMetricsOverride 之後;同檔 evalJS 內 `window.scrollTo(0, Math.round(${P}*(document.body.scrollHeight-window.innerHeight))); await new Promise(r=>setTimeout(r,120)); for(let i=0;i<90;i++) await new Promise(r=>requestAnimationFrame(r));`;預設回傳 `return JSON.stringify({y:Math.round(scrollY),dh:document.body.scrollHeight});``
  - 對策:若 PeakOps 某段動畫收斂需要更久,不要改 shot.mjs(它在 C:/tmp,不屬於 repo);改成在自己的 extra probe .js 裡自行多 pump 幾輪 rAF 再 return。
- C:/tmp 另有現成的 probe 範本可直接抄:probe.js(讀 window.__sdbg 分鏡除錯狀態)、probe2.js(同一捲動位置跑兩輪比對狀態是否可重現)、mem.js(canvas 尺寸/DPR/JS heap/video readyState/大於 200KB 的資源清單)、bhprobe.js(多捲動點量測卡片 bounding box、圖片是否載入、是否溢出視窗)。
  - 證據:`C:/tmp/probe.js `const P = parseFloat(process.env.PP || "0.314"); ... for (let i=0;i<200;i++){ await new Promise(r=>requestAnimationFrame(r)); } return JSON.stringify(window.__sdbg||null);`;C:/tmp/mem.js `const m=performance.memory||{}; return JSON.stringify({canvas:[c.width,c.height], dpr:devicePixelRatio, heapMB:..., vids:vs, res:performance.getEntriesByType('resource').filter(r=>r.transferSize>200000)...})`;C:/tmp/bhprobe.js `overflowX: document.documentElement.scrollWidth > innerWidth ? 'OVERFLOW' : 'ok'`、`fits: cb ? (cb.top >= -1 && cb.bottom <= fr.contentWindow.innerHeight + 1) : null``
  - 對策:「絕不爆版」這個通則可以直接用 bhprobe.js 的 `document.documentElement.scrollWidth > innerWidth` 這一行做成回歸檢查,每次改版桌機+手機各跑一次。
- C:/tmp/*.py(b1-b8、onb.py、mosaic.py、cover.py 等)不是驗證腳本,是「直接改寫 Home.dc.html 的補丁腳本」。誤跑會改到檔案。
  - 證據:`C:/tmp/b8.py:4-6 `p = 'Home.dc.html'` / `s = io.open(p, encoding='utf-8').read()` / `o = s`;C:/tmp/onb.py:4-6 同樣三行;兩者其後皆為大段 CSS 字串準備注入`
  - 對策:盤點驗證手段時把 .py 全部排除;此次任務唯讀,絕不執行它們。
- repo 內唯一的自製驗證器 cases-validator.js 只服務 Cases 頁,且必須加 ?pqdebug=1 才會輸出;PeakOps 不使用它,對本次改版沒有覆蓋。
  - 證據:`cases-validator.js:1 `// 開發期案例素材驗證:published case 缺 cover/gallery/alt/尺寸 → 回報清單`;cases-validator.js `debug = new URLSearchParams(window.location.search).get('pqdebug') === '1'` 且 `if (missing.length && debug)` 才 console.error;`grep -ln "cases-validator" *.dc.html` 只命中 Cases.dc.html`
  - 對策:PeakOps 沒有等價驗證器,只能靠截圖 + probe;不要宣稱有自動化檢查覆蓋。
- 同一問題的連帶面:PeakOps 不在 sitemap.xml,vercel.json 也沒有對應 rewrite,所以目前 PeakOps 只有 /PeakOps.dc.html 這個檔名路徑可達,無乾淨路由。
  - 證據:`sitemap.xml 全文只有 6 個 <loc>:https://peakqi.com/、/solutions、/cases、/pricing、/about、/demo;vercel.json 全文 rewrites 僅 `{"source": "/", "destination": "/Home.dc.html"}`;`grep -rn "PeakOps\|peakops" vercel.json sitemap.xml robots.txt Nav.dc.html` 零命中`
  - 對策:若要讓 PeakOps 被收錄,seo.js key、sitemap.xml 條目、vercel.json rewrite 三者要一起加,且 path 必須一致,否則 canonical 會指到一個 404。
- 【DC 地雷 4】<helmet> 是用正規表示式改寫成 <sc-helmet>,不是真正的標籤解析;`<helmet/>` 或大小寫以外的變形寫法會漏掉。
  - 證據:`support.js:377-378 `html = html.replace(/<helmet(\s|>)/gi, "<sc-helmet$1"); html = html.replace(/<\/helmet\s*>/gi, "</sc-helmet>");`;support.js:494 `if (tag === "sc-helmet") return host.helmet(el);`;PeakOps.dc.html:10 `<helmet>` / :65 `</helmet>` 為正確寫法`
  - 對策:維持 PeakOps.dc.html:10 與 :65 現有的開閉寫法,不要改成自我閉合或加奇怪屬性。
- repo 內確實留有 gstack headless 瀏覽器的既有產出,佐證團隊實際用的就是 headless 截圖流程;但這兩個檔是 log 產物,不是可執行腳本。
  - 證據:``ls -la .gstack/` → browse-console.log (4429 bytes, Jul 21 13:24)、browse-network.log (104212 bytes, Jul 21 13:25);.github/workflows/ 下只有 jekyll-gh-pages.yml 一個 workflow(非本站建置)`
  - 對策:若要沿用 gstack,注意它會寫入 .gstack/ 底下的 log;本次唯讀任務不要觸發。

### 數字與承諾的真實性(PeakOps.dc.html + 其內容資料層 content.js)

- 儀表板面板內的所有數字都是虛構且無標註:轉換 18% ↑、128 本月新客、NT$92K 本月成交、來源 LINE 42% / IG 33% / 官網 25%、進度 60%。
  - 證據:`PeakOps.dc.html:692 「轉換 18% ↑」;694-696 「128 本月新客」「28s 平均回覆」「NT$92K 本月成交」;PeakOps.dc.html:706 「來源 · LINE 42% / IG 33% / 官網 25%」;PeakOps.dc.html:688 「進度 60%」`
  - 對策:同上,只要 #liveops 整區有一句『畫面為產品介面示意,非實際客戶數據』即可涵蓋。
- 報價面板出現具體金額與稅率,可能被當成真實報價:12,000 / 18,600 / 6,000 / 營業稅 5% / NT$ 38,430,另有聊天視窗的『三房約 NT$2,800 起』。頁面其他地方卻一律寫『依需求報價』。
  - 證據:`PeakOps.dc.html:665-668 明細與「營業稅 5%」;PeakOps.dc.html:672 「NT$ 38,430」;PeakOps.dc.html:596 「三房約 NT$2,800 起」;對照 content.js:163-165 `quote: '依需求報價'``
  - 對策:這些是 UI 模擬對話,建議在該面板加『示意』字樣,或把金額改成明顯非真實的樣式(例如 NT$ ##,###)。是否保留具體數字要問使用者。
- 圖片/影片計費只寫『用多少付多少』,沒有任何單價、計價單位(張/秒/次)或級距,無法讓人評估成本。
  - 證據:`content.js:181 「AI 場景渲染、風格模擬、短影音等,用多少、付多少。」;PeakOps.dc.html:1413 usageTips[1] 「實際費率依方案而定,Demo 時可依你的用量情境估算。」`
  - 對策:至少寫出計價單位與級距區間。需使用者提供實際費率。
- 三方案全部只寫『依需求報價』,但頁面 CTA 與比較表卻宣稱『低建置＋月費,用多少算多少』,存在有價格主張卻無任何價格的落差。
  - 證據:`content.js:163-165 三個 plan 皆 `quote: '依需求報價'`(渲染於 PeakOps.dc.html:1020);content.js:158 「低建置＋月費,用多少算多少」;content.js:167 planNote`
  - 對策:『低建置』是相對比較用語,沒有比較基準;若不打算揭露價格,建議刪掉『低』字或改為『建置費與月費分開計算』。
- B 方案掛『最多人選』徽章,屬可查證的事實宣稱(人氣/銷售佔比),頁面上沒有任何依據或期間。
  - 證據:`content.js:164 `featured: true, badge: '最多人選'`;渲染於 PeakOps.dc.html:1015 「最多人選」`
  - 對策:要嘛提供依據(例如『2025 年新簽客戶中佔比最高』),要嘛改成不涉事實的『推薦』。
- 比較表對競品做出未具來源的量化與貶抑陳述:『找工程師完整客製 約三個月起』『單一客服機器人 多半只回答 FAQ』『多需自行摸索』,同時自誇『專人持續協助優化』卻無 SLA 定義(頻率、期間、回應時間)。
  - 證據:`content.js:156-158 compare.cols 三欄 vals;渲染於 PeakOps.dc.html:950-957(桌機)與 961-976(手機)`
  - 對策:競品欄改為中性描述並加『市場一般情況,實際依廠商而異』註腳;『專人持續協助優化』補上服務頻率與範圍。
- 損失試算(100 組/月 → 30 組流失 → 每單 1 萬 → 30 萬/月 → 360 萬/年)有『情境試算』標籤與免責,但關鍵假設『30% 流失率』沒有出處,免責文字還提到讀者看不到的『附件』。
  - 證據:`PeakOps.dc.html:383/392/401/410(四個 data-lossv:100、30、1、30)、PeakOps.dc.html:435-437(360 萬/年 + 『情境試算』膠囊);content.js:40-49 `lossYear.note = '以上為附件中的情境試算,用於呈現漏接與流程中斷可能造成的影響,實際結果依企業詢問量、客單價與轉換率而異。'``
  - 對策:把『附件』改成對外可理解的說法(例如『本頁示範用假設』),並在句中明寫『假設流失率 30%、客單價 1 萬元』把假設攤開。
- 診斷區的動態數字(24 條未讀、12 組未跟進、8 筆重複、6 小時延遲、5 處斷點)由引擎即時算出並顯示成真實計數,不過此區確實有免責 —— 這是全頁唯一有標『非成效數據』的示意區,可作為其他區塊的範本。
  - 證據:`content.js:240-246 `diagMetrics` max 值 24/12/8/6/5;PeakOps.dc.html:1572 `diag: (d?.diagMetrics ?? []).map((m,i)=>({...m, max:[7,12,9,6,5][i] ?? 7}))`(注意:模板覆寫的 max 是 7/12/9/6/5,與 content.js 的 24/12/8/6/5 不一致);渲染文字由 home2-engine.js:98-105 產生;免責在 PeakOps.dc.html:274`
  - 對策:順帶記錄一個資料不一致:PeakOps.dc.html:1572 的 max 陣列覆寫了 content.js:240-246 的 max,兩處數字對不上(24 vs 7、8 vs 9)。要改的話只需擇一為準,不要兩邊都留。
- 客製實績點名了政府客戶並宣稱交付狀態:『嘉義市世博會官網』『市府級大型活動官網也有執行經驗』『如期交付上線』,屬第三方可查證且涉及客戶名譽的陳述。
  - 證據:`content.js:177 customCred(渲染於 PeakOps.dc.html:1063);content.js:138 「嘉義市世博會官網 / 市府級大型活動網站,如期交付上線」`
  - 對策:確認是否為直接承包或分包、是否取得對方露出同意。未確認前不要新增任何政府客戶名稱。
- 「三個理由,讓你幾乎零風險」使用絕對化框架(僅靠『幾乎』兩字緩和),而支撐它的三項理由本身條款不完整(見前述綁約/退費)。
  - 證據:`PeakOps.dc.html:1141 「三個理由,讓你幾乎零風險」;PeakOps.dc.html:1138 `LOW RISK`;content.js:194-198 risk 三項`
  - 對策:在合約條款釐清前,建議改成『三個機制,降低你的導入風險』。
- 任務指定要盤點的「86」與「9」兩個數字,在本頁與 content.js 中都找不到對應的宣稱。86 僅出現在 CSS 尺寸(86vw)與座標,9 僅出現在樣式數值。
  - 證據:`PeakOps.dc.html:107 `width:min(370px,86vw)`(唯一的 86);PeakOps.dc.html:424 `cx="1186"`;grep『86 / 9 年 / v: '9』於 *.js *.dc.html 均無相符的宣稱字串`
  - 對策:若使用者記得的是其他頁面(例如 About/Cases)的數字,需要指出頁面名稱再盤。本頁確定沒有。
- 「免費」一詞在本頁與 content.js 完全找不到;絕對化用語集中在:零風險(幾乎)、不限量、不綁約、不外流、不會硬答、不再漏單、全額退。
  - 證據:`grep『免費』於 PeakOps.dc.html 與 content.js 無結果;絕對用語行號:PeakOps.dc.html:1141(幾乎零風險)、148/1189(全額退・不綁約)、1428 與 content.js:180(不限量)、content.js:202(不外流)、content.js:203(不會硬答)、content.js:59(不再漏單)`
  - 對策:以上七處建議一起處理,避免只改一處造成同頁不一致。
- Demo 承諾『15 分鐘』出現三次,屬時間承諾但無排除條件(逾時、需求複雜時);另 CTA 電話與信箱為真實聯絡方式,須確認仍有效。
  - 證據:`PeakOps.dc.html:145 「預約 15 分鐘場景 Demo」;PeakOps.dc.html:1165 「15 分鐘 Demo 裡直接用你的場景回答」;PeakOps.dc.html:1191 同;content.js:195 「15 分鐘 Demo」;PeakOps.dc.html:1192 `tel:0266093699`、1195 `mailto:jacky@peakqi.com`(來源 content.js:2-8)`
  - 對策:『15 分鐘』可改為『約 15 分鐘』。電話/信箱有效性請使用者確認。

### 動畫保護範圍盤點(PeakOps.dc.html + 6 支引擎的 DOM 契約)

- componentDidMount 共動態 import 9 個模組,其中「動畫類」為 6 支:motion-kit.js + motion/home.motion.js(成對)、home2-engine.js、gl-engine.js、interactions-engine.js、sections-engine.js、hero-engine.js + sequence/manifest.js(成對)。非動畫的另 3 支為 content.js / seo.js / analytics.js。
  - 證據:`PeakOps.dc.html:1259 import('./content.js');:1270 import('./seo.js');:1271 Promise.all([import('./motion-kit.js'), import('./motion/home.motion.js')]);:1274 import('./analytics.js');:1294 import('./home2-engine.js');:1301 import('./gl-engine.js');:1308 import('./interactions-engine.js');:1315 import('./sections-engine.js');:1322 Promise.all([import('./hero-engine.js'), import('./sequence/manifest.js')])`
  - 對策:要停用某一段動畫,改這 9 個 import 的其中一行即可,不要去改引擎內部。componentWillUnmount(1330-1340)已成對呼叫 destroy(),新增引擎時要同步補。
- hero-engine 使用 Canvas 2D(非 WebGL、非 three.js),並有 scroll progress 映射 + pinned 邏輯 + 降級 applyStatic()。sequence/manifest.js 目前 enabled:false,影格序列整條路徑是死的。
  - 證據:`hero-engine.js:716 ctx = canvas.getContext('2d');:628 p = clamp(-r0.top / …);:657 applyStatic();:55 if (!manifest || !manifest.enabled) return;sequence/manifest.js:6 enabled: false`
  - 對策:sequence/ 資料夾目前無素材,manifest 是預留開關。不要為了「清乾淨」把 sequence/manifest.js 或 import 拿掉——hero-engine 的 createHeroEngine({refs, manifest}) 簽名要它。
- 死碼確認:home2-engine 的 wall() 針對 #resultwall / [data-wgrid] / [data-wmeta],這三者在 PeakOps.dc.html 完全不存在,該函式在本頁永遠 early-return。
  - 證據:`home2-engine.js:207-210 q('#resultwall [data-wrap]') / [data-wgrid] / [data-wmeta];:209 if (!wrap || !stage || !grid) return;PeakOps.dc.html 內 grep 'resultwall'=0、'data-wgrid'=0、'data-wmeta'=0;但 PeakOps.dc.html:882 仍留著 data-divider="aperture" 標籤文字 'RESULT WALL — 做出來的東西'`
  - 對策:這是本頁唯一「有引擎、沒 DOM」的段落。若之後要加 Result Wall,照 home2-engine.js:206-224 的契約補 #resultwall > [data-wrap] > [data-stage] + [data-wgrid] + [data-wmeta] 即可,不用改引擎。反之若確定不做,882 行那個 aperture divider 的文案與實際內容(#portfolio 精選作品)語意對不上。
- gl-engine 有全域能力閘門:reduced-motion、saveData、deviceMemory<4、或視窗寬度 <900 就整個不啟動;webglcontextlost 會 kill 並 display:none。所有 WebGL 效果都是純裝飾,關掉不影響敘事。
  - 證據:`gl-engine.js:260-263 if (reduced || save || lowMem || (window.innerWidth||0) < 900) { disabled = true; return; };:254-257 function kill(){ disabled=true; canvas.style.display='none'; } // fallback:底層 Canvas2D/DOM 敘事完整保留`
  - 對策:改版時不需要為 gl-engine 保留任何視覺;但上面列的 4 個選擇器仍要保留,否則不是降級而是「桌機看得到別人看不到的破圖差異」。
- motion-kit 有 3 個掃描器在本頁完全沒有對應元素:[data-maskreveal]、[data-dataline]、[data-parallax] 皆為 0 個,PageIntroSequence 也因 flags.pageIntro=false + 無 [data-intro] 而不執行。
  - 證據:`motion-kit.js:281-283 querySelectorAll('[data-maskreveal]'/'[data-dataline]'/'[data-parallax]');:122 const root = document.querySelector('[data-intro]'); if (!root) return;PeakOps.dc.html grep:data-maskreveal=0、data-dataline=0、data-parallax=0、data-intro=0;motion/home.motion.js:14-15 intro: null, flags.pageIntro:false`
  - 對策:這是既有的、可用但未用的 API。要幫新區塊加進場動畫,優先在 HTML 加這三個屬性(零 JS 改動),不要再寫新引擎。
- canvas/WebGL/scroll-progress/pinned 四項能力矩陣:hero-engine = Canvas2D + progress + pinned;gl-engine = WebGL + progress(讀別人的)+ 無自有 pin;home2-engine = 無 canvas + progress + pinned(4 段);sections-engine = 無 canvas + progress + pinned(#flow 一段,#loss/#pain 為 traverse 非 pin);interactions-engine = 無 canvas + progress + sticky(僅展廊);motion-kit = 無 canvas + progress + 提供 pin 元件。
  - 證據:`hero-engine.js:716 getContext('2d') / :628 pinned progress;gl-engine.js:270 getContext('webgl') / :130-133 讀 flowWrap 的 pin 進度但自身 canvas 為 fixed;home2-engine.js:14-17 pin() → StickyProductStage / :40,77,169,190 ScrollChapter(…,{pinned:true});sections-engine.js:259-262 pinP()/traverseP() 與 :266-267 loss.pinned=false、flow.pinned=true;interactions-engine.js:118-119 stage.style.position='sticky';motion-kit.js:104-118 StickyProductStage / :84-101 ScrollChapter`
  - 對策:全站沒有任何 three.js / R3F。整頁 pin 總量:hero 360vh + flow 265vh + handoff 45 + diagnostic 100 + liveops 180 + relay 120(distanceVh),改任何一段的高度都會改變其餘章節在 #pq-rail 上的相對位置。
- 確認本專案無 package.json、無 node_modules、無任何 build/lint/test 指令,所有 .js 都是瀏覽器原生 ESM 動態 import。
  - 證據:`專案根目錄 ls package.json → 'NO package.json';根目錄 .js 皆為原生模組,PeakOps.dc.html:6 <script src="./support.js"> 為唯一的傳統 script`
  - 對策:驗證只能靠實際開瀏覽器 + 上面那些 window.__pq*.state() 把手,不要回報任何 npm 指令。

### 文案來源與 CTA(PeakOps.dc.html 唯讀盤點)

- 專案確實沒有 package.json,不存在 lint/typecheck/test/build 指令(已實測確認,非臆測)
  - 證據:``ls package.json` 於 C:/Users/User/Documents/GitHub/peakqi-website 無輸出;同目錄僅有 content.js(290 行)與 PeakOps.dc.html(1597 行)`
  - 對策:回報建置狀態時直接寫「無 build step,瀏覽器端 ES module 直載」,不要寫 npm 指令
- 文案是「混合來源」:content.js 只供應資料型清單(24 個 renderVals key),所有標題、eyebrow、導言、CTA 文字、hero 五幕文案全部 hardcode 在 .dc.html
  - 證據:`PeakOps.dc.html:1258-1261 `componentDidMount() { import('./content.js').then(m => { this.setState({ d: m }); ...` 整包 module 存進 state.d;PeakOps.dc.html:1555-1590 renderVals 逐一取用 d?.stats / d?.painPoints / d?.painClose / d?.lossYear.note / d?.features / d?.baseSupport / d?.caseStudies / d?.caseNote / d?.worksFeatured / d?.diagMetrics / d?.relayStations / d?.plans / d?.planNote / d?.customRanges / d?.customNote / d?.customCred / d?.usageNote / d?.timelineNote / d?.risk / d?.faq;另 d?.compare(compareRows/compareCards)、d?.planModules(:1474)、d?.usage、d?.timeline 在 renderVals 上段組裝`
- 損失情境的數字(100 / 30 / 1 / 30萬 / 360萬)完全硬寫在 HTML,與 content.js lossSteps、lossYear.v 各存一份 → 改一邊不會同步
  - 證據:`PeakOps.dc.html:383 `<span data-lossv data-t="100">100</span>`、:392 data-t="30"、:401 data-t="1"、:410 data-t="30" + :411 「萬/月」、:435 data-t="360" + :436「萬/年」;content.js:41-45 lossSteps 同樣的 100/30/1/30,content.js:47 lossYear.v='360'`
  - 對策:改數字時必須同時改兩處;若要收斂成單一來源,data-t 也得一起由 binding 產生(引擎靠 data-t 做 count-up)
- 聯絡資訊硬寫在頁面,沒用 content.js 的 contact export
  - 證據:`PeakOps.dc.html:1192 `href="tel:0266093699"` 文字 `(02) 6609-3699`、:1195 `href="mailto:jacky@peakqi.com"`;content.js:2-7 export const contact = { email:'jacky@peakqi.com', phone:'0266093699', phoneDisplay:'(02) 6609-3699', ... } 未被 PeakOps 引用(grep contact 在 PeakOps.dc.html 零命中)`
  - 對策:目前值一致沒錯,但屬雙軌;換電話時要記得改 .dc.html
- content.js 定義了 caseCta 與 humanCompare,PeakOps 都沒用,對應區塊改為硬寫,文字還跟 export 不一致
  - 證據:`content.js:112 `export const caseCta = '討論相似導入情境';` 但 PeakOps.dc.html:870 硬寫 `把這個流程套用到我的公司 →`;content.js:168 humanCompare 物件 vs PeakOps.dc.html:1040-1048 硬寫「請一位真人助理 / 月薪＋招募與管理成本 / VS / 這套系統 / 一次導入,持續運作 / 還幫你 24 小時顧前線。」`
- CTA 清單(PeakOps.dc.html 本體,共 18 個不重複字串;不含 Nav/Footer)
  - 證據:`L145 hero「預約 15 分鐘場景 Demo」→Demo.dc.html;L146 hero「查看實際案例」→Cases.dc.html;L302 #pain「看 AI 怎麼分擔這些事」→Solutions.dc.html;L471 #flow/接客「看接客細節 →」→Solutions.dc.html#capture;L491 #flow/追客「看追客細節 →」→#follow;L515 #flow/養客「看養客細節 →」→#marketing;L544 #flow「用我的場景跑一遍 →」→Demo.dc.html;L798 #features(orbit)「看功能怎麼搭配 →」;L827 #features(orbitrow)「看功能怎麼搭配 →」(同字串重複);L870 #cases「把這個流程套用到我的公司 →」→Demo.dc.html?case={slug}(:1566);L877 #cases「看完整案例與更多實績 →」→Cases.dc.html;L901 #portfolio「瀏覽全部 30+ 實績 →」→Cases.dc.html#portfolio;L1397 renderVals `linkLabel: w.url ? '造訪網站 ↗' : '查看案例 →'`(渲染於 L910 卡片);L1021 #pricing 卡內「預約諮詢 →」;L1034 #pricing 卡底「用我的場景試一次 →」;L1166 #faq「預約 Demo →」;L1191 #demo-cta「預約 15 分鐘場景 Demo」;L1192 #demo-cta「(02) 6609-3699」;L1195 #demo-cta「jacky@peakqi.com」。非 CTA 的控制項:L66 skip link「跳到主要內容」、L779 模組 chip、L898/899 藝廊箭頭、L995 方案 tab、L1086 計費說明 i 鈕`
- 加上 Nav/Footer 兩個 dc-import,整頁實際渲染的 CTA 不重複字串共 20 種
  - 證據:`PeakOps.dc.html:67 `<dc-import name="Nav" active="product" sticky="{{ stickyVal }}" cta-threshold="0.35">`、:1249 `<dc-import name="Footer">`;Nav.dc.html:45 桌機列「預約 AI 導入評估」、Nav.dc.html:82 手機選單「預約 15 分鐘場景 Demo」、Nav.dc.html:226 sticky ctaLabel「用我的場景看 Demo」;Footer.dc.html:31「預約 Demo」、Footer.dc.html:47「預約 AI 導入評估 →」`
- analytics 埋點只涵蓋部分 CTA;#flow、#portfolio、#features 的所有 CTA 完全沒有事件
  - 證據:`PeakOps.dc.html:1284-1289 只 wire 了 `#hero a[href="Demo.dc.html"]`、`#hero a[href="Cases.dc.html"]`、`#cases a[href^="Demo.dc.html?case="]`、`#pricing a[href="Demo.dc.html"]`、`#demo-cta a[href="Demo.dc.html"]`、`a[href^="tel:"],a[href^="mailto:"]`;L544(#flow 用我的場景跑一遍)、L877/L901(案例/作品導流)、L798/L827(功能導流)、L302(痛點導流)皆不在名單內`
  - 對策:補 wire,或直接改用 `[data-cta]` 全域委派(部分 CTA 已有 data-cta,但 L302/471/491/515/798/827/870/877/901/1166 沒有)
- 埋點是 setTimeout 900ms 後才 querySelectorAll 綁定,期間點擊不會被記錄
  - 證據:`PeakOps.dc.html:1282 `setTimeout(() => { wire(...) }, 900);``
- 右下角固定 CTA 不在本頁,由 Nav.dc.html 提供;本頁文字是「用我的場景看 Demo」+ 徽章「15 MIN」,連 Demo.dc.html
  - 證據:`Nav.dc.html:90-99 `<sc-if value="{{ showSticky }}">` → `position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:150` 內含 `{{ ctaLabel }}` 與 `{{ ctaBadgeText }}`;Nav.dc.html:226 `ctaLabel: active === 'home' ? '預約 AI 導入評估' : '用我的場景看 Demo'`,PeakOps.dc.html:67 傳 active="product" → 走後者;Nav.dc.html:227-228 ctaBadge=active!=='home' → 顯示 ctaBadgeText '15 MIN'`
- 右下角 CTA 觸發條件:四個條件全 true 才出現;捲動達全頁 35% 後永久顯示,只能靠 ✕ 關(sessionStorage),不會再自動隱藏
  - 證據:`Nav.dc.html:222 `showSticky: (this.props.sticky ?? true) && active !== 'demo' && !this.state.dismissed && this.state.ctaOk`;PeakOps.dc.html:67 `cta-threshold="0.35"`,PeakOps.dc.html:1554 `stickyVal: this.props.stickyCta ?? true`(prop 預設 true,見 :1255 data-props);Nav.dc.html:124-131 scroll handler `ratio = scrollTop / (scrollHeight - innerHeight)`,`if (ratio >= thr && !ctaOk) { setState({ctaOk:true}); this._evt('sticky_demo_view'); window.removeEventListener('scroll', ...) }` → 一次性、不可逆;Nav.dc.html:112-113 `sessionStorage.getItem('pqCtaDismissed')==='1'` 直接 return;Nav.dc.html:231-236 ctaDismiss 寫入 sessionStorage + track('cta_dismiss')`
- Nav sticky 的 ctaHref 三元運算兩邊完全相同,是無效程式碼
  - 證據:`Nav.dc.html:225 `ctaHref: active === 'home' ? 'Demo.dc.html' : 'Demo.dc.html',`(上方 :223-224 兩行註解甚至互相矛盾:一行說首頁 pill 改為『探索旗下產品』,下一行說改為『預約 AI 導入評估』)`
  - 對策:刪掉三元或補上真正的首頁分支 URL;順手清掉過期註解
- 【誤解風險 #2】hero 結尾「一套系統完成接客、追客與養客」= all-in-one 敘事,強化「取代既有系統」聯想
  - 證據:`PeakOps.dc.html:143 `專為台灣中小企業打造,<br>一套系統完成接客、追客與養客,<br>最快 10 個工作天上線。``
  - 對策:加一句相容性說明(可與現有 LINE/CRM/Excel 並行)
- 【誤解風險 #5】Live Ops 示意面板連續出現「AI 自動接手」「自動跟進」「自動算稅」「PEAKQI 自動整合」,四處無人介入語境
  - 證據:`PeakOps.dc.html:197 `PEAKQI 自動整合`;:590 `AI 自動接手`;:620 `陳先生 → 自動跟進`;:663 `自動算稅``
  - 對策:至少在 :590 改成「AI 先接手」;:620 改「自動排入跟進」——加時間/範圍限定詞就能大幅降低『全自動』誤讀
- 【誤解風險 #6】比較表把 PeakQi 定位成第三種「解決方式」與現有工具二選一,而非疊加
  - 證據:`content.js:157 `{ name: 'PeakQi 整合營運系統', vals: ['最快 10 個工作天上線', '接客＋管理＋行銷＋報價,一套整合', ...], hot: true }`,渲染於 PeakOps.dc.html:936 `<section id="compare" data-screen-label="三種解決方式比較">`(:950 compareRows / :961 compareCards)`
- 關鍵字「取代」「換掉」「全自動」「零人工」「不需要人」在 PeakOps.dc.html 與 content.js 中一次都沒出現 —— 找不到,不是漏看
  - 證據:``grep -n "取代\|換掉\|完全自動\|不需要人\|零人工" PeakOps.dc.html content.js` 零輸出。命中的只有「不用再開」(PeakOps.dc.html:81)一處`
- 頁面已有四處『AI 交棒真人』的緩解文案,可作為改寫上述風險條目時的既有語氣基準
  - 證據:`PeakOps.dc.html:474「AI 先回應、理解需求、協助安排時段,必要時馬上轉真人。」;:481 chip「真人接手」;:135 hero 客戶卡片「真人接手 / 已標記 ✓」;:606「重要 → 轉真人」;content.js:59「判斷不了就轉真人」`

### 字級與閱讀層級(Typography scale & reading hierarchy)— PeakOps.dc.html 唯讀盤點

- 根字級 = 16px(html/body 皆未設 font-size,全檔 8 個 @media 也沒有任何一個改 font-size),所以 rem→px 換算為 1rem=16px,且『手機沒有任何字級降版/升版』——所有固定 px 值在 390px 與 1920px 下完全相同。
  - 證據:`PeakOps.dc.html:20 `html{scroll-behavior:smooth}`;PeakOps.dc.html:21 `body{margin:0;background:#F2EFE8;color:#090B0E;font-family:'Noto Sans TC',sans-serif;-webkit-font-smoothing:antialiased}`(無 font-size);@media 僅在 52,53,55,56,59,60,61,62 行,內容全是 display/grid/order/animation,無 font-size`
  - 對策:若要做手機閱讀性修正,目前沒有既有的 @media 斷點可掛字級,需新增(既有斷點是 899px/900px)。
- HERO 客戶卡片模擬 UI 全區字級 10.5-13px,是全頁最密集的過小字群。卡片欄位標籤 10.5px ×6、值 13px ×6、卡片註解 11.5px,顏色多為 rgba(242,239,232,.45)。這是裝飾性 mock,但視覺上仍是可讀文字。
  - 證據:`PeakOps.dc.html:115,119,123,127,131,135 `font:400 10.5px ... color:rgba(242,239,232,.45)`;:110,116,120,124,128,132,136 `font:700 13px`;:139 `font:400 11.5px ... rgba(242,239,232,.45)``
  - 對策:若定調為 aria-hidden 的裝飾插圖可豁免;若視為內容則需 ≥14px + alpha ≥ .7。需先問定位(見 openQuestions)。
- HERO-STATS 數字帶:數字 clamp(1.7rem,2.8vw,2.4rem)=27.2/27.2/35.8/38.4/38.4px;標籤固定 13px 且 rgba(242,239,232,.55)。標籤 13px < 14px 基準(桌面手機同時違規)。
  - 證據:`PeakOps.dc.html:163 `font:700 clamp(1.7rem,2.8vw,2.4rem) 'Space Grotesk'`;PeakOps.dc.html:164 `font:400 13px 'Noto Sans TC',sans-serif;color:rgba(242,239,232,.55)``
  - 對策:標籤 13px→14.5px。
- DIAGNOSTIC 其餘:亂散工具卡內文固定 13px(桌面<17、手機<16 違規)×4、卡片標籤 10.5px ×5、診斷面板註記 11.5px 且 alpha .4、收尾大字 clamp(1.3rem,2.6vw,2rem)=20.8/20.8/32/32/32px。
  - 證據:`PeakOps.dc.html:237,241,245,253 `font:500 13px/1.6`;:236,240,244,252 `font:600 10.5px`;:249 `font:700 13px/1.5`;:274 `font:400 11.5px/1.6 ... color:rgba(242,239,232,.4)`;:277 `font:900 clamp(1.3rem,2.6vw,2rem)/1.55``
  - 對策:第274行的 11.5px + alpha .4 是全頁最難讀組合之一(對比約 3.1:1),建議 13px + alpha .6。
- PRICING 有兩個定義但完全沒被 markup 使用的字級樣式(dead style):setupStyle 帶著 clamp(2rem,3vw,2.6rem)(=32/32/38.4/41.6/41.6px)、currencyStyle 帶 600 14px,但第1010-1035行的方案卡模板只用了 codeStyle / nameStyle / smallLabelStyle / baseStyle / itemStyle / btnStyle / cardStyle。
  - 證據:`PeakOps.dc.html:1369 `currencyStyle: { font: "600 14px 'Space Grotesk',sans-serif", ... }`;PeakOps.dc.html:1370 `setupStyle: { font: "700 clamp(2rem,3vw,2.6rem)/1 'Space Grotesk',sans-serif" }`;模板 PeakOps.dc.html:1010-1035 只出現 p.codeStyle / p.nameStyle / p.smallLabelStyle / p.quote / p.baseStyle / p.itemStyle / p.btnStyle`
  - 對策:確認過去是否曾有「NT$ + 大數字」報價版型被改成 {{ p.quote }} 純文字。若確定廢棄可刪,但先確認沒有其他 .dc.html 共用同一段 script。
- RISK:h2 主樣板達標;卡片 h3 900 21px(桌面 21<22 違規、手機 21 ✓,只差 1px);卡片內文 15px、副說明 15px(桌面<17、手機<16 皆違規)。
  - 證據:`PeakOps.dc.html:1141 h2;:1142 `font:500 15px ... rgba(9,11,14,.6)`;:1147 `font:700 12px 'Space Grotesk'`(編號);:1148 `<h3 style="margin:0;font:900 21px 'Noto Sans TC',sans-serif">{{ r.t }}</h3>`;:1149 `font:400 15px/1.8 ... rgba(9,11,14,.68)``
  - 對策:h3 21px→22px(1px 之差)、內文 15px→17px。
- 跨區重複的 eyebrow / 編號模式全數違反輔助文字 14px 基準:section eyebrow `font:600 12px 'Space Grotesk'` 出現 17 次、section 編號 `font:700 13px 'Space Grotesk'` 出現 12 次。這兩個是頁面骨架的固定元件,是最容易一次修好的項目。
  - 證據:`eyebrow 12px 於 PeakOps.dc.html:177,227,289,376,455,567,732,761,837,892,941,986,1074,1112,1138,1162,1187;編號 13px 於 PeakOps.dc.html:287,374,453,759,835,890,939,984,1072,1110,1136,1160`
  - 對策:兩個模式同步提到 14px(letter-spacing .3em 可略降到 .24em 避免爆版)。因為是 29 處同字串,可用單一 replace_all 完成。

### responsive-與-breakpoint(PeakOps.dc.html 唯讀盤點)

- 全頁只有 8 條 @media,其中「佈局類」斷點只有一個:899/900px。沒有平板中段斷點(768/1024),也沒有小手機(≤380px)斷點。清單:52 行 reduced-motion 關 #relay 站點動畫;53 行 reduced-motion 用 [style*="pqXxx"] 屬性選擇器關掉所有 inline keyframe;55 行 max-width:899px(唯一大量改佈局的一條);56 行 min-width:900px 隱藏 #pq-cmp-mob;59 行 reduced-motion 關 body 進場;60 行 max-width:899px 隱藏 #pq-orbit;61 行 min-width:900px 隱藏 #pq-orbitrow;62 行 max-width:899px 隱藏 #demo-cta [data-echo]。
  - 證據:`PeakOps.dc.html:52-62,例如 55 行:`@media (max-width:899px){#pq-live-grid{grid-template-columns:1fr!important}#pq-live-console{order:1;min-height:440px!important}#pq-live-items{order:2;display:grid!important;grid-template-columns:1fr 1fr!important;...}#pq-cmp-desk{display:none!important}#pq-tl{flex-direction:column!important;min-width:0!important}#pq-tl>[data-tstep]{border-top:none!important;border-left:2px solid rgba(242,239,232,.18);padding:0 0 30px 24px!important}...}``
- 斷點值不一致:頁面 CSS 與所有 JS 引擎用 900,但 Nav 元件用 959/960。960~900 之間的視窗會出現「漢堡選單已出現、但頁面內容仍是桌面雙欄」的中間態。
  - 證據:`PeakOps.dc.html:55 `@media (max-width:899px)`;Nav.dc.html:13 `@media (max-width:959px){#pq-links{display:none!important}#pq-burger{display:flex!important}}`;motion-config.js:16 `export const BP = { mobile: 900, wide: 1200 };`;sections-engine.js:317 `mobile = (window.innerWidth || 1200) < 900;``
  - 對策:把 Nav 的 959 對齊到 899,或把三處(CSS / motion-config BP.mobile / Nav)抽成同一個常數來源;不要只改其中一邊。
- 唯一真正只靠 :hover 的效果是 CTA 箭頭位移,且它是純裝飾、不影響可用性;其餘 pointer 類效果(tilt、cursor follower、CTA spotlight、orbit 核心視差)都已正確 gate 在 pointer:fine + hover:hover,手機不會綁定。按壓回饋用的是 pointerdown/up,觸控可用。
  - 證據:`micro-engine.js:26 `'[data-cta]:hover [data-arrow]{transform:translateX(6px)}'`;micro-engine.js:3 `const fine = !!(window.matchMedia && window.matchMedia('(pointer:fine)').matches && window.matchMedia('(hover:hover)').matches);`;micro-engine.js:44 `function tiltWire() { if (!fine || reduced) return;`;micro-engine.js:74 `function cursorWire() { if (!fine || reduced || save || lowMem) return;`;micro-engine.js:113 `function spotWire() { if (!fine || reduced) return;`;micro-engine.js:49-50 `on(document, 'pointerdown', down...)`;sections-engine.js:242 `if (mobile) return;`(orbit move)`
- 多個純文字 CTA 連結完全沒有垂直 padding,inline-flex 高度約 18-22px,遠低於 44px,在手機上是主要的轉換路徑之一。
  - 證據:`PeakOps.dc.html:798 `<a href="Solutions.dc.html" style="font:700 14.5px 'Noto Sans TC',sans-serif;text-decoration:none">看功能怎麼搭配 →</a>`;同型態於 827、870 `把這個流程套用到我的公司 →`、877、901 `瀏覽全部 30+ 實績 →`、1021 `預約諮詢`、1166 `預約 Demo →`、302、544`
  - 對策:統一給這類文字 CTA `display:inline-flex;padding:11px 0;` 或 `min-height:44px;align-items:center`,不改字級與顏色。
- 本頁自己只有兩個 position:fixed(skip link、grain 遮罩),沒有右下角固定 CTA。右下角固定 CTA 來自 <dc-import name="Nav">,實作在 Nav.dc.html:91。
  - 證據:`PeakOps.dc.html:18 `#pq-skip{position:fixed;left:12px;top:-60px;z-index:600;...}`;PeakOps.dc.html:1252 `position:fixed;inset:0;z-index:500;pointer-events:none;opacity:.05;...`;PeakOps.dc.html:67 `<dc-import name="Nav" active="product" sticky="{{ stickyVal }}" cta-threshold="0.35" ...>``
- 右下角固定 CTA 逐項體檢:z-index=150;bottom=calc(18px + env(safe-area-inset-bottom, 0px)) → 有用 safe-area(通過);right=18px 沒有 env(safe-area-inset-right),橫向持握有瀏海的機型會被切;<a> 本身沒有 aria-label,但有可見文字 {{ ctaLabel }},所以無障礙名稱是有的(不是缺陷);關閉鈕有 aria-label="關閉浮動 Demo 按鈕";focus 樣式來自兩條全域規則(PeakOps helmet 與 micro-engine 注入),Nav.dc.html 自己沒有寫。
  - 證據:`Nav.dc.html:91 `<div style="position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom, 0px));z-index:150;display:flex;align-items:center">`;Nav.dc.html:92 `<a href="{{ ctaHref }}" onClick="{{ ctaClick }}" data-cta style="...padding:13px 18px;border-radius:999px;...">`;Nav.dc.html:96 `<button onClick="{{ ctaDismiss }}" aria-label="關閉浮動 Demo 按鈕" ...>`;PeakOps.dc.html:54 `summary:focus-visible,button:focus-visible,a:focus-visible{outline:2px solid #FF6B2C;outline-offset:2px}`;micro-engine.js:23 `'a:focus-visible,button:focus-visible,summary:focus-visible,[role="tab"]:focus-visible{outline:2px solid #FF6B2C;outline-offset:2px}'``
  - 對策:right 改成 calc(18px + env(safe-area-inset-right, 0px));focus 樣式建議在 Nav.dc.html 內補一份,不要只依賴 PeakOps 的 helmet(其他頁若沒有那段就裸奔)。
- 另有一個 JS 動態產生的 position:fixed 章節導軌:桌機在右側 right:14px / z-index:90,手機改成頂部 3px 進度條 / z-index:400。分支正確,但 isMobile 同樣是載入時算一次,旋轉不會切換。
  - 證據:`motion-kit.js:216 `nav.style.cssText = 'position:fixed;left:0;right:0;top:0;height:3px;z-index:400;pointer-events:none;...'`;motion-kit.js:228 `nav.style.cssText = 'position:fixed;right:14px;top:50%;transform:translateY(-50%);z-index:90;...'`;motion-kit.js:209 `const isMobile = ctx.mobile;``
  - 對策:與上面 mobile 旗標問題一起修;右側導軌 z-index:90 低於 Nav 浮動 CTA 的 150,層級目前不衝突,不要動 z-index。
- 三個橫向排列區塊全部都有處理,不會造成頁面級水平捲動:比較表(min-width:760px)在 <900px 直接 display:none 換成卡片版;橫向時間軸(min-width:820px)在 <900px 轉成直式並把 min-width 歸零;精選作品展廊本來就是刻意的容器內橫捲(overflow-x:auto + scroll-snap),且 JS 已針對手機保留原生捲動。
  - 證據:`PeakOps.dc.html:944-945 `<div id="pq-cmp-desk" style="...overflow-x:auto">` + `<div style="min-width:760px;display:grid;grid-template-columns:120px 1fr 1fr 1.15fr;...">`,由 55 行 `#pq-cmp-desk{display:none!important}` 關閉;PeakOps.dc.html:1118-1119 `<div style="...overflow-x:auto;padding-bottom:8px">` + `<div id="pq-tl" style="display:flex;min-width:820px;position:relative">`,由 55 行 `#pq-tl{flex-direction:column!important;min-width:0!important}` 覆蓋;PeakOps.dc.html:907-910 展廊 scroller + 卡片 `min-width:300px;max-width:300px`;interactions-engine.js:93 `if (reduced || mobile) return; // 原生橫向 snap(模板預設)`;interactions-engine.js:178 `const vertical = getComputedStyle(tl.cont).flexDirection === 'column';`(時間軸進度條會跟著轉軸)`
- 手機被壓扁但沒有 media query 覆蓋的橫向三欄:Live Ops 控制台內部的 CRM 看板、專案看板(各 3 個 flex:1 欄)與兩處 1fr 1fr 1fr 統計列。360px 視窗下控制台內容寬約 288px,扣 gap 後每欄僅約 89px,中文標籤(「平均回覆速度」「本週轉換率」「NT$92K」)會斷成多行或擠壓。55 行的 media query 只處理了 #pq-live-grid / #pq-live-console / #pq-live-items 的外層,沒有碰面板內部。
  - 證據:`PeakOps.dc.html:616 `<div style="position:relative;flex:1;display:flex;gap:10px">` 底下 617/618/619 三個 `flex:1`;PeakOps.dc.html:682-685 同結構;PeakOps.dc.html:579 `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:...">`;PeakOps.dc.html:693 `<div style="display:grid;grid-template-columns:1fr 1fr;1fr;gap:10px">`(原文為 `1fr 1fr 1fr`);PeakOps.dc.html:1217 `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:...">``
  - 對策:在既有的 `@media (max-width:899px)` 區塊內追加(不要新開斷點):把 #pq-live-console 內的看板改 `grid-template-columns:1fr 1fr` 或允許橫捲;統計列的說明文字縮到 9.5px 或改 2 欄。1217 那組在 #demo-cta 內,<900px 時容器已是單欄全寬,壓力較小,可排最後。
- 其餘所有雙欄/多欄 grid 都用了 `repeat(auto-fit,minmax(min(100%,Npx),1fr))`,靠 min(100%,…) 自動在窄寬度塌成單欄,不需要 media query。唯二用固定 minmax 下限的是已被隱藏的 #pq-orbit,以及兩個 auto-fit 但下限沒包 min(100%) 的格線(180px / 170px / 150px),後者在 320px 以上仍安全。
  - 證據:`PeakOps.dc.html:767 `<div id="pq-orbit" ... grid-template-columns:minmax(420px,1.15fr) minmax(320px,.85fr);...">`(由 60 行隱藏,801 行 #pq-orbitrow 為手機版);PeakOps.dc.html:160 `grid-template-columns:repeat(auto-fit,minmax(180px,1fr))`;PeakOps.dc.html:200 `minmax(170px,1fr)`;PeakOps.dc.html:1055 `minmax(150px,1fr)`;對照 232/284/432/473/493/517/741/842/1008/1069/1144/1157/1185 皆為 `minmax(min(100%,Npx),1fr)``
- overflow-x 風險整體低:全頁 0 個 100vw、0 個負 margin;所有負位移(-6/-19/-26/-30px 等)都在有 overflow:hidden 的祖先內被裁掉。但沒有 html/body 的 overflow-x:hidden 保險,任何未來新增的溢出都會直接變成整頁橫捲。
  - 證據:``grep -c '100vw' PeakOps.dc.html` = 0;`grep -c 'overflow-x:hidden' PeakOps.dc.html` = 0;負位移清單 PeakOps.dc.html:234(left:-6px;right:-6px)、709(right:-19px)、1200(left:-26px;top:-30px)、1204(right:-20px)、1208(left:-18px;bottom:-18px);裁切來源 PeakOps.dc.html:573 `#pq-live-console ... overflow:hidden`、1182 `<section id="demo-cta" ... overflow:hidden ...>`;另 62 行 `@media (max-width:899px){#demo-cta [data-echo]{display:none!important}}``
  - 對策:若要加保險,只加 `html{overflow-x:clip}`(不要用 hidden 在 body,會殺掉 position:sticky 的 hero)。這頁 hero 靠 position:sticky,overflow:hidden 在祖先上會直接讓 71 行的 sticky 失效。
- 順帶發現(非 responsive 但同一段程式):#pq-live-console 的情境連接線 `right:-19px` 被父層 overflow:hidden 完全裁掉,桌機也看不到。
  - 證據:`PeakOps.dc.html:709 `<span data-live-link aria-hidden="true" style="position:absolute;right:-19px;top:12%;width:19px;height:2px;background:#FF6B2C;...">`;父層 PeakOps.dc.html:573 `<div id="pq-live-console" style="position:relative;...;overflow:hidden;min-height:460px">``
  - 對策:要留這條線就把它移到 #pq-live-grid 層級(572 行)當絕對定位子元素,不要拿掉 573 的 overflow:hidden(面板切換靠它裁切)。
- 痛點區的裝飾視窗在手機會互相重疊。5 個絕對定位卡片寬度寫死 150-240px,在 360px 視窗(容器約 320px)下 left:5%+200px、right:4%+190px、left:29%+240px 三者座標重疊。JS 已在寬度 <520px 時只保留前 3 個,但前 3 個彼此仍重疊。整塊 aria-hidden,屬視覺問題非可及性問題。
  - 證據:`PeakOps.dc.html:304 `<div ref="{{ pain }}" aria-hidden="true" style="position:relative;min-height:560px;...;overflow:hidden;...">`;316 `position:absolute;left:5%;top:5%;width:200px`;325 `position:absolute;right:4%;top:9%;width:190px`;334 `position:absolute;left:29%;top:34%;width:240px`;sections-engine.js:295 `const small = pain.root.clientWidth < 520;` 與 297 `if (small && i > 2) { w.el.style.display = 'none'; return; }``
  - 對策:在 sections-engine 的 small 分支再收斂到只留 2 個,或在 899px media query 內把這三張卡改成 `position:static` 的直式堆疊。不要改 316/325/334 的 data-dep / data-rot(視差係數靠它)。
- Hero 用 360vh 外框 + 100vh sticky 舞台。iOS Safari 動態網址列會讓 100vh 在捲動中改變,sticky 舞台高度與滿版 canvas 會抖動;全頁沒有任何 dvh/svh 用法。
  - 證據:`PeakOps.dc.html:70-71 `<div ref="{{ heroWrap }}" style="position:relative;height:360vh">` / `<div ref="{{ heroStage }}" style="position:sticky;top:0;height:100vh;overflow:hidden">`;`grep 'dvh\|svh\|lvh' PeakOps.dc.html` 無結果`
  - 對策:改 `height:100svh`(或 `100dvh`)並保留 `100vh` 當 fallback:`height:100vh;height:100svh`。注意 hero-engine.js 有自己的高度計算(hero-engine.js:693 `W = Math.min(1000, (window.innerWidth || 1000) * 0.86); H = 340;`),改 CSS 前要確認不會跟它打架。
- 本專案確實沒有 package.json,無 lint / typecheck / test / build 可執行;所有 JS 都是瀏覽器端 ES module,由 .dc.html 內的 dynamic import 載入。任何驗證只能靠瀏覽器實測。
  - 證據:``ls package.json` → No such file or directory;PeakOps.dc.html:1271 `Promise.all([import('./motion-kit.js'), import('./motion/home.motion.js')])`;1294 `import('./home2-engine.js')`;1301 `import('./gl-engine.js')`;1308 `import('./interactions-engine.js')`;1315 `import('./sections-engine.js')`;1322 `Promise.all([import('./hero-engine.js'), import('./sequence/manifest.js')])``


## C. 絕對不可修改清單(合併去重)

- c:/Users/User/Documents/GitHub/peakqi-website/PeakOps.dc.html
- c:/Users/User/Documents/GitHub/peakqi-website/home2-engine.js
- c:/Users/User/Documents/GitHub/peakqi-website/gl-engine.js
- c:/Users/User/Documents/GitHub/peakqi-website/interactions-engine.js
- c:/Users/User/Documents/GitHub/peakqi-website/sections-engine.js
- c:/Users/User/Documents/GitHub/peakqi-website/hero-engine.js
- c:/Users/User/Documents/GitHub/peakqi-website/motion-kit.js
- c:/Users/User/Documents/GitHub/peakqi-website/motion-config.js
- c:/Users/User/Documents/GitHub/peakqi-website/motion/home.motion.js
- c:/Users/User/Documents/GitHub/peakqi-website/content.js
- 本次為唯讀盤點,以上檔案一律不得修改
- PeakOps.dc.html:70 `height:360vh` 與 :71 `position:sticky;top:0;height:100vh` — hero-engine.js:576/:628 直接讀 wrap.offsetHeight 換算進度,改高度=改整段 hero 動畫時序
- PeakOps.dc.html:172,222,562,729 的 `<div data-wrap>` 與 :173,223,563,730 的 `<div data-stage>` 這層巢狀結構 — home2-engine.js 用 `#handoff [data-wrap]` / `#diagnostic [data-wrap]` / `#liveops [data-wrap]` / `#relay [data-wrap]` 精確查詢,少一層就整段 pin 失效
- PeakOps.dc.html:370-371 lossWrap/lossStage 與 :449-450 flowWrap/flowStage 的 ref 名稱與巢狀關係 — sections-engine.js:90,122 依賴
- PeakOps.dc.html:905-908 galWrap/galStage/galScroller/galTrack 四層巢狀 — interactions-engine.js:80,109-121 依賴,且 :907 的 `max-width:1360px` 同時是 scroller 量測基準(clientWidth 決定 runway)
- `#flow > div` 這個選擇器路徑 — gl-engine.js:284 `document.querySelector('#flow > div')`,#flow 內第一層 div 不能多包一層
- PeakOps.dc.html:465-466,486,510,532 的 `[data-deck]` / `[data-layer="0|1|2"]` / `[data-layer="m"]` / `[data-mcap]` — sections-engine.js:125-159 會覆寫其 position/left/top/width/margin
- PeakOps.dc.html:161,201,263,294 等 `<sc-for>` 與 `{{ }}` 綁定語法 — DC 框架語法,不可當普通 HTML 改
- engine 檔本身(home2-engine.js / gl-engine.js / interactions-engine.js / sections-engine.js / hero-engine.js / motion-kit.js / motion-config.js / motion/home.motion.js / sequence/manifest.js)— 本次為唯讀盤點,一律不動
- c:/Users/User/Documents/GitHub/peakqi-website/support.js —— 檔頭第 1 行明示 GENERATED、來源 dc-runtime/ 不在 repo,改了無法重建且會被下次產生覆蓋
- c:/Users/User/Documents/GitHub/peakqi-website/peakqi-vision-architecture/** 與 peakqi-vision-architecture_V2/** —— 獨立 Next.js 專案,與 PeakOps.dc.html 無關
- C:/tmp/*.py(b1-b8.py、onb.py、mosaic.py、mos2.py、mon.py、cover.py)—— 是直接改寫 Home.dc.html 的補丁腳本,本次不得執行、不得改
- C:/tmp/shot.mjs、C:/tmp/shot2.mjs、C:/tmp/probe*.js、C:/tmp/mem.js、C:/tmp/bhprobe.js —— 共用驗證工具,本次唯讀盤點不改;要客製請另存新 probe 檔
- PeakOps.dc.html 的 x-dc 結構界線:第 9 行 <x-dc>、第 1254 行 </x-dc>、第 1255 行 <script type="text/x-dc" data-dc-script data-props="..."> —— 這三行的位置關係與唯一性是 parser 前提(support.js:38-43 lastIndexOf),不可增減或搬動
- PeakOps.dc.html:10 <helmet> 與 :65 </helmet> 的開閉寫法 —— support.js:377-378 是正規式改寫,不可改成自我閉合
- PeakOps.dc.html:6 <script src="./support.js"></script> —— 必須留在 <x-dc> 之前的 <head>,整頁 runtime 靠它
- PeakOps.dc.html:67 <dc-import name="Nav"> 與 :1249 <dc-import name="Footer"> 的 name 屬性 —— name 決定 sibling fetch 的檔名(support.js:597-598、1520-1541),改名即 404
- 模板端 {{ }} 只寫純路徑的既有慣例 —— support.js:205-293 的 resolve() 不支援函式呼叫/運算/三元/邏輯運算子,改成表達式會靜默變空白
- PeakOps 五個 sc-for 的資料來源變數:cases(:841)、compareRows(:950)、compareCards(:961)、customs(:1056)、faqs(:1169) —— 變成非陣列會整區無聲消失(support.js:553-567)
- C:\Users\User\Documents\GitHub\peakqi-website\home2-engine.js(依賴 #diagnostic [data-dtool]/[data-dmeter]/[data-dcount]/[data-dtake]/[data-dclose]/[data-dscan]、#liveops [data-live-panel]/[data-live-item]/[data-live-link]/[data-live-name] 選擇器)
- C:\Users\User\Documents\GitHub\peakqi-website\sections-engine.js(依賴 #loss [data-lossv] 與其 data-t 屬性,sections-engine.js:94 讀 parseInt(data-t))
- C:\Users\User\Documents\GitHub\peakqi-website\interactions-engine.js(依賴 #cases [data-count] 做數字滾動,interactions-engine.js:25-32 會覆寫 textContent;在 #cases 數字外加註腳可以,改 data-count 元素內文會被引擎蓋掉)
- C:\Users\User\Documents\GitHub\peakqi-website\hero-engine.js + sequence/manifest.js(依賴 ref t1~t5、heroWrap/heroStage/heroCanvas/heroHint;Hero 148 行那句退費文案位於 heroT5 容器內,可改字但不可動容器結構)
- C:\Users\User\Documents\GitHub\peakqi-website\gl-engine.js、motion-kit.js、motion/home.motion.js(綁 data-cta / data-arrow / data-echo / data-spot / data-tilt / data-divider 等屬性)
- PeakOps.dc.html:1255 的 data-props JSON 與 1256 起的 class Component extends DCLogic 結構(改內容不需動這裡)
- content.js 的 export 名稱與物件欄位名(stats/lossYear/caseStudies.metrics/plans/risk/usage/faq/compare 皆被多頁共用:Home、Cases、Pricing、Solutions、About、Demo 也 import,改欄位會連帶影響其他頁)
- #diagnostic 的 data-max / data-u 屬性名(home2-engine.js:100-103 直接讀取)
- #pq-live-grid / #pq-live-console / #pq-live-items / #pq-cmp-desk / #pq-cmp-mob / #pq-tl / #pq-orbit / #pq-orbitrow 這些 id(第 55-62 行 RWD media query 直接綁 id)
- c:/Users/User/Documents/GitHub/peakqi-website/hero-engine.js(animation-only)
- c:/Users/User/Documents/GitHub/peakqi-website/home2-engine.js(animation-only)
- c:/Users/User/Documents/GitHub/peakqi-website/gl-engine.js(animation-only,WebGL)
- c:/Users/User/Documents/GitHub/peakqi-website/interactions-engine.js(animation-only)
- c:/Users/User/Documents/GitHub/peakqi-website/sections-engine.js(animation-only)
- c:/Users/User/Documents/GitHub/peakqi-website/motion-kit.js(animation-only,共用元件庫,多頁共用)
- c:/Users/User/Documents/GitHub/peakqi-website/motion-config.js(animation tokens,多頁共用)
- c:/Users/User/Documents/GitHub/peakqi-website/motion/home.motion.js(本頁章節設定,唯一該動的動畫檔)
- c:/Users/User/Documents/GitHub/peakqi-website/sequence/manifest.js(hero 影格 manifest,enabled:false 但簽名被依賴)
- c:/Users/User/Documents/GitHub/peakqi-website/micro-engine.js(由 Nav.dc.html 間接載入)
- section id:#hero #handoff #diagnostic #flow #liveops #relay #cases #pricing #demo-cta(motion/home.motion.js 的 chapters 靠 getElementById)
- id:#pq-orbit #pq-orbitrow #pq-tl #pq-live-grid #pq-live-console #pq-live-items
- DOM 巢狀:section#hero > div[ref=heroWrap;height:360vh] > div[ref=heroStage;position:sticky;top:0;height:100vh] > canvas[ref=heroCanvas]
- DOM 巢狀:section#handoff|#diagnostic|#liveops|#relay > div[data-wrap] > div[data-stage](三層缺一不可)
- DOM 巢狀:div[ref=galWrap] > div[ref=galStage] > div[ref=galScroller] > div[ref=galTrack](四層,不可插層/合併)
- DOM 順序:#flow 的第一個直接子 div 必須是 flowWrap(gl-engine.js:284 '#flow > div')
- DOM 順序:#pq-orbit 的 firstElementChild 必須是 role=tablist 的軌道盤(gl-engine.js:151)
- DOM 順序:[data-dmeter] 的 firstElementChild 必須是進度條 fill(home2-engine.js:87)
- DOM 順序:[data-rail] 的 firstElementChild 必須是圓點 span(sections-engine.js:217)
- ref 名(與 renderVals 對應):wrap stage canvas t1 t2 t3 t4 t5 hint pain lossWrap lossStage flowWrap flowStage orbitBox orbitCore galWrap galStage galScroller galTrack
- hero 屬性:data-scrim data-st data-chip
- pain 屬性:data-win data-dep data-rot data-badge data-break data-gap data-leak data-cursor data-ba
- loss 屬性:data-lossv data-t data-lgap data-drop
- flow 屬性:data-deck data-layer("0"/"1"/"2"/"m") data-mcap data-rail data-noise
- handoff 屬性:data-hpath(必須是 <path>) data-hpack data-hnum data-hnote
- diagnostic 屬性:data-dtool data-rot data-dmeter data-dcount data-max data-u data-dtake data-dclose data-dscan
- liveops 屬性:data-live-panel(0..5) data-live-item data-name data-live-link data-live-name(panel 數必須等於 item 數)
- relay 屬性:data-rstation data-rchip data-rfill data-rpack
- cases/portfolio 屬性:data-caseimg data-src data-count data-bg data-tilt
- compare/timeline 屬性:data-sweeper data-tline data-dot data-tstep
- demo-cta 屬性:data-console data-echo data-spot
- divider 屬性:data-divider(line/shutter/aperture) data-line data-label data-shut-l data-shut-r data-ap
- orbit 座標系:SVG viewBox="0 0 600 460" 與 ellipse rx=238 ry=164(gl-engine.js:155,160 與 PeakOps.dc.html:1492 orbPts 三處同步)
- 全域把手:window.__pqHero(.cons) __pqGL __pqInteractions(.galNav) __pqSections __pqHome2 __pqMicro
- keyframes 名稱(PeakOps.dc.html:25-57):pqFloat pqPulse pqDash pqJitter pqSweep pqScan pqBarFlow pqTypeDot pqGenSweep pqCapGrow pqSeqLit pqBarBreath pqAdvract pqHeart pqCountFlash pqAnxious pqBreakPulse pqBlink pqPktA pqStationLit pqPageIn
- CSS media query(PeakOps.dc.html:55, 62):#pq-live-* / #pq-cmp-desk / #pq-tl / #demo-cta [data-echo] 那兩條與引擎邏輯耦合
- 各區塊 HTML 的『初始 inline style』本身即 reduced-motion/mobile 的完成態,不可視為隨意可調的預設值
- C:/Users/User/Documents/GitHub/peakqi-website/PeakOps.dc.html 的 section id:#hero #hero-stats #handoff #diagnostic #pain #loss #flow #liveops #relay #features #cases #portfolio #compare #pricing #usage #timeline #risk #faq #demo-cta —— 引擎以 '#cases'、'#flow > div'、'#flow [data-deck]'、'#compare [data-sweeper]'、'#demo-cta [data-console]'、'#timeline' 直接選取
- #pq-orbit / #pq-orbitrow / #pq-live-console / #pq-live-items / #pq-cmp-desk / #pq-cmp-mob / #pq-tl 這些 id(PeakOps.dc.html:767/801/573/711/944/960/1119),引擎 querySelector 依賴
- 所有 data-* 鉤子,尤其:[data-lossv] 與其 data-t 值(:383/392/401/410/435,count-up 動畫來源)、[data-caseimg][data-src]、[data-count]、[data-layer]、[data-deck]、[data-rail]、[data-st]、[data-chip]、[data-echo]、[data-hpath]、[data-hnote]、[data-scrim]、[data-console]、[data-sweeper]、[data-tline]、[data-orbcard]、[data-live-item]/[data-live-name]/[data-live-panel]/[data-live-link]、[data-rstation]/[data-rchip]/[data-rfill]、[data-drop]/[data-lgap]/[data-leak]、[data-tilt]、[data-cta]、[data-arrow]
- ref="{{ ... }}" 綁的節點與其巢狀層級:heroWrap/heroStage/heroCanvas/heroT1–heroT5/heroHint(:70-152)、lossWrap/lossStage(:370-371)、flowWrap/flowStage(:449-450)、pain(:上方)、orbitBox/orbitCore、galWrap/galStage/galScroller/galTrack —— hero-engine.js / sections-engine.js 會直接改 style.position 等
- Nav.dc.html 的 showSticky 條件鏈(:222)與 sessionStorage key 'pqCtaDismissed'(:113/232):改動會影響全站每一頁的浮動 CTA,不是 PeakOps 單頁範圍
- PeakOps.dc.html:1255 的 data-props JSON(stickyCta / grain)與 :1554 stickyVal 對應關係
- analytics 選擇器契約:PeakOps.dc.html:1284-1289 依賴 href 精確等於 'Demo.dc.html' / 'Cases.dc.html' 與前綴 'Demo.dc.html?case=' —— 改 href 寫法(例如加 utm)會靜默弄壞埋點
- content.js 既有 export 名稱:多頁共用(Nav 用 navigation、Demo/Cases 頁用 demoIndustries/contactTimes/portfolioAI/portfolioWeb/solutionsScenarios 等),不可在只改 PeakOps 的情況下重新命名或刪除
- c:/Users/User/Documents/GitHub/peakqi-website/home2-engine.js(本次唯讀盤點,未修改)
- c:/Users/User/Documents/GitHub/peakqi-website/motion-kit.js / motion/home.motion.js / sequence/manifest.js
- id 選擇器(被 PeakOps.dc.html:55-62 的 @media 與 sections-engine 綁定):#pq-live-grid、#pq-live-console、#pq-live-items、#pq-cmp-desk、#pq-cmp-mob、#pq-orbit、#pq-orbitrow、#pq-tl、#relay、#demo-cta、#pq-skip
- home2-engine 依賴的 data-*:data-wrap、data-stage、data-dtake、data-dtool、data-dscan、data-dmeter、data-dcount、data-dclose、data-hpath、data-hpack、data-hnum、data-hnote、data-rfill、data-rpack、data-rchip、data-rstation、data-live、data-name、data-max、data-u、data-rot、data-wgrid、data-wmeta
- sections-engine 依賴的 data-*:data-layer、data-deck、data-mcap、data-rail、data-lossv、data-lgap、data-drop、data-gap、data-leak、data-orbcard、data-t、data-badge、data-break、data-ba、data-dep、data-noise、data-cursor、data-win
- interactions/gl/motion 依賴的 data-*:data-count、data-dot、data-tline、data-tstep、data-sweeper、data-bg、data-caseimg、data-src、data-console、data-tilt、data-cta、data-arrow、data-echo、data-spot、data-divider、data-label、data-line、data-ap、data-parallax、data-maskreveal、data-shut、data-intro、data-dataline、data-chip、data-scrim、data-st
- DC 框架語法:<x-dc>、<helmet>、<dc-import>、sc-for / sc-if 及其 as / hint-placeholder-count / hint-placeholder-val 屬性、ref="{{ }}"、style="{{ }}"、style-hover、onClick/onKeyDown 綁定
- PeakOps.dc.html:52-53 的 prefers-reduced-motion 規則,其中用 [style*="pqTypeDot"] 等字串比對 inline style —— 任何改 style 屬性的動作都不可刪掉這些 animation 名稱
- PeakOps.dc.html:920 附近 portfolio 卡的 min-width:300px/max-width:300px 與 scroll-snap 設定(galScroller 寬度計算依賴)
- PeakOps.dc.html:1010-1035 方案卡模板所引用的 property 名(p.codeStyle/p.nameStyle/p.smallLabelStyle/p.quote/p.baseStyle/p.itemStyle/p.btnStyle/p.btnHover/p.cardStyle/p.setupBoxStyle)—— 改 JS 樣式值可以,改 key 名會斷
- PeakOps.dc.html:55 這一整條 @media (max-width:899px) 是全頁唯一的手機佈局規則,任何 responsive 修正必須「加在裡面」,不可重寫或拆散
- 選擇器 #pq-live-grid / #pq-live-console / #pq-live-items / [data-live-item] / [data-live-panel] — home2-engine.js:140-172 依這些 id 與屬性做情境切換與 aria-current
- 選擇器 #pq-cmp-desk 與 #pq-cmp-mob 的成對關係(55 行隱藏桌面版、56 行隱藏手機版),拿掉任一邊會導致某個寬度區間兩份都出現或兩份都消失
- 選擇器 #pq-orbit 與 #pq-orbitrow 的成對關係(60/61 行),且 #pq-orbitrow [data-orbcard] 被 sections-engine.js:276 拿來做手機視差
- #pq-tl 與其子節點 [data-tstep] / [data-dot] / [data-tline] 的 DOM 結構 — interactions-engine.js:178 用 getComputedStyle(#pq-tl).flexDirection 判斷橫直軸
- PeakOps.dc.html:70-71 heroWrap(height:360vh)與 heroStage(position:sticky;top:0)的巢狀關係 — hero-engine 的捲動進度全靠這個結構,且任何祖先加 overflow:hidden 都會讓 sticky 失效
- PeakOps.dc.html:53 那條用 [style*="pqXxx"] 屬性選擇器關動畫的 reduced-motion 規則 — 它依賴 inline style 內的 animation 名稱字串,改寫 inline style 會靜默失效
- Nav.dc.html:91 浮動 CTA 的 position:fixed 容器與 <sc-if value="{{ showSticky }}"> 包裹關係(Nav.dc.html:90、222)
- 所有 data-* 鉤子:data-wrap / data-stage / data-win / data-dep / data-rot / data-leak / data-gap / data-badge / data-hpath / data-hpack / data-hnum / data-rstation / data-rchip / data-rfill / data-rpack / data-tstep / data-cta / data-arrow / data-tilt / data-spot / data-echo / data-count / data-sweeper — 分散在 sections-engine、home2-engine、interactions-engine、micro-engine
- engines 本身(home2-engine.js / gl-engine.js / interactions-engine.js / sections-engine.js / hero-engine.js / motion-kit.js / micro-engine.js)— 本次為唯讀盤點,未做行為驗證,不應在同一次改動中一併修改

## D. 複查駁回的結論(原盤點錯誤,不可採信)

### a11y

- ~~(措辭層級)「reduced 的降級策略是引擎整條關掉」~~
  - 為何錯:對 gl/interactions/sections/hero 成立,但 home2-engine 並非「整條關掉」而是逐場景 early-return,且部分場景在 reduced 下仍會執行程式:home2-engine.js:28 仍寫入 `p2.style.animation = ctx.reduced ? 'none' : ...`;home2-engine.js:156-164 在 reduced 分支之前(line165 才 return)已為 items 掛上 role=button / tabindex=0 / click / keydown,並在 line165 執行 `setActive(0, false)`。實際語意是「動畫關掉、互動與可及性屬性保留」,不是整個引擎停用。
- ~~(措辭層級)ctx.reduced 等同 prefers-reduced-motion~~
  - 為何錯:motion-config.js:22-23 的 tier 'static' 同時由 `navigator.connection.saveData` 觸發,motion-kit.js:29 以 `capabilityTier() === 'static'` 賦值,故 ctx.reduced 在純 save-data(未開 reduced motion)裝置上也會為 true。以 a11y 盤點而言把它直接當成 reduced-motion 訊號會高估覆蓋來源。

### claims

- ~~診斷區顯示的動態數字是「24 條未讀、12 組未跟進、8 筆重複、6 小時延遲、5 處斷點」~~
  - 為何錯:頁面上實際永遠不會顯示 24 與 8。PeakOps.dc.html:1572 用 `max: [7, 12, 9, 6, 5][i] ?? 7` 完全覆寫 content.js:240-246 的 max,渲染時 PeakOps.dc.html:267 傳入的是 7/12/9/6/5,home2-engine.js:103 以 `Math.max(1, Math.round(max * bad))` 計算,上限即為 7 與 9。正確敘述應為「最多 7 條未讀、12 組未跟進、9 筆重複、6 小時延遲、5 處斷點」。該結論的 evidence 括號裡雖已注意到覆寫,但 claim 本文仍寫錯數字,對外報告會誤導。
- ~~content.js 內可列名的作品約 27 筆~~
  - 為何錯:漏算 caseStudies。content.js:93-99 的「美業 AI 體驗系統」既不在 worksFeatured(115-121)也不在 portfolioAI(125-135)/portfolioWeb(138-150),是第 28 筆獨立可列名作品(caseStudies 其餘三筆 —— 室內設計 AI 整合平台 content.js:74、婚禮產業 AI 大禮包 content.js:84、房仲 AI 助手 content.js:102 —— 才與 worksFeatured 重複)。正確去重總數為 28,不是 27。結論方向(不足 30)仍成立,但數字有誤。
- ~~fixHint 稱「沒有『約』『該案例』的三個(5 倍、3 倍、多次)」~~
  - 為何錯:「3 倍」有「該案例」標註。content.js:98 為 `{ v: '3 倍', l: '報價速度提升(該案例)' }`,l 欄位明確帶「(該案例)」。同行真正缺標註的是 `{ v: '↓約 60%', l: '決策時間縮短' }` 與 `{ v: '多次', l: '風格反覆試換' }`。清單應為:5 倍(content.js:90)、↓約 60%(content.js:98)、多次(content.js:98)、8+(content.js:90)、10+(content.js:80)、3天→3hr(content.js:80)——按這條的標準遠不只三個。
- ~~Demo 承諾『15 分鐘』出現三次~~
  - 為何錯:實際在 PeakOps.dc.html 出現四次:145、1165、1189(「花 15 分鐘,看這套系統用你的場景跑一遍」)、1191,加上 content.js:195 共五處。該結論自己在另一條(退費一致性)引用了 1189,卻在這裡漏計,導致「三次」低估。
- ~~「9 僅出現在樣式數值」~~
  - 為何錯:這句敘述無法從證據支撐,也未在 evidence 中提出任何 grep 結果佐證(只對「86」給了行號)。實務上「9」在本頁大量出現於 content.js 經 sc-for 渲染的成效數字(如 content.js:80「約 90%」、content.js:116「提案效率 ↑約 90%」)與 PeakOps.dc.html:696「NT$92K」等內容字串中,不只是樣式數值。結論的實質(本頁沒有以「9」為主體的宣稱)可接受,但這句陳述本身寫錯。

### layout

- ~~主容器 max-width:1360px 共 19 處~~
  - 為何錯:實測 `grep -o "max-width:1360px" PeakOps.dc.html | wc -l` = 18,不是 19;且該條自己列出的行號(:174,:215,:224,:284,:372,:564,:731,:757,:833,:888,:907,:937,:982,:1069,:1108,:1134,:1157,:1185)數起來也只有 18 個。總數應為 1400×1 + 1360×18 + 1160×1 = 20 個主容器宣告。
- ~~#hero 客戶卡與 #liveops 主控台頂列均為 1fr 1fr 1fr(33.3 三等分),證據 PeakOps.dc.html:113 / :579 / :693 / :1217~~
  - 為何錯:PeakOps.dc.html:113 實際是 `display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px` — 兩欄不是三欄。`grep -n "1fr 1fr 1fr"` 全頁只有 3 筆:579、693、1217(且 693 位於 #liveops 561-727 內,不是 relay)。
- ~~#flow pin 卡片寬度證據為 sections-engine.js:148-153 `el.style.width='min(760px, 96%)'; el.style.left='50%'; el.style.top='50%'`,fixHint 指向 sections-engine.js:150~~
  - 為何錯:行號錯:`grep -n "min(760px" sections-engine.js` → 155。實際 :154 `el.style.left='50%'; el.style.top='50%';`、:155 `el.style.width='min(760px, 96%)';`;:150 是 `}`(結束 if (flow.deck) 區塊),:148-153 內沒有 width/left/top 宣告(148 是 deck height、151 是 forEach 起頭)。值本身存在,但引用行號不成立。
- ~~硬編碼 padding 證據:1352 行 renderVals 內 `padding: '30px 28px'`、:1147 `padding:28px 26px`~~
  - 為何錯:兩個行號都錯。`renderVals()` 在 PeakOps.dc.html:1347,`padding: '30px 28px'` 在 :1358(不是 1352);`padding:28px 26px` 在 :1146(不是 1147)。
- ~~另有 4 處中段寬度內文(43-56%)~~
  - 為何錯:數字與自身證據不符:evidence 實際列了 6 個行號(:208 560px、:277 720px、:439 560px、:876 560px、:1189 520px、:1175 620px),且 :1175 自己也註明不生效。應為 5 處生效 + 1 處冗餘,不是 4 處。
- ~~#flow 是全頁唯一有自動降級的 sticky~~
  - 為何錯:至少還有兩處自動降級:(1) interactions-engine.js:111 `if (extra < 60) { galReset(); return; }` — 展廊 sticky 在寬度不足時退回一般捲動(同一份盤點的第 9 條自己也寫了);(2) home2-engine.js:15 `if (ctx.reduced || ctx.mobile) return false;` 與各場景 :27/:73/:165/:182 的 reduced/mobile 早退,使 handoff/diagnostic/liveops/relay 四個 pin 在行動版/減動效時完全不 pin。
- ~~真正的左右雙欄(非 auto-fit)只有 2 組~~
  - 為何錯:若以「非 auto-fit 的兩欄 grid」字面認定,至少還有 PeakOps.dc.html:113 `grid-template-columns:1fr 1fr`,以及 :55 media query 內 `#pq-live-items{grid-template-columns:1fr 1fr!important}`。該條實際成立的範圍只有「非等寬的版面級雙欄」——原句未加此限定,字面為假。
- ~~全頁 sticky 區塊共 6 個實際生效~~
  - 為何錯:與同一份盤點第 9 條自相矛盾:interactions-engine.js:117-120 的展廊 sticky 是第 7 個實際生效的 sticky(且 runway 以 px 計)。「共 6 個」只有在限定為「以 vh 計 runway 的 sticky」時才成立。
- ~~依 section 分組的 max-width 清單(20 個區塊)~~
  - 為何錯:清單不完整:另有兩個 divider 區塊未列入 — PeakOps.dc.html:553 `<div data-divider="shutter">` 與 :882 `<div data-divider="aperture">`(兩者皆無 1360 容器)。原條只涵蓋 :214 一個 divider,把全頁講成 20 個區塊。

### tooling

- ~~claim 6:「shot.mjs 與 shot2.mjs 只差 --user-data-dir(cdpprof / cdpprof2),可並行跑」~~
  - 為何錯:「只差 user-data-dir」是對的(diff 只有第 9 行),但「可並行跑」錯。兩支的第 8 行都是同一個 `--remote-debugging-port=9333`(shot.mjs:8、shot2.mjs:8 完全相同)。且 shot.mjs:17 是 `fetch('http://127.0.0.1:9333/json/list')` 後 `l.find(t=>t.type==='page'&&t.url.startsWith('http'))` 取第一個命中的 page target。同時跑兩支:第二個 Chrome 會搶不到 9333,或第一支會 attach 到另一支的分頁,量測結果錯亂。真要並行必須改 port,而 port 是硬寫死的、不吃參數。
- ~~claim 5 的機制與 fixHint:「getReact() 直接 throw」「先看 console 有沒有 `window.React is not available yet`」~~
  - 為何錯:結論(需對外網路、CDN 掛掉會整頁空白)正確,但機制與要找的 console 字串是錯的。實際碼路是 support.js:1763-1766 `hideRawTemplate(); loadReactUmd().then(init).catch((err) => { console.error("[dc] failed to load React or boot:", err); throw err; });`,而 loadReactUmd(support.js:1695-1703)在 script `onerror` 時 reject `new Error('failed to load ' + src)`(support.js:1691)。也就是 init() 根本沒被呼叫,getReact()(support.js:9-12)在這條路徑上永遠不會被執行,不會印出 `window.React is not available yet`。CDN 被擋時 console 實際看到的是 `[dc] failed to load React or boot: Error: failed to load https://unpkg.com/react@18.3.1/...`。照 fixHint 去 grep `window.React is not available yet` 會找不到而誤判。附帶:REACT_URL/REACT_DOM_URL 帶 SRI(support.js:1074、:1076)且 `crossOrigin = 'anonymous'`(support.js:1687),所以 SRI 不符或 CORS 標頭異常同樣會走這條 onerror,不只是「離線」。
- ~~claim 20:「.github/workflows/ 下只有 jekyll-gh-pages.yml 一個 workflow(非本站建置)」~~
  - 為何錯:檔案數正確,但「非本站建置」是錯的,且這條錯誤會連帶讓 claim 1 的「無 build」被過度推論。該 workflow 的內容是:`on: push: branches: ["main"]`,job build 用 `actions/checkout@v4` 檢出本 repo,再 `actions/jekyll-build-pages@v1` with `source: ./` / `destination: ./_site`,然後 `upload-pages-artifact@v3` + `deploy-pages@v5`。搭配 repo 根的 CNAME(`peakqi.com`),這正是本站(含 PeakOps.dc.html)推上 main 後的建置與部署管線,而且它會失敗、會擋部署。正確說法應為「有 CI build(Jekyll 靜態搬運 + GH Pages 部署),但它不編譯也不驗證 .dc.html 的任何渲染行為」。
- ~~claim 1:「本專案無 lint、無 typecheck、無 test、無 build 指令」~~
  - 為何錯:「本機無可跑的 npm 指令」為真(已實查根目錄無 package.json / tsconfig / .eslintrc / node_modules),但「無 build」作為絕對敘述不成立:push 到 main 會觸發 .github/workflows/jekyll-gh-pages.yml 的 jekyll-build-pages 建置與 GH Pages 部署(見上一條)。PR 描述應寫「本 repo 無本機 lint/typecheck/test;唯一 CI 是 Jekyll 靜態建置+GH Pages 部署,不驗證 .dc.html 渲染」,而不是「完全沒有 build」。
- ~~claim 8 的 fixHint:「『絕不爆版』可以直接用 bhprobe.js 做成回歸檢查」~~
  - 為何錯:「直接用」不成立。bhprobe.js 開頭三行就是 `document.getElementById('pq-bh-runway')`、`document.getElementById('pq-bh-frame')`、`run.getBoundingClientRect()`,後段還有 `d.querySelector('three-d-stage').shadowRoot`。這些節點是 Home 的 behind-the-scenes 區塊專屬;PeakOps.dc.html grep 不到 pq-bh-runway / pq-bh-frame / three-d-stage,整支在 PeakOps 上會在第 3 行就 TypeError(run 為 null)。可重用的只有 `document.documentElement.scrollWidth > innerWidth` 這一個運算式,必須另寫一支獨立 probe,不能沿用檔案。

### content

- ~~專案確實沒有 package.json,不存在 lint/typecheck/test/build 指令~~
  - 為何錯:根目錄確無 package.json,但 repo 內有兩個:./peakqi-vision-architecture/package.json 與 ./peakqi-vision-architecture_V2/package.json,兩者 scripts 皆含 build(bash scripts/build-verified.sh)、test(npm run build && node --test tests/rendered-html.test.mjs)、lint(eslint .)、dev(vite)。正確說法應限縮為「PeakOps.dc.html 所屬的根目錄站台無 build step」,不能說整個專案沒有
- ~~同目錄僅有 content.js(290 行)與 PeakOps.dc.html(1597 行)~~
  - 為何錯:行數兩者正確,但根目錄實際還有 about-hero.js、analytics.js、case-media.js、cases-engine.js、cases-hero.js、cases-validator.js、gl-engine.js、hero-config.js、hero-engine.js、hero-kit.js、hero-scenes.js、home-engine.js、home2-engine.js、interactions-engine.js、micro-engine.js、motion-config.js、motion-kit.js、pa-engine.js、sections-engine.js、seo.js、solutions-engine.js、support.js 共 22 支 .js,以及 peakqi-camera-parts.json、vercel.json,和 assets/ data/ motion/ sequence/ uploads/ 等子目錄
- ~~content.js 只供應資料型清單(24 個 renderVals key)~~
  - 為何錯:實測 `grep -o "d?\.[a-zA-Z0-9]*|d\.compare"` 去重後為 26 個 content.js export 被取用(25 個 d?.X + d.compare),另加 componentDidMount 內的 m.faqJsonLd(m.faq)。24 這個數字算少了
- ~~grep contact 在 PeakOps.dc.html 零命中~~
  - 為何錯:PeakOps.dc.html:1289 `wire('a[href^="tel:"],a[href^="mailto:"]', 'contact_click');` 含 contact。應改寫為「d?.contact / content.js contact export 未被引用」——該核心結論本身成立
- ~~L1397 renderVals `linkLabel: w.url ? '造訪網站 ↗' : '查看案例 →'`(渲染於 L910 卡片)~~
  - 為何錯:linkLabel 實際在 PeakOps.dc.html:1396(1397 是 `}));`);渲染處也不是 L910(那是卡片 `<a href="{{ w.href }}">` 外殼),而是 L926 `<span ...>{{ w.linkLabel }}</span>`
- ~~c.human 資料已在 renderVals :1562 的 ...c spread 裡~~
  - 為何錯:1562 是 `mods: d?.features ?? [],`。cases 的 map 起於 :1564,`...c,` 在 :1565。結論(human 可零成本取得)成立,行號錯
- ~~content.js:157 `{ name: 'PeakQi 整合營運系統', ... hot: true }`~~
  - 為何錯:該筆實際在 content.js:158;157 是『單一客服機器人』那一列
- ~~『同一件事(進 Demo.dc.html)』就有 7 種不同講法~~
  - 為何錯:其自身列舉 145/544/1021/1034/1166/1191+Nav sticky 去重後只有 6 種(145 與 1191 是同一字串「預約 15 分鐘場景 Demo」)。若要算全,還漏了 :870「把這個流程套用到我的公司」(href=Demo.dc.html?case=)與 Nav.dc.html:45 / Footer.dc.html:47「預約 AI 導入評估」(href 皆為 Demo.dc.html),實際是 8 種。7 這個數字兩邊都對不上
- ~~grep '{{ loss' 在模板內零命中(只命中 ref 用的 lossWrap/lossStage 與 :1560 lossNote)~~
  - 為何錯:{{ lossNote }} 有實際渲染於 PeakOps.dc.html:439 `<p ...>{{ lossNote }}</p>`,不是只在 :1560 定義端命中。loss/flow/wall 三個 key 為死綁定的結論不受影響,但 lossNote 是活的
- ~~右下角 CTA 觸發條件:捲動達全頁 35% 才出現~~
  - 為何錯:對本頁成立(PeakOps.dc.html:67 傳 cta-threshold="0.35"),但條件描述不完整:Nav.dc.html:117-121 有旁路 `if (thr <= 0) { this.setState({ ctaOk: true }); ... return; }`,threshold 為 0 或未傳時 CTA 立即顯示、完全不需捲動。另 dismissed 的 return 在 :116 而非所述的 :112-113(那兩行只是 let/getItem)

### type

- ~~全頁 <style> 區為第 17-68 行;字級 100% 是 inline style~~
  - 為何錯:<style> 實際是 PeakOps.dc.html:17 開始、:63 結束(`grep -n '<style>|</style>'` → 17 與 63),不是 17-68。且 <style> 內確實有一筆字級宣告:PeakOps.dc.html:18 `#pq-skip{...font:700 14px 'Noto Sans TC',sans-serif;...}`,所以「字級 100% 是 inline」不成立(應說『除 #pq-skip 外全部 inline』)。核心結論『無 :root、無 typography token』仍成立。另『23 種各自獨立的 inline clamp』實測 markup 內 distinct = 22 種,要加上 JS 的 setupStyle clamp(2rem,3vw,2.6rem) 才湊到 23,措辭「inline」不精確。
- ~~PRICING 第1041/1046 行 clamp(1.05rem,1.9vw,1.4rem) = 16.8/16.8/24.3/22.4/22.4px~~
  - 為何錯:clamp 上限 1.4rem = 22.4px,1280px 時 1.9vw = 24.32px 已超過上限,實際輸出被夾為 22.4px,不可能是 24.3px。正確序列為 16.8/16.8/22.4/22.4/22.4px(390/768/1280/1440/1920)。原文在同一式子裡先寫 24.3 又寫 22.4,是 clamp 換算錯誤。
- ~~DEMO-CTA 右側 console 模擬 UI 為 9.5-12.5px,含全頁最小的 9.5px~~
  - 為何錯:兩處都不對。(a)同一個 console mock 內 PeakOps.dc.html:1219、1223、1227 皆為 `font:700 24px 'Space Grotesk'`(數字 12 / 28s / 18%),字級範圍不是 9.5-12.5px。(b)全頁最小不是 9.5px:PeakOps.dc.html:645 `font:600 9px`、:650/:651/:652 `font:700 9px sans-serif` 更小,這點在同一份報告的另一條結論裡已自述,前後矛盾。
- ~~達到桌面內文基準 17px 以上的只有 20 個(17px×5、18px×6、20px×6、21px×3),22px 以上僅 7 個~~
  - 為何錯:自相矛盾且數字錯。實測 ≥17px 共 27 個:17px×5、18px×6、20px×6、21px×3、22px×4、24px×3。所列的 20 個只是 17-21px 區間,再加上自己承認的 22px 以上 7 個就是 27。另外『全頁 367 個固定 px 字級宣告』只是 `font:<weight> <n>px` 這個 regex 的命中數,漏掉 PeakOps.dc.html:638 `font:15px`、:639/:640 `font:12px`(無 weight)、:655/:656 `font-size:10px`、:1098 `font-size:11.5px`,以及 <script> 內以字串定義的 JS 樣式(1366/1372/1447/1449/1450/1429 等),實際總數大於 367。
- ~~section 編號 `font:700 13px 'Space Grotesk'` 出現 12 次;兩個模式合計 29 處可用單一 replace_all 修好~~
  - 為何錯:實測 `grep -n "font:700 13px 'Space Grotesk'"` 命中 16 次,除了所列的 287,374,453,759,835,890,939,984,1072,1110,1136,1160,還有 PeakOps.dc.html:128(hero 客戶卡片)、:296(pain)、:692(liveops)、:1043(pricing)。因此合計是 17+16 = 33 處,不是 29 處;若直接 replace_all 會連帶改到 hero mock 與 liveops console 內非 section 編號的元素。
- ~~米底 #F2EFE8 上 rgba(9,11,14,.45) 約 2.9:1~~
  - 為何錯:依 WCAG 相對亮度複算,合成色約 rgb(137,136,134),對 #F2EFE8(L≈0.865)的對比為 (0.865+0.05)/(0.248+0.05) ≈ 3.07:1,不是 2.9:1。同組其他數字(.5≈3.6、.4≈2.65)則正確。另 PeakOps.dc.html:274 的修正建議說『對比約 3.1:1』也偏低——該行是 rgba(242,239,232,.4) 在深底 #090B0E 上,實際約 3.4:1。結論方向(皆不足 4.5:1)不受影響。
- ~~第1098行是全頁唯一用獨立 font-size 覆寫 shorthand 的地方~~
  - 為何錯:PeakOps.dc.html:655 與 :656 同樣在一行內先寫 `font:500 11.5px 'Noto Sans TC',sans-serif` 再以 `font-size:10px` 覆寫,與 1098 的模式相同,因此並非唯一。全檔 `font-size:` 共 3 處(655、656、1098)。

### resp

- ~~`style-hover` 在整個 repo 的任何 .js 檔案裡都找不到實作,本頁 12 處 hover 樣式很可能完全沒有生效(桌機也沒有)~~
  - 為何錯:完全錯誤。DC runtime 就是本地的 support.js(第 1 行註解 `// GENERATED from dc-runtime/src/*.ts`),它有實作:support.js:428-431 `if (key.startsWith("style-")) { pseudoClasses.push(host.pseudoClass(key.slice(6), value)); continue; }`,再由 support.js:740 `props.className = [props.className, ...pseudoClasses].filter(Boolean).join(" ")` 掛上 class。產生器在 support.js:1428-1446 `createPseudoSheet`:`const cls = "scp" + (n++).toString(36); const sel = pseudo === "before" || pseudo === "after" ? "."+cls+"::"+pseudo : "."+cls+":"+pseudo; el.sheet.insertRule(sel + "{" + css + "}", ...)`。也就是說 style-hover 產生的是真正的 CSS `:hover` 規則(不是 JS mouseenter),桌機完全生效、觸控裝置自然不觸發。原盤點的 grep 只搜 `style-hover|styleHover` 字面字串,漏掉 `startsWith("style-")` 的前綴比對。severity 應由 high 降為 info,fixHint(改寫成 @media (hover:hover))全部作廢。
- ~~唯一真正只靠 :hover 的效果是 CTA 箭頭位移~~
  - 為何錯:「唯一」錯誤。既然 style-hover 會產生真 CSS :hover 規則(見上),本頁 12 處 style-hover(PeakOps.dc.html:544、898、899、1191 等)全都是純 :hover 效果,加上 micro-engine.js:26 的箭頭位移,至少 13 處。不過這些都是顏色/背景切換,屬純裝飾,「不影響可用性」的結論仍成立。此條其餘證據(micro-engine.js:3 fine gate、242 orbit `if (mobile) return`、pointerdown 按壓)核對無誤,但三個 gate 的行號有偏差:tiltWire 的 guard 在 45(44 是函式宣告)、cursorWire 在 75/76(74 是註解行,非原稱的 74)、spotWire 在 109/110(非原稱的 113)。
- ~~「全頁只有 8 條 @media」~~
  - 為何錯:以「渲染後的整頁」而言不成立。PeakOps.dc.html:67 import 了 Nav,Nav.dc.html:13 帶進第 9 條 `@media (max-width:959px)`;Nav.dc.html:106 `import('./micro-engine.js')` 又在 runtime 注入第 10 條 micro-engine.js:28 `@media (prefers-reduced-motion:reduce){[data-cta],[data-cta] [data-arrow]{transition:none}}`;support.js:119 另有 `@media print`。只有限定「PeakOps.dc.html 檔案內」才是 8 條。
- ~~痛點區前 3 張裝飾視窗「三者座標重疊」,且 JS 判斷在 sections-engine.js:295 / 297~~
  - 為何錯:行號錯誤 + 結論誇大。(1) 行號:實際是 sections-engine.js:51 `const small = pain.root.clientWidth < 520;` 與 sections-engine.js:53 `if (small && i > 2) { w.el.style.display = 'none'; return; }`;295/297 在檔案中是 `raf = requestAnimationFrame(loop)` / `lastTick = performance.now()`,與 pain 無關。(2) 重疊只驗證得出前兩張(top:5% 與 top:9%,即 28px / 50px,水平 16-216px 與 117-307px 明確互壓);第三張 top:34%(約 190px)與前兩張的垂直距離達 140px 以上,除非卡片高度超過 160px 否則不重疊,現有證據無法支撐「三者重疊」。
- ~~「唯二用固定 minmax 下限的是 #pq-orbit,以及兩個 auto-fit 但下限沒包 min(100%) 的格線(180px / 170px / 150px)」~~
  - 為何錯:自我矛盾/數目錯誤:「唯二」「兩個」但實際列出三個(160 行 180px、200 行 170px、1055 行 150px),加上 767 行 #pq-orbit 的兩個固定下限,固定下限的 minmax 共 5 處分佈在 4 行。枚舉本身完整,只有數量詞錯。
- ~~「所有負位移(-6/-19/-26/-30px 等)都在有 overflow:hidden 的祖先內被裁掉」,負位移清單為 234/709/1200/1204/1208~~
  - 為何錯:清單不完整且機制描述有誤。完整負位移還有 PeakOps.dc.html:46(top:-1px)、196(top:-12px)、198(bottom:-12px)、736(top:-5px)、738(top:-4px)、739(top:-3px)、1120(top:-2px)。且 234 行的 `[data-dscan] left:-6px;right:-6px` 其父層 PeakOps.dc.html:233 `position:relative;display:flex;flex-direction:column;gap:12px;min-height:300px` 並沒有 overflow:hidden,祖先 232 的 grid 也沒有 — 它不是被裁掉,而是因為外層 section 有 clamp(20px,5vw,48px) padding 所以碰不到視窗邊緣。結論(無頁面級橫捲)仍成立,理由錯。
- ~~fixHint:「focus 樣式建議在 Nav.dc.html 內補一份,不要只依賴 PeakOps 的 helmet(其他頁若沒有那段就裸奔)」~~
  - 為何錯:前提錯誤。micro-engine.js 正是由 Nav 自己載入的(Nav.dc.html:106 `import('./micro-engine.js')`),而 micro-engine.js:23 注入的 `a:focus-visible,button:focus-visible,summary:focus-visible,[role="tab"]:focus-visible{outline:2px solid #FF6B2C;outline-offset:2px}` 是全域規則。任何 import Nav 的頁面都會拿到 focus 樣式,不會「裸奔」。
- ~~零星行號偏差(不影響結論,但證據不可直接引用)~~
  - 為何錯:Nav 關閉鈕在 Nav.dc.html:97,非 96;方案 tab 的 `font: "700 13.5px 'Noto Sans TC',sans-serif"` 在 PeakOps.dc.html:1461,非 1459(1459 是 `style: {`,1460 才是 padding);motion-kit 手機頂部進度條 cssText 在 motion-kit.js:217,非 216。
- ~~多個純文字 CTA「inline-flex 高度約 18-22px」~~
  - 為何錯:描述不精確:798/827/870/877/901/1166 這幾條並沒有 display:inline-flex,是純 inline <a>(只有 font + text-decoration + margin),其命中高度取決於行框而非 inline-flex 盒。只有 302/544/1021 才是 inline-flex。核心結論(無垂直 padding、遠低於 44px)不受影響。

### anim

- ~~結論1:「componentDidMount 共動態 import 9 個模組」~~
  - 為何錯:實際是 9 個 import 呼叫點、11 個模組檔(motion-kit.js+motion/home.motion.js 與 hero-engine.js+sequence/manifest.js 各為 Promise.all 成對)。PeakOps.dc.html:1259/1270/1271(×2)/1274/1294/1301/1308/1315/1322(×2)。說「9 個模組」與其後自己列出的 8 支動畫檔+3 支非動畫檔(=11)自相矛盾,應寫成「9 個 import 語句 / 11 個模組」。
- ~~結論10:「#pq-orbitrow 這個 id 只有這一個用途」~~
  - 為何錯:不成立。PeakOps.dc.html:61 `@media (min-width:900px){#pq-orbitrow{display:none!important}}` 也用同一個 id 做桌機隱藏(與 :60 的 #pq-orbit 手機隱藏成對)。所以此 id 至少有兩個用途,改名不只是「手機視差消失」,還會讓這塊在桌機也一起顯示出來。
- ~~結論24:「六支引擎都把除錯把手掛到 window……__pqMicro」~~
  - 為何錯:micro-engine.js 全檔沒有 __pqMicro(grep 為 0,檔內 window.* 只有 matchMedia 與 __pqVTGuard)。__pqMicro 是由 Nav.dc.html:107-109 在 import 後自己掛上的(window.__pqMicro = m.createMicro())。所以是「五支引擎自掛 + micro 由 Nav 元件掛」,不是六支引擎都自掛。
- ~~結論6 fixHint:「這 8 個 ref 名稱是 renderVals(1527-1538)回傳的 key」~~
  - 為何錯:sections-engine 只用 7 個 ref:pain / lossWrap / lossStage / flowWrap / flowStage / orbitBox / orbitCore(sections-engine.js:22,90,122,238,全檔 refs.* 僅出現在這些行加 322/324)。renderVals 對應的是 PeakOps.dc.html:1527-1533;1534-1538 的 orbitMods/orbitKeys/galWrap…galTrack 屬於 interactions-engine 與模板,不歸 sections。數量與行段範圍都被放大。
- ~~結論8 的行號證據「sections-engine.js:112 [data-lgap];:113 loss.drops」~~
  - 為何錯:選擇器不在那兩行。[data-lgap] 的 querySelector 在 sections-engine.js:95、[data-drop] 在 :96(setupLoss 內);112/113 只是 lossUpdate 裡使用 loss.gap / loss.drops 的更新端。要改屬性契約應看 95-96。
- ~~結論9 的行號證據「:130 [data-mcap];:131 [data-rail]」與 fixHint「unpinFlow() (:167)」~~
  - 為何錯:實際為 :129 mergedCap('[data-mcap]')、:130 rails('[data-rail]')、:131 noise('[data-noise]');function unpinFlow() 在 :166。各差 1 行(:136-145、:151-158、:127-128、:217 則正確)。
- ~~結論5 的行號證據「hero-engine.js:657 applyStatic()」~~
  - 為何錯:657 行是註解 `// ---------- 降級模式 ----------`;function applyStatic() 定義在 658,實際呼叫點在 640(frame() 的 catch)與 741(__pqHero.static)。結論本身成立,但引用行號錯。
- ~~結論12 的行號證據「PeakOps.dc.html:229 data-dtake」~~
  - 為何錯:data-dtake 實際在 230 行(229 行不是它)。同段其他行號(235-251 dtool、267 dcount、269 dmeter、277 dclose、234 dscan)皆正確。
- ~~結論(relay)與結論26 引用的「PeakOps.dc.html:741 data-rstation / :742 data-rchip」~~
  - 為何錯:實際 data-rstation 在 743、data-rchip 在 744(735 data-rfill、736 data-rpack 正確)。另外 data-rstation 還被 CSS 使用(PeakOps.dc.html:45-52 的 #relay [data-rstation]::after 脈衝動畫與 nth-child 延遲),盤點時漏了這條「CSS 也依賴此屬性」的耦合。
- ~~結論25:「PeakOps.dc.html:6 <script src="./support.js"> 為唯一的傳統 script」~~
  - 為何錯:還有 PeakOps.dc.html:64 的 inline <script>(unhandledrejection 過濾 'Transition was skipped'/AbortError),以及 :1255 的 <script type="text/x-dc">。support.js 只是唯一的「外部 src」script,不是唯一的傳統 script。


## E. 需要使用者提供事實才能寫的問題

- 找不到 package.json(網站根目錄無;只有 ./peakqi-vision-architecture/package.json、./peakqi-vision-architecture_V2/package.json 這兩個無關子專案),所以本站確實沒有 lint / typecheck / test / build 指令可回報。
- 容器要收斂成哪個值?1360 在 1280 視窗下完全無效(被 1184 卡住),要改的其實是 padding 的 clamp 上限 48px。你要的是「內容更窄、留白更多」還是「容器數值統一」?這兩件事解法相反。
- #hero-stats 的 1400px(:159)與 #flow 的 1160px(:451)是刻意的還是歷史遺留?#flow 若改成 1360,sections-engine.js:150 的 `min(760px,96%)` 卡片寬度要不要跟著放大?
- 6 處 auto-fit 雙欄(:232/:284/:432/:1069/:1157/:1185)目前都是 50/50。要不要改成有主副之分(如 58/42,跟 #features 的 :767 對齊)?若要,:284 與 :432 兩側都有絕對定位子元素(:312-315 的 data-gap/data-leak 用 left:49.5%/50%/55%,:427-430 用 left:46.6%/47%/52.5%),欄寬一動這些百分比座標會跑掉,需要一併重算。
- 7 處窄文字(:292/:765/:990/:1077/:1090/:1125/:1165)的「雙重收窄」要拿掉哪一層?拿掉內層 max-width 會讓中文長行變成 560px 一行(約 34 字),超過一般可讀上限;拿掉外層欄寬則會動到整個 grid。
- home2-engine 的 pin 高度不隨 resize 重算(motion-kit.js:107 寫死 px),sections-engine 的 flow 用 265vh 會重算。要不要統一?這屬於 JS 行為修改,超出本次唯讀盤點,需要你先授權。
- 全頁沒用 svh/dvh。行動版位址列造成的 100vh 跳動要不要一起處理?會牽動 :71、motion-kit.js:110、sections-engine.js:139 三處。
- home2-engine.js:205-212 的 `wall()` 在本頁是死碼(無 #resultwall),但 PeakOps.dc.html:882 有一個 `RESULT WALL — 做出來的東西` 的 divider(:881-885)。是原本規劃了 resultwall 區塊後來拿掉、還是 divider 是刻意留的標題?
- PeakOps 要不要獨立收錄?若要,seo.js ROUTES 要新增的 path 是什麼(/peakops?/peak-ops?/products/peakops?)——這同時決定 sitemap.xml 條目與 vercel.json rewrite,三處必須一致,我不能替你猜。若不要獨立收錄,現行 applySEO('home') 也不對(它會宣告 canonical 指向首頁),應改為明確加 noindex 或指向正確的父頁。
- Case.dc.html:138 也是 applySEO('cases')、和 Cases.dc.html:327 共用同一個 canonical,個別案例頁同樣被併入列表頁。這是否為刻意設計?要不要一併處理,還是本次只動 PeakOps?
- 驗證要跑在哪個 base URL?本機靜態 server(需要你確認用哪個指令/port,repo 內沒有任何 server 設定檔),還是已部署的 Vercel/GitHub Pages 網址?vercel.json 只 rewrite 了 /,其餘路徑的實際行為我無法從檔案確定。
- headless 驗證需要對外網路抓 unpkg 的 React 18(support.js:1073-1077)。此環境是否允許?若不允許,截圖一律空白,整個截圖驗證手段不可用,需要先改成本地 vendored React——但那會動到 support.js(已列入禁改),需要你裁決。
- 要不要把「不爆版」做成固定回歸檢查?bhprobe.js 已有現成的 document.documentElement.scrollWidth > innerWidth 判斷,可抽成 PeakOps 專用 probe,但要先確認驗證的視窗尺寸清單(目前腳本預設桌機 1920x919、手機以 W<600 觸發 mobile,實際要測哪幾組請指定)。
- console 訊息目前不會被 shot*.mjs 收集(只 Runtime.enable,未訂閱 Runtime.consoleAPICalled)。而 DC 的所有失敗都只走 console。是否允許我另建一支新的 probe/腳本來收 console?(不改動 C:/tmp 既有檔案)
- 合約到底有沒有最短承諾期?『不綁約』與 content.js:196『最低三個月』何者為真?(這決定 4 處文案怎麼改)
- 30 天退費的完整條件:起算日是簽約日還是上線日?退的是月費還是含建置費?誰認定『沒效』?有哪些排除情形?有沒有書面條款可連結?
- 『30+ 已上線系統與網站案例』的實際數字與統計截止日是多少?能否提供可對外列名的清單(目前 content.js 只湊得出約 27 筆)?
- 『8+ 產業別實戰經驗』的產業定義與實際家數?(content.js:68 列了 10 個產業,兩者要對齊)
- 四個案例的成效數字(約90%、5倍、3倍、↓約70%、↓約60%、↑約20%、約8hr/週、30秒內)分別是怎麼量測的?比較基準期多長?有沒有客戶書面同意露出?
- 『成交率 5 倍』『報價速度 3 倍』這兩個沒有加『約』的數字,是實測還是估算?
- AI 回應『30 秒內』有沒有實測數據(p50/p95)?尖峰、圖片訊息、LINE API 延遲時的實際表現?
- 有沒有正式 SLA(可用率 %、維護窗口、中斷補償)?『24h 全天候在線』能承諾到什麼程度?
- 資安具體事實:資料存放在哪個雲/地區?傳輸與靜態加密方式?模型供應商是否已關閉訓練用途?有無 ISO 27001 / SOC2 或任何認證?有無 DPA 可簽?
- 『文字類不限量』是否真的無上限?有沒有公平使用條款或速率限制?超量時會發生什麼事?
- 圖片/影片計費的單位與費率區間(每張/每秒/每次多少錢)可否公開?
- 三方案是否有可公開的價格區間或起價?『低建置』的比較基準是什麼?
- B 方案『最多人選』的依據是什麼?統計期間與樣本?
- 比較表『找工程師完整客製 約三個月起』『單一客服機器人 多半只回答 FAQ』的依據?能否改成中性描述?
- 『專人持續協助優化』的服務內容:多久一次?持續多久?回應時間?含在月費嗎?
- 損失試算的假設是否可公開:100 組/月、流失 30%、客單 1 萬,是哪個產業的哪個情境?content.js:48 提到的『附件』是什麼文件、能不能對外提?
- 『大部分客戶光是 AI 幫忙接客就回本』有沒有實際樣本?回本的定義與期間?若沒有,是否同意改寫或刪除?
- 嘉義市世博會官網是直接承包還是分包?『市府級』『如期交付』的說法是否已取得對方同意露出?
- 『最快 10 個工作天上線』的前提條件(標準模組範圍、客戶資料何時到位)可否寫進頁面?
- #liveops 與 #demo-cta 的控制台假資料(12 / 28s / 18% / 128 / NT$92K / 42-33-25%)是否同意加上『介面示意,非實際數據』標註,或把 LIVE 標籤改掉?
- 報價面板的具體金額(NT$38,430、營業稅 5%、三房約 NT$2,800 起)是否要保留?若保留是否加示意標註?
- PeakOps.dc.html:1572 的 max 陣列 [7,12,9,6,5] 與 content.js:240-246 的 24/12/8/6/5 不一致,以哪一組為準?
- #resultwall / [data-wgrid] / [data-wmeta] 在 home2-engine.js:206-224 有完整實作但 PeakOps.dc.html 完全沒有這段 DOM(第 882 行的 aperture divider 還寫著『RESULT WALL — 做出來的東西』)。這次要 (a) 補上 Result Wall 區塊、(b) 把 882 行的 divider 文案改成對應 #portfolio、還是 (c) 兩者都不動?
- 本次改版的實際範圍是哪幾個 section?目前 6 支引擎覆蓋了 #hero #handoff #diagnostic #pain #loss #flow #liveops #relay #features #cases #portfolio #compare #timeline #demo-cta——幾乎整頁。沒有明確範圍就無法判斷哪些選擇器是『這次真的會碰到』。
- pin 總距離(hero 360vh + flow 265vh + handoff 45 + diagnostic 100 + liveops 180 + relay 120)是否允許調整?若要縮短頁面長度,是改 HTML 的 360vh/引擎裡的 265vh,還是改 home2-engine.js:31,74,166,183 的 distanceVh 參數?這三處分屬不同檔案。
- PeakOps.dc.html 這頁的 seo.js 套用的是 applySEO('home')、motion 設定用的是 motion/home.motion.js(key:'home')——這頁到底是要當首頁還是獨立的 PeakOps 產品頁?若是後者,需要新增 motion/peakops.motion.js 嗎(那會是新增動畫檔,超出『不該改動畫』的前提)?
- 手機(<900px)與 reduced-motion 下大量區塊直接 return、只顯示 HTML 初始態。改版時的驗收基準是只看桌機,還是三種模式都要?這會決定 HTML 初始 inline style 可不可以動。
- CTA 主語是否要統一?若要,主 CTA 定為哪一句:「預約 15 分鐘場景 Demo」(頁面現行主力,出現 3 次)、「預約 AI 導入評估」(Nav+Footer 現行)、還是「用我的場景看 Demo」(Nav sticky 現行)?三者現在同時存在且都指向 Demo.dc.html。
- Nav sticky CTA 的文字要不要跟 PeakOps 頁面主 CTA 對齊?目前 active="product" 走「用我的場景看 Demo」,與 hero/demo-cta 的「預約 15 分鐘場景 Demo」不同;對齊會影響其他所有非首頁頁面。
- hero L81「不用再開五個軟體切來切去」是刻意的替換式訴求(打『工具太多』痛點)還是要改成相容式訴求(『串起你已經在用的工具』)?這句是全頁最強的轉換鉤子,改動有轉換率風險,需要你決定方向。
- 價格區塊 L1040-1048「請一位真人助理 VS 這套系統」是否保留?若保留,可接受的改寫底線是什麼(改成『系統+團隊 vs 只有團隊』?還是整區拿掉)?這是最明確的『AI 取代人力』暗示。
- 案例卡要不要補渲染 content.js 的 human 欄位(AI 與人分工)?資料現成、四個案例都有,但會讓每張卡多一段文字,需要確認版面容忍度(記憶中的通則:絕不爆版)。
- loss 區塊(100/30/1/30萬/360萬)要不要改由 content.js 驅動?會牽動 data-lossv 的 data-t 動畫值,屬於引擎契約變更,需要你確認是否納入本輪範圍。
- Solutions 導流那 5 種說法(看 AI 怎麼分擔這些事 / 看接客細節 / 看追客細節 / 看養客細節 / 看功能怎麼搭配)是刻意做分段錨點導覽,還是也要收斂?
- 埋點缺口(#flow / #portfolio / #features / #pain 的 CTA 無事件)是否本輪要補?補的話要沿用 wire() 逐條加,還是改成 [data-cta] 全域委派(後者需要替 10 個連結補 data-cta 屬性)。
- 模擬 UI(hero 客戶卡片 105-140、liveops console 561-727、diagnostic 亂散工具卡 236-253、demo-cta console 1210-1245)裡的 9-13px 文字:算「裝飾插圖」可豁免字級/對比基準,還是算「內容」必須一併放大?這一個決定會影響 289 個小字宣告裡的大約 180 個。
- 桌面內文 17px 這條基準是要套在全部 <p> 上,還是只套在「主要閱讀段落」(pain/faq/risk/usage/demo-cta),而讓卡片內說明維持 15px?目前全頁沒有任何段落 ≥17px,若一律拉到 17px,pain 列表、compare 表格、timeline(max-width:200px)都會換行變多。
- h1 只有 hero 一個(第77行)。要達到「桌面 ≥64px」必須把上限從 3.8rem 提到 4rem 以上,但 hero 是 heroT1~T5 絕對定位疊層且 max-width:580px。是否允許同時放寬 max-width,或必須維持現有換行(讓 AI 接住 / 每一個客戶。)?
- 要不要真的建立 :root typography token?建立後 PeakOps.dc.html 會與其他 .dc.html(Solutions/Cases/Demo)字級脫節 —— 是只做這一頁,還是要一起改?若只做這頁,token 應寫在這頁的 <style> 還是共用檔?
- diagnostic / liveops / relay 這三個 h2 用小一號 clamp,是刻意的「劇場型 section 次級標題」設計,還是遺漏?這決定它們該升到 48px 級,還是改成 h3 語意。
- 第638-640行的 `font:15px sans-serif` / `font:12px sans-serif` 沒有指定 'Noto Sans TC',是刻意要 monospace/系統字的視覺差異,還是漏寫?
- 低對比修正的目標是 WCAG AA(4.5:1)還是只要「看得清楚」?若定 AA,米底區的 rgba(9,11,14,.5) 共 43 處中約 25 處都要動,範圍很大。
- 本專案無 package.json、無 bundler、無 build step(已確認 `ls package.json` = No such file),所以沒有 lint/typecheck/test/build 可跑。修改後的驗證方式要用什麼?(瀏覽器目視 / gstack browse 截圖 / 其他)
- Nav 的 959px 與頁面的 899px 是刻意分層(導覽先塌、內容後塌),還是歷史遺留?決定要不要對齊。
- style-hover 在正式的 DC runtime(不在此 repo,本地只有 support.js)裡是否有實作?如果有,它是用 JS mouseenter 綁定還是產生 CSS :hover 規則?這決定要不要全部改寫成 @media (hover:hover)。
- 44px 觸控區是否為本次的驗收硬標準?若是,26px 的說明鈕與 30px 的關閉鈕要用「擴張命中區」還是「直接放大」?後者會改變視覺。
- 要不要新增平板中段斷點(768-899)?目前 iPad 直向會吃到完整的手機規則(比較表變卡片、功能總覽變直排),可能浪費版面。
- hero 的 100vh 是否要改成 100svh/100dvh?這會改變捲動總長度與 hero-engine 的進度對應,需要確認動畫節奏可以接受。
- Live Ops 控制台內部的三欄看板在手機要「改成兩欄」還是「允許容器內橫捲」?兩種做法對 home2-engine 的面板切換影響不同。
