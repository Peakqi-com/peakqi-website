// 奇鋒國際 PeakQi — 全站內容資料層(唯一內容來源:AI 方案 Sales Kit)
// i18n(Phase 1):所有使用者可見字串走 t(zh, en)——中文站回傳原文(零變化),
// /en/ 頁自動取英文。英文腔調:精簡行銷(B/C 混合),短語全檔一致:
// 依需求報價=Custom quote、預約諮詢=Book a call、接客/追客/養客=Capture/Follow up/Nurture。
// 注意:solutionsScenarios[].key 兼作引擎切換識別,暫不翻(Phase 2 Solutions 頁一併處理)。
import { t } from './i18n.js';

export const contact = {
  email: 'jacky@peakqi.com',
  phone: '0266093699',
  phoneDisplay: '(02) 6609-3699',
  site: 'peakqi.com',
  url: 'https://peakqi.com'
};

export const navigation = [
  // 首頁單獨列一項:手機使用者不一定會意識到左上 Logo 可以點回首頁
  { href: '/', key: 'home', label: t('首頁', 'Home') },
  { href: '/solutions', key: 'solutions', label: t('解決方案', 'Solutions') },
  { href: '/method', key: 'method', label: t('導入方法', 'How we deliver') },
  { href: '/cases', key: 'cases', label: t('案例', 'Cases') },
  { key: 'product', label: t('產品', 'Products'), children: [
    { href: '/peakops', label: 'Peak Ops', desc: t('通用 AI 業務工具', 'AI business toolkit') },
    { href: 'https://www.aiweddingpro360.com/', label: 'AI Wedding Pro', desc: t('婚禮 AI', 'Wedding AI'), ext: true },
    { href: 'https://www.aiinteriorpro360.com/', label: 'AI Interior Pro', desc: t('室內設計 AI', 'Interior design AI'), ext: true },
    { href: 'https://bubble.tw', label: t('冒泡', 'Bubble'), desc: t('房仲 AI', 'Real-estate AI'), ext: true },
    { href: '/pricing', label: t('方案說明', 'Pricing'), desc: t('Peak Ops 三種規劃與導入範圍', 'Three Peak Ops plans & scope') }
  ] },
  { href: '/about', key: 'about', label: t('關於我們', 'About') },
  { href: '/blog', key: 'blog', label: t('觀點', 'Insights') }
];

export const stats = [
  { v: '30+', l: t('已上線的系統與網站', 'systems & sites shipped'), d: t('累計交付並實際上線的 AI 系統、客製平台與品牌網站專案。', 'AI systems, custom platforms and brand sites delivered and live.') },
  { v: '8+', l: t('導入過的產業情境', 'industries deployed'), d: t('實際做過導入的產業與流程情境,不是可服務產業的清單。', 'Industries we have actually shipped in — not a list of industries we could serve.') },
  { v: t('最快 10 天', 'From 10 days'), l: t('標準模組第一階段上線', 'Phase-1 launch, standard modules'), d: t('以標準模組估算的最快工作天數。客製串接、資料遷移與跨部門平台另行評估。', 'Best-case working-day estimate with standard modules. Custom integrations, data migration and cross-team platforms are scoped separately.') },
  { v: t('24 小時', '24 hours'), l: t('AI 持續接收詢問', 'AI keeps taking inquiries'), d: t('系統全天候接收、分類並整理客戶詢問。需要判斷的內容仍在上班時間由專人接手。', 'The system receives, sorts and organizes inquiries around the clock. Judgment calls still go to your team during work hours.') }
];

export const painPoints = [
  { t: t('資訊斷裂', 'Broken data'), d: t('LINE、表單、試算表與 CRM 各自保存一部分資訊,團隊需要反覆搜尋與複製。', 'LINE, forms, spreadsheets and your CRM each hold a piece. The team keeps searching and copy-pasting.') },
  { t: t('工作斷裂', 'Broken handoffs'), d: t('客服回覆後,仍需人工通知業務、建立客戶、安排追蹤與整理報價。', 'After support replies, someone still has to notify sales, create the customer, schedule follow-ups and draft the quote.') },
  { t: t('責任斷裂', 'Broken ownership'), d: t('案件停下來時,團隊不知道目前由誰負責,以及下一步應該做什麼。', 'When a deal stalls, nobody knows who owns it — or what happens next.') }
];
export const painClose = t('問題通常不在工具本身,而在工具與工具之間那一段沒有人接。', 'The problem is rarely the tools. It is the gap between them that nobody covers.');

export const lossSteps = [
  { v: '100', u: t('組/月', '/mo'), l: t('詢問進來', 'inquiries in') },
  { v: '30', u: t('組', ''), l: t('回太慢、資料接不上而流失', 'lost to slow replies and broken data') },
  { v: t('1', 'NT$10k'), u: t('萬', ''), l: t('每單平均金額', 'average order value') },
  { v: t('30', 'NT$300k'), u: t('萬/月', '/mo'), l: t('每月可能蒸發的營收', 'revenue at risk each month') }
];
export const lossYear = {
  v: t('360', 'NT$3.6M'), u: t('萬/年', '/yr'),
  note: t('以上為情境估算,不是實際發生的數字。計算式為「每月詢問數 × 漏追比例 × 平均客單價 × 12」,用於呈現漏接與流程中斷可能造成的影響。實際結果依企業詢問量、成交率、客單價與流程而異。', 'A scenario estimate, not an actual figure. Formula: monthly inquiries × drop rate × average order × 12 — to show what missed handoffs can cost. Actual results depend on your volume, close rate, order size and process.')
};
export const lossQuote = t('工具越多越亂,客人就在空隙裡漏掉。', 'More tools, more gaps — and customers slip through them.');

export const flow3 = [
  { n: '01', en: 'CAPTURE', t: t('接客', 'Capture'), d: t('AI 先回應、理解需求、協助安排時段,必要時轉由專人接手。半夜進來的詢問,不用等到隔天上班才有人看到。', 'AI answers first, reads the need and books time slots — and hands off to a person when it matters. A 2 a.m. inquiry no longer waits until morning.') },
  { n: '02', en: 'FOLLOW', t: t('追客', 'Follow up'), d: t('CRM 集中客戶資料、建立跟進節奏,該跟進的系統提醒你,AI 把訊息擬好,你確認就送出。', 'The CRM centralizes customers and sets a follow-up rhythm. The system nudges you, AI drafts the message, you approve and send.') },
  { n: '03', en: 'NURTURE', t: t('養客', 'Nurture'), d: t('案例、內容、優惠與關係維護集中安排,把「考慮中」的客人一步步推向下訂。', 'Cases, content, offers and touchpoints in one plan — moving "still thinking" customers toward the order, step by step.') }
];

export const features = [
  { n: '01', name: t('AI 客服', 'AI Support'), tag: t('接住常見問題,低信心或敏感案件轉人工。', 'Handles common questions; low-confidence or sensitive cases go to a person.'), items: [t('自動回覆、理解需求', 'Auto-reply that reads the need'), t('協助預約、保留時段', 'Booking and slot holds'), t('判斷不了就轉真人', 'Escalates when unsure')] },
  { n: '02', name: 'CRM', tag: t('把對話整理成客戶資料、目前階段與下一步,並依狀態提醒負責人。', 'Turns conversations into customer records, stages and next steps — and nudges the owner.'), items: [t('名單集中一個後台', 'One back office for all leads'), t('互動紀錄與行為追蹤', 'Interaction and behavior history'), t('跟進節奏自動提醒', 'Automatic follow-up reminders')] },
  { n: '03', name: t('行銷', 'Marketing'), tag: t('貼文、EDM 與視覺由 AI 先出草稿,發不發、怎麼調由你決定。', 'AI drafts posts, EDMs and visuals first. You decide what ships and how.'), items: [t('貼文草稿每週產出', 'Weekly post drafts'), t('Banner、EDM 快速生成', 'Fast banners and EDMs'), t('AI 場景渲染與風格模擬', 'AI scene renders and style previews')] },
  { n: '04', name: t('報價', 'Quotes'), tag: t('整理客戶需求與方案,產出可確認的報價草稿。', 'Assembles needs and options into a quote draft you can confirm.'), items: [t('線上報價單', 'Online quotes'), t('自動算稅', 'Auto tax'), t('Excel / PDF 匯出', 'Excel / PDF export')] },
  { n: '05', name: t('專案', 'Projects'), tag: t('成交資訊直接進入任務、時程與交付流程。', 'Closed deals flow straight into tasks, timelines and delivery.'), items: [t('專案排程與進度追蹤', 'Scheduling and progress tracking'), t('成本與利潤管理', 'Cost and margin management'), t('提案簡報整合', 'Proposal deck integration')] },
  { n: '06', name: t('數據', 'Insights'), tag: t('看見詢問從哪裡進來,又在哪一個階段停下來。', 'See where inquiries come from — and where they stall.'), items: [t('營運儀表板', 'Operations dashboard'), t('來源分析、業績追蹤', 'Source analytics and sales tracking'), t('AI 月報自動生成', 'Auto-generated AI monthly report')] }
];
export const baseSupport = [t('安全穩定', 'Secure & stable'), t('雲端架構', 'Cloud-based'), t('資料整合', 'Data integration'), t('開放整合', 'Open APIs'), t('彈性擴充', 'Scales with you')];

export const industries = [t('婚禮婚慶', 'Weddings'), t('室內設計', 'Interior design'), t('房仲不動產', 'Real estate'), t('美業', 'Beauty'), t('團購電商', 'Group-buy commerce'), t('活動售票', 'Event ticketing'), t('ESG 永續', 'ESG'), t('社區管理', 'Community management'), t('教育培訓', 'Education'), t('品牌官網', 'Brand sites')];
export const industriesNote = t('新產業版本以標準模組建置,第一階段最快 10 個工作天可部署;客製需求另行評估。', 'New industry builds use standard modules — Phase 1 can deploy in as fast as 10 working days. Custom work is scoped separately.');

export const caseStudies = [
  {
    slug: '室內設計 AI 整合平台',
    industry: t('室內設計裝修', 'Interior design'), title: t('室內設計 AI 整合平台', 'Interior Design AI Platform'),
    img: '/assets/works/work-interior.png',
    alt: t('室內設計 AI 整合平台畫面:空間渲染、風格模擬與自動提案簡報', 'Interior Design AI Platform: space renders, style previews and auto proposal decks'),
    stuck: t('客戶改一次風格,就要重畫、重渲染、重做簡報;設計師把時間花在來回修改與整理提案,而不是設計本身。', 'Every style change meant redrawing, re-rendering and rebuilding the deck. Designers spent their time on revisions, not design.'),
    did: t('空間渲染、風格模擬、自動提案簡報,整合進一個平台。', 'Space renders, style previews and auto proposal decks — one platform.'),
    human: t('風格生成與提案排版由 AI 準備草稿;材質、報價與最終簡報由設計師確認後送出。', 'AI drafts the styles and deck layout; materials, quotes and the final deck ship only after the designer signs off.'),
    metrics: [{ v: t('約 90%', '~90%'), l: t('提案效率提升(該案例)', 'faster proposals (this case)') }, { v: t('3天→3hr', '3 days → 3 hrs'), l: t('三天的工作,3 小時完成', 'three days of work, done in three hours') }, { v: '10+', l: t('種風格一鍵切換', 'styles, one-click switch') }]
  },
  {
    slug: '婚禮產業 AI 大禮包',
    industry: t('婚禮婚慶', 'Weddings'), title: t('婚禮產業 AI 大禮包', 'Wedding Industry AI Suite'),
    img: '/assets/works/work-wedding.png',
    alt: t('婚禮產業 AI 大禮包系統畫面:婚紗試穿模擬與 AI 接客', 'Wedding AI Suite: dress try-on previews and AI intake'),
    stuck: t('婚紗款式、檔期、試妝與方案問題集中在 LINE,由客服重複回覆,再人工把資訊整理到不同表單與群組。', 'Dress styles, dates, makeup trials and package questions all piled into LINE. Support answered on repeat, then re-typed everything into forms and group chats.'),
    did: t('婚紗試穿、髮型試妝模擬、場景生成,加上 AI 接客。', 'Dress try-on, hair and makeup previews, scene generation — plus AI intake.'),
    human: t('常見問題與試妝試髮預覽由 AI 先處理;價格、檔期與特殊需求交由專人確認。', 'AI handles FAQs and try-on previews first; pricing, dates and special requests go to a person.'),
    metrics: [{ v: t('↓約 70%', '↓ ~70%'), l: t('客服人力(該案例)', 'support workload (this case)') }, { v: t('5 倍', '5×'), l: t('成交率提升', 'close rate') }, { v: '8+', l: t('AI 功能模組', 'AI modules') }]
  },
  {
    slug: '美業 AI 體驗系統',
    industry: t('美容・美髮・美甲', 'Beauty · Hair · Nails'), title: t('美業 AI 體驗系統', 'Beauty AI Experience'),
    stuck: t('髮色、妝容與美甲只能用形容的溝通,客人難以想像成果;報價與確認在對話裡來回,做完才發現落差。', 'Hair color, makeup and nails were described in words — customers could not picture the result. Quotes bounced around chats, and gaps surfaced only after the work was done.'),
    did: t('髮色試換、妝容模擬、美甲預覽,消費前先看成果。', 'Hair color try-on, makeup previews, nail previews — see the result before you buy.'),
    human: t('試色與效果預覽由 AI 生成;方案、價格與客製需求由美業師確認後報價。', 'AI generates the previews; plans, prices and custom requests are quoted by the stylist.'),
    metrics: [{ v: t('3 倍', '3×'), l: t('報價速度提升(該案例)', 'faster quoting (this case)') }, { v: t('↓約 60%', '↓ ~60%'), l: t('決策時間縮短', 'decision time') }, { v: t('多次', 'Unlimited'), l: t('風格反覆試換', 'style retries') }]
  },
  {
    slug: '房仲 AI 助手',
    industry: t('房仲不動產', 'Real estate'), title: t('房仲 AI 助手(串 LINE 官方帳號)', 'Real-Estate AI Assistant (LINE OA)'),
    img: '/assets/works/work-realestate.png',
    alt: t('房仲 AI 助手畫面:串接 LINE 官方帳號自動回物件、排預約帶看', 'Real-Estate AI Assistant: LINE OA integration, auto listing replies and viewing bookings'),
    stuck: t('物件、格局、價格與帶看時間的詢問散在 LINE,業務要一則則回,再人工安排帶看,回覆常常隔數小時。', 'Listing, layout, price and viewing questions scattered across LINE. Agents answered one by one and booked viewings by hand — replies often took hours.'),
    did: t('AI 自動回覆物件資訊、排預約帶看,串接 LINE 官方帳號。', 'AI answers listing questions and books viewings, integrated with the LINE official account.'),
    human: t('物件資訊與帶看時段由 AI 自動回覆與預約;議價、屋況說明與成交交由業務處理。', 'AI replies and books automatically; negotiation, property details and closing stay with the agent.'),
    metrics: [{ v: t('30 秒內', '< 30 sec'), l: t('回覆時間,原本數小時(該案例)', 'reply time, down from hours (this case)') }, { v: t('約 8hr/週', '~8 hrs/wk'), l: t('節省的排程時間', 'scheduling time saved') }, { v: t('↑約 20%', '↑ ~20%'), l: t('名單轉化', 'lead conversion') }]
  }
];
export const caseNote = t('實際成果依企業流程、資料品質與導入範圍而異。', 'Actual results vary with your process, data quality and rollout scope.');
export const caseCta = t('討論相似導入情境', 'Discuss a similar rollout');

export const worksFeatured = [
  { t: t('婚禮產業 AI 大禮包', 'Wedding Industry AI Suite'), cat: t('AI 系統', 'AI system'), img: '/assets/works/work-wedding.png', alt: t('婚禮產業 AI 大禮包系統畫面:婚紗試穿模擬、社群影片生成、發文中心與客戶續談 CRM', 'Wedding AI Suite: dress try-on, social video generation, publishing hub and follow-up CRM'), problem: t('新人問不停,試妝試髮只能靠形容。', 'Couples ask nonstop; try-ons lived in words only.'), solution: t('婚紗試穿、試妝模擬、場景生成+AI 接客。', 'Dress try-on, makeup previews, scene generation + AI intake.'), results: [t('客服人力 ↓約 70%', 'Support workload ↓ ~70%'), t('成交率 5 倍', 'Close rate 5×'), t('8+ AI 模組', '8+ AI modules')] },
  { t: t('室內設計 AI 整合平台', 'Interior Design AI Platform'), cat: t('AI 系統', 'AI system'), img: '/assets/works/work-interior.png', alt: t('室內設計 AI 整合平台畫面:空間渲染、風格模擬與自動提案簡報', 'Interior Design AI Platform: renders, style previews and auto proposal decks'), problem: t('提案、畫圖、渲染、簡報,三天起跳。', 'Proposal, drawings, renders, deck — three days minimum.'), solution: t('渲染、風格模擬、自動提案,一個平台完成。', 'Renders, style previews and auto proposals in one platform.'), results: [t('提案效率 ↑約 90%', 'Proposals ~90% faster'), t('3 天工作 3 小時完成', '3 days of work in 3 hours'), t('10+ 風格一鍵切換', '10+ styles, one click')] },
  { t: t('房仲 AI 助手', 'Real-Estate AI Assistant'), cat: t('AI 系統', 'AI system'), img: '/assets/works/work-realestate.png', alt: t('房仲 AI 助手畫面:串接 LINE 官方帳號,自動回物件、排預約帶看', 'Real-Estate AI Assistant: LINE OA, auto listing replies, viewing bookings'), problem: t('物件詢問回覆要花數小時。', 'Listing replies took hours.'), solution: t('串 LINE 官方帳號,自動回物件、排帶看。', 'LINE OA integration: auto replies and viewing bookings.'), results: [t('回覆縮短至 30 秒內', 'Replies under 30 seconds'), t('每週省約 8 小時排程', '~8 hrs/week of scheduling saved'), t('名單轉化 ↑約 20%', 'Lead conversion ↑ ~20%')] },
  { t: t('AI LINE 群組自動摘要', 'AI LINE Group Digest'), cat: t('AI 系統', 'AI system'), img: '/assets/works/work-linesummary.png', alt: t('AI LINE 群組自動總結摘要工具畫面', 'AI LINE group auto-summary tool'), problem: t('群組訊息太多,重點被洗掉。', 'Too many messages; the point gets buried.'), solution: t('AI 自動總結群組對話重點。', 'AI summarizes group chats automatically.'), results: [], url: 'https://line-requirement-bot.vercel.app/' },
  { t: t('AI 自動排桌・排房工具', 'AI Table & Room Planner'), cat: t('AI 系統', 'AI system'), img: '/assets/works/work-tables.png', alt: t('AI 自動排組桌、排房工具畫面', 'AI table and room auto-assignment tool'), problem: t('排桌、排房靠人腦喬,一改再改。', 'Seating and rooms juggled by hand, changed again and again.'), solution: t('AI 自動排組桌、排房。', 'AI assigns tables and rooms automatically.'), results: [] },
  { t: t('牽成|任務回報・團隊管理', 'Chian-Sing | Tasks & Teams'), cat: t('客製系統', 'Custom system'), img: '/assets/works/work-tasks.png', alt: t('牽成任務回報與團隊管理系統畫面', 'Chian-Sing task reporting and team management system'), problem: t('任務交辦散在對話裡,回報靠追問。', 'Assignments scattered in chats; updates only when chased.'), solution: t('任務回報與團隊管理收進一套系統。', 'Task reporting and team management in one system.'), results: [] },
  { t: t('團購通|電商・LINE 串接', 'GroupBuy Go | Commerce × LINE'), cat: t('客製系統', 'Custom system'), img: '/assets/works/work-groupbuy.png', alt: t('團購通電商系統畫面,串接 LINE 官方帳號', 'GroupBuy Go commerce system with LINE OA integration'), problem: t('團購對帳、下單訊息全靠人工整理。', 'Group-buy orders and reconciliations sorted by hand.'), solution: t('電商系統串接 LINE 官方帳號。', 'Commerce system wired into the LINE official account.'), results: [] }
];

export const portfolioAI = [
  { t: t('心途', 'Xintu'), d: t('LINE 定課任務管理工具', 'LINE course-task manager'), cat: t('AI 系統', 'AI system') },
  { t: t('AI 排桌排房', 'AI Table & Room Planner'), d: t('自動排組桌、排房工具', 'Auto table and room assignment'), cat: t('AI 系統', 'AI system'), img: '/assets/works/work-tables.png' },
  { t: t('牽成', 'Chian-Sing'), d: t('任務回報/團隊管理系統', 'Task reporting & team management'), cat: t('客製系統', 'Custom system'), img: '/assets/works/work-tasks.png' },
  { t: t('團購通', 'GroupBuy Go'), d: t('電商系統,串接 LINE 官方帳號', 'Commerce with LINE OA integration'), cat: t('客製系統', 'Custom system'), img: '/assets/works/work-groupbuy.png' },
  { t: 'Hungmen Voice', d: t('聲音檢測自我狀態報告', 'Voice-based self-state reports'), cat: t('AI 系統', 'AI system') },
  { t: t('AI 神農氏', 'AI Shennong'), d: t('保健品配方健檢與開發評估', 'Supplement formula checks and R&D review'), cat: t('AI 系統', 'AI system') },
  { t: t('AutoDraft 台灣 AI 補助王', 'AutoDraft Grant Writer'), d: t('補助計畫書 AI 搜尋、分析與撰寫', 'AI search, analysis and drafting for grant proposals'), cat: t('AI 系統', 'AI system'), url: 'https://autodraft-mvp.vercel.app/' },
  { t: 'Pounds Network', d: t('服務業會員忠誠度與獎勵平台', 'Loyalty and rewards platform for services'), cat: t('AI 系統', 'AI system'), url: 'https://www.pounds.network/en' },
  { t: t('AI LINE 群組摘要', 'AI LINE Group Digest'), d: t('LINE 群組對話自動總結', 'Auto-summary for LINE group chats'), cat: t('AI 系統', 'AI system'), url: 'https://line-requirement-bot.vercel.app/', img: '/assets/works/work-linesummary.png' },
  { t: t('AI 呂洞賓', 'AI Lü Dongbin'), d: t('算命/解籤系統', 'Fortune-telling and lot-reading system'), cat: t('AI 系統', 'AI system') },
  { t: 'Nivora AI', d: t('AI Agent 虛擬辦公室', 'AI-agent virtual office'), cat: t('AI 系統', 'AI system') }
];
export const portfolioWeb = [
  { t: t('嘉義市世博會官網', 'Chiayi Expo Official Site'), d: t('市府級大型活動網站,如期交付上線', 'City-level event site, shipped on schedule'), cat: t('品牌網站', 'Brand site'), img: '/assets/works/work-expo.png' },
  { t: t('ROUZHI 顏植髮泥', 'ROUZHI'), d: t('品牌官網', 'Brand site'), cat: t('品牌網站', 'Brand site'), url: 'https://rouzhi.tw/' },
  { t: 'OUROS', d: t('AI 課程網頁設計', 'AI course site design'), cat: t('品牌網站', 'Brand site'), url: 'https://www.ouros.tw/' },
  { t: t('DOIIIN ESG 平台', 'DOIIIN ESG Platform'), d: t('網頁設計顧問暨製作', 'Web design consulting and build'), cat: t('品牌網站', 'Brand site'), url: 'https://v0-esg-media-platform.vercel.app/' },
  { t: t('SparkSpace 倉儲監控', 'SparkSpace Warehouse Monitor'), d: t('倉儲監控系統', 'Warehouse monitoring system'), cat: t('客製系統', 'Custom system'), url: 'https://www.sparkspace.com.tw/', img: '/assets/works/work-warehouse.png' },
  { t: t('宮廷命理研究院', 'Palace Numerology Institute'), d: t('算名系統與課程', 'Name-reading system and courses'), cat: t('客製系統', 'Custom system'), url: 'https://palace-virid-nine.vercel.app/' },
  { t: 'Inner Weather', d: t('VJ 用視覺軟體', 'Visual software for VJs'), cat: t('客製系統', 'Custom system'), url: 'https://love-hazel-two.vercel.app/' },
  { t: 'ASML', d: t('品牌官網', 'Brand site'), cat: t('品牌網站', 'Brand site') },
  { t: t('拉步步', 'Labubu'), d: t('活動售票系統', 'Event ticketing system'), cat: t('客製系統', 'Custom system') },
  { t: t('台中綠園', 'Taichung Green Garden'), d: t('圖庫房系統', 'Image library system'), cat: t('客製系統', 'Custom system') },
  { t: t('社區管理 APP', 'Community Management App'), d: t('社區管理 APP 與後台', 'Community app with back office'), cat: t('客製系統', 'Custom system'), img: '/assets/works/work-community.png' },
  { t: t('租屋管理平台', 'Rental Management Platform'), d: t('租屋與物件管理', 'Rentals and listings management'), cat: t('客製系統', 'Custom system') },
  { t: t('顏博士論壇', 'Dr. Yan Forum'), d: t('論壇網站', 'Forum site'), cat: t('品牌網站', 'Brand site') }
];

// 中立比較:不同做法適合不同階段,不貶低其他選擇、不寫無依據的時程
export const compare = {
  dims: [t('適合情況', 'Best when'), t('優點', 'Strengths'), t('需要注意', 'Watch out for'), t('費用模式', 'Cost model')],
  cols: [
    { name: t('單一 AI 工具', 'Single AI tool'), vals: [t('只處理一個明確任務', 'One clear task to solve'), t('上手快', 'Quick to start'), t('資料可能仍需人工轉移', 'Data may still move by hand'), t('單一工具訂閱', 'Per-tool subscription')], hot: false },
    { name: t('完整客製開發', 'Full custom build'), vals: [t('有特殊流程與充足預算', 'Unique process, solid budget'), t('彈性最高', 'Maximum flexibility'), t('前期規格與維護投入較高', 'Heavier upfront spec and upkeep'), t('專案報價', 'Project pricing')], hot: false },
    { name: t('PeakQi 模組化導入', 'PeakQi modular rollout'), vals: [t('希望先驗證,再逐步整合', 'Validate first, integrate step by step'), t('起步範圍可控制,模組可累加', 'Controlled start, stackable modules'), t('仍需要企業參與流程與資料確認', 'Your team still confirms process and data'), t('導入費＋月費＋使用量費', 'Setup + monthly + usage')], hot: true }
  ]
};

// 三種「導入起點」:差異是流程深度,不是公司規模。
export const plans = [
  { code: 'A', name: t('AI 接客起步方案', 'AI Capture Starter'), tag: t('接住詢問', 'Capture inquiries'), quote: t('依需求報價', 'Custom quote'),
    who: t('已有穩定詢問量,但團隊花大量時間重複回答、確認需求與安排預約。', 'Steady inquiries, but the team burns hours on repeat answers, need-checks and bookings.'),
    goal: t('先把詢問接住、整理,再交給正確的人。', 'Capture and organize inquiries first, then route them to the right person.'),
    base: '',
    items: [t('核准知識查詢', 'Approved knowledge answers'), t('常見問題回覆與回覆草稿', 'FAQ replies and drafts'), t('需求欄位擷取', 'Need-field extraction'), t('預約引導', 'Booking guidance'), t('人工轉接', 'Human handoff'), t('基本客戶紀錄', 'Basic customer records')],
    excludes: [t('完整 CRM 階段管理', 'Full CRM stage management'), t('自動跟進序列', 'Automated follow-up sequences'), t('報價與專案管理', 'Quotes and project management'), t('跨部門控制台', 'Cross-team console')],
    upgrade: t('當你不只需要回答問題,還需要管理客戶階段、負責人和下一步時,建議進入 B。', 'When you need stages, owners and next steps — not just answers — move to B.'),
    setup: t('第一階段導入費・依範圍評估', 'Phase-1 setup fee · scoped to fit'), monthly: t('平台與維運月費・依方案確認', 'Platform & upkeep monthly · per plan'),
    featured: false, badge: '' },
  { code: 'B', name: t('AI 業務流程方案', 'AI Sales Flow'), tag: t('推進案件', 'Move deals forward'), quote: t('依需求報價', 'Custom quote'),
    who: t('詢問進來後容易停住,需要管理客戶狀態、負責人與後續動作。', 'Inquiries come in, then stall. You need statuses, owners and next actions.'),
    goal: t('讓每一筆詢問都有負責人、目前階段與下一步。', 'Every inquiry gets an owner, a stage and a next step.'),
    base: t('包含 A,再加上:', 'Everything in A, plus:'),
    items: [t('CRM 客戶與案件', 'CRM customers and deals'), t('負責人分派', 'Owner assignment'), t('客戶階段', 'Customer stages'), t('跟進提醒', 'Follow-up reminders'), t('常見疑慮回覆草稿', 'Objection reply drafts'), t('互動紀錄', 'Interaction history'), t('基本流程分析', 'Basic flow analytics')],
    excludes: [t('完整報價流程', 'Full quoting flow'), t('專案交付管理', 'Project delivery management'), t('跨部門權限', 'Cross-team permissions'), t('大型資料遷移', 'Large data migration'), t('深度客製介面', 'Deeply custom UI')],
    upgrade: t('當報價、交付與跨部門資料也要接進來時,建議進入 C。', 'When quotes, delivery and cross-team data need to plug in too, move to C.'),
    setup: t('第一階段導入費・依範圍評估', 'Phase-1 setup fee · scoped to fit'), monthly: t('平台與維運月費・依方案確認', 'Platform & upkeep monthly · per plan'),
    featured: true, badge: t('建議起步', 'Recommended start') },
  { code: 'C', name: t('AI 營運整合方案', 'AI Operations Suite'), tag: t('整合營運', 'Integrate operations'), quote: t('依需求報價', 'Custom quote'),
    who: t('客服、業務、報價與交付由不同部門或工具負責,需要建立跨流程營運視圖。', 'Support, sales, quoting and delivery live in different teams or tools. You need one operations view.'),
    goal: t('將詢問、成交與交付接成同一條可管理的流程。', 'Connect inquiry, close and delivery into one manageable flow.'),
    base: t('包含 B,再加上:', 'Everything in B, plus:'),
    items: [t('內容與行銷流程', 'Content and marketing flow'), t('報價與提案草稿', 'Quote and proposal drafts'), t('專案交接', 'Project handoff'), t('任務與時程', 'Tasks and timelines'), t('管理儀表板', 'Management dashboard'), t('多角色權限', 'Multi-role permissions'), t('既有工具串接', 'Existing-tool integration'), t('流程與使用數據', 'Flow and usage analytics')],
    excludes: [t('超出標準模組的深度客製(獨立列於客製評估)', 'Deep customization beyond standard modules (scoped separately)')],
    upgrade: t('標準模組無法直接覆蓋時,客製項目、交付範圍與費用會獨立列出。', 'Where standard modules do not cover it, custom items, scope and cost are listed separately.'),
    setup: t('第一階段導入費・依範圍評估', 'Phase-1 setup fee · scoped to fit'), monthly: t('平台與維運月費・依方案確認', 'Platform & upkeep monthly · per plan'),
    featured: false, badge: '' }
];
export const planNote = t('實際費用依需求範圍與使用情境評估。歡迎預約諮詢,我們會依你的場景給出建議與報價;各產品的詳細價格請見該產品官網。', 'Actual cost is scoped to your needs and usage. Book a call — we will recommend a plan and quote for your scenario. Product-specific pricing lives on each product site.');
// 不做「取代員工」對比:系統處理重複工作,人保留判斷與服務
export const humanCompare = { leftT: t('人工重複處理', 'Manual repetition'), leftV: t('逐筆複製、整理與在工具間轉貼資料', 'Copying, sorting and re-pasting data between tools'), leftU: '', rightT: t('AI 協作流程', 'AI-assisted flow'), rightV: t('系統彙整與提醒,人工確認後送出', 'The system compiles and reminds; people confirm and send'), rightU: '', rightD: t('AI 先處理常見問題,例外轉人工。', 'AI handles the routine; exceptions go to people.') };

export const customRanges = [
  { s: t('單一流程導入', 'Single-flow rollout'), r: t('先從一個高價值場景驗證,快速上線。', 'Validate one high-value scenario and launch fast.') },
  { s: t('多模組整合', 'Multi-module integration'), r: t('接上 CRM、報價、專案等多個模組。', 'Wire in CRM, quotes, projects and more.') },
  { s: t('跨部門營運系統', 'Cross-team operations'), r: t('打通部門之間的資料與流程。', 'Connect data and flow across departments.') },
  { s: t('客製平台開發', 'Custom platform build'), r: t('依需求從零打造專屬系統。', 'Purpose-built systems from scratch.') }
];
export const customNote = t('可以先從一個高價值場景開始,也可以在驗證有效後,逐步整合成跨部門營運平台。', 'Start with one high-value scenario — then, once it proves out, grow it into a cross-team operations platform.');
export const customCred = t('客製實績:嘉義市世博會官網、品牌官網、倉儲監控平台、售票系統、社區管理 APP 等——市府級大型活動官網也有執行經驗。', 'Custom track record: the Chiayi Expo official site, brand sites, warehouse monitoring, ticketing, a community app and more — including city-level event sites.');

export const usage = [
  { t: t('文字類:標準用量包含於月費', 'Text AI: standard usage included'), d: t('AI 對話、文案、報告與分析的標準用量含在月費內;實際額度與公平使用範圍依方案確認。', 'Standard usage for chat, copy, reports and analysis is included in the monthly fee; exact allowances and fair use are confirmed per plan.'), c: '#65E0BC' },
  { t: t('圖片・影片類:按使用量計費', 'Image & video: usage-based'), d: t('AI 場景渲染、風格模擬、短影音等高成本用量,依實際使用量計費。', 'High-cost generation — scene renders, style previews, short video — is billed by actual usage.'), c: '#3E9BFF' }
];
export const usageNote = t('文字類用量含在月費內;圖片與影片類依實際使用量計費,導入前會依你的流程先估算範圍。', 'Text usage is included in the monthly fee; image and video are usage-based. We estimate your range before rollout.');

export const timeline = [
  { d: 'DAY 0', t: t('簽約、提供資料', 'Sign and hand over data') },
  { d: 'DAY 1–4', t: t('建立知識庫、設定 AI 話術、功能模組建置', 'Knowledge base, AI scripts, module setup') },
  { d: 'DAY 5–7', t: t('內部測試、模擬對話', 'Internal testing and simulated chats') },
  { d: 'DAY 7–10', t: t('校準會議', 'Calibration session') },
  { d: 'DAY 10', t: t('正式上線', 'Go live') }
];
export const timelineNote = t('此時程適用標準模組的第一階段上線。客製串接、資料遷移、跨部門平台與特殊權限需求,依現有系統與流程複雜度另行評估;完整垂直平台或大型客製系統參考時程約六週起。', 'This timeline applies to a Phase-1 launch on standard modules. Custom integrations, data migration, cross-team platforms and special permissions are scoped to your systems; full vertical platforms or large custom builds start around six weeks.');

export const risk = [
  { n: '01', t: t('先看情境 Demo', 'See a scenario demo first'), d: t('用你自己的流程跑一遍,先確認流程、資料與使用方式,再決定是否進入導入。', 'Run it on your own workflow — confirm the flow, data and usage before deciding to roll out.') },
  { n: '02', t: t('第一階段三個月', 'Phase 1 is three months'), d: t('第一階段為三個月;之後可依實際使用情況按月調整或停止。', 'Phase 1 runs three months; after that, adjust or stop month by month based on real usage.') },
  { n: '03', t: t('上線後調整期', 'Tuning after launch'), d: t('上線後依實際使用回饋調整設定、話術與流程。退費與終止條件以合約約定為準,簽約前會逐條說明。', 'After launch we tune settings, scripts and flow from real feedback. Refund and termination terms follow the contract, explained line by line before signing.') }
];

export const faq = [
  { q: t('會不會很難用?', 'Is it hard to use?'), a: t('我們幫你設定好,你照常做生意,系統在背後把客人接起來。不用學新軟體,也不用改變現在的做事方式。', 'We set it up; you run your business as usual while the system catches customers in the background. No new software to learn, no workflow to change.') },
  { q: t('客戶資料安全嗎?', 'Is customer data safe?'), a: t('獨立存放、加密保護。資料不外流,也不會拿去訓練別人的模型。', "Stored separately and encrypted. Your data does not leave, and it is not used to train anyone else's models.") },
  { q: t('AI 會不會亂回話?', 'Will the AI make things up?'), a: t('上線前會用你的實際情境反覆校準;遇到判斷不了的問題,馬上轉真人,不會硬答。', 'We calibrate on your real scenarios before launch. When it cannot judge, it hands off to a person instead of guessing.') },
  { q: t('AI 跟真人怎麼分工?', 'How do AI and people split the work?'), a: t('AI 顧前線:接待、了解需求、先篩選;對話中出現重要內容,直接轉給你接手。', 'AI covers the front line — greeting, understanding needs, first-pass filtering. The moment something important comes up, it hands the conversation to you.') },
  { q: t('多久可以上線?', 'How fast can we launch?'), a: t('標準模組的第一階段最快 10 個工作天:DAY 0 簽約、DAY 1–4 建置、DAY 5–7 測試、DAY 7–10 校準、DAY 10 上線。客製串接、資料遷移與跨部門平台依現有系統複雜度另行評估;完整垂直平台或大型客製參考約六週起。', 'Phase 1 on standard modules: as fast as 10 working days — sign on Day 0, build Days 1–4, test Days 5–7, calibrate Days 7–10, live on Day 10. Custom integrations, migrations and cross-team platforms are scoped separately; large custom builds start around six weeks.') },
  { q: t('AI 使用量怎麼計費?', 'How is AI usage billed?'), a: t('文字類(對話、文案、報告、SEO 分析)的標準用量含在月費內,實際額度與公平使用範圍依方案確認;圖片與影片類(場景渲染、風格模擬、短影音)按使用量計費,用多少付多少。', 'Standard text usage (chat, copy, reports, SEO analysis) is included in the monthly fee, with allowances confirmed per plan. Image and video (renders, style previews, short video) are pay-per-use.') },
  { q: t('可以只做部分功能嗎?', 'Can we start with just part of it?'), a: t('可以。方案由小到大:A 先把接客做好,B 加上跟進與 CRM,C 才是完整營運平台;之後要擴充,再往上加就好。', 'Yes. Plans stack: A nails intake, B adds follow-up and CRM, C is the full operations platform. Expand later by adding on top.') },
  { q: t('能不能串接 LINE 或既有流程?', 'Can it connect to LINE or our current flow?'), a: t('可以。LINE 官方帳號串接是我們的核心場景(房仲助手、團購通都是實例);既有工具與流程的整合範圍,Demo 時依你的情況確認。', 'Yes. LINE official-account integration is a core scenario for us (the real-estate assistant and GroupBuy Go are live examples). Integration scope for your tools is confirmed at the demo.') }
];

// 方案頁專用 FAQ:只回答方案與費用的購買疑慮(產品功能問題留在產品頁 faq)
export const faqPricing = [
  { q: t('報價主要取決於哪些因素?', 'What drives the quote?'), a: t('啟用的模組數量、流程設定範圍、資料整理程度、既有工具串接、權限角色與是否需要客製介面。Demo 之後會列出具體項目。', 'Module count, flow setup scope, data cleanup, existing-tool integrations, permission roles and any custom UI. Concrete items are listed after the demo.') },
  { q: t('導入費、月費與使用費有什麼差別?', 'Setup vs. monthly vs. usage — what is the difference?'), a: t('導入費是第一階段的一次性專案費(設定、資料、串接);月費涵蓋系統使用、維運與標準文字 AI 用量;圖片影片等高成本 AI 依實際用量計費。', 'Setup is a one-time Phase-1 fee (configuration, data, integrations). Monthly covers the platform, upkeep and standard text AI. High-cost image/video AI is billed by usage.') },
  { q: t('三種方案可以後續升級嗎?', 'Can we upgrade later?'), a: t('可以。A → B → C 是能力累加,升級時保留既有資料與設定,只補上新增模組的導入工作。', 'Yes. A → B → C stack. Upgrades keep your data and settings; only the new modules need setup.') },
  { q: t('可以只先做一個模組嗎?', 'Can we start with a single module?'), a: t('可以。建議從最影響營運的一段流程開始,確認有效再擴大。', 'Yes. Start with the flow that hurts most, prove it, then expand.') },
  { q: t('既有 LINE、CRM 或表單可以保留嗎?', 'Can we keep our LINE, CRM or forms?'), a: t('可以。我們處理的是工具之間原本需要人工搬運的部分;實際串接方式依工具、API 與權限評估。', 'Yes. We take over the parts people used to carry between tools; the exact integration depends on tools, APIs and permissions.') },
  { q: t('什麼情況需要客製開發?', 'When is custom development needed?'), a: t('需要串接多套現有系統、資料遷移、多部門權限、特殊審核流程或專屬介面時,客製項目會與標準方案分開評估與報價。', 'Multiple system integrations, data migration, multi-team permissions, special approval flows or bespoke UI — custom items are scoped and quoted separately from the standard plan.') },
  { q: t('第一階段通常包含什麼?', 'What does Phase 1 usually include?'), a: t('目標與範圍確認、模組設定、資料整理、內部測試與上線交接;細項會寫在提案裡。', 'Goal and scope confirmation, module setup, data cleanup, internal testing and launch handover — detailed in the proposal.') },
  { q: t('媒體用量超過之後怎麼計費?', 'What happens beyond the media allowance?'), a: t('圖片與影片類依實際使用量計費;導入前會依你的流程先估算範圍,避免意外帳單。', 'Image and video are billed by actual usage. We estimate your range before rollout, so there are no surprise bills.') },
  { q: t('合作期間與取消方式?', 'Terms and cancellation?'), a: t('合約期限、最低合作期間與調整條件依方案而定,簽約前會逐條說明。', 'Contract length, minimum term and adjustment terms depend on the plan — explained line by line before signing.') }
];

// k = 該步的小劇場類型(對應 Solutions.dc.html 的 [data-fanim] CSS);a = 劇場說明;e = 右上角狀態(空字串則不顯示)
export const followupSeq = [
  { d: 'STEP 01', t: t('補齊需求:缺的資料由 AI 擬好追問訊息', 'Fill the gaps: AI drafts the follow-up question for missing data'), k: 'fill', a: t('AI 補上缺的那一欄', 'AI fills the missing field'), e: t('缺 1 項', '1 missing') },
  { d: 'STEP 02', t: t('提供相關案例或資料,幫客戶往下評估', 'Send relevant cases or materials to help them evaluate'), k: 'deck', a: t('挑出對應的案例送出', 'Matching case sent'), e: '' },
  { d: 'STEP 03', t: t('確認客戶反應,更新案件狀態', 'Read the response, update the deal status'), k: 'reply', a: t('客戶回覆・狀態更新', 'Reply in · status updated'), e: t('有意願', 'Interested') },
  { d: 'STEP 04', t: t('由負責人決定下一步:報價、約訪或結案', 'The owner picks the next move: quote, meet or close'), k: 'fork', a: t('負責人選一條路走', 'Owner picks the path'), e: '' }
];

// 方案 ↔ 功能模組對應(功能總覽六模組)
// 注意:鍵值同時是顯示名與對應鍵——features[].name 已 t() 化,這裡跟著用同一份翻譯
const M = { svc: t('AI 客服', 'AI Support'), crm: 'CRM', mkt: t('行銷', 'Marketing'), quo: t('報價', 'Quotes'), prj: t('專案', 'Projects'), data: t('數據', 'Insights') };
export const planModules = {
  A: [M.svc],
  B: [M.svc, M.crm, M.data],
  C: [M.svc, M.crm, M.mkt, M.quo, M.prj, M.data]
};
export const planAdds = {
  A: { adds: [M.svc], can: t('先把詢問接住、整理,再交給正確的人。', 'Capture and organize inquiries, then route them right.') },
  B: { adds: [M.crm, M.data], can: t('現在每一筆詢問都有負責人、階段與下一步。', 'Now every inquiry has an owner, a stage and a next step.') },
  C: { adds: [M.mkt, M.quo, M.prj], can: t('前台詢問一路接到報價、交付與管理視圖。', 'From front-line inquiry all the way to quotes, delivery and the management view.') }
};

// Demo 表單設定
export const demoIndustries = [...industries, t('其他', 'Other')];
export const contactTimes = [t('不限,方便就好', 'Anytime works'), t('平日上午', 'Weekday mornings'), t('平日下午', 'Weekday afternoons'), t('平日晚上', 'Weekday evenings'), t('週末', 'Weekends')];
// API endpoint 集中設定:接上正式後端時填入 URL;null = 預覽 demo submission
// 表單收件:/api/submit(Vercel 函式)→ Google 試算表(SHEET_WEBHOOK_URL)等出口,見 FORM-SETUP.md
export const submitConfig = { endpoint: '/api/submit' };

export function faqJsonLd(list) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
  };
}

// 新場景資料(純流程示意,無新增成果數字)
export const diagMetrics = [
  { t: t('未讀訊息', 'Unread messages'), u: t('條', ''), max: 24 },
  { t: t('未跟進名單', 'Leads not followed up'), u: t('組', ''), max: 12 },
  { t: t('資料重複', 'Duplicate records'), u: t('筆', ''), max: 8 },
  { t: t('平均回覆延遲', 'Average reply delay'), u: t('小時', 'hrs'), max: 6 },
  { t: t('流程斷點', 'Broken handoffs'), u: t('處', ''), max: 5 }
];
export const relayStations = [
  { t: t('LINE 詢問', 'LINE inquiry'), s: 'CAPTURED', d: t('客人訊息進來,AI 先接住並辨識需求', 'A message comes in; AI catches it and reads the need') },
  { t: t('AI 分類', 'AI triage'), s: 'CLASSIFIED', d: t('需求、預算、時段自動整理', 'Need, budget and timing sorted automatically') },
  { t: t('CRM 建檔', 'CRM record'), s: 'ASSIGNED', d: t('建立客戶卡,指派負責人與跟進序列', 'Customer card created; owner and follow-up sequence assigned') },
  { t: t('報價', 'Quote'), s: 'QUOTED', d: t('線上報價單自動算稅,當天送出', 'Online quote with auto tax, sent same day') },
  { t: t('專案', 'Project'), s: 'DELIVERED', d: t('排程執行,進度打開就知道', 'Scheduled and executed; progress at a glance') },
  { t: t('數據回報', 'Reporting'), s: 'MEASURED', d: t('來源與業績寫回儀表板與 AI 月報', 'Sources and sales flow back into the dashboard and AI monthly report') }
];

// /solutions 接客情境切換(產品 UI 模擬對話,非成效宣稱)
// 注意:key 兼作引擎切換識別,Phase 2 Solutions 頁一併雙語化
export const solutionsScenarios = [
  { key: '一般問題', msgs: [
    { who: 'c', text: t('你們的服務流程大概是怎麼進行?', 'How does your service process work?') },
    { who: 'ai', text: t('我們會先了解需求,再安排時間詳談。方便說一下您想解決的狀況嗎?', 'We start by understanding your needs, then set up a call. Mind sharing what you are trying to solve?') },
    { who: 'ai', kind: 'sticker', text: '😊' },
    { who: 'ai', text: t('已為您整理常見流程說明,也可以直接幫您預約時段。', 'I have put together the process overview — I can also book you a slot right now.') }
  ], rec: { src: t('LINE 官方帳號', 'LINE OA'), need: t('服務流程說明', 'Process overview'), miss: t('想解決的狀況', 'Problem to solve'), st: t('AI 可處理', 'AI can handle'), stc: 'ai' },
    crm: [t('需求類型:服務諮詢', 'Type: service inquiry'), t('狀態:資訊已提供', 'Status: info provided'), t('下一步:邀請預約', 'Next: invite to book')] },
  { key: '預約', msgs: [
    { who: 'c', text: t('想約這週五下午討論。', 'Can we talk this Friday afternoon?') },
    { who: 'ai', text: t('週五 14:00–16:00 有空檔,先幫您保留 14:00,可以嗎?', 'Friday 14:00–16:00 is open — shall I hold 14:00 for you?') },
    { who: 'ai', kind: 'image', text: t('週五行事曆・14:00 已圈起', 'Friday calendar · 14:00 circled') },
    { who: 'c', kind: 'sticker', text: '🙌' },
    { who: 'ai', text: t('已保留並寄出提醒,當天會再通知您。', 'Held and reminder sent — we will ping you on the day.') }
  ], rec: { src: t('LINE 官方帳號', 'LINE OA'), need: t('預約時段', 'Booking slot'), miss: t('無(資料齊全)', 'None (all set)'), st: t('AI 可處理', 'AI can handle'), stc: 'ai' },
    crm: [t('需求類型:預約', 'Type: booking'), t('時段:週五 14:00 ✓', 'Slot: Fri 14:00 ✓'), t('提醒:已排程', 'Reminder: scheduled')] },
  { key: '報價', msgs: [
    { who: 'c', kind: 'image', text: t('現場照片・供估價參考', 'Site photos · for the estimate') },
    { who: 'c', text: t('這樣的需求大概多少錢?', 'Roughly how much for something like this?') },
    { who: 'ai', text: t('會依範圍報價。我先記下您的需求重點,報價單今天內由專人送出。', 'It depends on scope. I have noted the key requirements — a specialist will send the quote today.') },
    { who: 'ai', kind: 'image', text: t('報價單草稿・PDF 產出中', 'Quote draft · PDF generating') }
  ], rec: { src: t('LINE 官方帳號', 'LINE OA'), need: t('估價', 'Estimate'), miss: t('需求範圍、預算區間', 'Scope and budget range'), st: t('待人工確認', 'Needs human review'), stc: 'h' },
    crm: [t('需求類型:報價', 'Type: quote'), t('報價單:草稿已建 ✓', 'Quote: draft created ✓'), t('指派:待專人確認', 'Assigned: pending review')] },
  { key: '轉真人', msgs: [
    { who: 'c', text: t('我的狀況比較複雜,想直接跟你們的人談。', 'My case is complicated — can I talk to a person?') },
    { who: 'ai', text: t('了解,馬上為您轉接。重點需求我已先整理好,不用再重講一次。', 'Of course — transferring now. I have summarized your needs, so you will not have to repeat yourself.') },
    { who: 'ai', kind: 'video', text: t('專員 30 秒自我介紹', '30-sec specialist intro') },
    { who: 'h', text: t('您好,我是專員,已看到您的需求摘要,我們直接從細節開始。', 'Hi, I am your specialist. I have your summary — let us jump straight into the details.') }
  ], rec: { src: t('LINE 官方帳號', 'LINE OA'), need: t('複雜需求洽談', 'Complex-case discussion'), miss: t('細節待專員確認', 'Details pending review'), st: t('已轉交負責人', 'Handed to owner'), stc: 'h' },
    crm: [t('需求類型:複雜案件', 'Type: complex case'), t('轉真人:已接手 ✓', 'Human: taken over ✓'), t('對話摘要:已附上', 'Chat summary: attached')] }
];

export const chatDemo = [
  { who: 'c', text: t('請問到府服務多少錢?', 'How much is an on-site visit?'), time: '23:41' },
  { who: 'ai', text: t('您好!到府服務會依需求範圍報價,方便說明一下您的需求嗎?我也可以先幫您保留本週的到府時段。', 'Hi! On-site visits are quoted by scope — mind sharing what you need? I can also hold a slot for you this week.'), time: '23:41', tag: t('30 秒內接住', 'Caught in 30 sec') },
  { who: 'c', text: t('好,想約這週五下午。', 'Sure. Friday afternoon works.'), time: '23:43' },
  { who: 'ai', text: t('已為您保留週五下午時段,重點需求已整理好,將由專人與您確認細節。', 'Friday afternoon is held. Your key needs are summarized — a specialist will confirm the details.'), time: '23:43', tag: t('重要需求 → 轉真人', 'Important need → human') }
];
