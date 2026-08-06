// PeakQi 內頁 Hero 集中設定 — 場景、距離、顏色、camera/material 上限、reduced 資產、feature flags
// 共用元件在 hero-kit.js;各頁 Canvas 敘事在 hero-scenes.js。改 Hero 行為只改這一檔。
// i18n(Phase 1):label/kicker/line/cta label 走 t(zh,en);href 內的中文查詢參數是識別鍵,不翻。
import { t, LANG } from './i18n.js';
// EN 頁 hero CTA 站內連結自動加 /en 前綴(錨點與外部連結不動)
const ep = (h) => (LANG === 'en' && h.charAt(0) === '/' ? '/en' + h : h);
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
    story: 'FROM INQUIRY TO OPERATION:詢問 → 辨識 → 建檔 → 跟進 → 延續 → 接通 → 營運視圖',
    totalVh: { desktop: 380, tablet: 280, mobile: 320 },
    scenes: [
      { id: 'sig',     label: t('詢問進來', 'Inquiry in'),      kicker: t('階段 01 · 進入', 'Stage 01 · Intake'),      line: t('詢問從 LINE、網站或表單進來,原本得等人處理。', 'Inquiries arrive from LINE, web or forms — they used to wait for a person.'),        d: [0, .12],   m: [0, .13] },
      { id: 'layers',  label: t('辨識需求', 'Read the need'),   kicker: t('階段 02 · 辨識', 'Stage 02 · Triage'),      line: t('AI 辨識需求、補齊欄位;價格與敏感由人確認。', 'AI reads the need and fills the fields; pricing and sensitive calls stay human.'),      d: [.12, .28], m: [.13, .28] },
      { id: 'cap',     label: t('回應與建檔', 'Reply & record'), kicker: t('階段 03 · 建檔', 'Stage 03 · Record'),      line: t('對話結束,案件與下一步已進 CRM,指定負責人。', 'By the end of the chat, the deal and next step are in the CRM with an owner.'),  d: [.28, .43], m: [.28, .43] },
      { id: 'fol',     label: t('安排下一步', 'Next step'),      kicker: t('階段 04 · 跟進', 'Stage 04 · Follow up'),   line: t('依案件狀態提醒負責人;AI 先擬稿,人再送出。', 'Status-based nudges to the owner; AI drafts, people send.'),      d: [.43, .58], m: [.43, .58] },
      { id: 'nur',     label: t('延續脈絡', 'Keep the thread'),  kicker: t('階段 05 · 延續', 'Stage 05 · Continue'),    line: t('報價與後續服務沿用同一份客戶脈絡。', 'Quotes and follow-on service reuse the same customer context.'),                d: [.58, .72], m: [.58, .72] },
      { id: 'align',   label: t('流程接通', 'Wired together'),   kicker: t('階段 06 · 接通', 'Stage 06 · Connect'),     line: t('既有工具保留;模組依斷點加入,資料線接通。', 'Keep your tools; modules plug into the gaps and the data lines connect.'),                     d: [.72, .88], m: [.72, .87] },
      { id: 'console', label: t('營運視圖', 'Operations view'),  kicker: t('階段 07 · 管理', 'Stage 07 · Manage'),      line: t('每筆詢問的階段、負責人與下一步,一眼看完。', 'Every inquiry: stage, owner and next step, at a glance.'),               d: [.88, 1],   m: [.87, 1] }
    ],
    reduced: ['sig', 'layers', 'cap', 'fol', 'console'],
    ctas: [
      { kind: 'primary', label: t('用我的流程跑一次', 'Run it on my workflow'), href: ep('/demo?case=接客追客養客整合流程'), track: 'hero_demo_click' },
      { kind: 'ghost', label: t('查看實際案例', 'See real cases'), href: ep('/cases'), track: 'hero_case_click' }
    ],
    flags: {}
  },
  cases: {
    key: 'cases', paint: 'cases',
    story: 'PROOF IN MOTION:婚禮 → 室內設計 → 房仲 → 美業 → 換你的流程(場域情境,無截圖)',
    totalVh: { desktop: 340, tablet: 260, mobile: 265 },
    scenes: [
      { id: 'wed', label: t('婚禮婚慶', 'Weddings'),        kicker: t('場域 01', 'Field 01'), line: t('半夜的檔期詢問 AI 先接住,細節再由人確認。', 'AI catches the 2 a.m. date inquiry; a person confirms the details.'),   d: [0, .2],    m: [0, .2] },
      { id: 'int', label: t('室內設計', 'Interior design'), kicker: t('場域 02', 'Field 02'), line: t('需求與預算先整理成案件卡,設計師再接手。', 'Needs and budget become a deal card before the designer steps in.'),             d: [.2, .4],   m: [.2, .4] },
      { id: 'rea', label: t('房仲不動產', 'Real estate'),   kicker: t('場域 03', 'Field 03'), line: t('「這間還在嗎?」自動對上物件與帶看時段。', '"Is this one still available?" auto-matches the listing and a viewing slot.'),            d: [.4, .6],   m: [.4, .6] },
      { id: 'bea', label: t('美業預約', 'Beauty bookings'), kicker: t('場域 04', 'Field 04'), line: t('預約、改期與前一日提醒自動完成。', 'Bookings, rescheduling and day-before reminders run themselves.'),               d: [.6, .8],   m: [.6, .8] },
      { id: 'sum', label: t('換你的流程', 'Your turn'),     kicker: t('場域 05', 'Field 05'), line: t('同一套系統接住不同場域,換你的流程跑一次。', 'One system, many fields — now run it on your workflow.'),           d: [.8, 1],    m: [.8, 1] }
    ],
    reduced: ['wed', 'rea', 'sum'],
    ctas: [
      { kind: 'primary', label: t('查看所有案例', 'Browse all cases'), href: '#index', track: 'hero_case_click' },
      { kind: 'ghost', label: t('把這個流程套用到我的公司', 'Apply this to my company'), href: ep('/demo?case=接客追客養客整合流程'), track: 'hero_demo_click' }
    ],
    flags: {}
  },
  pricing: {
    key: 'pricing', paint: 'pricing',
    story: 'PLAN YOUR FIRST PHASE:三種起步 → A 接住 → B 推進 → C 整合 → 比較 → 計費 → 上線',
    totalVh: { desktop: 380, tablet: 290, mobile: 250 },
    scenes: [
      { id: 'racks',  label: t('三種起步', 'Three starts'),      kicker: t('起步 01 · 三種範圍', 'Start 01 · Three scopes'), line: t('接住詢問、推進案件、整合營運——三種起步。', 'Capture inquiries, move deals, integrate ops — three ways in.'),                        d: [0, .12],   m: [0, .2] },
      { id: 'cap',    label: t('A 接住詢問', 'A · Capture'),     kicker: t('起步 02 · A 方案', 'Start 02 · Plan A'),   line: t('知識查詢、草稿、預約與轉接,先把詢問接住。', 'Knowledge answers, drafts, bookings and handoffs — catch every inquiry first.'), d: [.12, .26], m: null },
      { id: 'assist', label: t('B 推進案件', 'B · Move deals'),  kicker: t('起步 03 · B 方案', 'Start 03 · Plan B'),   line: t('再加上 CRM、負責人與跟進,每筆詢問有下一步。', 'Add CRM, owners and follow-ups — every inquiry gets a next step.'),               d: [.26, .4],  m: null },
      { id: 'plat',   label: t('C 整合營運', 'C · Integrate'),   kicker: t('起步 04 · C 方案', 'Start 04 · Plan C'),   line: t('再加入行銷、報價與數據,前台接到後台交付。', 'Add marketing, quotes and insights — front line straight to delivery.'),                 d: [.4, .57],  m: [.2, .45] },
      { id: 'cmp',    label: t('並列比較', 'Side by side'),      kicker: t('起步 05 · 比較', 'Start 05 · Compare'),    line: t('三種範圍並列比較,實際費用依場景評估。', 'Three scopes side by side; actual cost is scoped to your scenario.'),   d: [.57, .72], m: [.45, .68] },
      { id: 'use',    label: t('費用三部分', 'Three cost parts'), kicker: t('起步 06 · 計費', 'Start 06 · Billing'),   line: t('導入費+月費+高成本 AI 用量,依實際使用計。', 'Setup + monthly + high-cost AI usage, billed as used.'),     d: [.72, .88], m: [.68, .88] },
      { id: 'run',    label: t('開始運作', 'Up and running'),    kicker: t('起步 07 · 上線', 'Start 07 · Launch'),     line: t('選定起步範圍,第一階段上線。', 'Pick your starting scope and launch Phase 1.'),                 d: [.88, 1],   m: [.88, 1] }
    ],
    reduced: ['racks', 'plat', 'cmp', 'use', 'run'],
    ctas: [
      { kind: 'primary', label: t('用我的需求比較方案', 'Compare plans for my needs'), href: '#p-selector', track: 'hero_case_click' },
      { kind: 'ghost', label: t('預約 15 分鐘 Demo', 'Book a 15-min call'), href: ep('/demo'), track: 'hero_demo_click' }
    ],
    flags: {}
  },
  about: {
    key: 'about', paint: 'aboutOrganic',
    // 2026-08 重設計:撤掉案例截圖牆,改「生長的墨枝」有機生成視覺(about-organic.js),
    // 五幕 = PeakQi 五個核心:創意 → 細節 → 數位內容 → 文化轉型 → 技術力。
    story: 'FIVE CORES, ONE ORGANISM:創意 → 細節 → 數位內容 → 文化轉型 → 技術力',
    totalVh: { desktop: 300, tablet: 245, mobile: 240 },
    scenes: [
      { id: 'idea',    label: t('創意', 'Creativity'),        kicker: t('場景 01 / 05', 'Scene 01 / 05'), line: t('從品牌到互動,每一次都當作品開一次頭。', 'From brand to interaction, every project starts as a fresh piece of work.'), d: [0, .2],   m: [0, .2] },
      { id: 'craft',   label: t('細節', 'Detail'),            kicker: t('場景 02 / 05', 'Scene 02 / 05'), line: t('字距、動線、例外訊息,一條一條修過。', 'Kerning, flows, error states — tuned line by line.'),   d: [.2, .4],  m: [.2, .4] },
      { id: 'content', label: t('數位內容', 'Digital content'), kicker: t('場景 03 / 05', 'Scene 03 / 05'), line: t('圖、文、影音接上系統,持續長出來、持續可用。', 'Images, copy and video wired into the system — always growing, always usable.'), d: [.4, .6], m: [.4, .6] },
      { id: 'culture', label: t('文化轉型', 'Culture shift'),  kicker: t('場景 04 / 05', 'Scene 04 / 05'), line: t('陪團隊把做事方式換季,而不是丟一套工具就走。', 'We help teams change how they work — not just drop off a tool.'), d: [.6, .8], m: [.6, .8] },
      { id: 'tech',    label: t('技術力', 'Engineering'),      kicker: t('場景 05 / 05', 'Scene 05 / 05'), line: t('47 個模組的引擎,一行一行寫出來、一段一段接上線。', 'A 47-module engine, written line by line and shipped piece by piece.'), d: [.8, 1], m: [.8, 1] }
    ],
    reduced: ['idea', 'content', 'tech'],
    ctas: [
      { kind: 'primary', label: t('看我們如何合作', 'How we work together'), href: '#a-method', track: 'about_method_click' },
      { kind: 'ghost', label: t('查看實際案例', 'See real cases'), href: ep('/cases'), track: 'hero_case_click' }
    ],
    flags: {}
  },
  method: {
    key: 'method', paint: 'method',
    story: 'HOW WE DELIVER:盤點現況 → 定義第一階段 → 建立驗證 → 上線與持續改善',
    totalVh: { desktop: 300, tablet: 235, mobile: 250 },
    scenes: [
      { id: 'map',   label: t('盤點現況', 'Map the present'),  kicker: t('階段 1 / 4', 'Stage 1 / 4'), line: t('找出詢問從哪進來、案件停在哪,產出問題清單。', 'Find where inquiries enter and deals stall; produce the problem list.'), d: [0, .26],   m: [0, .28] },
      { id: 'goal',  label: t('定義第一階段', 'Define Phase 1'), kicker: t('階段 2 / 4', 'Stage 2 / 4'), line: t('定出範圍與人工確認邊界,先做最有價值的一段。', 'Set the scope and the human-approval line; build the highest-value slice first.'), d: [.26, .5],  m: [.28, .55] },
      { id: 'pilot', label: t('建立驗證', 'Build the pilot'),    kicker: t('階段 3 / 4', 'Stage 3 / 4'), line: t('接出流程讓使用者實測,確認閘門就在裡面。', 'Wire the flow, let real users test it — approval gates built in.'), d: [.5, .76],  m: [.55, .8] },
      { id: 'live',  label: t('上線與改善', 'Launch & improve'), kicker: t('階段 4 / 4', 'Stage 4 / 4'), line: t('標準模組最快 10 個工作天上線,再依使用調整。', 'Standard modules go live in as little as 10 working days, then tune from usage.'), d: [.76, 1],   m: [.8, 1] }
    ],
    reduced: ['map', 'goal', 'pilot', 'live'],
    ctas: [
      { kind: 'primary', label: t('預約 AI 導入評估', 'Build your Phase-1 draft'), href: ep('/demo'), track: 'hero_demo_click' },
      { kind: 'ghost', label: t('查看實際案例', 'See real cases'), href: ep('/cases'), track: 'hero_case_click' }
    ],
    flags: {}
  },
  demo: {
    key: 'demo', paint: 'demo',
    story: 'BUILD YOUR FIRST AI FLOW:選擇情境 → 找出卡點 → 組合第一階段 → 確認並送出',
    totalVh: { desktop: 340, tablet: 260, mobile: 215 },
    scenes: [
      { id: 'ind',   label: t('選擇情境', 'Pick a scenario'),    kicker: t('任務 1 / 4', 'Task 1 / 4'), line: t('先選產業情境,案例與流程示意跟著更新。', 'Pick your industry; the cases and flow preview update with it.'), d: [0, .25],   m: [0, .28] },
      { id: 'flow',  label: t('找出卡點', 'Find the snag'),      kicker: t('任務 2 / 4', 'Task 2 / 4'), line: t('勾選最卡的流程,草稿即時加入對應節點。', 'Tick the flow that hurts; the draft adds the matching nodes live.'),     d: [.25, .5],  m: [.28, .55] },
      { id: 'build', label: t('組合第一階段', 'Assemble Phase 1'), kicker: t('任務 3 / 4', 'Task 3 / 4'), line: t('核對能力與人工確認邊界,組成第一版草稿。', 'Check capabilities and the human-approval line; assemble draft one.'),   d: [.5, .78],  m: [.55, .8] },
      { id: 'go',    label: t('確認並送出', 'Confirm & send'),   kicker: t('任務 4 / 4', 'Task 4 / 4'), line: t('草稿自動帶入表單,補上聯絡方式就能送出討論。', 'The draft fills the form — add contact info and send it over.'),       d: [.78, 1],   m: [.8, 1] }
    ],
    reduced: ['ind', 'flow', 'build', 'go'],
    ctas: [
      { kind: 'primary', label: t('開始填寫需求', 'Start the form'), href: '#pq-demo-grid', track: 'hero_demo_click' },
      { kind: 'ghost', label: t('先查看相似案例', 'See similar cases first'), href: ep('/cases'), track: 'hero_case_click' }
    ],
    // (2026-08)草稿面板已移出 hero 成獨立 #draft section,右欄改 data-hero-canvaszone
    // 畫布舞台 —— canvas 重新開啟,四任務主題動畫由 paintDemo 繪製。
    flags: {}
  }
};
