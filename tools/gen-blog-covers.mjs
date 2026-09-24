// 文章封面產生器 ── node tools/gen-blog-covers.mjs [slug ...]
//
// 用品牌樣式(深底、Space Grotesk 字距標籤、單一強調色、幾何主題圖)程式化畫出
// 1440×745 的封面,存成 assets/blog/<slug>.webp。不帶參數 = 全部重畫。
//
// 為什麼不用外部圖庫或 AI 生圖:文章是概念性的,截圖對不上;AI 生圖跟站上的
// 視覺語言(/tour 那種暗底大標)不一定合,而且不可重現。這裡每張都是可重跑、
// 可 diff 的 SVG,改個字重跑就好。
//
// 尺寸與現有封面(assets/blog/tower.webp 1440×745)一致。列表縮圖是 16:10
// object-fit:cover 置中裁切,兩側各會被裁掉約 125px —— 主體全部放在中間的安全區。
//
// 沒有 cwebp / PIL / magick 也能跑:用 playwright 驅動系統 Chrome 渲染,
// 再在頁面裡把截圖畫進 canvas 以 toDataURL('image/webp') 編碼。
// Chrome 路徑同 prerender.mjs:PQ_CHROME 環境變數,預設是 Windows 路徑。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'blog');
const CHROME = process.env.PQ_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = 1440, H = 745;

// 品牌色(與各頁 :root 一致)
const INK = '#090B0E', PAPER = '#F2EFE8', ORANGE = '#FF6B2C', BLUE = '#3E9BFF', MINT = '#65E0BC', PINK = '#E06B9C';

// ── 主題圖:每篇一個 SVG 片段,畫在 640×420 的框裡(會置中放在右側) ──────────
const dot = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const txt = (x, y, s, size, c, extra = '') => `<text x="${x}" y="${y}" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="${size}" fill="${c}" ${extra}>${s}</text>`;

const MOTIFS = {
  // 六個簽約前該問的問題:3×2 的勾選格,前兩格已勾,其餘待問
  'how-to-choose-ai-automation-partner': (a) => {
    let s = '';
    const labels = ['PROCESS', 'HANDOFF', 'DATA', 'PRICING', 'PILOT', 'EXIT'];
    labels.forEach((l, i) => {
      const x = 20 + (i % 3) * 205, y = 30 + Math.floor(i / 3) * 190;
      const done = i < 2;
      s += `<rect x="${x}" y="${y}" width="180" height="160" rx="14" fill="${done ? a : 'none'}" fill-opacity="${done ? .16 : 0}" stroke="${done ? a : 'rgba(242,239,232,.28)'}" stroke-width="2"/>`;
      s += txt(x + 18, y + 40, `0${i + 1}`, 30, done ? a : 'rgba(242,239,232,.55)');
      s += txt(x + 18, y + 132, l, 17, done ? PAPER : 'rgba(242,239,232,.5)', 'letter-spacing="3"');
      if (done) s += `<path d="M${x + 118} ${y + 34} l12 12 l28 -30" stroke="${a}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
    return s;
  },
  // 費用三塊 + DAY 0→10 時程:三根高度不同的柱,下面一條刻度尺
  'ai-automation-cost-and-timeline': (a) => {
    let s = '';
    const bars = [['SETUP', 250, 'one-off'], ['MONTHLY', 150, 'platform'], ['USAGE', 95, 'metered']];
    bars.forEach(([l, h, sub], i) => {
      const x = 40 + i * 200, y = 300 - h;
      s += `<rect x="${x}" y="${y}" width="140" height="${h}" rx="10" fill="${a}" fill-opacity="${1 - i * .3}"/>`;
      s += txt(x, 335, l, 20, PAPER, 'letter-spacing="3"');
      s += txt(x, 362, sub, 15, 'rgba(242,239,232,.5)');
    });
    s += `<line x1="40" y1="405" x2="620" y2="405" stroke="rgba(242,239,232,.3)" stroke-width="2"/>`;
    [0, 4, 7, 10].forEach((d) => {
      const x = 40 + d * 58;
      s += `<line x1="${x}" y1="396" x2="${x}" y2="414" stroke="${PAPER}" stroke-width="3"/>`;
      s += txt(x - 8, 398 - 10, `D${d}`, 16, 'rgba(242,239,232,.7)');
    });
    s += dot(620, 405, 9, a);
    return s;
  },
  // LINE → AI → FIELDS → CRM:四個節點一條鏈
  'line-ai-support-crm-integration': (a) => {
    let s = '';
    const nodes = ['LINE', 'AI', 'FIELDS', 'CRM'];
    nodes.forEach((n, i) => {
      const x = 60 + i * 175;
      const last = i === nodes.length - 1;
      s += `<circle cx="${x}" cy="200" r="52" fill="${last ? a : 'none'}" stroke="${a}" stroke-width="${last ? 0 : 3}"/>`;
      s += txt(x, 208, n, n.length > 3 ? 18 : 22, last ? INK : PAPER, 'text-anchor="middle" letter-spacing="2"');
      if (i < nodes.length - 1) {
        s += `<line x1="${x + 60}" y1="200" x2="${x + 110}" y2="200" stroke="${a}" stroke-width="4"/>`;
        s += `<path d="M${x + 104} 190 l12 10 l-12 10" stroke="${a}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    });
    // 底下:CRM 之後排出的跟進節奏
    [0, 1, 2].forEach((k) => {
      s += `<rect x="${430 + k * 62}" y="290" width="46" height="12" rx="6" fill="${a}" fill-opacity="${.9 - k * .3}"/>`;
    });
    s += txt(60, 300, 'catch → extract → record → follow up', 16, 'rgba(242,239,232,.55)', 'letter-spacing="1.5"');
    return s;
  },
  // 傳統 CRM vs AI CRM:左邊空白表單行,右邊已填滿並打勾
  'ai-crm-vs-traditional-crm': (a) => {
    let s = '';
    s += txt(20, 34, 'CRM', 22, 'rgba(242,239,232,.55)', 'letter-spacing="4"');
    s += txt(350, 34, 'AI CRM', 22, a, 'letter-spacing="4"');
    for (let r = 0; r < 5; r++) {
      const y = 70 + r * 66;
      s += `<rect x="20" y="${y}" width="290" height="46" rx="8" fill="none" stroke="rgba(242,239,232,.22)" stroke-width="2" stroke-dasharray="6 6"/>`;
      s += `<rect x="350" y="${y}" width="290" height="46" rx="8" fill="${a}" fill-opacity=".14" stroke="${a}" stroke-width="2"/>`;
      s += `<rect x="366" y="${y + 17}" width="${120 + (r * 37) % 90}" height="12" rx="6" fill="${a}" fill-opacity=".8"/>`;
      s += `<path d="M${600} ${y + 22} l8 8 l16 -18" stroke="${a}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    s += `<line x1="330" y1="62" x2="330" y2="405" stroke="rgba(242,239,232,.18)" stroke-width="2"/>`;
    return s;
  },
};

// ── 每篇的標籤(語言中性:站上中文頁本來就用英文 eyebrow)與強調色 ──────────────
const COVERS = {
  'how-to-choose-ai-automation-partner': { eyebrow: 'AI ADOPTION', title: '6 QUESTIONS', sub: 'before you sign', accent: ORANGE },
  'ai-automation-cost-and-timeline':     { eyebrow: 'COST × TIMELINE', title: '3 PARTS', sub: 'setup · monthly · usage — not one number', accent: MINT },
  'line-ai-support-crm-integration':     { eyebrow: 'LINE → CRM', title: '4 LINKS', sub: 'from first message to a record', accent: BLUE },
  'ai-crm-vs-traditional-crm':           { eyebrow: 'AI CRM vs CRM', title: 'WHO FILLS IT IN?', sub: 'the real difference', accent: PINK },
};

function html(slug) {
  const c = COVERS[slug];
  const motif = MOTIFS[slug](c.accent);
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:${INK}}
.c{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:
  radial-gradient(900px 600px at 78% 45%, rgba(255,255,255,.045), transparent 60%),
  linear-gradient(160deg,#0E1013 0%,${INK} 55%,#0A0C0F 100%);font-family:'Space Grotesk',sans-serif;color:${PAPER}}
.brand{position:absolute;left:150px;top:64px;font-weight:700;font-size:20px;letter-spacing:.02em}
.brand b{color:${ORANGE}}
.brand small{display:block;margin-top:4px;font-weight:500;font-size:12px;letter-spacing:.32em;color:rgba(242,239,232,.5)}
.eye{position:absolute;left:150px;top:250px;font-weight:700;font-size:15px;letter-spacing:.34em;color:${c.accent}}
.ttl{position:absolute;left:150px;top:284px;width:520px;font-weight:700;font-size:58px;line-height:1.02;letter-spacing:-.01em}
.sub{position:absolute;left:150px;top:466px;font-weight:500;font-size:19px;letter-spacing:.04em;color:rgba(242,239,232,.62)}
.motif{position:absolute;left:670px;top:160px;width:640px;height:420px}  /* 右緣留在 16:10 裁切線(x≈1315)內 */
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(242,239,232,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(242,239,232,.035) 1px,transparent 1px);background-size:72px 72px}
.foot{position:absolute;left:150px;bottom:56px;font-weight:500;font-size:13px;letter-spacing:.26em;color:rgba(242,239,232,.42)}
</style></head><body><div class="c"><div class="grid"></div>
<div class="brand">奇鋒國際 <b>PeakQi</b><small>AI OPERATING PLATFORM</small></div>
<div class="eye">${c.eyebrow}</div>
<div class="ttl">${c.title}</div>
<div class="sub">${c.sub}</div>
<svg class="motif" viewBox="0 0 640 420" xmlns="http://www.w3.org/2000/svg">${motif}</svg>
<div class="foot">PEAKQI.COM / BLOG</div>
</div></body></html>`;
}

const want = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const slugs = want.length ? want : Object.keys(COVERS);
for (const s of slugs) if (!COVERS[s]) throw new Error(`沒有 ${s} 的封面定義,先加進 COVERS / MOTIFS`);

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const slug of slugs) {
    await page.setContent(html(slug), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
    // 在同一個頁面裡用 canvas 轉 webp(Chrome 內建編碼器)
    const dataUrl = await page.evaluate(async ({ b64, w, h }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0);
      return cv.toDataURL('image/webp', 0.9);
    }, { b64: png.toString('base64'), w: W, h: H });
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    const out = path.join(OUT, `${slug}.webp`);
    fs.writeFileSync(out, buf);
    console.log(`  ${slug}.webp  ${(buf.length / 1024).toFixed(0)}KB`);
  }
} finally { await browser.close(); }
console.log(`[gen-blog-covers] 完成 ${slugs.length} 張 → assets/blog/`);
