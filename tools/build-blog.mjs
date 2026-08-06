// 部落格全站重建 ── 冪等,跑幾次結果都一樣
//   node tools/build-blog.mjs
//
// 唯一內容來源:content/blog/<slug>.zh.md 與 content/blog/<slug>.en.md
//   有 .zh.md 沒 .en.md = 這篇只有中文;英文版不列出、不輸出 hreflang、語言切換鈕在該頁不出現。
// 產出(全部 commit 進 repo,線上不需要任何後端):
//   blog/<slug>.dc.html      /blog/<slug>
//   en/blog/<slug>.dc.html   /en/blog/<slug>
//   Blog.dc.html / en/Blog.dc.html      列表頁(卡片是靜態 HTML,爬蟲免執行 JS)
//   posts.js                            機器可讀索引(給工具與未來的「最新文章」區塊)
//   sitemap.xml / feed.xml / en/feed.xml
//
// SEO 鐵律:og:* 與 canonical 一律靜態寫在 <head>。Facebook / LINE 的爬蟲不執行 JS,
// 靠 seo.js 注入的話分享出去會是一片空白。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontMatter, mdToHtml, readMins, autoSummary, esc } from './md.mjs';
import { writeSitemapAndFeed, SITE } from './gen-sitemap.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'content', 'blog');

// 標籤字典:key 用英文(進網址與 class 都安全),顯示走雙語
export const TAGS = {
  'ai-adoption': { zh: 'AI 導入', en: 'AI adoption' },
  'automation': { zh: '流程自動化', en: 'Automation' },
  'customer-ops': { zh: '客戶經營', en: 'Customer ops' },
  'industry': { zh: '產業觀察', en: 'Industry' },
  'build-notes': { zh: '製作筆記', en: 'Build notes' }
};

const UI = {
  zh: {
    lang: 'zh-Hant-TW', ogLocale: 'zh_TW', dir: '/blog/', idxUrl: '/blog', home: '/',
    brand: '奇鋒國際 PeakQi', sep: '｜',
    idxTitle: '觀點', idxKicker: 'INSIGHTS',
    idxLede: 'AI 導入、流程自動化與客戶經營的實作觀點。寫我們實際做過的事,以及做的時候踩到什麼。',
    idxMeta: 'PeakQi 談 AI 導入、流程自動化與客戶經營的實作觀點,來自實際交付的專案現場。',
    all: '全部', back: '回到觀點', mins: '分鐘閱讀', empty: '這個標籤下還沒有文章。',
    related: '延伸閱讀', skip: '跳到主要內容', updated: '更新於',
    ctaTitle: '想知道這些流程在你的公司長什麼樣?',
    ctaBody: '預約一次場景 Demo,我們用你實際的流程走一遍,再一起評估哪一段值得先自動化。',
    ctaBtn: '預約場景 Demo', ctaHref: '/demo'
  },
  en: {
    lang: 'en', ogLocale: 'en_US', dir: '/en/blog/', idxUrl: '/en/blog', home: '/en/',
    brand: 'PeakQi', sep: ' | ',
    idxTitle: 'Insights', idxKicker: 'INSIGHTS',
    idxLede: 'Notes on AI adoption, workflow automation and customer operations — what we actually built, and what we ran into while building it.',
    idxMeta: 'PeakQi on AI adoption, workflow automation and customer operations — written from the delivery floor.',
    all: 'All', back: 'Back to Insights', mins: 'min read', empty: 'No posts under this tag yet.',
    related: 'Read next', skip: 'Skip to main content', updated: 'Updated',
    ctaTitle: 'Want to see what this looks like inside your company?',
    ctaBody: 'Book a scenario demo. We walk through your actual workflow, then work out together which part is worth automating first.',
    ctaBtn: 'Book a scenario demo', ctaHref: '/en/demo'
  }
};

// 沒有封面圖時的莫蘭迪色塊(依 slug 決定,同一篇永遠同一色)
const MORANDI = ['#A8B5A2', '#C9B8A8', '#B3A8B5', '#A2AFB5', '#C3B49A', '#B5A6A0', '#9FAEA6', '#BFAEB8'];
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const swatch = (slug) => {
  const h = hash(slug), n = MORANDI.length;
  const a = h % n;
  // 一定要用無號右移:>> 遇到高位為 1 的雜湊會變負數,取餘後拿到負索引 → undefined
  let b = (h >>> 3) % n;
  if (b === a) b = (a + 3) % n;                    // 兩色相同會變成純色塊,漸層就消失了
  return [MORANDI[a], MORANDI[b]];
};

const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(d, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || '').trim());
  if (!m) return '';
  return lang === 'en' ? `${MON_EN[+m[2] - 1]} ${+m[3]}, ${m[1]}` : `${m[1]} 年 ${+m[2]} 月 ${+m[3]} 日`;
}

const warn = [];
const W = (msg) => { warn.push(msg); };

// ── 1. 讀取原稿 ──────────────────────────────────────────────
function readSources() {
  if (!fs.existsSync(SRC)) { fs.mkdirSync(SRC, { recursive: true }); return []; }
  const files = fs.readdirSync(SRC).filter((f) => /\.(zh|en)\.md$/i.test(f));
  const bySlug = new Map();
  for (const f of files) {
    const m = /^(.+)\.(zh|en)\.md$/i.exec(f);
    const slug = m[1], lang = m[2].toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) { W(`slug 只能用小寫英數與連字號:${f}`); continue; }
    const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
    const { meta, body } = parseFrontMatter(raw);
    if (!meta.title) { W(`缺 title,已略過:${f}`); continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date || '')) { W(`date 需為 YYYY-MM-DD,已略過:${f}`); continue; }
    if (meta.draft === 'true') { W(`草稿狀態,不產出:${f}`); continue; }
    const html = mdToHtml(body);
    if (!bySlug.has(slug)) bySlug.set(slug, { slug });
    bySlug.get(slug)[lang] = {
      meta, html,
      title: meta.title,
      summary: meta.summary || autoSummary(html, lang === 'en' ? 190 : 90),
      mins: readMins(body, lang)
    };
  }
  return [...bySlug.values()];
}

// ── 2. 正規化成索引 ──────────────────────────────────────────
function toIndex(entries) {
  const posts = [];
  for (const e of entries) {
    if (!e.zh) { W(`只有英文版沒有中文版,暫不產出:${e.slug}(中文站是主站,請先補 ${e.slug}.zh.md)`); continue; }
    const m = e.zh.meta;
    const tags = String(m.tags || '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const t of tags) if (!TAGS[t]) W(`未知標籤「${t}」(${e.slug}) — 請先加進 tools/build-blog.mjs 的 TAGS`);
    let cover = (m.cover || '').trim();
    if (cover && !cover.startsWith('/')) { W(`cover 必須是絕對路徑(/assets/...):${e.slug}`); cover = ''; }
    if (cover && !fs.existsSync(path.join(ROOT, cover.replace(/^\//, '')))) { W(`找不到封面檔,改用色塊:${cover}`); cover = ''; }
    posts.push({
      slug: e.slug,
      date: m.date,
      updated: (m.updated || '').trim(),
      tags: tags.filter((t) => TAGS[t]),
      cover,
      coverAlt: (m.coverAlt || '').trim(),
      hasEn: !!e.en,
      zh: { title: e.zh.title, summary: e.zh.summary, mins: e.zh.mins },
      en: e.en ? { title: e.en.title, summary: e.en.summary, mins: e.en.mins } : null,
      _src: e
    });
  }
  // 新→舊;同日期用 slug 穩定排序,避免重建時順序抖動
  posts.sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : (a.date < b.date ? 1 : -1)));
  return posts;
}

// ── 3. 共用樣式 ──────────────────────────────────────────────
const BASE_CSS = `
h1,h2{text-wrap:balance}
html{scroll-behavior:smooth}
body{margin:0;background:#F2EFE8;color:#090B0E;font-family:'Noto Sans TC',sans-serif;-webkit-font-smoothing:antialiased}
::selection{background:#FF6B2C;color:#F2EFE8}
#pq-skip{position:fixed;left:12px;top:-60px;z-index:600;background:#090B0E;color:#F2EFE8;padding:12px 18px;border-radius:2px;font:700 .875rem 'Noto Sans TC',sans-serif;text-decoration:none;transition:top .16s}
#pq-skip:focus{top:12px;outline:2px solid #FF6B2C;outline-offset:2px}
@keyframes pqPageIn{from{opacity:0}to{opacity:1}}
body{animation:pqPageIn 260ms cubic-bezier(0.16,1,0.3,1)}
@media (prefers-reduced-motion:reduce){body{animation:none}*{transition:none!important}}`;

const EN_TYPE_CSS = `
html[lang="en"] h1,html[lang="en"] h2,html[lang="en"] h3{text-wrap:balance}
html[lang="en"] p,html[lang="en"] li{hyphens:auto;-webkit-hyphens:auto;text-wrap:pretty}`;

const ARTICLE_CSS = `
.pb-wrap{max-width:760px;margin:0 auto;padding:clamp(26px,4vw,44px) clamp(20px,5vw,48px) clamp(64px,9vw,110px)}
/* 返回連結要獨佔一行:inline-flex 會和後面的標籤黏成同一行,讀起來像「回到觀點 AI 導入」 */
.pb-back{display:flex;width:max-content;align-items:center;gap:7px;min-height:44px;font:600 13px 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.55);text-decoration:none}
.pb-back:hover{color:#D14E12}
.pb-kicker{display:block;margin-top:10px;font:600 11.5px 'Space Grotesk',sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#FF6B2C}
.pb-title{margin:12px 0 0;font:900 clamp(1.72rem,4.2vw,2.85rem)/1.28 'Noto Sans TC',sans-serif;letter-spacing:-.01em}
.pb-lede{margin:16px 0 0;font:400 clamp(1rem,1.55vw,1.14rem)/1.78 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.7)}
.pb-meta{margin:18px 0 0;font:500 13px 'Space Grotesk','Noto Sans TC',sans-serif;letter-spacing:.02em;color:rgba(9,11,14,.46)}
.pb-cover{margin:clamp(26px,4vw,42px) 0 0}
.pb-cover img{display:block;width:100%;height:auto;border-radius:3px}
/* 沒有封面圖時的色帶。刻意做矮:16/7 在桌機是 330px 的空白色塊,看起來像圖沒載到 */
.pb-swatch{margin:clamp(26px,4vw,42px) 0 0;aspect-ratio:16/5;border-radius:3px}
@media(max-width:600px){.pb-swatch{aspect-ratio:16/6}}
.pb-body{margin-top:clamp(26px,4vw,42px)}
.pb-body>*:first-child{margin-top:0}
.pb-body p{margin:20px 0 0;font:400 16.5px/2 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.84);overflow-wrap:anywhere}
.pb-body h2{margin:clamp(38px,5vw,58px) 0 0;font:800 clamp(1.22rem,2.1vw,1.55rem)/1.5 'Noto Sans TC',sans-serif}
.pb-body h3{margin:30px 0 0;font:700 1.0625rem/1.6 'Noto Sans TC',sans-serif}
.pb-body h4{margin:24px 0 0;font:700 .9375rem/1.6 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.7)}
.pb-body a{color:#D14E12;text-decoration:underline;text-underline-offset:3px}
.pb-body img{max-width:100%;height:auto}
.pb-list{margin:16px 0 0;padding-left:22px}
.pb-list li{margin-top:8px;font:400 16.5px/1.95 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.84);overflow-wrap:anywhere}
.pb-quote{margin:26px 0 0;padding:2px 0 2px 18px;border-left:3px solid #FF6B2C;font:500 16.5px/1.85 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.76)}
.pb-body code{background:rgba(9,11,14,.06);padding:2px 6px;border-radius:3px;font:400 .9em ui-monospace,SFMono-Regular,Menlo,monospace}
.pb-code{margin:22px 0 0;padding:16px 18px;background:#090B0E;color:#E8E4DA;border-radius:3px;overflow-x:auto;font:400 13.5px/1.72 ui-monospace,SFMono-Regular,Menlo,monospace}
.pb-code code{background:none;padding:0;white-space:pre}
.pb-fig{margin:clamp(26px,4vw,40px) 0}
.pb-fig img{display:block;width:100%;height:auto;border-radius:3px}
.pb-fig figcaption{margin-top:10px;font:400 13px/1.7 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.5)}
.pb-tablewrap{margin:24px 0 0;overflow-x:auto;-webkit-overflow-scrolling:touch}
.pb-table{border-collapse:collapse;min-width:100%;font:400 14.5px/1.7 'Noto Sans TC',sans-serif}
.pb-table th,.pb-table td{padding:11px 14px;border-bottom:1px solid rgba(9,11,14,.12);text-align:left;white-space:nowrap}
.pb-table th{font-weight:700;background:rgba(9,11,14,.04)}
.pb-hr{margin:clamp(34px,5vw,50px) 0 0;border:0;border-top:1px solid rgba(9,11,14,.14)}
.pb-cta{margin:clamp(42px,6vw,66px) 0 0;padding:clamp(22px,4vw,34px);background:#090B0E;color:#F2EFE8;border-radius:3px}
.pb-cta h2{margin:0;font:800 clamp(1.06rem,1.9vw,1.32rem)/1.5 'Noto Sans TC',sans-serif;color:#F2EFE8}
.pb-cta p{margin:10px 0 0;font:400 14.5px/1.85 'Noto Sans TC',sans-serif;color:rgba(242,239,232,.72)}
.pb-cta a{display:inline-flex;align-items:center;gap:8px;margin-top:18px;padding:13px 22px;min-height:44px;box-sizing:border-box;background:#FF6B2C;color:#090B0E;font:700 14px 'Noto Sans TC',sans-serif;text-decoration:none;border-radius:2px}
.pb-cta a:hover{background:#FF8149;color:#090B0E}
.pb-rel{margin:clamp(42px,6vw,64px) 0 0}
.pb-rel h2{margin:0 0 16px;font:700 11.5px 'Space Grotesk',sans-serif;letter-spacing:.22em;text-transform:uppercase;color:rgba(9,11,14,.45)}
.pb-relgrid{display:grid;gap:12px}
.pb-relcard{display:block;padding:17px 19px;background:#fff;border:1px solid rgba(9,11,14,.1);border-radius:3px;text-decoration:none;transition:border-color .18s,transform .18s}
.pb-relcard:hover{border-color:#FF6B2C;transform:translateY(-2px)}
.pb-relcard .t{font:700 15px/1.55 'Noto Sans TC',sans-serif;color:#090B0E}
.pb-relcard .d{margin-top:6px;font:500 12px 'Space Grotesk','Noto Sans TC',sans-serif;color:rgba(9,11,14,.46)}
@media(min-width:760px){.pb-relgrid{grid-template-columns:repeat(3,1fr)}}`;

const INDEX_CSS = `
.bl-head{max-width:1160px;margin:0 auto;padding:clamp(48px,7vw,96px) clamp(20px,5vw,48px) clamp(24px,3vw,38px)}
.bl-head .k{font:600 11.5px 'Space Grotesk',sans-serif;letter-spacing:.26em;color:#FF6B2C}
.bl-head h1{margin:12px 0 0;font:900 clamp(2.05rem,5.2vw,3.5rem)/1.18 'Noto Sans TC',sans-serif;letter-spacing:-.02em}
.bl-head p{margin:16px 0 0;max-width:58ch;font:400 clamp(.95rem,1.5vw,1.06rem)/1.8 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.64)}
.bl-filter{max-width:1160px;margin:0 auto;padding:0 clamp(20px,5vw,48px);display:flex;flex-wrap:wrap;gap:8px}
.bl-chip{appearance:none;-webkit-appearance:none;border:1px solid rgba(9,11,14,.16);background:none;border-radius:999px;padding:9px 16px;min-height:40px;font:600 13px 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.62);cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.bl-chip:hover{border-color:#090B0E;color:#090B0E}
.bl-chip[aria-pressed="true"]{background:#090B0E;border-color:#090B0E;color:#F2EFE8}
.bl-grid{max-width:1160px;margin:0 auto;padding:clamp(22px,3vw,32px) clamp(20px,5vw,48px) clamp(72px,10vw,120px);display:grid;gap:clamp(16px,2.2vw,26px)}
@media(min-width:720px){.bl-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1080px){.bl-grid{grid-template-columns:repeat(3,1fr)}}
.bl-card{display:flex;flex-direction:column;background:#fff;border:1px solid rgba(9,11,14,.1);border-radius:4px;overflow:hidden;text-decoration:none;transition:border-color .2s,transform .2s,box-shadow .2s}
.bl-card:hover{border-color:#FF6B2C;transform:translateY(-3px);box-shadow:0 14px 34px -22px rgba(9,11,14,.55)}
.bl-card[hidden]{display:none}
.bl-thumb{position:relative;aspect-ratio:16/10;overflow:hidden}
.bl-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.bl-thumb .n{position:absolute;right:14px;bottom:6px;font:700 3.2rem/1 'Space Grotesk',sans-serif;color:rgba(255,255,255,.34)}
.bl-cb{display:flex;flex-direction:column;flex:1;padding:17px 19px 20px}
.bl-tag{font:600 10.5px 'Space Grotesk',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#FF6B2C}
.bl-ct{margin:9px 0 0;font:800 clamp(1rem,1.45vw,1.1rem)/1.5 'Noto Sans TC',sans-serif;color:#090B0E}
.bl-cs{margin:9px 0 0;flex:1;font:400 13.5px/1.8 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.6)}
.bl-cm{margin:15px 0 0;font:500 12px 'Space Grotesk','Noto Sans TC',sans-serif;color:rgba(9,11,14,.42)}
.bl-empty{max-width:1160px;margin:0 auto;padding:0 clamp(20px,5vw,48px) clamp(72px,10vw,120px);font:400 15px/1.9 'Noto Sans TC',sans-serif;color:rgba(9,11,14,.55)}
.bl-empty[hidden]{display:none}`;

// ── 4. 頁面外殼 ──────────────────────────────────────────────
function shell({ lang, title, desc, canonical, ogImage, css, jsonLd, body, dcScript, active, alt }) {
  const u = UI[lang];
  const isEn = lang === 'en';
  // hreflang 靜態寫在 head:除了 SEO,i18n.js 的 hasEn() 也直接讀這一行決定語言切換鈕要不要出現,
  // 所以不必把整份文章索引載進每一頁。只有中英兩版都存在時才輸出。
  const hreflang = alt ? `<link rel="alternate" hreflang="zh-Hant" href="${esc(alt.zh)}">
<link rel="alternate" hreflang="en" href="${esc(alt.en)}">
<link rel="alternate" hreflang="x-default" href="${esc(alt.zh)}">
` : '';
  return `<!DOCTYPE html>
<html lang="${u.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="${jsonLd ? 'article' : 'website'}">
<meta property="og:site_name" content="${esc(u.brand)}">
<meta property="og:locale" content="${u.ogLocale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<link rel="canonical" href="${esc(canonical)}">
${hreflang}<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(u.brand)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<link rel="alternate" type="application/rss+xml" title="${esc(u.idxTitle)}" href="${isEn ? '/en/feed.xml' : '/feed.xml'}">
${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}
<script>window.__dcComponentDir='/';</script>
<script src="/support.js"></script>
<script>try{if('scrollRestoration' in history)history.scrollRestoration='manual';}catch(e){}
window.addEventListener('beforeunload',function(){try{window.scrollTo(0,0);}catch(e){}});
window.addEventListener('load',function(){if(!location.hash)requestAnimationFrame(function(){window.scrollTo(0,0);});});</script>
</head>
<body>
<x-dc>
<helmet>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>${BASE_CSS}${isEn ? EN_TYPE_CSS : ''}${css}
</style>
</helmet>
<a id="pq-skip" href="#pq-main">${esc(u.skip)}</a>
<dc-import name="Nav" active="${active}" hint-size="100%,68px"></dc-import>
${body}
<dc-import name="Footer" hint-size="100%,460px"></dc-import>
</x-dc>
<script type="text/x-dc" data-dc-script data-props="{&quot;$preview&quot;: {&quot;width&quot;: &quot;100%&quot;, &quot;height&quot;: 900}}">
class Component extends DCLogic {
${dcScript || '  renderVals() { return {}; }'}
}
</script>
</body>
</html>
`;
}

// ── 5. 文章頁 ────────────────────────────────────────────────
function buildArticle(post, lang, all) {
  const u = UI[lang];
  const c = lang === 'en' ? post._src.en : post._src.zh;
  const url = SITE + u.dir + post.slug;
  const tagLabel = post.tags.length ? TAGS[post.tags[0]][lang] : u.idxTitle;
  const ogImage = post.cover ? SITE + post.cover : SITE + '/og.png';
  const [c1, c2] = swatch(post.slug);

  const metaBits = [fmtDate(post.date, lang), `${c.mins} ${u.mins}`];
  if (post.updated) metaBits.push(`${u.updated} ${fmtDate(post.updated, lang)}`);

  // 延伸閱讀:同標籤優先,再補最新的;只挑「該語言存在」的文章
  const pool = all.filter((p) => p.slug !== post.slug && (lang === 'zh' || p.hasEn));
  const score = (p) => p.tags.filter((t) => post.tags.includes(t)).length;
  const related = pool.slice().sort((a, b) => score(b) - score(a) || (a.date < b.date ? 1 : -1)).slice(0, 3);

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: c.title,
    description: c.summary,
    inLanguage: u.lang,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    image: ogImage,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: u.brand, url: SITE + (lang === 'en' ? '/en/' : '/') },
    publisher: { '@type': 'Organization', name: u.brand, logo: { '@type': 'ImageObject', url: SITE + '/assets/logo.png' } }
  });

  const cover = post.cover
    ? `<figure class="pb-cover"><img src="${post.cover}" alt="${esc(post.coverAlt || c.title)}" width="1200" height="630" fetchpriority="high" decoding="async"></figure>`
    : `<div class="pb-swatch" style="background:linear-gradient(118deg,${c1},${c2})" aria-hidden="true"></div>`;

  const body = `
<main id="pq-main" class="pb-wrap" data-screen-label="${esc(c.title).slice(0, 24)}">
  <a class="pb-back" href="${u.idxUrl}">← ${esc(u.back)}</a>
  <span class="pb-kicker">${esc(tagLabel)}</span>
  <h1 class="pb-title">${esc(c.title)}</h1>
  <p class="pb-lede">${esc(c.summary)}</p>
  <p class="pb-meta">${esc(metaBits.join(' · '))}</p>
  ${cover}
  <article class="pb-body">
${c.html}
  </article>
  <hr class="pb-hr">
  <aside class="pb-cta">
    <h2>${esc(u.ctaTitle)}</h2>
    <p>${esc(u.ctaBody)}</p>
    <a href="${u.ctaHref}">${esc(u.ctaBtn)} →</a>
  </aside>
${related.length ? `  <nav class="pb-rel" aria-label="${esc(u.related)}">
    <h2>${esc(u.related)}</h2>
    <div class="pb-relgrid">
${related.map((r) => {
    const rc = lang === 'en' ? r.en : r.zh;
    return `      <a class="pb-relcard" href="${u.dir}${r.slug}"><span class="t">${esc(rc.title)}</span><span class="d">${esc(fmtDate(r.date, lang))} · ${rc.mins} ${esc(u.mins)}</span></a>`;
  }).join('\n')}
    </div>
  </nav>` : ''}
</main>`;

  return shell({
    lang, active: 'blog',
    title: c.title + u.sep + u.brand,
    desc: c.summary,
    canonical: url, ogImage, jsonLd,
    alt: post.hasEn ? { zh: `${SITE}/blog/${post.slug}`, en: `${SITE}/en/blog/${post.slug}` } : null,
    css: ARTICLE_CSS, body
  });
}

// ── 6. 列表頁 ────────────────────────────────────────────────
function buildIndex(posts, lang) {
  const u = UI[lang];
  const list = lang === 'en' ? posts.filter((p) => p.hasEn) : posts;
  const usedTags = [...new Set(list.flatMap((p) => p.tags))].filter((t) => TAGS[t]);

  const cards = list.map((p, i) => {
    const c = lang === 'en' ? p.en : p.zh;
    const [c1, c2] = swatch(p.slug);
    const thumb = p.cover
      ? `<img src="${p.cover}" alt="${esc(p.coverAlt || c.title)}" loading="lazy" decoding="async">`
      : `<span class="n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>`;
    const tag = p.tags.length ? TAGS[p.tags[0]][lang] : u.idxTitle;
    return `    <a class="bl-card" href="${u.dir}${p.slug}" data-tags="${esc(p.tags.join(' '))}">
      <span class="bl-thumb"${p.cover ? '' : ` style="background:linear-gradient(118deg,${c1},${c2})"`}>${thumb}</span>
      <span class="bl-cb">
        <span class="bl-tag">${esc(tag)}</span>
        <span class="bl-ct">${esc(c.title)}</span>
        <span class="bl-cs">${esc(c.summary)}</span>
        <span class="bl-cm">${esc(fmtDate(p.date, lang))} · ${c.mins} ${esc(u.mins)}</span>
      </span>
    </a>`;
  }).join('\n');

  const chips = usedTags.length ? `
<div class="bl-filter" role="group" aria-label="${esc(u.idxTitle)}">
  <button type="button" class="bl-chip" data-tag="" aria-pressed="true">${esc(u.all)}</button>
${usedTags.map((t) => `  <button type="button" class="bl-chip" data-tag="${t}" aria-pressed="false">${esc(TAGS[t][lang])}</button>`).join('\n')}
</div>` : '';

  const body = `
<main id="pq-main" data-screen-label="${esc(u.idxTitle)}">
  <header class="bl-head">
    <span class="k">${u.idxKicker}</span>
    <h1>${esc(u.idxTitle)}</h1>
    <p>${esc(u.idxLede)}</p>
  </header>${chips}
  <div class="bl-grid" id="bl-grid">
${cards}
  </div>
  <p class="bl-empty" id="bl-empty" hidden>${esc(u.empty)}</p>
</main>`;

  // 篩選:純 DOM 操作,不動 state ── 走 setState 會重繪整棵樹,監聽器就掉了
  const dcScript = `  renderVals() { return {}; }
  componentDidMount() {
    const chips = [].slice.call(document.querySelectorAll('.bl-chip'));
    const cards = [].slice.call(document.querySelectorAll('.bl-card'));
    const empty = document.getElementById('bl-empty');
    if (!chips.length || !cards.length) return;
    this._onChip = (e) => {
      const btn = e.currentTarget, tag = btn.getAttribute('data-tag') || '';
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === btn)));
      let shown = 0;
      cards.forEach((card) => {
        const on = !tag || (' ' + (card.getAttribute('data-tags') || '') + ' ').indexOf(' ' + tag + ' ') >= 0;
        card.hidden = !on;
        if (on) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    };
    chips.forEach((c) => c.addEventListener('click', this._onChip));
    this._chips = chips;
  }
  componentWillUnmount() {
    if (this._chips && this._onChip) this._chips.forEach((c) => c.removeEventListener('click', this._onChip));
  }`;

  return shell({
    lang, active: 'blog',
    title: u.idxTitle + u.sep + u.brand,
    desc: u.idxMeta,
    canonical: SITE + u.idxUrl,
    ogImage: SITE + '/og.png',
    jsonLd: null,
    // 列表頁只要有任一篇英文版就成對:英文列表頁本來就存在,只是可能空的
    alt: posts.some((p) => p.hasEn) ? { zh: SITE + '/blog', en: SITE + '/en/blog' } : null,
    css: INDEX_CSS, body, dcScript
  });
}

// ── 7. posts.js ──────────────────────────────────────────────
function buildPostsJs(posts) {
  const rows = posts.map((p) => '  ' + JSON.stringify({
    slug: p.slug, date: p.date, updated: p.updated || undefined,
    tags: p.tags, cover: p.cover || undefined, hasEn: p.hasEn,
    zh: p.zh, en: p.en || undefined
  })).join(',\n');
  const tagRows = Object.entries(TAGS).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
  return `// 自動產生 ── 請勿手改。改內容請編輯 content/blog/*.md 後執行:node tools/build-blog.mjs
// 文章索引(新→舊)。hasEn=false 代表這篇只有中文版:英文列表不列出、不輸出 hreflang。
export const TAGS = {
${tagRows}
};

export const POSTS = [
${rows}
];

// 給頁面用的小工具:取最新 n 篇(英文站自動只取有英文版的)
export function latest(n, lang) {
  const list = lang === 'en' ? POSTS.filter((p) => p.hasEn) : POSTS;
  return list.slice(0, n || 3);
}
`;
}

// ── 8. 執行 ──────────────────────────────────────────────────
function rmStale(dir, keep) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!/\.dc\.html$/.test(f)) continue;
    if (!keep.has(f)) { fs.unlinkSync(path.join(dir, f)); n++; }
  }
  return n;
}

const entries = readSources();
const posts = toIndex(entries);

const zhDir = path.join(ROOT, 'blog');
const enDir = path.join(ROOT, 'en', 'blog');
fs.mkdirSync(zhDir, { recursive: true });
fs.mkdirSync(enDir, { recursive: true });

const keepZh = new Set(), keepEn = new Set();
for (const p of posts) {
  fs.writeFileSync(path.join(zhDir, p.slug + '.dc.html'), buildArticle(p, 'zh', posts), 'utf8');
  keepZh.add(p.slug + '.dc.html');
  if (p.hasEn) {
    fs.writeFileSync(path.join(enDir, p.slug + '.dc.html'), buildArticle(p, 'en', posts), 'utf8');
    keepEn.add(p.slug + '.dc.html');
  }
}
// 原稿刪掉/英文版撤下時,產出物要跟著消失,否則會留下孤兒頁被 Google 收錄
const staleZh = rmStale(zhDir, keepZh);
const staleEn = rmStale(enDir, keepEn);

fs.writeFileSync(path.join(ROOT, 'Blog.dc.html'), buildIndex(posts, 'zh'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'en', 'Blog.dc.html'), buildIndex(posts, 'en'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'posts.js'), buildPostsJs(posts), 'utf8');

const r = writeSitemapAndFeed(posts.map(({ _src, ...rest }) => rest));

const enCount = posts.filter((p) => p.hasEn).length;
console.log(`\n文章 ${posts.length} 篇(英文版 ${enCount} 篇)`);
console.log(`  blog/*.dc.html        ${keepZh.size} 檔${staleZh ? `(清掉 ${staleZh} 個孤兒)` : ''}`);
console.log(`  en/blog/*.dc.html     ${keepEn.size} 檔${staleEn ? `(清掉 ${staleEn} 個孤兒)` : ''}`);
console.log(`  Blog.dc.html / en/Blog.dc.html`);
console.log(`  posts.js              ${posts.length} 筆`);
console.log(`  sitemap.xml           ${r.sitemap} 筆`);
console.log(`  feed.xml ${r.feedZh} 篇 / en/feed.xml ${r.feedEn} 篇`);
if (warn.length) {
  console.log('\n注意:');
  warn.forEach((w) => console.log('  ! ' + w));
}
console.log('');
