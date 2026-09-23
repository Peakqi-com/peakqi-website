// CSP 產生器 ── node tools/gen-csp.mjs
//
// 把 Content-Security-Policy 寫進 vercel.json 的全站 headers 規則。
// inline script 的 sha256 由本工具掃描產出,不要手動維護 —— 漏一個就是那頁的
// 腳本靜默不執行(CSP 違規只進 console,畫面不會報錯,很難發現)。
//
// ⚠ 改了任何 *.dc.html、重跑 prerender.mjs 或 gen-cases.mjs 之後,必須重跑本工具。
//    順序:prerender → gen-cases → gen-sitemap → **gen-csp** → commit。
//
// 這個站為什麼只能鎖到這個程度:
//   script-src 必須留 'unsafe-eval' —— support.js 用 new Function() 跑 Babel 轉譯後的
//     JSX(support.js:797 / 1164 / 1171),那是 DC runtime 的核心,拿掉整站的元件都不會掛載。
//   style-src 必須留 'unsafe-inline' —— 全站有 25,000 多處 inline style 屬性,
//     要拿掉得先把它們收斂成 class,是另一個層級的工程。
//   但 inline **script** 不必妥協:全站沒有任何 onclick 等事件屬性,
//     所以可執行的 inline script 全部可以用 hash 列舉,不需要 'unsafe-inline'。
//     這一條才是 CSP 擋 XSS 的主力 —— 注入的 <script> 與 <img onerror> 都會被擋下。
//
// 注意:<script type="application/ld+json"> 是資料不是程式,瀏覽器不執行,CSP 也不擋,
//      所以不列入 hash(列了也沒用,只會讓標頭白白變大)。

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 實際會被瀏覽器當成「頁面」載入的 HTML。
// tpl/ 不列入:那些模板是 support.js 在執行期 fetch 後交給 DC runtime 的,
// 內容經 Babel 轉譯再 new Function 執行,不是頁面層級的 inline script。
const PAGE_GLOBS = [
  ['built', /\.html$/], ['built/en', /\.html$/],
  ['cases', /\.html$/], ['en/cases', /\.html$/],
  ['blog', /\.dc\.html$/], ['en/blog', /\.dc\.html$/],
  ['Steampunk', /\.html$/],
  ['.', /^404\.dc\.html$/], ['en', /^404\.dc\.html$/],
];

function pages() {
  const out = [];
  for (const [dir, re] of PAGE_GLOBS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      if (re.test(f) && fs.statSync(path.join(abs, f)).isFile()) out.push(path.join(dir, f));
    }
  }
  return out.sort();
}

// 只取「會執行」的 inline script:沒有 src、且 type 不是 json 類。
const SCRIPT = /<script([^>]*)>([\s\S]*?)<\/script>/g;
function hashesOf(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const found = [];
  for (const [, attrs, body] of src.matchAll(SCRIPT)) {
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/\b(ld\+json|application\/json)\b/.test(attrs)) continue;
    if (!body.trim()) continue;
    found.push(crypto.createHash('sha256').update(body, 'utf8').digest('base64'));
  }
  return found;
}

const files = pages();
const hashes = new Set();
for (const f of files) for (const h of hashesOf(f)) hashes.add(h);
const sorted = [...hashes].sort();

// 外部來源:實測自部署檔案(見 commit 訊息),不是照抄常見範本。
//   unpkg            React / ReactDOM / Babel standalone / three.js
//   googletagmanager GA4 的 gtag.js(由 ga4.js 動態插入)
//   fonts.googleapis 字型樣式表;fonts.gstatic 字型檔本身
//   google-analytics GA4 的事件 beacon(gtag.js 執行期才決定區域網域)
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-eval' https://unpkg.com https://www.googletagmanager.com ${sorted.map((h) => `'sha256-${h}'`).join(' ')}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com",
  "media-src 'self'",
  "connect-src 'self' https://unpkg.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://stats.g.doubleclick.net",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const vjPath = path.join(ROOT, 'vercel.json');
const vj = JSON.parse(fs.readFileSync(vjPath, 'utf8'));
// 全站規則的 source 是 /((?!admin).*) —— 刻意把 /admin 排除在外:
// 後台需要連 api.github.com,而兩條 headers 規則同時命中時 CSP 會取交集,
// 全站這條就會把它擋掉。/admin 的 CSP 直接寫在 vercel.json,不由本工具產生
// (那一頁沒有自己的 inline script,不需要 hash)。
const GLOBAL_SOURCE = '/((?!admin).*)';
const rule = vj.headers.find((h) => h.source === GLOBAL_SOURCE);
if (!rule) throw new Error(`vercel.json 裡找不到 source 為 ${GLOBAL_SOURCE} 的全站 headers 規則`);

const i = rule.headers.findIndex((h) => h.key === 'Content-Security-Policy');
const entry = { key: 'Content-Security-Policy', value: CSP };
if (i >= 0) rule.headers[i] = entry; else rule.headers.push(entry);

fs.writeFileSync(vjPath, JSON.stringify(vj, null, 2) + '\n', 'utf8');
console.log(`[gen-csp] 掃描 ${files.length} 頁 → ${sorted.length} 個 inline script hash`);
console.log(`[gen-csp] CSP 長度 ${CSP.length} 字元,已寫入 vercel.json`);
