// PeakQi 內頁 Hero 集中設定 — 場景、距離、顏色、camera/material 上限、reduced 資產、feature flags
// 共用元件在 hero-kit.js;各頁 Canvas 敘事在 hero-scenes.js。改 Hero 行為只改這一檔。
export const HERO_SHARED = {
  colors: { ink: '#090B0E', ivory: '#F2EFE8', orange: '#FF6B2C', blue: '#3E9BFF', green: '#65E0BC', panel: '#14171C', line: 'rgba(242,239,232,.16)' },
  dprMax: 1.5,                       // Canvas DPR 上限
  camera: { maxDriftPx: 22, maxRisePx: 44, maxTiltDeg: 0, pushScale: 0 }, // 內頁不做 camera push/tilt
  material: { grainAlpha: 0.032, glowMax: 0.16, lineW: 1.2, lineWMax: 2.2 },
  // reduced-motion 資產策略:不是 duration=0,而是 3–5 張靜態關鍵畫面(keyframe canvas + 場景文案)
  reducedAssets: { frameH: 150, frameHMobile: 120, gap: 18 },
  flags: {
    enabled: true,      // 全站 Hero 總開關(false = 全部退回靜態 fallback)
    canvas: true,       // Canvas 敘事層
    grain: true,        // Film grain(僅 full tier)
    idle: true,         // 停留時的微動(僅 full tier;lite/mobile 只跟捲動)
    progress: true,     // 場景進度指示
    media: true,        // 浮動 UI / 截圖層
    dataLines: true     // DOM/SVG 資料線層
  }
};

// 每個場景:id / label / kicker / line(場景文案)+ d(desktop 0–1 range)/ m(mobile;null=併入下一景)
// totalVh:pinned 總高(含 100vh 畫面)。desktop 260–420 / mobile 140–220。
export const heroConfig = {
  solutions: {
    key: 'solutions', paint: 'solutions',
    story: '一條訊息的旅程:進線 → 接住 → 跟進 → 加溫 → 六模組接管',
    totalVh: { desktop: 340, tablet: 250, mobile: 180 },
    scenes: [
      { id: 'sig',    label: '訊號進來',   kicker: 'SCENE 01 · INBOUND',  line: 'LINE、FB、IG、官網的詢問,同時進到同一條資料鏈。', d: [0, .15],   m: [0, .25] },
      { id: 'catch',  label: '30 秒接住',  kicker: 'SCENE 02 · CAPTURE',  line: 'AI 客服 30 秒內回應、判斷意圖、寫進 CRM。',        d: [.15, .32], m: [.25, .5] },
      { id: 'follow', label: '追客不漏',   kicker: 'SCENE 03 · FOLLOW',   line: 'DAY 1/3/5/7 自動跟進,該提醒的一件不漏。',          d: [.32, .5],  m: [.5, .75] },
      { id: 'warm',   label: '養客加溫',   kicker: 'SCENE 04 · NURTURE',  line: '分眾內容持續加溫,把「考慮中」推向下訂。',            d: [.5, .66],  m: null },
      { id: 'rack',   label: '六模組接管', kicker: 'SCENE 05 · SYSTEM',   line: '六個模組在同一個控制台各就各位。',                   d: [.66, .84], m: null },
      { id: 'cta',    label: '換你的場景', kicker: 'SCENE 06 · YOUR TURN', line: '15 分鐘,用你的產業把這條線重跑一遍。',              d: [.84, 1],   m: [.75, 1] }
    ],
    reduced: ['sig', 'catch', 'follow', 'rack', 'cta'],
    ctas: [
      { kind: 'primary', label: '預約 15 分鐘 Demo', href: 'Demo.dc.html', track: 'hero_demo_click' },
      { kind: 'ghost', label: '看實際案例', href: 'Cases.dc.html', track: 'hero_case_click' }
    ],
    flags: {}
  },
  cases: {
    key: 'cases', paint: 'cases',
    story: '打開交付檔案櫃:攤開 → 抽出 → 對焦 → 蓋章 → 產業版圖',
    totalVh: { desktop: 320, tablet: 240, mobile: 175 },
    scenes: [
      { id: 'wall',  label: '檔案牆拉開', kicker: 'SCENE 01 · ARCHIVE',    line: '30+ 支系統與網站的交付紀錄,一次攤開。',          d: [0, .16],   m: [0, .26] },
      { id: 'pull',  label: '抽出一格',   kicker: 'SCENE 02 · PULL',       line: '每一格都是實際上線的畫面,不是概念圖。',            d: [.16, .34], m: [.26, .52] },
      { id: 'focus', label: '對焦過程',   kicker: 'SCENE 03 · FOCUS',      line: '從需求訪談到上線,流程固定、進度可追。',            d: [.34, .52], m: null },
      { id: 'proof', label: '數字蓋章',   kicker: 'SCENE 04 · PROOF',      line: '回覆速度、跟進率、上線週期,用數字驗收。',          d: [.52, .7],  m: [.52, .78] },
      { id: 'map',   label: '八個產業',   kicker: 'SCENE 05 · INDUSTRIES', line: '婚慶、房仲、餐飲、健檢……版圖持續增加。',          d: [.7, .86],  m: null },
      { id: 'cta',   label: '你的產業',   kicker: 'SCENE 06 · YOUR TURN',  line: '想看你產業的版本,Demo 直接跑給你看。',            d: [.86, 1],   m: [.78, 1] }
    ],
    reduced: ['wall', 'pull', 'proof', 'cta'],
    ctas: [
      { kind: 'primary', label: '預約 15 分鐘 Demo', href: 'Demo.dc.html', track: 'hero_demo_click' },
      { kind: 'ghost', label: '看精選案例', href: '#stories', track: 'hero_case_click' }
    ],
    flags: {}
  },
  pricing: {
    key: 'pricing', paint: 'pricing',
    story: '機架由小到大:上架 A → 疊上 B → 滿載 C → 用量儀表 → 保證封條',
    totalVh: { desktop: 300, tablet: 230, mobile: 165 },
    scenes: [
      { id: 'frame', label: '價格先講清楚',      kicker: 'SCENE 01 · TRANSPARENT', line: '低建置費+月費;三個方案像機架,由小到大往上疊。', d: [0, .16],   m: [0, .24] },
      { id: 'pa',    label: '第一層:AI 接客',   kicker: 'SCENE 02 · PLAN A',      line: '建置 39,000、月費 2,500 起——先把詢問接住。',      d: [.16, .33], m: null },
      { id: 'pb',    label: '第二層:業務助理',  kicker: 'SCENE 03 · PLAN B',      line: '建置 78,000、月費 5,000 起——追客與提案一起上。',  d: [.33, .5],  m: [.24, .5] },
      { id: 'pc',    label: '第三層:營運平台',  kicker: 'SCENE 04 · PLAN C',      line: '建置 128,000、月費 8,000 起——整個營運面接管。',    d: [.5, .66],  m: null },
      { id: 'use',   label: '用量儀表',          kicker: 'SCENE 05 · USAGE',       line: '文字 AI 不限量;圖片、影片用多少算多少。',          d: [.66, .84], m: [.5, .76] },
      { id: 'sure',  label: '保證封條',          kicker: 'SCENE 06 · GUARANTEE',   line: '不綁約;30 天不滿意,依保證條款處理。',              d: [.84, 1],   m: [.76, 1] }
    ],
    reduced: ['frame', 'pb', 'use', 'sure'],
    ctas: [
      { kind: 'primary', label: '預約 15 分鐘 Demo', href: 'Demo.dc.html', track: 'hero_demo_click' },
      { kind: 'ghost', label: '直接比較三方案', href: '#p-selector', track: 'hero_case_click' }
    ],
    flags: {}
  },
  about: {
    key: 'about', paint: 'about',
    story: '內容力 × 系統力:兩座峰 → 稜線 → 里程碑 → 方法 → 營運網',
    totalVh: { desktop: 300, tablet: 230, mobile: 165 },
    scenes: [
      { id: 'peaks',  label: '兩座峰',   kicker: 'SCENE 01 · TWIN PEAKS', line: '內容力 × 系統力——PeakQi 名字的由來。',          d: [0, .16],   m: [0, .25] },
      { id: 'ridge',  label: '稜線成形', kicker: 'SCENE 02 · THE RIDGE',  line: '十年內容製作,長出一條通往系統的稜線。',          d: [.16, .34], m: [.25, .5] },
      { id: 'mile',   label: '里程碑',   kicker: 'SCENE 03 · MILESTONES', line: '30+ 支系統上線、8+ 個產業實戰。',                d: [.34, .54], m: [.5, .75] },
      { id: 'method', label: '方法',     kicker: 'SCENE 04 · METHOD',     line: '先看你的流程,再談要不要系統。',                  d: [.54, .72], m: null },
      { id: 'net',    label: '營運網',   kicker: 'SCENE 05 · NETWORK',    line: '接客、CRM、行銷、報價,接進同一張網。',            d: [.72, .88], m: null },
      { id: 'cta',    label: '先看流程', kicker: 'SCENE 06 · YOUR TURN',  line: '認識夠了,讓我們先看你的流程。',                  d: [.88, 1],   m: [.75, 1] }
    ],
    reduced: ['peaks', 'ridge', 'mile', 'cta'],
    ctas: [
      { kind: 'primary', label: '預約 15 分鐘 Demo', href: 'Demo.dc.html', track: 'hero_demo_click' },
      { kind: 'ghost', label: '看做過的東西', href: 'Cases.dc.html', track: 'hero_case_click' }
    ],
    flags: {}
  },
  demo: {
    key: 'demo', paint: 'demo',
    story: '從留下場景到 48 小時回覆:表單 → 對模組 → 現場跑 → 48H → 開始',
    totalVh: { desktop: 280, tablet: 220, mobile: 155 },
    scenes: [
      { id: 'leave', label: '留下你的場景', kicker: 'SCENE 01 · YOUR SCENARIO', line: '不用先懂 AI,先說目前最卡的流程。',            d: [0, .17],   m: [0, .25] },
      { id: 'match', label: '對上模組',     kicker: 'SCENE 02 · MATCH',         line: '我們挑對應模組,用你的產業做設定。',            d: [.17, .36], m: [.25, .52] },
      { id: 'run',   label: '現場跑一遍',   kicker: 'SCENE 03 · LIVE RUN',      line: '15 分鐘,把對話與流程實際跑給你看。',           d: [.36, .56], m: null },
      { id: 'clock', label: '48 小時內',    kicker: 'SCENE 04 · 48H',           line: '送出表單後,48 小時內收到回覆與時段。',          d: [.56, .76], m: [.52, .78] },
      { id: 'safe',  label: '不推銷',       kicker: 'SCENE 05 · NO PRESSURE',   line: '看完覺得不合用,直接說沒關係。',                d: [.76, .9],  m: null },
      { id: 'cta',   label: '表單就在下面', kicker: 'SCENE 06 · START',         line: '往下走,兩分鐘填完。',                          d: [.9, 1],    m: [.78, 1] }
    ],
    reduced: ['leave', 'match', 'clock', 'cta'],
    ctas: [
      { kind: 'primary', label: '直接填表單', href: '#pq-demo-grid', track: 'hero_demo_click' },
      { kind: 'ghost', label: '先選 Demo 場景', href: '#scene', track: 'hero_case_click' }
    ],
    flags: {}
  }
};
