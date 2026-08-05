// EN P2 第三批(Products/Bubble/AIWeddingPro/AIInteriorPro/Contact/Privacy/404)驗收 probe
// 用法:node .peakops-audit/run.mjs "http://127.0.0.1:8000/en/<頁>.dc.html" out.png 390 844 0 .peakops-audit/en-p2c-probe.js
// 檢查:DC 渲染、爆版(owcheck)、可見 CJK 殘留(Nav 語言鈕「中文」除外)、aria/alt/title CJK、內容契約(Nav/Footer/H1)。
await new Promise(r => setTimeout(r, 2500));
const $ = s => document.querySelector(s);

// 可見性判定(sc-if 未掛載、display:none、helmet/script/style 都不算)
const visible = el => {
  if (!el.isConnected) return false;
  for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  }
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};
const CJK = /[㐀-鿿豈-﫿　-〿！-～]/;

// 1) 可見文字 CJK 殘留(全頁,含 Nav/Footer;唯一豁免:語言切換鈕的「中文」)
const cjkText = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const t = node.textContent;
  if (!t || !CJK.test(t)) continue;
  const el = node.parentElement;
  if (!el || ['SCRIPT', 'STYLE', 'HELMET', 'NOSCRIPT'].includes(el.tagName)) continue;
  if (t.trim() === '中文') continue;   // Nav 語言鈕:en 頁顯示對向語言名,准中文
  if (!visible(el)) continue;
  cjkText.push((el.tagName + (el.id ? '#' + el.id : '')) + ' "' + t.trim().slice(0, 24) + '"');
  if (cjkText.length > 12) break;
}

// 2) aria/alt/title 屬性 CJK(共用 Nav/Footer 的殘留列出但另計)
const cjkAria = [];
for (const el of document.querySelectorAll('[aria-label],[alt],[title]')) {
  for (const a of ['aria-label', 'alt', 'title']) {
    const v = el.getAttribute(a);
    if (v && CJK.test(v)) { cjkAria.push(a + '="' + v.slice(0, 22) + '"'); }
  }
  if (cjkAria.length > 10) break;
}

// 3) 爆版 owcheck
const over = [];
if (document.documentElement.scrollWidth > innerWidth + 1) {
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)) {
      over.push(el.tagName + (el.id ? '#' + el.id : '') + '|' + Math.round(r.left) + '~' + Math.round(r.right));
      if (over.length > 8) break;
    }
  }
}

// 4) 內容契約:H1 有字、Nav/Footer 有掛(404 頁無 Nav/Footer,回報數字即可不判死)
const h1 = $('h1');
const counts = {
  h1: h1 ? h1.textContent.trim().slice(0, 40) : null,
  revealCards: document.querySelectorAll('[data-reveal]').length,
  navLinks: document.querySelectorAll('nav a, header a').length,
  footerRendered: !!$('footer') || !!$('[data-footer]'),
  links: document.querySelectorAll('a[href]').length,
  // 站內連結漏 /en 前綴的(錨點、mailto/tel、外部、/en/ 開頭都不算)
  missingEnPrefix: Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href'))
    .filter(h => h && h.startsWith('/') && !h.startsWith('/en/') && !h.startsWith('//')).slice(0, 8)
};

return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  htmlLang: document.documentElement.lang,
  title: document.title.slice(0, 70),
  rendered: !!h1 && document.body.textContent.trim().length > 100,   // x-dc 掛載後會被 support.js 解包,改以 H1+內文判定
  counts,
  docH: document.body.scrollHeight,
  overflowX: document.documentElement.scrollWidth > innerWidth + 1 ? 'OVERFLOW ' + document.documentElement.scrollWidth : 'ok',
  overflowCulprits: over,
  cjkVisibleText: cjkText,
  cjkAria: cjkAria
}, null, 1);
