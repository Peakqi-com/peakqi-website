// 預渲染管線 ── node tools/prerender.mjs
// 目的:讓不執行 JavaScript 的爬蟲(GPTBot、PerplexityBot、ClaudeBot…)也讀得到完整內容。
//
// 原理(單一內容來源,不維護兩份文案):
//   1. 模板(*.dc.html)仍是唯一可編輯來源;
//   2. 本工具用系統 Chrome 把每頁渲染完成,快照 #dc-root 的 HTML;
//   3. 產出 built/<Name>.html:head 補上 canonical/hreflang/JSON-LD,
//      <x-dc data-tpl="/tpl/<Name>.dc.html"> 內放快照(初始 HTML 即完整內容);
//   4. 原始模板複製到 tpl/,執行期 support.js(見 PQ PATCH)fetch 模板接手互動;
//   5. vercel.json 的 rewrites 把乾淨網址指到 built/。
//
// ⚠ 改了任何 *.dc.html 模板或 content.js 之後,必須重跑本工具再 commit,
//    否則線上內容停在舊版(built/ 是產出物,但要進版控)。
//
// 快照時擋掉視覺/動畫引擎(它們會把元素設成進場前的隱藏狀態),內容資料層照常載入。
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.peakqi.com';
const PORT = 8177;
const CHROME = process.env.PQ_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// [檔名, 中文乾淨路徑, 麵包屑名 zh, 麵包屑名 en]
const PAGES = [
  ['Home', '/', null, null],
  ['PeakOps', '/peakops', 'Peak Ops', 'Peak Ops'],
  ['Solutions', '/solutions', '解決方案', 'Solutions'],
  ['Pricing', '/pricing', '方案說明', 'Pricing'],
  ['Method', '/method', '導入方法', 'How We Deliver'],
  ['Cases', '/cases', '案例與作品', 'Case Studies'],
  ['About', '/about', '關於 PeakQi', 'About PeakQi'],
  ['Studio', '/studio', '接案', 'Studio'],
  ['Demo', '/demo', '預約 Demo', 'Book a Demo'],
  ['Products', '/products', '產品', 'Products'],
  ['Bubble', '/bubble', '冒泡', 'Bubble'],
  ['AIWeddingPro', '/ai-wedding-pro', 'AI Wedding Pro', 'AI Wedding Pro'],
  ['AIInteriorPro', '/ai-interior-pro', 'AI Interior Pro', 'AI Interior Pro'],
  ['Privacy', '/privacy', '隱私權政策', 'Privacy'],
  ['Blog', '/blog', '觀點', 'Insights']
];
// 頁面上真的有顯示 FAQ 的頁 → 靜態嵌 FAQPage(id 與執行期一致,執行期看到已存在就不再注入)
const FAQ_PAGES = { PeakOps: 'faq', Pricing: 'faqPricing' };

// 視覺/動畫引擎:快照時擋掉(頁面元件對這些 import 都有 .catch 容錯)
const BLOCK = /\/(motion-kit|motion\/[^/]+\.motion|hero-kit|hero-engine|hero-scenes|hero-config|cases-hero|cases-engine|home-engine|home2-engine|gl-engine|micro-engine|interactions-engine|pa-engine|sections-engine|solutions-engine|analytics|blog-hero|about-hero|about-organic|allen-[^/]+|puppet-kit)\.js/;

const enPath = (p) => (p === '/' ? '/en' : '/en' + p);

// 每語言各開一個 node 子行程取 content.js 的 FAQ 資料(i18n 於載入時定案語言)
function loadFaq(lang) {
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', `
    globalThis.location = { pathname: ${JSON.stringify(lang === 'en' ? '/en/' : '/')} };
    const m = await import(${JSON.stringify(pathToFileURL(path.join(ROOT, 'content.js')).href)});
    console.log(JSON.stringify({ faq: m.faq, faqPricing: m.faqPricing }));
  `], { encoding: 'utf8', cwd: ROOT });
  return JSON.parse(out);
}
const FAQ_DATA = { zh: loadFaq('zh'), en: loadFaq('en') };
const faqLd = (list) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
});

const S = await import(pathToFileURL(path.join(ROOT, 'seo-schema.js')).href);

function headInjections(name, lang, crumbZh, crumbEn, srcHead) {
  const en = lang === 'en';
  const p = PAGES.find((x) => x[0] === name)[1];
  const url = SITE + (en ? enPath(p) : p);
  const parts = [];
  if (!/rel="canonical"/.test(srcHead)) parts.push(`<link rel="canonical" href="${url}">`);
  if (!/hreflang/.test(srcHead)) {
    parts.push(`<link rel="alternate" hreflang="zh-Hant" href="${SITE + p}">`);
    parts.push(`<link rel="alternate" hreflang="en" href="${SITE + enPath(p)}">`);
    parts.push(`<link rel="alternate" hreflang="x-default" href="${SITE + p}">`);
  }
  const crumbs = [{ name: en ? 'Home' : '首頁', url: SITE + (en ? '/en' : '/') }];
  if (name !== 'Home') crumbs.push({ name: en ? crumbEn : crumbZh, url });
  const ld = [S.orgJsonLd(lang), S.webSiteJsonLd(lang), S.serviceJsonLd(lang), S.breadcrumbJsonLd(crumbs)];
  if (name === 'PeakOps') ld.push(S.peakOpsJsonLd(lang));
  parts.push(`<script type="application/ld+json" id="pq-ld-core">${JSON.stringify(ld)}</script>`);
  if (FAQ_PAGES[name]) {
    const list = FAQ_DATA[lang][FAQ_PAGES[name]] || [];
    if (list.length) parts.push(`<script type="application/ld+json" id="pq-faq-ld">${JSON.stringify(faqLd(list))}</script>`);
  }
  return parts.join('\n');
}

function compose(name, lang, srcText, snapshot) {
  const en = lang === 'en';
  const open = srcText.indexOf('<x-dc');
  const openEnd = srcText.indexOf('>', open);
  const close = srcText.lastIndexOf('</x-dc>');
  if (open < 0 || close < 0) throw new Error(name + ': 找不到 <x-dc>');
  const tplUrl = (en ? '/tpl/en/' : '/tpl/') + name + '.dc.html';
  const region = srcText.slice(openEnd + 1, close);
  // helmet 內容(title/描述/字型/樣式)搬進真正的 <head>:沒有 JS 也要有正確的 title 與樣式
  const hm = /<helmet>([\s\S]*?)<\/helmet>/.exec(region);
  let helmetInner = hm ? hm[1] : '';
  helmetInner = helmetInner.replace(/<meta name="viewport"[^>]*>\s*/g, ''); // head 已有
  const headEnd = srcText.indexOf('</head>');
  const srcHead = srcText.slice(0, headEnd);
  const inject = headInjections(name, lang, ...PAGES.find((x) => x[0] === name).slice(2), srcHead + helmetInner);
  let out = srcText.slice(0, headEnd) + helmetInner + '\n' + inject + '\n' +
    srcText.slice(headEnd, open) +
    `<x-dc data-tpl="${tplUrl}">\n` + snapshot + '\n</x-dc>' +
    srcText.slice(close + '</x-dc>'.length);
  return out;
}

// ── 啟動純靜態伺服器 ─────────────────────────────────────────────
const srv = spawn(process.execPath, [path.join(ROOT, 'tools/serve.mjs'), String(PORT), '--no-rules'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route('**/*', (route) => {
  const u = route.request().url();
  if (u.startsWith('http://localhost')) {
    if (BLOCK.test(u)) return route.abort();
    return route.continue();
  }
  if (u.startsWith('https://unpkg.com/')) return route.continue(); // React/ReactDOM
  return route.abort(); // 字型、分析、其他外部資源:快照不需要
});

const results = [];
try {
  for (const [name, cleanPath] of PAGES) {
    for (const lang of ['zh', 'en']) {
      const en = lang === 'en';
      const srcFile = path.join(ROOT, en ? 'en' : '.', name + '.dc.html');
      const srcText = fs.readFileSync(srcFile, 'utf8');
      const urlPath = (en ? '/en/' : '/') + name + '.dc.html';
      const page = await ctx.newPage();
      try {
        await page.goto(`http://localhost:${PORT}${urlPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => {
          const root = document.getElementById('dc-root');
          if (!root) return false;
          const html = root.innerHTML;
          return html.length > 3000 && !html.includes('{{') && !root.querySelector('.sc-placeholder') &&
            /lin\.ee|peakqi/.test(html); // Footer(聯絡區)已渲染
        }, { timeout: 45000 });
        await page.waitForTimeout(800); // 資料層 setState 安定
        const snapshot = await page.evaluate(() => document.getElementById('dc-root').innerHTML);
        if (snapshot.includes('{{') || snapshot.includes('<sc-')) throw new Error('快照仍含模板語法');
        const out = compose(name, lang, srcText, snapshot);
        if (out.includes('{{')) throw new Error('產出仍含 {{');
        const outFile = path.join(ROOT, 'built', en ? 'en' : '.', name + '.html');
        fs.mkdirSync(path.dirname(outFile), { recursive: true });
        fs.writeFileSync(outFile, out, 'utf8');
        // 模板複製到 /tpl(執行期 data-tpl 讀這份;/tpl 設 noindex,robots 也擋)
        const tplFile = path.join(ROOT, 'tpl', en ? 'en' : '.', name + '.dc.html');
        fs.mkdirSync(path.dirname(tplFile), { recursive: true });
        fs.writeFileSync(tplFile, srcText, 'utf8');
        results.push(`${lang}/${name}: ${(snapshot.length / 1024).toFixed(0)}KB`);
      } finally { await page.close(); }
    }
  }
} finally {
  await browser.close();
  srv.kill();
}
console.log('[prerender] 完成 ' + results.length + ' 頁\n  ' + results.join('\n  '));
