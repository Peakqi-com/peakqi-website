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
    story: 'FROM INQUIRY TO OPERATION:一筆詢問 → 辨識回應 → 建檔 → 跟進 → 延續 → 接通 → 營運視圖',
    totalVh: { desktop: 380, tablet: 280, mobile: 190 },
    scenes: [
      { id: 'sig',     label: '詢問進來',   kicker: '階段 01 · 進入',    line: '一筆詢問從 LINE、網站或表單進來——原本它會停在聊天室裡等人處理。',        d: [0, .12],   m: [0, .18] },
      { id: 'layers',  label: '辨識需求',   kicker: '階段 02 · 辨識', line: 'AI 辨識需求、補齊欄位;價格與敏感內容標記為待人工確認。',      d: [.12, .28], m: null },
      { id: 'cap',     label: '回應與建檔', kicker: '階段 03 · 建檔',      line: '對話結束的同時,客戶、案件與下一步已寫進 CRM,並指定負責人。',  d: [.28, .43], m: [.18, .42] },
      { id: 'fol',     label: '安排下一步', kicker: '階段 04 · 跟進',       line: '系統依案件狀態提醒負責人;訊息由 AI 擬好,人確認才送出。',      d: [.43, .58], m: [.42, .64] },
      { id: 'nur',     label: '延續脈絡',   kicker: '階段 05 · 延續',      line: '報價、案例與後續服務沿用同一份客戶脈絡,不用重新整理。',                d: [.58, .72], m: null },
      { id: 'align',   label: '流程接通',   kicker: '階段 06 · 接通',        line: '既有工具保留;模組依流程斷點加入,資料線在後方接通。',                     d: [.72, .88], m: [.64, .85] },
      { id: 'console', label: '營運視圖',   kicker: '階段 07 · 管理',      line: '每一筆詢問在哪個階段、由誰負責、下一步是什麼——一個視圖看完。',               d: [.88, 1],   m: [.85, 1] }
    ],
    reduced: ['sig', 'layers', 'cap', 'fol', 'console'],
    ctas: [
      { kind: 'primary', label: '用我的流程跑一次', href: 'Demo.dc.html?case=接客追客養客整合流程', track: 'hero_demo_click' },
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
    story: 'PLAN YOUR FIRST PHASE:三種起步 → 接住詢問 → 推進案件 → 整合營運 → 並列比較 → 費用三部分通道 → 穩定運作',
    totalVh: { desktop: 380, tablet: 290, mobile: 190 },
    scenes: [
      { id: 'racks',  label: '三種起步',   kicker: '起步 01 · 三種範圍',    line: '接住詢問、推進案件、整合營運——三個起步範圍等你選。',                        d: [0, .12],   m: [0, .2] },
      { id: 'cap',    label: 'A 接住詢問', kicker: '起步 02 · A 方案',   line: '裝入知識查詢、回覆草稿、預約與人工轉接——先把詢問接住。', d: [.12, .26], m: null },
      { id: 'assist', label: 'B 推進案件', kicker: '起步 03 · B 方案', line: '新增 CRM、負責人與跟進——現在每一筆詢問都有下一步。',               d: [.26, .4],  m: null },
      { id: 'plat',   label: 'C 整合營運', kicker: '起步 04 · C 方案',  line: '加入行銷、報價、專案與數據——前台詢問接到後台交付。',                 d: [.4, .57],  m: [.2, .45] },
      { id: 'cmp',    label: '並列比較',  kicker: '起步 05 · 比較',   line: '三種起步範圍並列比較,實際範圍與費用依你的場景評估。',   d: [.57, .72], m: [.45, .68] },
      { id: 'use',    label: '費用三部分', kicker: '起步 06 · 計費',   line: '導入費(一次性)+ 平台月費 + 高成本 AI 用量,依實際使用計。',     d: [.72, .88], m: [.68, .88] },
      { id: 'run',    label: '開始運作', kicker: '起步 07 · 上線',        line: '選定起步範圍,第一階段上線。找出適合你的方案。',                 d: [.88, 1],   m: [.88, 1] }
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
    // 原本 7 幕(frag/link/group/pipe/days/net/core)有兩個問題:幕數過多、且 pipe/days
    // 與頁面下方的六步驟方法區重複講同一件事。收斂為 4 幕,對應四段敘事:
    // 看見碎片 → 找出斷點 → 建立流程 → 開始運作。
    // 沿用 about-hero.js 既有的 L.frag / L.link / L.group / L.net 佈局,引擎不動。
    story: 'BUILT FROM REAL WORKFLOWS:看見碎片 → 找出斷點 → 建立流程 → 開始運作',
    totalVh: { desktop: 250, tablet: 205, mobile: 160 },
    scenes: [
      { id: 'frag',  label: '看見碎片', kicker: '場景 01 / 04', line: '一次詢問,要在聊天、表單、試算表與內部訊息之間反覆搬運。', d: [0, .26],   m: [0, .28] },
      { id: 'link',  label: '找出斷點', kicker: '場景 02 / 04', line: '找出重複輸入、容易漏追、責任不清與資料無法流動的節點。',   d: [.26, .52], m: [.28, .55] },
      { id: 'group', label: '建立流程', kicker: '場景 03 / 04', line: 'AI 協助分類、摘要與草稿;重要判斷、敏感內容與例外仍由人確認。', d: [.52, .78], m: [.55, .8] },
      { id: 'net',   label: '開始運作', kicker: '場景 04 / 04', line: '完成第一階段驗證後,再依成效逐步擴大。',                     d: [.78, 1],   m: [.8, 1] }
    ],
    reduced: ['frag', 'link', 'group', 'net'],
    ctas: [
      { kind: 'primary', label: '看我們如何合作', href: '#a-method', track: 'about_method_click' },
      { kind: 'ghost', label: '查看實際案例', href: 'Cases.dc.html', track: 'hero_case_click' }
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
