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
    story: 'ONE SYSTEM, THREE OPERATIONS:散落工具 → 三層成形 → 接住 → 跟進 → 加溫 → 接通組裝 → 控制台',
    totalVh: { desktop: 380, tablet: 280, mobile: 190 },
    scenes: [
      { id: 'sig',     label: '各做各的',   kicker: 'SCENE 01 · SCATTERED',    line: '散落的 LINE、Excel、表單、報價與工作視窗,漂在三個深度層。',        d: [0, .12],   m: [0, .18] },
      { id: 'layers',  label: '三個系統層', kicker: 'SCENE 02 · THREE LAYERS', line: 'CAPTURE、FOLLOW、NURTURE 各自成形,但層與層之間資料還是斷的。',      d: [.12, .28], m: null },
      { id: 'cap',     label: '詢問被接住', kicker: 'SCENE 03 · CAPTURE',      line: 'LINE 詢問進入 CAPTURE:AI 辨識需求、服務、聯絡時間、是否轉真人。',  d: [.28, .43], m: [.18, .42] },
      { id: 'fol',     label: '跟進節奏',   kicker: 'SCENE 04 · FOLLOW',       line: '客戶卡進入 FOLLOW:DAY 1、3、5、7 跟進節奏、提醒與訊息草稿。',      d: [.43, .58], m: [.42, .64] },
      { id: 'nur',     label: '持續加溫',   kicker: 'SCENE 05 · NURTURE',      line: '內容、案例與優惠進入 NURTURE:標籤分群、內容排程。',                d: [.58, .72], m: null },
      { id: 'align',   label: '資料線接通', kicker: 'SCENE 06 · ALIGN',        line: '三層對齊,橘藍資料線接通;六個模組在後方組裝。',                     d: [.72, .88], m: [.64, .85] },
      { id: 'console', label: '營運控制台', kicker: 'SCENE 07 · CONSOLE',      line: '完整的 PeakQi AI 營運控制台成形。換你的流程跑一次。',               d: [.88, 1],   m: [.85, 1] }
    ],
    reduced: ['sig', 'layers', 'cap', 'fol', 'console'],
    ctas: [
      { kind: 'primary', label: '用我的流程跑一次 Demo', href: 'Demo.dc.html?case=接客追客養客整合流程', track: 'hero_demo_click' },
      { kind: 'ghost', label: '查看實際案例', href: 'Cases.dc.html', track: 'hero_case_click' }
    ],
    flags: {}
  },
  cases: {
    key: 'cases', paint: 'cases',
    story: 'PROOF IN MOTION:特寫 → 截圖牆 → 類別排列 → 重點案例 → 成果配對 → 作品索引 → CTA',
    totalVh: { desktop: 400, tablet: 300, mobile: 200 },
    scenes: [
      { id: 'detail', label: '先看細節',   kicker: 'SCENE 01 · CLOSE-UP', line: '先看 3 張案例截圖的局部細節——都是實際上線的畫面。',            d: [0, .14],   m: [0, .2] },
      { id: 'wall',   label: '鏡頭拉開',   kicker: 'SCENE 02 · THE WALL', line: '更多真實截圖以不同深度組成作品牆,全部取自實績頁。',            d: [.14, .3],  m: [.2, .45] },
      { id: 'sort',   label: '依類別排列', kicker: 'SCENE 03 · SORTED',   line: 'AI 系統、客製平台、品牌網站、營運工具,各自歸位。',              d: [.3, .46],  m: null },
      { id: 'focus',  label: '重點案例',   kicker: 'SCENE 04 · FOCUS',    line: '婚禮、室內設計、社群、房仲——BEFORE / SYSTEM / RESULT。',        d: [.46, .62], m: [.45, .72] },
      { id: 'proof',  label: '成果配對',   kicker: 'SCENE 05 · PROOF',    line: '成果數字與對應截圖配對;僅列該案例實際數據。',                  d: [.62, .78], m: null },
      { id: 'index',  label: '作品索引',   kicker: 'SCENE 06 · INDEX',    line: '透視牆收整成清楚網格——PeakQi 作品索引。',                      d: [.78, .91], m: [.72, .9] },
      { id: 'cta',    label: '換你的流程', kicker: 'SCENE 07 · YOUR TURN', line: '查看所有案例,或把這個流程套用到你的公司。',                    d: [.91, 1],   m: [.9, 1] }
    ],
    reduced: ['detail', 'wall', 'focus', 'proof', 'index'],
    ctas: [
      { kind: 'primary', label: '查看所有案例', href: '#index', track: 'hero_case_click' },
      { kind: 'ghost', label: '把這個流程套用到我的公司', href: 'Demo.dc.html?case=接客追客養客整合流程', track: 'hero_demo_click' }
    ],
    flags: {}
  },
  pricing: {
    key: 'pricing', paint: 'pricing',
    story: 'CONFIGURE YOUR OPERATING SYSTEM:空機架 → 接客組裝 → 業務助理 → 營運平台 → 並列比價 → 雙計費通道 → 穩定運作',
    totalVh: { desktop: 380, tablet: 290, mobile: 190 },
    scenes: [
      { id: 'racks',  label: '三個機架',   kicker: 'SCENE 01 · EMPTY RACKS',    line: '三個空的系統機架進場:接客、業務助理、營運平台。',                        d: [0, .12],   m: [0, .2] },
      { id: 'cap',    label: 'AI 接客組裝', kicker: 'SCENE 02 · CAPTURE UNIT',   line: 'AI 自動回覆、需求了解、預約、轉真人裝進第一座——NT$39,000,月費 2,500 起。', d: [.12, .26], m: null },
      { id: 'assist', label: '業務助理擴充', kicker: 'SCENE 03 · ASSISTANT UNIT', line: 'CRM、追蹤、跟進序列與分析加入——NT$78,000,月費 5,000 起。',               d: [.26, .4],  m: null },
      { id: 'plat',   label: '營運平台成形', kicker: 'SCENE 04 · PLATFORM UNIT',  line: '行銷、報價、專案、數據補齊——NT$128,000,月費 8,000 起。',                 d: [.4, .57],  m: [.2, .45] },
      { id: 'cmp',    label: '三方案並列',  kicker: 'SCENE 05 · SIDE BY SIDE',   line: 'NT$39,000/月 2,500 起・NT$78,000/月 5,000 起・NT$128,000/月 8,000 起。',   d: [.57, .72], m: [.45, .68] },
      { id: 'use',    label: '兩條計費通道', kicker: 'SCENE 06 · TWO CHANNELS',   line: '文字類 AI 走 Included 不限量;圖片/影片走 Usage-based,用多少算多少。',     d: [.72, .88], m: [.68, .88] },
      { id: 'run',    label: '系統穩定運作', kicker: 'SCENE 07 · RUNNING',        line: '選定方案,系統上線。用你的需求比較方案,或 15 分鐘 Demo。',                 d: [.88, 1],   m: [.88, 1] }
    ],
    reduced: ['racks', 'plat', 'cmp', 'use', 'run'],
    ctas: [
      { kind: 'primary', label: '用我的需求比較方案', href: '#p-selector', track: 'hero_case_click' },
      { kind: 'ghost', label: '預約 15 分鐘 Demo', href: 'Demo.dc.html', track: 'hero_demo_click' }
    ],
    flags: {}
  },
  about: {
    key: 'about', paint: 'about',
    story: 'BUILT FROM REAL WORKFLOWS:流程碎片 → 30+ 連線 → 8+ 產業分群 → 導入流程 → DAY 0–10 → 案例網路 → 品牌核心',
    totalVh: { desktop: 360, tablet: 280, mobile: 190 },
    scenes: [
      { id: 'frag',  label: '流程碎片',   kicker: 'SCENE 01 · FRAGMENTS',   line: 'LINE、CRM、報價、專案與網站畫面的細小局部——每一片都來自實際系統。', d: [0, .13],   m: [0, .2] },
      { id: 'link',  label: '30+ 連線',   kicker: 'SCENE 02 · CONNECTED',   line: '案例畫面沿資料線連起來:30+ 支已上線系統與網站。',                    d: [.13, .27], m: [.2, .42] },
      { id: 'group', label: '8+ 產業',    kicker: 'SCENE 03 · BY INDUSTRY', line: '依產業重新分群:8+ 個產業別實戰經驗。',                              d: [.27, .42], m: null },
      { id: 'pipe',  label: '導入流程',   kicker: 'SCENE 04 · WORKFLOW',    line: '理解場景 → 整理資料 → 建置模組 → 測試校準 → 上線。',                 d: [.42, .57], m: [.42, .62] },
      { id: 'days',  label: '10 個工作天', kicker: 'SCENE 05 · TEN DAYS',    line: 'DAY 0 到 DAY 10,節點克制地排開——最快 10 個工作天上線。',            d: [.57, .71], m: null },
      { id: 'net',   label: '案例網路',   kicker: 'SCENE 06 · THE NETWORK', line: '真實案例互相連成一張營運系統網;點節點可進對應案例。',               d: [.71, .88], m: [.62, .88] },
      { id: 'core',  label: '收束成核心', kicker: 'SCENE 07 · THE CORE',    line: '網路收束成 PeakQi 營運核心。讓我們先看你的流程。',                   d: [.88, 1],   m: [.88, 1] }
    ],
    reduced: ['frag', 'link', 'pipe', 'net', 'core'],
    ctas: [
      { kind: 'primary', label: '讓我們先看你的流程', href: 'Demo.dc.html', track: 'hero_demo_click' },
      { kind: 'ghost', label: '查看案例與作品', href: 'Cases.dc.html', track: 'hero_case_click' }
    ],
    flags: {}
  },
  demo: {
    key: 'demo', paint: 'demo',
    story: 'BUILD YOUR DEMO SCENE:空白控制台 → 產業節點 → 流程節點 → 你來組裝 → 相似案例 → 準備摘要 → 導向表單',
    totalVh: { desktop: 340, tablet: 260, mobile: 175 },
    scenes: [
      { id: 'wait',  label: '等待你的場景', kicker: 'SCENE 01 · WAITING',    line: '一條未完成的資料線、一座空白控制台——等待輸入你的場景。',            d: [0, .12],   m: [0, .15] },
      { id: 'ind',   label: '產業節點',     kicker: 'SCENE 02 · INDUSTRY',   line: '婚禮、室內設計、房仲、美業、電商、活動、ESG、社區、教育、品牌、其他。', d: [.12, .27], m: [.15, .4] },
      { id: 'flow',  label: '流程問題',     kicker: 'SCENE 03 · FRICTION',   line: 'LINE 客服、名單追蹤、報價提案、行銷內容、專案管理、數據報表、客製流程。', d: [.27, .42], m: [.4, .65] },
      { id: 'build', label: '你來組裝',     kicker: 'SCENE 04 · ASSEMBLE',   line: '在右側控制台選一個產業、一個流程——鍵盤與觸控都可以。',              d: [.42, .57], m: null },
      { id: 'match', label: '相似場景',     kicker: 'SCENE 05 · SIMILAR',    line: '有對應案例就直接看真實截圖;沒有就用通用流程 UI,不虛構客戶。',       d: [.57, .72], m: null },
      { id: 'sum',   label: '準備摘要',     kicker: 'SCENE 06 · SUMMARY',    line: '產業、問題、可能展示的模組、希望聯絡時間——不做成果保證。',           d: [.72, .88], m: [.65, .88] },
      { id: 'go',    label: '導向表單',     kicker: 'SCENE 07 · TO FORM',    line: '資料流接到表單,兩分鐘填完。',                                        d: [.88, 1],   m: [.88, 1] }
    ],
    reduced: ['wait', 'ind', 'flow', 'sum', 'go'],
    ctas: [
      { kind: 'primary', label: '開始填寫需求', href: '#pq-demo-grid', track: 'hero_demo_click' },
      { kind: 'ghost', label: '先查看相似案例', href: 'Cases.dc.html', track: 'hero_case_click' }
    ],
    flags: {}
  }
};
