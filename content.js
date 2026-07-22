// 奇鋒國際 PeakQi — 全站內容資料層(唯一內容來源:AI 方案 Sales Kit)
export const contact = {
  email: 'jacky@peakqi.com',
  phone: '0266093699',
  phoneDisplay: '(02) 6609-3699',
  site: 'peakqi.com',
  url: 'https://peakqi.com'
};

export const navigation = [
  { href: 'Solutions.dc.html', key: 'solutions', label: '解決方案' },
  { href: 'Method.dc.html', key: 'method', label: '導入方法' },
  { href: 'Cases.dc.html', key: 'cases', label: '案例' },
  { key: 'product', label: '產品', children: [
    { href: 'PeakOps.dc.html', label: 'Peak Ops', desc: '通用 AI 業務工具' },
    { href: 'https://www.aiweddingpro360.com/', label: 'AI Wedding Pro', desc: '婚禮 AI', ext: true },
    { href: 'https://www.aiinteriorpro360.com/', label: 'AI Interior Pro', desc: '室內設計 AI', ext: true },
    { href: 'https://bubble.tw', label: '冒泡', desc: '房仲 AI', ext: true },
    { href: 'Pricing.dc.html', label: '方案說明', desc: 'Peak Ops 三種規劃與導入範圍' }
  ] },
  { href: 'About.dc.html', key: 'about', label: '關於我們' }
];

export const stats = [
  { v: '30+', l: '已上線的系統與網站', d: '累計交付並實際上線的 AI 系統、客製平台與品牌網站專案。' },
  { v: '8+', l: '導入過的產業情境', d: '實際做過導入的產業與流程情境,不是可服務產業的清單。' },
  { v: '最快 10 天', l: '標準模組第一階段上線', d: '以標準模組估算的最快工作天數。客製串接、資料遷移與跨部門平台另行評估。' },
  { v: '24 小時', l: 'AI 持續接收詢問', d: '系統全天候接收、分類並整理客戶詢問。需要判斷的內容仍在上班時間由專人接手。' }
];

export const painPoints = [
  { t: '資訊斷裂', d: 'LINE、表單、試算表與 CRM 各自保存一部分資訊,團隊需要反覆搜尋與複製。' },
  { t: '工作斷裂', d: '客服回覆後,仍需人工通知業務、建立客戶、安排追蹤與整理報價。' },
  { t: '責任斷裂', d: '案件停下來時,團隊不知道目前由誰負責,以及下一步應該做什麼。' }
];
export const painClose = '問題通常不在工具本身,而在工具與工具之間那一段沒有人接。';

export const lossSteps = [
  { v: '100', u: '組/月', l: '詢問進來' },
  { v: '30', u: '組', l: '回太慢、資料接不上而流失' },
  { v: '1', u: '萬', l: '每單平均金額' },
  { v: '30', u: '萬/月', l: '每月可能蒸發的營收' }
];
export const lossYear = {
  v: '360', u: '萬/年',
  note: '以上為情境估算,不是實際發生的數字。計算式為「每月詢問數 × 漏追比例 × 平均客單價 × 12」,用於呈現漏接與流程中斷可能造成的影響。實際結果依企業詢問量、成交率、客單價與流程而異。'
};
export const lossQuote = '工具越多越亂,客人就在空隙裡漏掉。';

export const flow3 = [
  { n: '01', en: 'CAPTURE', t: '接客', d: 'AI 先回應、理解需求、協助安排時段,必要時轉由專人接手。半夜進來的詢問,不用等到隔天上班才有人看到。' },
  { n: '02', en: 'FOLLOW', t: '追客', d: 'CRM 集中客戶資料、建立跟進節奏,該跟進的系統提醒你,AI 把訊息擬好,你確認就送出。' },
  { n: '03', en: 'NURTURE', t: '養客', d: '案例、內容、優惠與關係維護集中安排,把「考慮中」的客人一步步推向下訂。' }
];

export const features = [
  { n: '01', name: 'AI 客服', tag: '接住常見問題,低信心或敏感案件轉人工。', items: ['自動回覆、理解需求', '協助預約、保留時段', '判斷不了就轉真人'] },
  { n: '02', name: 'CRM', tag: '把對話整理成客戶資料、目前階段與下一步,並依狀態提醒負責人。', items: ['名單集中一個後台', '互動紀錄與行為追蹤', '跟進節奏自動提醒'] },
  { n: '03', name: '行銷', tag: '貼文、EDM 與視覺由 AI 先出草稿,發不發、怎麼調由你決定。', items: ['貼文草稿每週產出', 'Banner、EDM 快速生成', 'AI 場景渲染與風格模擬'] },
  { n: '04', name: '報價', tag: '整理客戶需求與方案,產出可確認的報價草稿。', items: ['線上報價單', '自動算稅', 'Excel / PDF 匯出'] },
  { n: '05', name: '專案', tag: '成交資訊直接進入任務、時程與交付流程。', items: ['專案排程與進度追蹤', '成本與利潤管理', '提案簡報整合'] },
  { n: '06', name: '數據', tag: '看見詢問從哪裡進來,又在哪一個階段停下來。', items: ['營運儀表板', '來源分析、業績追蹤', 'AI 月報自動生成'] }
];
export const baseSupport = ['安全穩定', '雲端架構', '資料整合', '開放整合', '彈性擴充'];

export const industries = ['婚禮婚慶', '室內設計', '房仲不動產', '美業', '團購電商', '活動售票', 'ESG 永續', '社區管理', '教育培訓', '品牌官網'];
export const industriesNote = '新產業版本以標準模組建置,第一階段最快 10 個工作天可部署;客製需求另行評估。';

export const caseStudies = [
  {
    slug: '室內設計 AI 整合平台',
    industry: '室內設計裝修', title: '室內設計 AI 整合平台',
    img: 'assets/works/work-interior.png',
    alt: '室內設計 AI 整合平台畫面:空間渲染、風格模擬與自動提案簡報',
    stuck: '客戶改一次風格,就要重畫、重渲染、重做簡報;設計師把時間花在來回修改與整理提案,而不是設計本身。',
    did: '空間渲染、風格模擬、自動提案簡報,整合進一個平台。',
    human: '風格生成與提案排版由 AI 準備草稿;材質、報價與最終簡報由設計師確認後送出。',
    metrics: [{ v: '約 90%', l: '提案效率提升(該案例)' }, { v: '3天→3hr', l: '三天的工作,3 小時完成' }, { v: '10+', l: '種風格一鍵切換' }]
  },
  {
    slug: '婚禮產業 AI 大禮包',
    industry: '婚禮婚慶', title: '婚禮產業 AI 大禮包',
    img: 'assets/works/work-wedding.png',
    alt: '婚禮產業 AI 大禮包系統畫面:婚紗試穿模擬與 AI 接客',
    stuck: '婚紗款式、檔期、試妝與方案問題集中在 LINE,由客服重複回覆,再人工把資訊整理到不同表單與群組。',
    did: '婚紗試穿、髮型試妝模擬、場景生成,加上 AI 接客。',
    human: '常見問題與試妝試髮預覽由 AI 先處理;價格、檔期與特殊需求交由專人確認。',
    metrics: [{ v: '↓約 70%', l: '客服人力(該案例)' }, { v: '5 倍', l: '成交率提升' }, { v: '8+', l: 'AI 功能模組' }]
  },
  {
    slug: '美業 AI 體驗系統',
    industry: '美容・美髮・美甲', title: '美業 AI 體驗系統',
    stuck: '髮色、妝容與美甲只能用形容的溝通,客人難以想像成果;報價與確認在對話裡來回,做完才發現落差。',
    did: '髮色試換、妝容模擬、美甲預覽,消費前先看成果。',
    human: '試色與效果預覽由 AI 生成;方案、價格與客製需求由美業師確認後報價。',
    metrics: [{ v: '3 倍', l: '報價速度提升(該案例)' }, { v: '↓約 60%', l: '決策時間縮短' }, { v: '多次', l: '風格反覆試換' }]
  },
  {
    slug: '房仲 AI 助手',
    industry: '房仲不動產', title: '房仲 AI 助手(串 LINE 官方帳號)',
    img: 'assets/works/work-realestate.png',
    alt: '房仲 AI 助手畫面:串接 LINE 官方帳號自動回物件、排預約帶看',
    stuck: '物件、格局、價格與帶看時間的詢問散在 LINE,業務要一則則回,再人工安排帶看,回覆常常隔數小時。',
    did: 'AI 自動回覆物件資訊、排預約帶看,串接 LINE 官方帳號。',
    human: '物件資訊與帶看時段由 AI 自動回覆與預約;議價、屋況說明與成交交由業務處理。',
    metrics: [{ v: '30 秒內', l: '回覆時間,原本數小時(該案例)' }, { v: '約 8hr/週', l: '節省的排程時間' }, { v: '↑約 20%', l: '名單轉化' }]
  }
];
export const caseNote = '實際成果依企業流程、資料品質與導入範圍而異。';
export const caseCta = '討論相似導入情境';

export const worksFeatured = [
  { t: '婚禮產業 AI 大禮包', cat: 'AI 系統', img: 'assets/works/work-wedding.png', alt: '婚禮產業 AI 大禮包系統畫面:婚紗試穿模擬、社群影片生成、發文中心與客戶續談 CRM', problem: '新人問不停,試妝試髮只能靠形容。', solution: '婚紗試穿、試妝模擬、場景生成+AI 接客。', results: ['客服人力 ↓約 70%', '成交率 5 倍', '8+ AI 模組'] },
  { t: '室內設計 AI 整合平台', cat: 'AI 系統', img: 'assets/works/work-interior.png', alt: '室內設計 AI 整合平台畫面:空間渲染、風格模擬與自動提案簡報', problem: '提案、畫圖、渲染、簡報,三天起跳。', solution: '渲染、風格模擬、自動提案,一個平台完成。', results: ['提案效率 ↑約 90%', '3 天工作 3 小時完成', '10+ 風格一鍵切換'] },
  { t: '房仲 AI 助手', cat: 'AI 系統', img: 'assets/works/work-realestate.png', alt: '房仲 AI 助手畫面:串接 LINE 官方帳號,自動回物件、排預約帶看', problem: '物件詢問回覆要花數小時。', solution: '串 LINE 官方帳號,自動回物件、排帶看。', results: ['回覆縮短至 30 秒內', '每週省約 8 小時排程', '名單轉化 ↑約 20%'] },
  { t: 'AI LINE 群組自動摘要', cat: 'AI 系統', img: 'assets/works/work-linesummary.png', alt: 'AI LINE 群組自動總結摘要工具畫面', problem: '群組訊息太多,重點被洗掉。', solution: 'AI 自動總結群組對話重點。', results: [], url: 'https://line-requirement-bot.vercel.app/' },
  { t: 'AI 自動排桌・排房工具', cat: 'AI 系統', img: 'assets/works/work-tables.png', alt: 'AI 自動排組桌、排房工具畫面', problem: '排桌、排房靠人腦喬,一改再改。', solution: 'AI 自動排組桌、排房。', results: [] },
  { t: '牽成|任務回報・團隊管理', cat: '客製系統', img: 'assets/works/work-tasks.png', alt: '牽成任務回報與團隊管理系統畫面', problem: '任務交辦散在對話裡,回報靠追問。', solution: '任務回報與團隊管理收進一套系統。', results: [] },
  { t: '團購通|電商・LINE 串接', cat: '客製系統', img: 'assets/works/work-groupbuy.png', alt: '團購通電商系統畫面,串接 LINE 官方帳號', problem: '團購對帳、下單訊息全靠人工整理。', solution: '電商系統串接 LINE 官方帳號。', results: [] }
];

export const portfolioAI = [
  { t: '心途', d: 'LINE 定課任務管理工具', cat: 'AI 系統' },
  { t: 'AI 排桌排房', d: '自動排組桌、排房工具', cat: 'AI 系統', img: 'assets/works/work-tables.png' },
  { t: '牽成', d: '任務回報/團隊管理系統', cat: '客製系統', img: 'assets/works/work-tasks.png' },
  { t: '團購通', d: '電商系統,串接 LINE 官方帳號', cat: '客製系統', img: 'assets/works/work-groupbuy.png' },
  { t: 'Hungmen Voice', d: '聲音檢測自我狀態報告', cat: 'AI 系統' },
  { t: 'AI 神農氏', d: '保健品配方健檢與開發評估', cat: 'AI 系統' },
  { t: 'AutoDraft 台灣 AI 補助王', d: '補助計畫書 AI 搜尋、分析與撰寫', cat: 'AI 系統', url: 'https://autodraft-mvp.vercel.app/' },
  { t: 'Pounds Network', d: '服務業會員忠誠度與獎勵平台', cat: 'AI 系統', url: 'https://www.pounds.network/en' },
  { t: 'AI LINE 群組摘要', d: 'LINE 群組對話自動總結', cat: 'AI 系統', url: 'https://line-requirement-bot.vercel.app/', img: 'assets/works/work-linesummary.png' },
  { t: 'AI 呂洞賓', d: '算命/解籤系統', cat: 'AI 系統' },
  { t: 'Nivora AI', d: 'AI Agent 虛擬辦公室', cat: 'AI 系統' }
];
export const portfolioWeb = [
  { t: '嘉義市世博會官網', d: '市府級大型活動網站,如期交付上線', cat: '品牌網站', img: 'assets/works/work-expo.png' },
  { t: 'ROUZHI 顏植髮泥', d: '品牌官網', cat: '品牌網站', url: 'https://rouzhi.tw/' },
  { t: 'OUROS', d: 'AI 課程網頁設計', cat: '品牌網站', url: 'https://www.ouros.tw/' },
  { t: 'DOIIIN ESG 平台', d: '網頁設計顧問暨製作', cat: '品牌網站', url: 'https://v0-esg-media-platform.vercel.app/' },
  { t: 'SparkSpace 倉儲監控', d: '倉儲監控系統', cat: '客製系統', url: 'https://www.sparkspace.com.tw/', img: 'assets/works/work-warehouse.png' },
  { t: '宮廷命理研究院', d: '算名系統與課程', cat: '客製系統', url: 'https://palace-virid-nine.vercel.app/' },
  { t: 'Inner Weather', d: 'VJ 用視覺軟體', cat: '客製系統', url: 'https://love-hazel-two.vercel.app/' },
  { t: 'ASML', d: '品牌官網', cat: '品牌網站' },
  { t: '拉步步', d: '活動售票系統', cat: '客製系統' },
  { t: '台中綠園', d: '圖庫房系統', cat: '客製系統' },
  { t: '社區管理 APP', d: '社區管理 APP 與後台', cat: '客製系統', img: 'assets/works/work-community.png' },
  { t: '租屋管理平台', d: '租屋與物件管理', cat: '客製系統' },
  { t: '顏博士論壇', d: '論壇網站', cat: '品牌網站' }
];

export const compare = {
  dims: ['上線速度', '能力範圍', '完成後支援', '費用模式'],
  cols: [
    { name: '找工程師完整客製', vals: ['約三個月起', '依預算與規格而定', '依合約範圍', '一次性較大投入'], hot: false },
    { name: '單一客服機器人', vals: ['快,但功能較單一', '多半只回答 FAQ', '多需自行摸索', '月費制,功能較少'], hot: false },
    { name: 'PeakQi 整合營運系統', vals: ['標準模組第一階段最快 10 個工作天上線', '接客＋管理＋行銷＋報價,一套整合', '專人持續協助優化', '低建置＋月費,用多少算多少'], hot: true }
  ]
};

export const plans = [
  { code: 'A', name: 'AI 接客方案', quote: '依需求報價', base: '', items: ['自動回覆', '需求了解', '預約', '轉接', '知識庫'], featured: false, badge: '' },
  { code: 'B', name: 'AI 業務助理', quote: '依需求報價', base: '包含 A 方案全部功能,再加上:', items: ['異議處理', '跟進序列', '養客 CRM', '月報分析'], featured: true, badge: '最多人選' },
  { code: 'C', name: 'AI 營運平台', quote: '依需求報價', base: '包含 B 方案全部功能,再加上:', items: ['社群貼文', '行銷排程', '提案簡報', '專案報價', '數據儀表板'], featured: false, badge: '' }
];
export const planNote = '實際費用依需求範圍與使用情境評估。歡迎預約諮詢,我們會依你的場景給出建議與報價;各產品的詳細價格請見該產品官網。';
export const humanCompare = { leftT: '請一位真人助理', leftV: '月薪＋招募與管理成本', leftU: '', rightT: '這套系統', rightV: '一次導入,持續運作', rightU: '', rightD: '還幫你 24 小時顧前線。' };

export const customRanges = [
  { s: '單一流程導入', r: '先從一個高價值場景驗證,快速上線。' },
  { s: '多模組整合', r: '接上 CRM、報價、專案等多個模組。' },
  { s: '跨部門營運系統', r: '打通部門之間的資料與流程。' },
  { s: '客製平台開發', r: '依需求從零打造專屬系統。' }
];
export const customNote = '可以先從一個高價值場景開始,也可以在驗證有效後,逐步整合成跨部門營運平台。';
export const customCred = '客製實績:嘉義市世博會官網、品牌官網、倉儲監控平台、售票系統、社區管理 APP 等——市府級大型活動官網也有執行經驗。';

export const usage = [
  { t: '文字類:包含在月費內,不限量', d: 'AI 對話、文案、報告、SEO 分析等,全部含在月費裡,不另外計費。', c: '#65E0BC' },
  { t: '圖片・影片類:按使用量計費', d: 'AI 場景渲染、風格模擬、短影音等,用多少、付多少。', c: '#3E9BFF' }
];
export const usageNote = '文字類用量含在月費內;圖片與影片類依實際使用量計費,導入前會依你的流程先估算範圍。';

export const timeline = [
  { d: 'DAY 0', t: '簽約、提供資料' },
  { d: 'DAY 1–4', t: '建立知識庫、設定 AI 話術、功能模組建置' },
  { d: 'DAY 5–7', t: '內部測試、模擬對話' },
  { d: 'DAY 7–10', t: '校準會議' },
  { d: 'DAY 10', t: '正式上線' }
];
export const timelineNote = '此時程適用標準模組的第一階段上線。客製串接、資料遷移、跨部門平台與特殊權限需求,依現有系統與流程複雜度另行評估;完整垂直平台或大型客製系統參考時程約六週起。';

export const risk = [
  { n: '01', t: '先看情境 Demo', d: '用你自己的流程跑一遍,先確認流程、資料與使用方式,再決定是否進入導入。' },
  { n: '02', t: '第一階段三個月', d: '第一階段為三個月;之後可依實際使用情況按月調整或停止。' },
  { n: '03', t: '上線後調整期', d: '上線後依實際使用回饋調整設定、話術與流程。退費與終止條件以合約約定為準,簽約前會逐條說明。' }
];

export const faq = [
  { q: '會不會很難用?', a: '我們幫你設定好,你照常做生意,系統在背後把客人接起來。不用學新軟體,也不用改變現在的做事方式。' },
  { q: '客戶資料安全嗎?', a: '獨立存放、加密保護。資料不外流,也不會拿去訓練別人的模型。' },
  { q: 'AI 會不會亂回話?', a: '上線前會用你的實際情境反覆校準;遇到判斷不了的問題,馬上轉真人,不會硬答。' },
  { q: 'AI 跟真人怎麼分工?', a: 'AI 顧前線:接待、了解需求、先篩選;對話中出現重要內容,直接轉給你接手。' },
  { q: '多久可以上線?', a: '標準模組的第一階段最快 10 個工作天:DAY 0 簽約、DAY 1–4 建置、DAY 5–7 測試、DAY 7–10 校準、DAY 10 上線。客製串接、資料遷移與跨部門平台依現有系統複雜度另行評估;完整垂直平台或大型客製參考約六週起。' },
  { q: 'AI 使用量怎麼計費?', a: '文字類(對話、文案、報告、SEO 分析)包含在月費內、不限量;圖片與影片類(場景渲染、風格模擬、短影音)按使用量計費,用多少付多少。' },
  { q: '可以只做部分功能嗎?', a: '可以。方案由小到大:A 先把接客做好,B 加上跟進與 CRM,C 才是完整營運平台;之後要擴充,再往上加就好。' },
  { q: '能不能串接 LINE 或既有流程?', a: '可以。LINE 官方帳號串接是我們的核心場景(房仲助手、團購通都是實例);既有工具與流程的整合範圍,Demo 時依你的情況確認。' }
];

// 跟進序列採「狀態導向」而非固定天數:不是每家企業都適用同一套七天模板。
// 系統支援依案件狀態 / 指定時間 / 客戶互動觸發,這裡呈現的是狀態流。
export const followupSeq = [
  { d: 'STEP 01', t: '補齊需求:缺的資料由 AI 擬好追問訊息' },
  { d: 'STEP 02', t: '提供相關案例或資料,幫客戶往下評估' },
  { d: 'STEP 03', t: '確認客戶反應,更新案件狀態' },
  { d: 'STEP 04', t: '由負責人決定下一步:報價、約訪或結案' }
];

// 方案 ↔ 功能模組對應(功能總覽六模組)
export const planModules = {
  A: ['AI 客服'],
  B: ['AI 客服', 'CRM', '數據'],
  C: ['AI 客服', 'CRM', '行銷', '報價', '專案', '數據']
};

// Demo 表單設定
export const demoIndustries = [...industries, '其他'];
export const contactTimes = ['不限,方便就好', '平日上午', '平日下午', '平日晚上', '週末'];
// API endpoint 集中設定:接上正式後端時填入 URL;null = 預覽 demo submission
export const submitConfig = { endpoint: null };

export function faqJsonLd(list) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
  };
}

// 新場景資料(純流程示意,無新增成果數字)
export const diagMetrics = [
  { t: '未讀訊息', u: '條', max: 24 },
  { t: '未跟進名單', u: '組', max: 12 },
  { t: '資料重複', u: '筆', max: 8 },
  { t: '平均回覆延遲', u: '小時', max: 6 },
  { t: '流程斷點', u: '處', max: 5 }
];
export const relayStations = [
  { t: 'LINE 詢問', s: 'CAPTURED', d: '客人訊息進來,AI 先接住並辨識需求' },
  { t: 'AI 分類', s: 'CLASSIFIED', d: '需求、預算、時段自動整理' },
  { t: 'CRM 建檔', s: 'ASSIGNED', d: '建立客戶卡,指派負責人與跟進序列' },
  { t: '報價', s: 'QUOTED', d: '線上報價單自動算稅,當天送出' },
  { t: '專案', s: 'DELIVERED', d: '排程執行,進度打開就知道' },
  { t: '數據回報', s: 'MEASURED', d: '來源與業績寫回儀表板與 AI 月報' }
];

// /solutions 接客情境切換(產品 UI 模擬對話,非成效宣稱)
export const solutionsScenarios = [
  { key: '一般問題', msgs: [
    { who: 'c', text: '你們的服務流程大概是怎麼進行?' },
    { who: 'ai', text: '我們會先了解需求,再安排時間詳談。方便說一下您想解決的狀況嗎?' },
    { who: 'ai', kind: 'sticker', text: '😊' },
    { who: 'ai', text: '已為您整理常見流程說明,也可以直接幫您預約時段。' }
  ], crm: ['需求類型:服務諮詢', '狀態:資訊已提供', '下一步:邀請預約'] },
  { key: '預約', msgs: [
    { who: 'c', text: '想約這週五下午討論。' },
    { who: 'ai', text: '週五 14:00–16:00 有空檔,先幫您保留 14:00,可以嗎?' },
    { who: 'ai', kind: 'image', text: '週五行事曆・14:00 已圈起' },
    { who: 'c', kind: 'sticker', text: '🙌' },
    { who: 'ai', text: '已保留並寄出提醒,當天會再通知您。' }
  ], crm: ['需求類型:預約', '時段:週五 14:00 ✓', '提醒:已排程'] },
  { key: '報價', msgs: [
    { who: 'c', kind: 'image', text: '現場照片・供估價參考' },
    { who: 'c', text: '這樣的需求大概多少錢?' },
    { who: 'ai', text: '會依範圍報價。我先記下您的需求重點,報價單今天內由專人送出。' },
    { who: 'ai', kind: 'image', text: '報價單草稿・PDF 產出中' }
  ], crm: ['需求類型:報價', '報價單:草稿已建 ✓', '指派:待專人確認'] },
  { key: '轉真人', msgs: [
    { who: 'c', text: '我的狀況比較複雜,想直接跟你們的人談。' },
    { who: 'ai', text: '了解,馬上為您轉接。重點需求我已先整理好,不用再重講一次。' },
    { who: 'ai', kind: 'video', text: '專員 30 秒自我介紹' },
    { who: 'h', text: '您好,我是專員,已看到您的需求摘要,我們直接從細節開始。' }
  ], crm: ['需求類型:複雜案件', '轉真人:已接手 ✓', '對話摘要:已附上'] }
];

export const chatDemo = [
  { who: 'c', text: '請問到府服務多少錢?', time: '23:41' },
  { who: 'ai', text: '您好!到府服務會依需求範圍報價,方便說明一下您的需求嗎?我也可以先幫您保留本週的到府時段。', time: '23:41', tag: '30 秒內接住' },
  { who: 'c', text: '好,想約這週五下午。', time: '23:43' },
  { who: 'ai', text: '已為您保留週五下午時段,重點需求已整理好,將由專人與您確認細節。', time: '23:43', tag: '重要需求 → 轉真人' }
];
