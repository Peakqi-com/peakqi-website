// i18n Phase 1 驗收:中文站 home-engine 的 t() 化字串必須仍輸出中文,且零爆版
// 用法:node .peakops-audit/run.mjs http://127.0.0.1:8000/Home.dc.html out.png 390 844 <P> .peakops-audit/i18n-home-zh.js
await new Promise((r) => setTimeout(r, 800));
const hasZh = (s) => /[一-鿿]/.test(s || '');
const doc = document.scrollingElement;
const out = {
  lang: document.documentElement.lang,           // 中文站必須是 zh-Hant-TW
  vw: innerWidth, scrollW: doc.scrollWidth, over: doc.scrollWidth - innerWidth,
  cineOn: document.getElementById('hero') && document.getElementById('hero').classList.contains('pq-cine-on'),
  annot: [], annotAllZh: null, railAria: null, railAriaZh: null
};
// 引擎生成的藍圖標註卡(SVG biz/note)—— t() 的實際輸出
const svg = document.querySelector('[data-cine-annot]');
if (svg) {
  svg.querySelectorAll('text.biz, text.note').forEach((el) => out.annot.push(el.textContent));
  out.annotAllZh = out.annot.length > 0 && out.annot.every(hasZh);
}
// 引擎生成的 rail 按鈕 aria-label
const rb = document.querySelector('[data-cine-rail] button');
if (rb) { out.railAria = rb.getAttribute('aria-label'); out.railAriaZh = hasZh(out.railAria); }
return JSON.stringify(out);
