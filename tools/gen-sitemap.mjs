// sitemap.xml + feed.xml 產生器 ── 由 tools/build-blog.mjs 呼叫,也可單獨執行
//   node tools/gen-sitemap.mjs
// 靜態頁清單寫死在下方(頁面本來就不常增減);部落格文章由 content/blog 掃描而來。
// 主機一律用 www.peakqi.com:canonical、hreflang、sitemap 三者若不同源,Google 會整組忽略 hreflang。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://www.peakqi.com';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 只在 git 查不到時當保底(未追蹤的檔、或在 repo 外執行)
const FALLBACK_LASTMOD = '2026-08-06';

// [中文 clean path, changefreq, 中文 priority, 頁面原始檔] ── 英文版一律 priority - 0.1
// 第四欄用來查 lastmod,英文版取 en/<同檔名>。
const STATIC_PAGES = [
  ['/', 'weekly', 1.0, 'Home.dc.html'],
  ['/peakops', 'weekly', 0.9, 'PeakOps.dc.html'],
  ['/solutions', 'weekly', 0.9, 'Solutions.dc.html'],
  ['/pricing', 'weekly', 0.9, 'Pricing.dc.html'],
  ['/method', 'monthly', 0.8, 'Method.dc.html'],
  ['/cases', 'weekly', 0.8, 'Cases.dc.html'],
  ['/demo', 'weekly', 0.9, 'Demo.dc.html'],
  ['/studio', 'weekly', 0.9, 'Studio.dc.html'],
  ['/about', 'monthly', 0.7, 'About.dc.html'],
  ['/products', 'monthly', 0.7, 'Products.dc.html'],
  ['/bubble', 'monthly', 0.6, 'Bubble.dc.html'],
  ['/ai-wedding-pro', 'monthly', 0.6, 'AIWeddingPro.dc.html'],
  ['/ai-interior-pro', 'monthly', 0.6, 'AIInteriorPro.dc.html'],
  ['/privacy', 'yearly', 0.3, 'Privacy.dc.html']
];

// lastmod 逐頁從 git 取,不再共用一個手動維護的常數。
// Google 拿 lastmod 決定要不要回來重爬:常數化的日期等於告訴它「這頁沒動過」——
// 實測 2026-08-11 時 Home 與 Solutions 都已改到 08-11,而常數還停在 08-06,
// 剛好在我們最需要它重爬(修完 canonical 與網址收斂)的時候壓住了訊號。
// 反過來也不能全站都蓋今天:Google 明說 lastmod 不實就整份忽略。
const TODAY = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
// 只砍尾端空白。不能用 trim():porcelain 的「已修改未暫存」每行開頭就是一個空格
// (" M path"),整份 trim 會吃掉第一行的前導空格,底下的欄位切分就整體位移一格。
function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .replace(/\s+$/, '');
  } catch { return ''; }
}
// 已修改未提交的檔案算今天 —— 它就是正要被提交的那一版,取 git 會慢一個 commit。
// 用正規式吃掉狀態欄而不是固定 slice(3),前導空格在不在都切得對。
const DIRTY = new Set(
  git(['status', '--porcelain']).split('\n')
    .map((l) => l.replace(/^\s*\S{1,2}\s+/, '').split(' -> ').pop().trim())
    .filter(Boolean)
);
function lastmodOf(file) {
  if (DIRTY.has(file)) return TODAY;
  return git(['log', '-1', '--format=%cs', '--', file]) || FALLBACK_LASTMOD;
}

const X = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const xml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => X[c]);
const enPath = (p) => (p === '/' ? '/en' : '/en' + p);

// YYYY-MM-DD → RFC-822(RSS 規格要求)。固定 09:00 +0800,避免時區推斷造成日期跳一天。
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function rfc822(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || '').trim());
  if (!m) return '';
  const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getUTCDay()];
  return `${dow}, ${m[3]} ${MON[+m[2] - 1]} ${m[1]} 09:00:00 +0800`;
}

function urlEntry({ loc, lastmod, changefreq, priority, alt }) {
  const lines = [`    <loc>${xml(loc)}</loc>`];
  if (alt) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="zh-Hant" href="${xml(alt.zh)}"/>`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${xml(alt.en)}"/>`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(alt.zh)}"/>`);
  }
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority != null) lines.push(`    <priority>${priority.toFixed(1)}</priority>`);
  return '  <url>\n' + lines.join('\n') + '\n  </url>';
}

/**
 * @param {Array} posts build-blog.mjs 產出的文章索引(依日期新→舊)
 * @returns {{sitemap:number, feedZh:number, feedEn:number}}
 */
export function writeSitemapAndFeed(posts) {
  const list = Array.isArray(posts) ? posts : [];
  const entries = [];

  // 1) 靜態頁(中文 + 英文,成對輸出 hreflang)
  for (const [p, freq, pri, file] of STATIC_PAGES) {
    const alt = { zh: SITE + p, en: SITE + enPath(p) };
    entries.push(urlEntry({ loc: SITE + p, lastmod: lastmodOf(file), changefreq: freq, priority: pri, alt }));
    entries.push(urlEntry({ loc: SITE + enPath(p), lastmod: lastmodOf('en/' + file), changefreq: freq, priority: Math.max(0.1, pri - 0.1), alt }));
  }

  // 2) 觀點列表頁 ── 有文章才輸出,空欄目進 sitemap 只是給 Google 一個空殼
  if (list.length) {
    const newest = list[0].date || FALLBACK_LASTMOD;
    const alt = { zh: SITE + '/blog', en: SITE + '/en/blog' };
    const hasAnyEn = list.some((p) => p.hasEn);
    entries.push(urlEntry({ loc: SITE + '/blog', lastmod: newest, changefreq: 'weekly', priority: 0.8, alt: hasAnyEn ? alt : null }));
    if (hasAnyEn) entries.push(urlEntry({ loc: SITE + '/en/blog', lastmod: newest, changefreq: 'weekly', priority: 0.7, alt }));
  }

  // 3) 每篇文章 ── hreflang 只在英文版真的存在時輸出
  for (const p of list) {
    const alt = p.hasEn ? { zh: `${SITE}/blog/${p.slug}`, en: `${SITE}/en/blog/${p.slug}` } : null;
    const lastmod = p.updated || p.date;
    entries.push(urlEntry({ loc: `${SITE}/blog/${p.slug}`, lastmod, changefreq: 'monthly', priority: 0.7, alt }));
    if (p.hasEn) entries.push(urlEntry({ loc: `${SITE}/en/blog/${p.slug}`, lastmod, changefreq: 'monthly', priority: 0.6, alt }));
  }

  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.join('\n') + '\n</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

  const feedZh = writeFeed(list, 'zh');
  const feedEn = writeFeed(list.filter((p) => p.hasEn), 'en');
  return { sitemap: entries.length, feedZh, feedEn };
}

const FEED_META = {
  zh: { file: 'feed.xml', self: '/feed.xml', link: '/blog', lang: 'zh-Hant-TW', title: '觀點｜奇鋒國際 PeakQi', desc: 'PeakQi 談 AI 導入、流程自動化與客戶經營的實作觀點。' },
  en: { file: 'en/feed.xml', self: '/en/feed.xml', link: '/en/blog', lang: 'en', title: 'Insights | PeakQi', desc: 'PeakQi on AI adoption, workflow automation and customer operations — from the build side.' }
};

function writeFeed(posts, lang) {
  const m = FEED_META[lang];
  const base = lang === 'en' ? '/en/blog/' : '/blog/';
  const items = posts.slice(0, 30).map((p) => {
    const c = lang === 'en' ? p.en : p.zh;
    const url = SITE + base + p.slug;
    return ['    <item>',
      `      <title>${xml(c.title)}</title>`,
      `      <link>${xml(url)}</link>`,
      `      <guid isPermaLink="true">${xml(url)}</guid>`,
      `      <description>${xml(c.summary)}</description>`,
      p.date ? `      <pubDate>${rfc822(p.date)}</pubDate>` : '',
      '    </item>'].filter(Boolean).join('\n');
  }).join('\n');

  const out = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n' +
    `    <title>${xml(m.title)}</title>\n` +
    `    <link>${SITE}${m.link}</link>\n` +
    `    <description>${xml(m.desc)}</description>\n` +
    `    <language>${m.lang}</language>\n` +
    `    <atom:link href="${SITE}${m.self}" rel="self" type="application/rss+xml"/>\n` +
    (items ? items + '\n' : '') +
    '  </channel>\n</rss>\n';

  const dest = path.join(ROOT, m.file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out, 'utf8');
  return posts.length;
}

// 單獨執行時:自己去讀 posts.js 的索引
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mod = await import(new URL('../posts.js', import.meta.url));
  const r = writeSitemapAndFeed(mod.POSTS || []);
  console.log(`sitemap.xml: ${r.sitemap} 筆　feed.xml: ${r.feedZh} 篇　en/feed.xml: ${r.feedEn} 篇`);
}
