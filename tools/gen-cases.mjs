// 案例永久頁產生器 ── node tools/gen-cases.mjs(無參數=中英都產)
// 產出:cases/<slug>.html 與 en/cases/<slug>.html(完整靜態 HTML,不依賴 JS 即可讀)。
// 內容唯一來源:content.js(caseStudies)+ case-media.js(截圖與 alt)。
// 誠實原則:程式庫查不到的欄位(客戶名稱、公司規模、實際導入期間、數據計算基準)
// 一律標示「待補」,並以 TODO_REQUIRES_APPROVAL 註解記錄,不虛構、不寫進 JSON-LD。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LANG = process.argv[2];

if (!LANG) {
  // i18n.js 在模組載入時就定案語言 → 每個語言各跑一個子行程
  for (const l of ['zh', 'en']) {
    execFileSync(process.execPath, [fileURLToPath(import.meta.url), l], { stdio: 'inherit' });
  }
  process.exit(0);
}

// i18n.js 依 location.pathname 判定語言;Node 沒有 location → 先墊一個
globalThis.location = { pathname: LANG === 'en' ? '/en/' : '/' };
const d = await import('../content.js');
const media = await import('../case-media.js');
const S = await import('../seo-schema.js');

const en = LANG === 'en';
const L = (zh, enTxt) => (en ? enTxt : zh);
const SITE = S.SITE;
const pfx = en ? '/en' : '';
const TODAY = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── 每案補充敘事(僅整理自 content.js / case-media.js 既有文案,無新增宣稱)────────
// workflow 步驟沿用原 Case.dc.html 的 wfMap(該檔已退役,文字搬到這裡成為唯一來源)
const EXTRA = {
  wedding: {
    slug: 'wedding-industry-ai-suite',
    summary: L('婚紗款式、檔期、試妝與方案詢問集中在 LINE、由客服重複回覆的婚慶業者,導入 AI 接客與試穿試妝模擬後,常見問題由 AI 先接住,價格與檔期由專人確認。',
      'A wedding business whose dress, date, makeup-trial and package questions all piled into LINE. After rolling out AI intake with dress try-on and makeup previews, AI catches the routine questions first — pricing and dates stay with the team.'),
    modules: [L('AI 接客(LINE 詢問先接住、辨識需求)', 'AI intake (catches LINE inquiries, reads the need)'), L('婚紗試穿模擬', 'Dress try-on previews'), L('髮型試妝模擬', 'Hair & makeup previews'), L('場景生成', 'Scene generation'), L('社群影片與發文中心', 'Social video & publishing hub'), L('客戶續談 CRM', 'Follow-up CRM')],
    systems: [L('LINE(詢問入口)', 'LINE (inquiry channel)')],
    workflow: [L('新人 LINE 詢問,AI 30 秒接住', 'A couple asks on LINE; AI catches it in 30 seconds'), L('婚紗試穿/試妝模擬,先看成果', 'Dress try-on and makeup previews — see the result first'), L('需求整理成客戶卡,轉真人談細節', 'Needs organized into a customer card, handed to a person for details'), L('成交後排跟進與社群內容', 'After closing: follow-ups and social content scheduled')],
    beforeAfter: [
      [L('詢問回覆', 'Inquiry replies'), L('客服在 LINE 重複回答同樣的問題', 'Support answered the same questions on repeat in LINE'), L('常見問題由 AI 先接住,判斷不了轉專人', 'AI catches FAQs first; hands off when unsure')],
      [L('試妝試紗', 'Try-ons'), L('只能用文字與範例照片形容', 'Described in words and sample photos only'), L('AI 模擬預覽,消費前先看成果', 'AI previews — see the result before deciding')],
      [L('資料整理', 'Data handling'), L('人工把資訊轉貼到表單與群組', 'Info re-typed into forms and group chats by hand'), L('需求自動整理成客戶卡與跟進節奏', 'Needs auto-organized into customer cards and follow-up rhythm')]
    ]
  },
  interior: {
    slug: 'interior-design-ai-platform',
    summary: L('客戶每改一次風格就要重畫、重渲染、重做簡報的室內設計公司,導入空間渲染、風格模擬與自動提案簡報後,設計師把時間放回設計本身。',
      'An interior design firm where every style change meant redrawing, re-rendering and rebuilding the deck. With space renders, style previews and auto proposal decks, designers put their time back into design.'),
    modules: [L('空間渲染', 'Space rendering'), L('風格模擬(10+ 風格切換)', 'Style previews (10+ styles)'), L('自動提案簡報', 'Auto proposal decks'), L('專案排程與報價銜接', 'Project scheduling & quote handoff')],
    systems: [L('平台內建整合(渲染/簡報/專案同一平台)', 'Built-in platform integration (renders, decks, projects in one)')],
    workflow: [L('需求進來,AI 整理空間條件', 'A request comes in; AI organizes the space brief'), L('空間渲染+風格模擬即時產出', 'Renders and style previews generated on the spot'), L('自動組提案簡報,當天可交', 'Proposal deck auto-assembled — deliverable same day'), L('定案後進專案排程與報價', 'Once approved: project scheduling and quoting')],
    beforeAfter: [
      [L('提案製作', 'Proposal building'), L('畫圖、渲染、簡報三天起跳', 'Drawings, renders and deck: three days minimum'), L('三天的工作量,3 小時完成(該案例)', 'Three days of work done in three hours (this case)')],
      [L('風格調整', 'Style changes'), L('改一次風格=重畫+重渲染+重排簡報', 'One style change = redraw + re-render + rebuild the deck'), L('10+ 風格一鍵切換', '10+ styles switched in one click')],
      [L('設計師時間', 'Designer time'), L('大量耗在來回修改與整理提案', 'Burned on revisions and deck assembly'), L('AI 準備草稿,設計師確認後送出', 'AI drafts; the designer signs off and ships')]
    ]
  },
  realestate: {
    slug: 'real-estate-line-ai-assistant',
    summary: L('物件、格局、價格與帶看詢問散在 LINE、回覆常隔數小時的房仲團隊,串接 LINE 官方帳號後由 AI 自動回物件、排帶看;議價與成交仍由業務處理。',
      'A real-estate team whose listing, layout, price and viewing questions scattered across LINE, with replies taking hours. Integrated with the LINE official account, AI now answers listings and books viewings — negotiation and closing stay with the agents.'),
    modules: [L('AI 物件自動回覆', 'AI listing replies'), L('預約帶看排程', 'Viewing scheduler'), L('名單建檔與跟進提醒', 'Lead records & follow-up reminders')],
    systems: [L('LINE 官方帳號(實際串接)', 'LINE Official Account (live integration)')],
    workflow: [L('LINE 物件詢問自動回覆', 'Listing questions on LINE answered automatically'), L('AI 排預約帶看時段', 'AI books viewing slots'), L('客況寫進名單,提醒跟進', 'Lead status recorded; follow-ups nudged'), L('帶看後回報與轉化追蹤', 'Post-viewing reports and conversion tracking')],
    beforeAfter: [
      [L('回覆速度', 'Reply speed'), L('業務一則則回,常隔數小時', 'Agents replied one by one — often hours later'), L('30 秒內回覆(該案例)', 'Replies within 30 seconds (this case)')],
      [L('帶看安排', 'Viewing bookings'), L('人工來回喬時間', 'Scheduled back and forth by hand'), L('AI 自動保留時段、寄提醒', 'AI holds slots and sends reminders')],
      [L('名單管理', 'Lead management'), L('客況散在對話裡', 'Lead status buried in chats'), L('自動建檔、依狀態提醒跟進', 'Auto records with status-based follow-up nudges')]
    ]
  },
  beauty: {
    slug: 'beauty-ai-experience',
    summary: L('髮色、妝容與美甲只能「用形容的」溝通、報價在對話裡來回的美業店家,導入試色與效果預覽後,客人消費前先看到成果,方案與價格由美業師確認後報價。',
      'A beauty business where hair color, makeup and nails were described in words and quotes bounced around chats. With AI color and style previews, customers see the result before they buy — plans and prices are still quoted by the stylist.'),
    modules: [L('髮色試換', 'Hair color try-on'), L('妝容模擬', 'Makeup previews'), L('美甲預覽', 'Nail previews')],
    systems: [L('現場諮詢流程(預覽工具)', 'In-store consultation flow (preview tools)')],
    workflow: [L('客人描述想要的風格', 'The customer describes the look they want'), L('AI 產生試色與效果預覽', 'AI generates color and style previews'), L('反覆試換直到滿意', 'Retry styles until it feels right'), L('美業師確認方案與價格後報價', 'The stylist confirms the plan and quotes')],
    beforeAfter: [
      [L('溝通方式', 'Communication'), L('風格只能用形容的,做完才發現落差', 'Styles lived in words; gaps surfaced after the work was done'), L('消費前先看模擬成果', 'See the simulated result before buying')],
      [L('報價', 'Quoting'), L('在對話裡來回確認', 'Bounced around chats'), L('試換確認後由美業師直接報價(該案例報價速度 3 倍)', 'Quoted by the stylist right after previews (3× faster in this case)')],
      [L('決策', 'Decisions'), L('客人難以想像成果、猶豫期長', 'Hard to picture the result; long hesitation'), L('決策時間縮短約 60%(該案例)', 'Decision time down ~60% (this case)')]
    ]
  }
};

// content.js caseStudies 的中文 slug ↔ media slug 對照(與 Cases.dc.html narrMap 一致)
const NARR = { wedding: '婚禮產業 AI 大禮包', interior: '室內設計 AI 整合平台', realestate: '房仲 AI 助手', beauty: '美業 AI 體驗系統' };

const font = "'Noto Sans TC',sans-serif";
const mono = "'Space Grotesk',sans-serif";

function sectionLabel(no, textStr) {
  return `<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
    <span style="font:700 .8125rem ${mono};color:#FF6B2C">${no}</span>
    <span style="width:36px;height:1px;background:#FF6B2C"></span>
    <span style="font:600 .75rem ${mono};letter-spacing:.26em;color:rgba(9,11,14,.5)">${esc(textStr)}</span>
  </div>`;
}

function buildPage(key) {
  const x = EXTRA[key];
  const narr = (d.caseStudies || []).find((c) => c.slug === NARR[key]);
  const m = (media.FEATURED_MEDIA || []).find((f) => f.slug === key) || null;
  if (!narr) throw new Error('caseStudies 缺 ' + key);
  const title = narr.title;
  const url = SITE + pfx + '/cases/' + x.slug;
  const zhUrl = SITE + '/cases/' + x.slug;
  const enUrl = SITE + '/en/cases/' + x.slug;
  const ogImg = m ? SITE + m.cover.src : SITE + '/og.png';
  const desc = x.summary.length > 155 ? x.summary.slice(0, 152) + '…' : x.summary;
  const pageTitle = `${title}${L('|案例|奇鋒國際 PeakQi', ' | Case Study | PeakQi')}`;

  const crumbs = [
    { name: L('首頁', 'Home'), url: SITE + (en ? '/en' : '/') },
    { name: L('案例與作品', 'Case Studies'), url: SITE + pfx + '/cases' },
    { name: title, url }
  ];
  const jsonLd = [
    S.orgJsonLd(LANG),
    S.webSiteJsonLd(LANG),
    { ...S.webPageJsonLd(LANG, { url, name: pageTitle, description: desc }),
      primaryImage: ogImg, datePublished: '2026-08-06', dateModified: TODAY,
      author: { '@id': S.ORG_ID } },
    S.breadcrumbJsonLd(crumbs)
    // 成效數據刻意不寫進 JSON-LD:計算期間與導入前基準尚未整理成可驗證欄位
    // (TODO_REQUIRES_APPROVAL:由 PeakQi 補齊後,再評估是否以 Claim 標記)。
  ];

  const navLinks = [
    [pfx + '/solutions', L('解決方案', 'Solutions')],
    [pfx + '/method', L('導入方法', 'How we deliver')],
    [pfx + '/cases', L('案例', 'Cases')],
    [pfx + '/pricing', L('方案說明', 'Pricing')],
    [pfx + '/about', L('關於我們', 'About')]
  ];

  const metricCards = (narr.metrics || []).map((mt) => `
      <div style="background:#171A1F;border:1px solid rgba(242,239,232,.14);border-radius:6px;padding:22px;display:flex;flex-direction:column;gap:7px">
        <span style="font:700 clamp(1.6rem,3vw,2.3rem)/1 ${mono};color:#FF6B2C">${esc(mt.v)}</span>
        <span style="font:400 .8125rem/1.6 ${font};color:rgba(242,239,232,.65)">${esc(mt.l)}</span>
      </div>`).join('');

  const galleryHtml = m ? `
<section style="padding:0 clamp(20px,5vw,48px) clamp(56px,7vw,96px)">
  <div style="max-width:1100px;margin:0 auto">
    ${sectionLabel('10', L('GALLERY — 系統實際畫面', 'GALLERY — Real product screens'))}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px">
      ${m.gallery.map((g) => `<img src="${g.src}" alt="${esc(g.alt)}" loading="lazy" width="${g.w}" height="${g.h}" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(9,11,14,.16);background:#090B0E;display:block">`).join('\n      ')}
    </div>
  </div>
</section>` : '';

  const related = Object.keys(EXTRA).filter((k) => k !== key).map((k) => {
    const rn = (d.caseStudies || []).find((c) => c.slug === NARR[k]);
    return `<a href="${pfx}/cases/${EXTRA[k].slug}" style="display:flex;flex-direction:column;gap:8px;background:#090B0E;color:#F2EFE8;border-radius:6px;padding:18px;text-decoration:none;border:1px solid rgba(9,11,14,.2)">
        <span style="font:600 .6875rem ${mono};letter-spacing:.18em;color:#FF6B2C">${esc((media.FEATURED_MEDIA.find((f) => f.slug === k) || { industry: rn.industry }).industry)}</span>
        <span style="font:800 .9375rem/1.5 ${font}">${esc(rn.title)}</span>
      </a>`;
  }).join('\n      ');

  const html = `<!DOCTYPE html>
<html lang="${en ? 'en' : 'zh-Hant-TW'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="zh-Hant" href="${zhUrl}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="x-default" href="${zhUrl}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${en ? 'PeakQi International' : 'PeakQi 奇鋒國際'}">
<meta property="og:locale" content="${en ? 'en_US' : 'zh_TW'}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImg}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(pageTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImg}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
h1,h2{text-wrap:balance}
body{margin:0;background:#F2EFE8;color:#090B0E;font-family:${font};-webkit-font-smoothing:antialiased}
a{color:#FF6B2C}a:hover{color:#D14E12}
::selection{background:#FF6B2C;color:#F2EFE8}
table{border-collapse:collapse;width:100%}
.pq-tablewrap{overflow-x:auto}
th,td{border-bottom:1px solid rgba(9,11,14,.14);padding:12px 14px;text-align:left;font:400 .9375rem/1.7 ${font};vertical-align:top}
th{font-weight:700;font-size:.8125rem;letter-spacing:.06em;color:rgba(9,11,14,.55);white-space:nowrap}
</style>
</head>
<body>
<header style="background:#090B0E;padding:14px clamp(20px,5vw,48px);display:flex;align-items:center;gap:18px;flex-wrap:wrap">
  <a href="${pfx || '/'}" style="font:800 1.0625rem ${mono};color:#F2EFE8;text-decoration:none;letter-spacing:.04em">PeakQi<span style="color:#FF6B2C">.</span></a>
  <nav aria-label="${L('主導覽', 'Main navigation')}" style="display:flex;gap:16px;flex-wrap:wrap;margin-left:auto">
    ${navLinks.map(([h, l2]) => `<a href="${h}" style="font:600 .8125rem ${font};color:rgba(242,239,232,.72);text-decoration:none">${esc(l2)}</a>`).join('\n    ')}
    <a href="${en ? '/cases/' + x.slug : '/en/cases/' + x.slug}" lang="${en ? 'zh-Hant' : 'en'}" style="font:600 .8125rem ${mono};color:rgba(242,239,232,.55);text-decoration:none;border:1px solid rgba(242,239,232,.25);border-radius:999px;padding:2px 10px">${en ? '中文' : 'EN'}</a>
    <a href="${pfx}/demo" style="font:700 .8125rem ${font};color:#090B0E;background:#FF6B2C;text-decoration:none;border-radius:2px;padding:7px 14px">${L('預約 Demo', 'Book a demo')}</a>
  </nav>
</header>

<section style="background:#090B0E;color:#F2EFE8;padding:clamp(44px,6vw,80px) clamp(20px,5vw,48px)">
  <div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:18px">
    <nav aria-label="breadcrumb" style="display:flex;gap:10px;flex-wrap:wrap;font:500 .78125rem ${font};color:rgba(242,239,232,.5)">
      <a href="${pfx || '/'}" style="color:rgba(242,239,232,.5);text-decoration:none">${L('首頁', 'Home')}</a><span>/</span>
      <a href="${pfx}/cases" style="color:rgba(242,239,232,.5);text-decoration:none">${L('案例與作品', 'Case Studies')}</a><span>/</span>
      <span style="color:#F2EFE8;font-weight:700">${esc(title)}</span>
    </nav>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <span style="border:1px solid rgba(242,239,232,.3);border-radius:999px;padding:5px 13px;font:500 .75rem ${font};color:rgba(242,239,232,.75)">${esc(narr.industry)}</span>
      <span style="font:600 .65625rem ${mono};letter-spacing:.2em;color:#FF6B2C">${L('AI 系統・實際導入案例', 'AI SYSTEM · REAL ROLLOUT')}</span>
    </div>
    <h1 style="margin:0;font:900 clamp(1.55rem,4.2vw,3.2rem)/1.3 ${font}">${esc(title)}</h1>
    <p style="margin:0;max-width:760px;font:400 clamp(.96875rem,1.25vw,1.09375rem)/1.85 ${font};color:rgba(242,239,232,.72)">${esc(x.summary)}</p>
    ${m ? `<img src="${m.cover.src}" alt="${esc(m.cover.alt)}" width="${m.cover.w}" height="${m.cover.h}" style="width:100%;height:auto;border-radius:8px;border:1px solid rgba(242,239,232,.16);background:#14171C;display:block">` : ''}
  </div>
</section>

<section style="padding:clamp(48px,6vw,80px) clamp(20px,5vw,48px)">
  <div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:clamp(40px,5vw,64px)">

    <div>
      ${sectionLabel('01', L('BACKGROUND — 客戶背景與產業', 'BACKGROUND — Client & industry'))}
      <p style="margin:0;max-width:760px;font:400 1rem/1.9 ${font};color:rgba(9,11,14,.78)">
        ${L(`${esc(narr.industry)}業者(案例以匿名呈現;客戶名稱與公司規模待客戶授權後公布)。此案為 PeakQi 實際交付並上線的系統,畫面截圖取自實際產品。`,
        `A business in ${esc(narr.industry).toLowerCase()} (presented anonymously; the client name and company size will be published once the client approves). This is a system PeakQi actually delivered and put live — screenshots are from the real product.`)}
        <!-- TODO_REQUIRES_APPROVAL: 客戶名稱、公司規模區間(如 10–50 人)需 PeakQi 與客戶確認後補上 -->
      </p>
    </div>

    <div>
      ${sectionLabel('02', L('BEFORE — 導入前的工作流程與痛點', 'BEFORE — The workflow and the pain'))}
      <p style="margin:0;max-width:760px;font:500 1.03125rem/1.9 ${font};color:rgba(9,11,14,.82)">${esc(narr.stuck)}</p>
    </div>

    <div>
      ${sectionLabel('03', L('SYSTEM — 導入的模組與串接系統', 'SYSTEM — Modules deployed & integrations'))}
      <p style="margin:0 0 14px;max-width:760px;font:500 1rem/1.85 ${font};color:rgba(9,11,14,.8)">${esc(narr.did)}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px">
        <div>
          <span style="font:600 .71875rem ${mono};letter-spacing:.2em;color:rgba(9,11,14,.45)">${L('導入模組', 'MODULES')}</span>
          <ul style="margin:10px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
            ${x.modules.map((mo) => `<li style="font:400 .9375rem/1.7 ${font};color:rgba(9,11,14,.75)">${esc(mo)}</li>`).join('\n            ')}
          </ul>
        </div>
        <div>
          <span style="font:600 .71875rem ${mono};letter-spacing:.2em;color:rgba(9,11,14,.45)">${L('串接系統', 'INTEGRATIONS')}</span>
          <ul style="margin:10px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
            ${x.systems.map((sy) => `<li style="font:400 .9375rem/1.7 ${font};color:rgba(9,11,14,.75)">${esc(sy)}</li>`).join('\n            ')}
          </ul>
          <p style="margin:10px 0 0;font:400 .78125rem/1.7 ${font};color:rgba(9,11,14,.5)">${L('其他既有工具的串接範圍依各案評估。', 'Additional integrations are scoped per project.')}</p>
        </div>
      </div>
    </div>

    <div>
      ${sectionLabel('04', L('TIMELINE — 導入時間', 'TIMELINE — Rollout time'))}
      <p style="margin:0;max-width:760px;font:400 1rem/1.9 ${font};color:rgba(9,11,14,.78)">
        ${L('此案實際導入期間整理中,尚未公開。作為參考:PeakQi 標準模組的第一階段最快 10 個工作天上線(DAY 0 簽約 → DAY 1–4 建置 → DAY 5–7 測試 → DAY 7–10 校準上線);像此案這類完整垂直平台,參考時程約六週起。',
        'The exact rollout duration for this case is being compiled and not yet published. For reference: Phase 1 on PeakQi standard modules goes live in as little as 10 working days (sign Day 0 → build Days 1–4 → test Days 5–7 → calibrate and launch Days 7–10); a full vertical platform like this one starts around six weeks.')}
        <!-- TODO_REQUIRES_APPROVAL: 此案實際導入起訖日期,由 PeakQi 內部紀錄補上 -->
      </p>
    </div>

    <div>
      ${sectionLabel('05', L('HUMAN — 人工覆核與例外處理', 'HUMAN — Review & exceptions'))}
      <div style="max-width:760px;padding:16px 18px;border-left:2px solid #FF6B2C;background:rgba(255,107,44,.05)">
        <p style="margin:0;font:500 .96875rem/1.85 ${font};color:rgba(9,11,14,.8)">${esc(narr.human)}</p>
      </div>
    </div>

    <div>
      ${sectionLabel('06', L('WORKFLOW — 進到系統後的流程', 'WORKFLOW — Inside the system'))}
      <ol style="margin:0;padding-left:22px;max-width:760px;display:flex;flex-direction:column;gap:8px">
        ${x.workflow.map((w) => `<li style="font:400 .96875rem/1.8 ${font};color:rgba(9,11,14,.75)">${esc(w)}</li>`).join('\n        ')}
      </ol>
    </div>

    <div>
      ${sectionLabel('07', L('COMPARE — 導入前後比較', 'COMPARE — Before vs. after'))}
      <div class="pq-tablewrap" style="max-width:860px">
        <table>
          <thead><tr><th scope="col">${L('項目', 'Area')}</th><th scope="col">${L('導入前', 'Before')}</th><th scope="col">${L('導入後', 'After')}</th></tr></thead>
          <tbody>
            ${x.beforeAfter.map(([a2, b2, c2]) => `<tr><td style="font-weight:700;white-space:nowrap">${esc(a2)}</td><td>${esc(b2)}</td><td>${esc(c2)}</td></tr>`).join('\n            ')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<section style="background:#090B0E;color:#F2EFE8;padding:clamp(48px,6vw,80px) clamp(20px,5vw,48px)">
  <div style="max-width:1100px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
      <span style="font:700 .8125rem ${mono};color:#FF6B2C">08</span>
      <span style="width:36px;height:1px;background:#FF6B2C"></span>
      <span style="font:600 .75rem ${mono};letter-spacing:.26em;color:rgba(242,239,232,.5)">${L('RESULTS — 該案例成果', 'RESULTS — Outcomes in this case')}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">${metricCards}
    </div>
    <p style="margin:18px 0 0;max-width:820px;font:400 .8125rem/1.8 ${font};color:rgba(242,239,232,.55)">
      ${L('※ 以上為該案例回報的成果。各數字的計算期間、導入前基準與計算方式仍在整理成可公開的驗證說明,補齊前不列入結構化資料,也不作為通用成效承諾;', '※ Outcomes reported for this specific case. The measurement period, pre-rollout baseline and calculation method are still being compiled for publication; until then these figures are excluded from structured data and are not a general performance promise. ')}${esc(d.caseNote)}
      <!-- TODO_REQUIRES_APPROVAL: 每一項數據需補「計算期間/導入前基準/導入後數值/計算方式/資料來源」;由 PeakQi 內部紀錄與客戶確認後公布 -->
    </p>
    <!-- TODO_REQUIRES_APPROVAL: 客戶引言 ── 取得客戶書面授權的真實引言後,加在此區(不放未授權引言,不做 Review schema) -->
  </div>
</section>

<section style="padding:clamp(48px,6vw,80px) clamp(20px,5vw,48px)">
  <div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:clamp(36px,4vw,56px)">
    <div>
      ${sectionLabel('09', L('FIT — 適用條件與限制', 'FIT — Who this fits, and limits'))}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px;max-width:900px">
        <div>
          <span style="font:600 .71875rem ${mono};letter-spacing:.2em;color:rgba(9,11,14,.45)">${L('適合的情況', 'A GOOD FIT WHEN')}</span>
          <ul style="margin:10px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
            <li style="font:400 .9375rem/1.7 ${font};color:rgba(9,11,14,.75)">${L('詢問量穩定,但大量時間耗在重複回覆與人工整理', 'Steady inquiries, but hours burned on repeat replies and manual sorting')}</li>
            <li style="font:400 .9375rem/1.7 ${font};color:rgba(9,11,14,.75)">${L('主要客源在 LINE 或官網表單', 'Customers come in via LINE or website forms')}</li>
            <li style="font:400 .9375rem/1.7 ${font};color:rgba(9,11,14,.75)">${L('希望保留人工判斷:AI 只處理常見與例行問題', 'You want human judgment kept: AI handles the routine only')}</li>
          </ul>
        </div>
        <div>
          <span style="font:600 .71875rem ${mono};letter-spacing:.2em;color:rgba(9,11,14,.45)">${L('限制與前提', 'LIMITS & PREREQUISITES')}</span>
          <ul style="margin:10px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
            <li style="font:400 .9375rem/1.7 ${font};color:rgba(9,11,14,.75)">${esc(d.caseNote)}</li>
            <li style="font:400 .9375rem/1.7 ${font};color:rgba(9,11,14,.75)">${L('企業需參與知識整理與流程確認,AI 才有可靠的回答依據', 'Your team helps compile knowledge and confirm flows — that is what makes AI answers reliable')}</li>
            <li style="font:400 .9375rem/1.7 ${font};color:rgba(9,11,14,.75)">${L('客製串接、資料遷移與跨部門平台需另行評估', 'Custom integrations, data migration and cross-team platforms are scoped separately')}</li>
          </ul>
        </div>
      </div>
    </div>

    <div>
      ${sectionLabel('10', L('NEXT — 下一步', 'NEXT — Next step'))}
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
        <a href="${pfx}/demo?case=${encodeURIComponent(NARR[key])}" style="display:inline-flex;align-items:center;gap:10px;background:#FF6B2C;color:#090B0E;padding:16px 28px;border-radius:2px;font:700 .96875rem ${font};text-decoration:none">${L('把這個流程套用到我的公司 →', 'Apply this flow to my business →')}</a>
        <a href="${pfx}/cases" style="font:500 .90625rem ${font};color:rgba(9,11,14,.6);text-decoration:none">${L('← 回案例列表', '← Back to all cases')}</a>
      </div>
    </div>
  </div>
</section>

${galleryHtml}

<section style="padding:0 clamp(20px,5vw,48px) clamp(56px,7vw,96px)">
  <div style="max-width:1100px;margin:0 auto">
    <span style="font:600 .71875rem ${mono};letter-spacing:.2em;color:rgba(9,11,14,.45)">${L('RELATED — 相關案例', 'RELATED — More cases')}</span>
    <div style="margin-top:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px">
      ${related}
    </div>
  </div>
</section>

<footer style="background:#090B0E;color:rgba(242,239,232,.6);padding:clamp(32px,4vw,48px) clamp(20px,5vw,48px)">
  <div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:10px;font:400 .8125rem/1.8 ${font}">
    <p style="margin:0">${L('內容整理與審核:PeakQi 奇鋒國際團隊|資料來源:實際交付專案與產品畫面|最後更新:', 'Compiled and reviewed by the PeakQi team | Source: delivered projects and real product screens | Last updated: ')}${TODAY}</p>
    <p style="margin:0">${esc(en ? S.BRAND_DESC.en : S.BRAND_DESC.zh)}</p>
    <p style="margin:0">© ${new Date().getFullYear()} ${L('奇鋒國際有限公司 PeakQi', 'PeakQi International Ltd.')}・<a href="${pfx}/privacy" style="color:rgba(242,239,232,.6)">${L('隱私權政策', 'Privacy')}</a>・<a href="mailto:jacky@peakqi.com" style="color:rgba(242,239,232,.6)">jacky@peakqi.com</a>・<a href="tel:+886266093699" style="color:rgba(242,239,232,.6)">(02) 6609-3699</a></p>
  </div>
</footer>
</body>
</html>
`;
  return { slug: x.slug, html };
}

const outDir = path.join(ROOT, en ? 'en/cases' : 'cases');
fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (const key of Object.keys(EXTRA)) {
  const { slug, html } = buildPage(key);
  fs.writeFileSync(path.join(outDir, slug + '.html'), html, 'utf8');
  n++;
}
console.log(`[gen-cases] ${LANG}: ${n} 頁 → ${en ? 'en/cases/' : 'cases/'}`);
