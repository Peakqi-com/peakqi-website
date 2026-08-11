// sitemap.xml + feed.xml 產生器 ── 由 tools/build-blog.mjs 呼叫,也可單獨執行
//   node tools/gen-sitemap.mjs
// 靜態頁清單寫死在下方(頁面本來就不常增減);部落格文章由 content/blog 掃描而來。
// 主機一律用 www.peakqi.com:canonical、hreflang、sitemap 三者若不同源,Google 會整組忽略 hreflang。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://www.peakqi.com';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 靜態頁最後更新日:改版時手動更新這一行即可(文章日期各自獨立,不受影響)
const STATIC_LASTMOD = '2026-08-06';

// [中文 clean path, changefreq, 中文 priority] ── 英文版一律 priority - 0.1
const STATIC_PAGES = [
  ['/', 'weekly', 1.0], ['/peakops', 'weekly', 0.9], ['/solutions', 'weekly', 0.9],
  ['/pricing', 'weekly', 0.9], ['/method', 'monthly', 0.8], ['/cases', 'weekly', 0.8],
  ['/demo', 'weekly', 0.9], ['/about', 'monthly', 0.7], ['/products', 'monthly', 0.7],
  ['/bubble', 'monthly', 0.6], ['/ai-wedding-pro', 'monthly', 0.6],
  ['/ai-interior-pro', 'monthly', 0.6], ['/contact', 'monthly', 0.6], ['/privacy', 'yearly', 0.3]
];

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
  for (const [p, freq, pri] of STATIC_PAGES) {
    const alt = { zh: SITE + p, en: SITE + enPath(p) };
    entries.push(urlEntry({ loc: SITE + p, lastmod: STATIC_LASTMOD, changefreq: freq, priority: pri, alt }));
    entries.push(urlEntry({ loc: SITE + enPath(p), lastmod: STATIC_LASTMOD, changefreq: freq, priority: Math.max(0.1, pri - 0.1), alt }));
  }

  // 2) 觀點列表頁 ── 有文章才輸出,空欄目進 sitemap 只是給 Google 一個空殼
  if (list.length) {
    const newest = list[0].date || STATIC_LASTMOD;
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
