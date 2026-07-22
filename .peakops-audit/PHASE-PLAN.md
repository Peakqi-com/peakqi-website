# PeakOps.dc.html 優化 — Phase 執行計畫

## 前提(Phase 1 盤點確認的事實)

- **無 package.json / tsconfig / eslint / test** → **不存在 lint、typecheck、test 指令**。
- 唯一 CI 是 `.github/workflows/jekyll-gh-pages.yml`(Jekyll 靜態搬運 + GH Pages 部署),
  **它不編譯也不驗證 .dc.html 的渲染行為**。所以「build 通過」不等於頁面正常。
- DC 框架的模板編譯失敗只 `console.error`,HTTP 仍 200 → **失敗是靜默的**。
- 因此本專案唯一可靠的驗收 gate 是:
  1. 靜態 server + headless Chrome 載入
  2. 抓 console 有無 `[dc-runtime]` / `[dc]` 開頭錯誤
  3. `document.documentElement.scrollWidth > innerWidth` 不爆版
  4. 關鍵 DOM 契約(ref / data-* / 巢狀)仍存在
  5. 截圖目視
  → 已做成 `.peakops-audit/probe.js`,每個 Phase 收尾都跑。

## 動畫保護範圍

**animation-only,一律不改**:
`hero-engine.js`、`home2-engine.js`、`gl-engine.js`、`interactions-engine.js`、
`sections-engine.js`、`motion-kit.js`、`motion-config.js`、`motion/home.motion.js`、
`sequence/manifest.js`、`micro-engine.js`、`support.js`

**PeakOps.dc.html 內不可動的東西**:見 `.peakops-audit/DO-NOT-TOUCH.md`(103 條)。
摘要:19 個 section id、20 個 ref 名、約 90 個 data-* 屬性、
4 組固定 DOM 巢狀(hero 三層 / handoff-diagnostic-liveops-relay 三層 / gallery 四層 / flow 首個直接子 div)、
`@media (max-width:899px)` 這一整條(全頁唯一手機佈局規則,只能往裡面加)。

**可改**:文字內容、字級/行高/顏色數值、padding/gap/max-width 數值、
新增不影響選擇器的 wrapper 樣式、CTA 文案、aria 標籤。

---

## Phase 1 — 盤點(已完成)
產出:`phase1-inventory.md`(178KB)、`DO-NOT-TOUCH.md`(103 條)、本計畫。

## Phase 2 — 定位、Hero 論述、Hero 數據定義
- 目標:第一屏就講清楚「不用換掉現有工具,先接起一段流程」;四個數字全部補上定義。
- 檔案:`PeakOps.dc.html`(hero 五幕文案 + #hero-stats)
- 桌面:主標改為不會被誤解為「換掉五個軟體」的版本;數據四欄補定義行。
- 手機:主標換行點、數據改兩欄。
- 驗收:probe 通過;`grep` 確認 data-st / data-chip / ref 數量不變。

## Phase 3 — CTA 全頁統一
- 目標:全頁主 CTA 一律「用我的流程跑一次」,次要一律「查看實際導入案例」。
- 檔案:`PeakOps.dc.html`
- 風險:`analytics.js` 埋點依賴 href 精確等於 `Demo.dc.html` / `Cases.dc.html`
  → **只改按鈕文字,不改 href**。
- 驗收:CTA 文案種類數 = 2;href 清單與改動前完全相同。

## Phase 4 — 誠實性修正(最高優先,含 blocker)
- 目標:移除不實與自相矛盾的陳述。
- 已知 blocker:同頁「不綁約」與「最低三個月」互相打臉(content.js:196 vs PeakOps:148/1142/1189)。
- 項目:「幾乎零風險」→ 改寫;「30 天內覺得沒效,月費全額退」→ 補適用範圍或降級;
  「最快 10 個工作天上線」→ 限定為「標準模組第一階段」;
  損失金額改為明確標示情境估算 + 計算式。
- 檔案:`PeakOps.dc.html`、`content.js`(risk / plans 欄位值,不改 key 名)
- 風險:`content.js` 被 6 頁共用 → 只改字串值,不改 export 名與欄位名。
- 驗收:`grep` 確認「零風險」「不綁約」不再與「最低三個月」並存;
  五個 `data-lossv` 的 `data-t` 值與元素數量不變(sections-engine 依賴)。

## Phase 5 — 敘事結構與段落論述
- 目標:問題 → 導入方法 → AI 與人分工 → 方案 → 下一步。
- 項目:流程 X 光(補「會得到什麼輸出」)、痛點改三個斷點、
  接客追客養客加正式定義與五問、六模組各補一句成果導向說明、
  客戶旅程七步 + AI/系統/人工圖例、AI Hub 四層架構、人機比較改為協作語氣。
- 檔案:`PeakOps.dc.html`、`content.js`(六模組說明字串)
- 風險:痛點區 `#pain` 有 9 種 data-* 且 `data-badge` 的 textContent 會被引擎覆寫成 1~5
  → 文案不放在 data-badge 內。
- 驗收:probe 通過;`#pain` / `#flow` / `#liveops` 的 data-* 數量不變。

## Phase 6 — 字級、container 與留白比例
- 目標:1280/1366/1440 筆電不再「大留白 + 小內容」。
- 現況:無 typography token,367 個固定 px + 23 種 inline clamp。
- 做法:不建新 token 系統(風險過高),改為**逐條調整既有 clamp 下限**,
  讓桌面內文 ≥17px、輔助字 ≥14px、h2 ≥48px;
  主容器 1360px 維持,長文 max-width 收到 720–780px。
- 檔案:`PeakOps.dc.html`
- 驗收:自動換算 390/768/1280/1440/1920 五個寬度的實際 px,列出違規數 = 0。

## Phase 7 — 手機版、reduced-motion、a11y、最終驗收
- 目標:手機不是桌面縮小版;無水平捲動;觸控區 ≥44px。
- 做法:全部增補進既有 `@media (max-width:899px)`;必要時新增 ≤480px 一條。
- 項目:橫向時間軸轉垂直、三欄轉單欄、六模組不依賴 hover、
  固定 CTA safe-area + 44px + aria-label + focus 樣式。
- 驗收:360/375/390/430/768 五個寬度 probe 全通過;
  reduced-motion 模式下無空白 pinned 區塊。

---

## 每個 Phase 收尾固定動作
1. 列出修改檔案與內容
2. `grep` 比對 DOM 契約數量(ref / data-* / section id)未變
3. 跑 `.peakops-audit/probe.js`(console 錯誤 / 爆版 / 契約 / 截圖)
4. commit
5. 記錄仍需使用者提供事實的項目

## 不做的事
- 不新增 npm / bundler / 框架
- 不重構動畫、不換動畫套件
- 不把動畫區塊改成靜態卡片
- 不用 display:none 移除資訊
- 不修改 `peakqi-vision-architecture*/`
- 不捏造任何數字、合約條件、保證條款
