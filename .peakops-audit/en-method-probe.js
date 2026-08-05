// EN Method 頁(/en/Method.dc.html)驗收 probe — 搭配 .peakops-audit/run.mjs
// 用法:node .peakops-audit/run.mjs "http://127.0.0.1:8000/en/Method.dc.html#pqf=0.15" out.png 390 844 0 .peakops-audit/en-method-probe.js
//   #pqf=<0..1> = hero 收合進度(照 ua-*-hero probe 的捲法);沒帶 hash 就用 run.mjs 的 scrollP。
// 檢查:DC 渲染、hero API、爆版(owcheck)、可見 CJK 殘留(含共用 Nav/Footer)、aria CJK、垂直裁切。
await new Promise(r => setTimeout(r, 2500));
const $ = s => document.querySelector(s);

// hero 進度捲動(hash 觸發)
const mHash = location.hash.match(/pqf=([\d.]+)/);
if (mHash) {
  const f = Math.min(1, Math.max(0, parseFloat(mHash[1])));
  const wrap = $('[data-hero-wrap]');
  const top = wrap ? wrap.getBoundingClientRect().top + scrollY : 0;
  const end = wrap ? Math.max(wrap.offsetHeight - innerHeight, innerHeight) : innerHeight;
  for (let i = 1; i <= 16; i++) { scrollTo(0, top + end * f * i / 16); await new Promise(r => requestAnimationFrame(r)); }
  await new Promise(r => setTimeout(r, 900));
}

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
const CJK = /[㐀-鿿豈-﫿　-〿！-～]/;

// 1) 可見文字 CJK 殘留(全頁,含 Nav/Footer)
const cjkText = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const t = node.textContent;
  if (!t || !CJK.test(t)) continue;
  const el = node.parentElement;
  if (!el || ['SCRIPT', 'STYLE', 'HELMET', 'NOSCRIPT'].includes(el.tagName)) continue;
  if (!visible(el)) continue;
  cjkText.push((el.tagName + (el.id ? '#' + el.id : '')) + ' "' + t.trim().slice(0, 24) + '"');
  if (cjkText.length > 12) break;
}

// 2) aria/alt/title 屬性 CJK(已知:motion-kit rail 的「頁面章節導覽/跳到」是共用檔,列出但另計)
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

// 4) hero 垂直裁切(about-probe 的 heroClipY 模式)
const heroClipY = (() => {
  const st = $('[data-hero-stage]'); const copy = $('[data-hero-copy]');
  if (!st || !copy) return null;
  return Math.round(copy.getBoundingClientRect().bottom - st.getBoundingClientRect().bottom);
})();

// 5) 內容契約:六卡、時程節點、三機制卡有沒有長出來(content.js 綁定是否成功)
const counts = {
  stepCards: document.querySelectorAll('#m-grid > div').length,
  tlNodes: document.querySelectorAll('#m-tl > div').length,
  riskCards: document.querySelectorAll('#m-risk [data-mv]').length,
  navLinks: document.querySelectorAll('nav a, header a').length,
  footerRendered: !!$('footer') || !!$('[data-footer]')
};

return JSON.stringify({
  vw: innerWidth, vh: innerHeight, y: Math.round(scrollY),
  htmlLang: document.documentElement.lang,
  title: document.title.slice(0, 60),
  rendered: !!$('section#m-hero'),
  heroApi: window.__pqHero ? { scenes: window.__pqHero.scenes, mode: window.__pqHero.mode, ok: window.__pqHero.ok } : null,
  heroClipY,
  counts,
  docH: document.body.scrollHeight,
  overflowX: document.documentElement.scrollWidth > innerWidth + 1 ? 'OVERFLOW ' + document.documentElement.scrollWidth : 'ok',
  overflowCulprits: over,
  cjkVisibleText: cjkText,
  cjkAria: cjkAria
}, null, 1);
