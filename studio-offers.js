// 奇鋒國際 PeakQi — 接案頁(/studio)資料層:接案方式、模組價格、可承接方向、核心能力
// 中英雙語走 t(zh, en)(與 content.js 同一套機制);中文站回傳原文,/en/ 頁自動取英文。
//
// ★ 價格怎麼填(整站只有這一個地方要改)★
//   每一項的 price 目前都是 TBD(顯示「報價待定 / Quote TBD」)。要公開價格時,
//   把該項的 price 換成 t('NT$ 60,000 起', 'From NT$60,000') 這樣一行即可 ——
//   版面已經替價格留好位置(接案方式的大價格列、模組表的價格欄),
//   填了就直接顯示,不必改任何 HTML 或 CSS。
//   unit 是價格底下那行小字(計價單位),同樣可留白。
//
// 內容原則(與全站一致):不寫沒有事實根據的數字、時程、保證與 SLA。
// 這裡的「做過的事」全部對得上 content.js 的 portfolioAI / portfolioWeb / worksFeatured。
import { t } from './i18n.js';

// 尚未公開的價格一律用這個標記(而不是留白):版面才不會塌,也不會被誤讀成免費
export const TBD = t('報價待定', 'Quote TBD');

// ── 一、接案方式:三種合作形狀(頁面頂部「接案與模組價格」保留區的左半) ──
export const engagements = [
  {
    key: 'project', code: 'P-01',
    name: t('專案制', 'Project'),
    tag: t('一次交付一個成品', 'One build, delivered'),
    who: t('已經知道要做什麼:一個官網、一套系統,或一個平台。', 'You know what you need: a site, a system or a platform.'),
    includes: [
      t('需求盤點與範圍確認', 'Scoping and requirements'),
      t('設計、開發、測試到上線', 'Design, build, test, launch'),
      t('原始碼與操作文件交接', 'Source code and docs handover')
    ],
    price: TBD, unit: t('依專案範圍', 'Per project scope'),
    accent: '#FF6B2C'
  },
  {
    key: 'modules', code: 'P-02',
    name: t('模組加購', 'Modules'),
    tag: t('在既有系統上加一塊', 'Add one piece at a time'),
    who: t('系統已經在跑,只缺某一段功能或某一條串接。', 'Your system runs already — one capability or integration is missing.'),
    includes: [
      t('單一模組建置與串接', 'One module, built and wired in'),
      t('與現有資料與權限對接', 'Fits your existing data and roles'),
      t('可逐月累加,不必一次到位', 'Stack them month by month')
    ],
    price: TBD, unit: t('依模組計價', 'Per module'),
    accent: '#3E9BFF'
  },
  {
    key: 'retainer', code: 'P-03',
    name: t('長期夥伴', 'Retainer'),
    tag: t('每月固定產能', 'Reserved capacity'),
    who: t('要持續開發與調整,希望有一組固定的人接住。', 'You keep shipping and tuning, and want a team that stays.'),
    includes: [
      t('每月固定開發與調整時數', 'Reserved build and tuning hours'),
      t('上線後的維運與監看', 'Upkeep and monitoring after launch'),
      t('優先排程與定期檢視', 'Priority scheduling and reviews')
    ],
    price: TBD, unit: t('每月計費', 'Monthly'),
    accent: '#65E0BC'
  }
];
export const engagementNote = t(
  '三種形狀可以混用:先用專案制把第一段做出來,之後以模組加購擴充,穩定後轉長期夥伴。',
  'Mix them: ship the first slice as a project, extend it module by module, then move to a retainer.'
);

// ── 二、模組價格表(保留區的右半):16 個可獨立報價的模組 ──
export const moduleGroups = [
  {
    key: 'capture', n: '01',
    name: t('接客與客戶', 'Capture & customers'),
    items: [
      { key: 'intake', name: t('AI 接客助理', 'AI intake assistant'), d: t('自動回應詢問、擷取需求欄位、引導預約。', 'Answers inquiries, extracts needs, guides bookings.'), price: TBD },
      { key: 'kb', name: t('知識庫問答', 'Knowledge Q&A'), d: t('用核准過的內容回答,答不了就轉人工。', 'Answers from approved content; escalates when unsure.'), price: TBD },
      { key: 'crm', name: t('CRM 客戶與案件', 'CRM records & deals'), d: t('對話變成客戶資料、目前階段與負責人。', 'Turns chats into records, stages and owners.'), price: TBD },
      { key: 'follow', name: t('跟進提醒', 'Follow-up reminders'), d: t('依案件狀態提醒,AI 先擬稿、人再送出。', 'Status-based nudges; AI drafts, people send.'), price: TBD }
    ]
  },
  {
    key: 'deliver', n: '02',
    name: t('業務與交付', 'Sales & delivery'),
    items: [
      { key: 'quote', name: t('線上報價', 'Online quotes'), d: t('報價單、稅額計算與 PDF / Excel 匯出。', 'Quote sheets, tax math, PDF / Excel export.'), price: TBD },
      { key: 'project', name: t('專案與任務', 'Projects & tasks'), d: t('成交後接進時程、任務與交付追蹤。', 'Closed deals flow into schedules and tasks.'), price: TBD },
      { key: 'dash', name: t('營運儀表板', 'Operations dashboard'), d: t('看見詢問從哪進來、停在哪一個階段。', 'See where inquiries enter and where they stall.'), price: TBD }
    ]
  },
  {
    key: 'wire', n: '03',
    name: t('通路與串接', 'Channels & integration'),
    items: [
      { key: 'line', name: t('LINE 官方帳號串接', 'LINE OA integration'), d: t('官方帳號、群組機器人與推播通知。', 'Official account, group bots and push messages.'), price: TBD },
      { key: 'api', name: t('既有工具串接', 'Existing-tool integration'), d: t('把現在在用的系統以 API 接進流程。', 'Wires the tools you already run into the flow.'), price: TBD },
      { key: 'migrate', name: t('資料遷移與清理', 'Data migration & cleanup'), d: t('舊名單、表單與試算表整理進新系統。', 'Old lists, forms and sheets, moved in clean.'), price: TBD },
      { key: 'roles', name: t('多角色權限', 'Roles & permissions'), d: t('部門、職務與資料可見範圍的分層控制。', 'Layered access by team, role and data scope.'), price: TBD }
    ]
  },
  {
    key: 'face', n: '04',
    name: t('內容與介面', 'Content & interface'),
    items: [
      { key: 'site', name: t('品牌官網', 'Brand site'), d: t('品牌敘事、響應式版面、表單與 SEO 基礎。', 'Brand narrative, responsive layout, forms, SEO.'), price: TBD },
      { key: 'motion', name: t('互動動畫與 3D', 'Motion & 3D'), d: t('捲動分鏡、Canvas 2D、WebGL 與 3D 模型。', 'Scroll storytelling, Canvas 2D, WebGL and 3D.'), price: TBD },
      { key: 'image', name: t('AI 影像生成', 'AI image generation'), d: t('空間渲染、風格模擬、試穿試妝與商品圖。', 'Space renders, style previews, try-ons, product shots.'), price: TBD },
      { key: 'video', name: t('AI 短影音', 'AI short video'), d: t('社群短影音與素材,接上發布排程。', 'Social clips and assets, wired to a publish schedule.'), price: TBD },
      { key: 'i18n', name: t('中英雙語與 SEO', 'Bilingual & SEO'), d: t('雙路徑雙語站、hreflang 與結構化資料。', 'Dual-path bilingual site, hreflang, structured data.'), price: TBD }
    ]
  }
];

export const priceNotes = [
  t('每個模組都可以單獨報價,也可以組進同一個專案一起做。', 'Every module can be quoted on its own or bundled into one project.'),
  t('標準模組的第一階段最快 10 個工作天上線;完整垂直平台或大型客製系統參考時程約六週起。', 'A Phase-1 launch on standard modules can go live in as little as 10 working days; full vertical platforms and large custom builds start around six weeks.'),
  t('實際費用與工期依需求範圍、既有系統與資料狀況評估,報價前會先把範圍寫清楚。', 'Cost and timeline are scoped to your needs, existing systems and data. We write the scope down before quoting.')
];

// ── 三、可以承接的方向:證據全部對得上 content.js 的作品清單 ──
export const directions = [
  {
    key: 'ai', n: '01', accent: '#FF6B2C',
    name: t('AI 系統與 Agent', 'AI systems & agents'),
    line: t('讓系統先接住、先整理,再交給人判斷。', 'The system catches and sorts first; people decide.'),
    d: t('AI 接客與客服、知識庫問答、需求擷取、文件與報告生成、對話摘要,並保留人工確認的閘門。', 'AI intake and support, knowledge Q&A, need extraction, document and report generation, chat summaries — with human approval gates built in.'),
    works: [t('婚禮產業 AI 大禮包', 'Wedding Industry AI Suite'), t('AI LINE 群組摘要', 'AI LINE Group Digest'), t('AutoDraft 補助王', 'AutoDraft Grant Writer'), t('AI 神農氏', 'AI Shennong')],
    out: t('可上線的對話流程、知識庫與後台', 'A live conversation flow, knowledge base and back office')
  },
  {
    key: 'sys', n: '02', accent: '#3E9BFF',
    name: t('客製系統與平台', 'Custom systems & platforms'),
    line: t('流程特殊、現成工具接不起來時的那一套。', 'For the flow no off-the-shelf tool can hold.'),
    d: t('CRM、報價、專案與任務、電商與團購、售票、倉儲監控、社區與租屋管理——含後台、權限與報表。', 'CRM, quoting, projects and tasks, commerce and group-buy, ticketing, warehouse monitoring, community and rental management — with back office, permissions and reports.'),
    works: [t('牽成 任務回報', 'Chian-Sing task reporting'), t('團購通 電商 × LINE', 'GroupBuy Go commerce × LINE'), t('SparkSpace 倉儲監控', 'SparkSpace warehouse monitor'), t('社區管理 APP', 'Community management app')],
    out: t('正式上線的系統、後台與操作文件', 'A live system, back office and operating docs')
  },
  {
    key: 'web', n: '03', accent: '#E06B9C',
    name: t('品牌官網與體驗網站', 'Brand sites & web experiences'),
    line: t('會動、會說故事,而且真的跑得動的網站。', 'Sites that move, tell the story and still run fast.'),
    d: t('品牌敘事與版面、捲動分鏡動畫、Canvas 2D 與 WebGL、3D 模型、雙語與 SEO 基礎建設。', 'Brand narrative and layout, scroll-driven storytelling, Canvas 2D and WebGL, 3D models, bilingual builds and SEO foundations.'),
    works: [t('嘉義市世博會官網', 'Chiayi Expo official site'), t('ROUZHI 品牌官網', 'ROUZHI brand site'), t('OUROS 課程網站', 'OUROS course site'), t('DOIIIN ESG 平台', 'DOIIIN ESG platform')],
    out: t('可自行維護的網站與內容結構', 'A site and content structure your team can maintain')
  },
  {
    key: 'media', n: '04', accent: '#65E0BC',
    name: t('AI 影像與影片', 'AI image & video'),
    line: t('消費前先看到效果,決定就快了。', 'People decide faster when they can see it first.'),
    d: t('空間渲染、風格模擬、婚紗試穿與髮妝預覽、商品情境圖、社群短影音,接上發布與追蹤流程。', 'Space renders, style previews, dress try-ons and makeup previews, product scenes and social video — wired into publishing and tracking.'),
    works: [t('AI Interior Pro 空間渲染', 'AI Interior Pro renders'), t('AI Wedding Pro 試穿模擬', 'AI Wedding Pro try-on'), t('念映 AI 影片', 'Memora AI video')],
    out: t('可重複使用的生成流程與素材庫', 'A repeatable generation flow and asset library')
  },
  {
    key: 'ops', n: '05', accent: '#F2B33D',
    name: t('系統整合與自動化', 'Integration & automation'),
    line: t('既有工具留著,把中間那一段接起來。', 'Keep your tools — we connect the gap between them.'),
    d: t('LINE 官方帳號、CRM 與試算表、既有系統 API、資料遷移、排程與通知,把手動轉貼的那一段拿掉。', 'LINE official accounts, CRM and spreadsheets, existing-system APIs, data migration, scheduling and alerts — removing the copy-paste step.'),
    works: [t('冒泡 房仲 AI 助手', 'Bubble real-estate assistant'), t('心途 LINE 定課工具', 'Xintu LINE course tool'), t('Pounds Network 會員平台', 'Pounds Network loyalty platform')],
    out: t('接通的資料線與可監看的自動流程', 'Connected data lines and automations you can watch')
  }
];

// ── 四、核心能力:每一條都指得出站上或作品清單裡的實體 ──
export const capabilities = [
  { key: 'scope', name: t('流程盤點與範圍切割', 'Scoping & process design'), d: t('先找出卡在哪,再決定第一階段做哪一段。', 'Find where it stalls, then decide what Phase 1 covers.'), proof: t('六階段導入方法', 'A six-stage delivery method') },
  { key: 'ai', name: t('AI 應用工程', 'Applied AI engineering'), d: t('知識庫、需求擷取、判斷邊界與人工確認閘門。', 'Knowledge bases, extraction, decision limits, approval gates.'), proof: t('47 模組引擎', 'A 47-module engine') },
  { key: 'full', name: t('全端產品開發', 'Full-stack product build'), d: t('前台後台、權限、串接與部署一起做完。', 'Front end, back office, permissions, integrations, deploy.'), proof: t('30+ 已上線系統與網站', '30+ systems and sites shipped') },
  { key: 'motion', name: t('即時圖形與動畫', 'Real-time graphics & motion'), d: t('Canvas 2D、WebGL、3D 模型與捲動分鏡。', 'Canvas 2D, WebGL, 3D models and scroll storytelling.'), proof: t('本站的捲動分鏡引擎', "This site's scroll engine") },
  { key: 'data', name: t('資料串接與自動化', 'Data & automation'), d: t('LINE、CRM、試算表、既有系統與 API 串成一條。', 'LINE, CRM, sheets, existing systems and APIs in one line.'), proof: t('8+ 導入過的產業情境', '8+ industries deployed') },
  { key: 'i18n', name: t('雙語內容與 SEO', 'Bilingual content & SEO'), d: t('中英雙路徑、hreflang、結構化資料與網站地圖。', 'Dual-path zh/en, hreflang, structured data, sitemaps.'), proof: t('本站中英雙語 16 頁', '16 bilingual pages on this site') }
];

// ── 五、一個案子怎麼跑:對齊 Method 頁的六階段,但講的是接案視角 ──
export const runway = [
  { n: '01', d: t('第 1 次會議', 'First call'), t: t('聊清楚要解決什麼', 'What are we solving'), o: t('問題清單與可行方向', 'Problem list and directions') },
  { n: '02', d: t('3–5 個工作天', '3–5 working days'), t: t('範圍、模組與報價', 'Scope, modules, quote'), o: t('書面範圍與報價單', 'Written scope and quote') },
  { n: '03', d: t('啟動', 'Kickoff'), t: t('資料、帳號與窗口就位', 'Data, accounts, owners in place'), o: t('專案排程與里程碑', 'Schedule and milestones') },
  { n: '04', d: t('每週', 'Weekly'), t: t('可以點的版本,不是簡報', 'A clickable build, not a deck'), o: t('每週可操作的進度版本', 'A working build every week') },
  { n: '05', d: t('上線', 'Launch'), t: t('測試、權限與例外處理', 'Testing, permissions, exceptions'), o: t('正式上線版本', 'The live release') },
  { n: '06', d: t('交接之後', 'After handover'), t: t('原始碼、文件與教學', 'Source, docs and training'), o: t('可自行維護或續約維運', 'Maintain it yourself, or keep us on') }
];

// 需要對方提供什麼(不是合約條款,是開工前提)
export const prereq = [
  t('一位可以做決定的窗口', 'One person who can make calls'),
  t('現有流程、資料與帳號的存取', 'Access to your flow, data and accounts'),
  t('每週一次、約 30 分鐘的確認時間', 'About 30 minutes a week to confirm')
];

export const studioCta = {
  title: t('把你的專案講一次,我們回你一份範圍', 'Tell us the project — we send back a scope'),
  line: t('先寫下你要解決的事,我們會回覆可行方向、模組組合與報價。', 'Describe what you need solved. We reply with directions, a module mix and a quote.'),
  primary: t('聊聊你的專案', 'Start a project'),
  ghost: t('先看實際案例', 'See real work')
};
