# About.dc.html 重做 —— Phase 執行計畫

## Phase 1 盤點結果(已完成)

### 檔案分類
| 類別 | 檔案 |
|---|---|
| animation-only(**不改**) | `about-hero.js`(節點網路佈局 L.frag/link/group/pipe/days/net/core)、`hero-kit.js`、`hero-scenes.js`(paintAbout canvas)、`pa-engine.js`(方法列/作品帶/時間軸)、`motion-kit.js`、`motion-config.js`、`support.js` |
| config(**可改值,不改結構**) | `hero-config.js` 的 `about` 區塊(scenes 陣列、totalVh、ctas)、`motion/about.motion.js`(章節清單) |
| layout + content | `About.dc.html`(406 行,模板 + renderVals 內嵌資料) |
| shared data | `content.js`、`case-media.js`(縮圖來源,**不改**) |
| shared components | `Nav.dc.html`、`Footer.dc.html` |
| seo | `seo.js` 的 `about` key |

### 動畫 DOM 契約(刪改即靜默失效)
`data-hero-wrap` / `data-hero-stage` / `data-hero-copy` / `data-hero-canvas` /
`data-hero-scenestage` / `data-hero-scene="<id>"` / `data-hero-cta` / `data-hero-primary` /
`data-hero-progress` / `data-ashotwall` / `data-alines` / `data-shot` + `data-clu` /
`data-aclust`(4 個) / `data-acore` / `data-count` /
`data-wrap` > `data-stage`(a-method 與 a-strip 各一組,pin 契約) /
`data-mfill` / `data-mstep` / `data-mconsole-text` / `data-strack` / `data-spec`

### 與其他頁重複的內容
| 本頁區塊 | 與哪一頁重複 | 處置 |
|---|---|---|
| `a-numbers` 的 10 天 / 24h | PeakOps、Pricing、Solutions | **移除**(留 30+ / 8+,關於頁不做銷售承諾) |
| `a-industries` 產業地圖 | Solutions 的產業清單、Cases 的案例索引 | 保留但縮小,改為「服務過的產業」佐證,不再當主角 |
| `a-method` 六步驟 | 導入方法頁(Solutions)的階段說明 | **改變角度**:不講「做什麼」,改講「誰負責、交付什麼、在哪裡確認」 |
| `a-strip` 作品帶(14 張) | Cases 頁的實績索引 | **縮到 6 張**,每張加類型與說明,導向案例頁 |
| `a-spectrum` 四種交付型態 | Solutions 的方案範圍 | **改角度**:不列功能,只答「適合誰 / 我們負責什麼」 |

### 動畫敘事功能判定
| 動畫 | 判定 |
|---|---|
| Hero 節點網路 7 幕 | 有敘事潛力但**幕數過多**(frag/link/group/pipe/days/net/core),且 pipe/days 與方法區重複 → 收斂為 4 幕 |
| Hero canvas(paintAbout) | 裝飾層,保留 |
| `data-count` 數字滾動 | 有意義,保留 |
| `a-method` 進度條 + 步驟高亮 | 有意義,保留;但版面要改 |
| `a-strip` 水平位移 | 目前**純裝飾**(14 張無說明的小圖)→ 改為 6 張具名交付證據 |
| `a-spectrum` hover 底色 | 輕度,保留 |

### 沒有資料、不得自行補寫
團隊成員姓名/照片/資歷、客戶數、SLA、資安認證、資料保存方式、合約條款。

---

## Phase 2 內容架構與文案資料
改 `About.dc.html` renderVals 內嵌資料 + `seo.js`。不動動畫。
驗收:probe 契約不變、無溢位。

## Phase 3 Hero 四幕敘事
改 `hero-config.js`(about scenes 7→4、totalVh 縮短)+ `About.dc.html` hero DOM 文案。
`about-hero.js` 的 `apply()` 以 `L[id] || L.net` 取用,移除 3 個 id 不會報錯。
驗收:`__pqHero.scenes === 4`、四幕文字對得上、無空白屏。

## Phase 4 新增「為什麼存在」與「三個工作原則」
純新增區塊,插在 hero 之後、數字之前。同步更新 `motion/about.motion.js` 章節。

## Phase 5 數字瘦身 + 六步驟版面重做 + 團隊角色
數字 4 → 2;六步驟橫向六窄卡 → 左說明 + 右 2×3 矩陣;新增「你會和誰一起工作」(角色架構,不捏造人名)。

## Phase 6 作品帶瘦身 + 交付範圍改角度 + AI 治理原則
14 張 → 6 張具名;四種型態改「適合誰 / 我們負責什麼」;新增治理原則區塊。

## Phase 7 CTA 統一、手機版、a11y、reduced-motion、最終驗收
CTA 全頁統一「預約 AI 導入評估」/「查看實際案例」;320–430px 不爆版;六視窗驗收。

## 驗證方式(本專案無 lint/typecheck/test/build)
`node .peakops-audit/run.mjs <url> <png> <W> <H> <p> .peakops-audit/about-probe.js [reduced]`
→ `python .peakops-audit/check.py <out>`(About 用 about-probe.js 的契約基準)
