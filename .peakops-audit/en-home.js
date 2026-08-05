// /en/Home.dc.html 英文版驗收:lang=en、Nav/Footer 走 t() 顯示英文、零可見中文、零爆版
// 用法:node .peakops-audit/run.mjs "http://127.0.0.1:8000/en/Home.dc.html" out.png W H P .peakops-audit/en-home.js
await new Promise((r) => setTimeout(r, 1600));
const hasZh = (s) => /[㐀-鿿]/.test(s || '');
const doc = document.scrollingElement;
const out = {
  lang: document.documentElement.lang,             // 必須 en(i18n.js 依 /en/ 路徑判定)
  vw: innerWidth, scrollW: doc.scrollWidth, over: doc.scrollWidth - innerWidth,
  cineOn: !!(document.getElementById('hero') && document.getElementById('hero').classList.contains('pq-cine-on')),
  title: document.title.slice(0, 60),
  zhVisible: [],       // 視口外也算:任何 render 出來的中文文字節點(排除公司法定名)
  navEn: null, footEn: null,
  h1: null, h1Lines: null, btnOverflow: []
};
// 全頁文字節點掃描(排除 script/style/noscript 與 JSON-LD)
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let n;
while ((n = walker.nextNode())) {
  const p = n.parentElement;
  if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName)) continue;
  const t = n.textContent.trim();
  if (t === '中文') continue;                        // Nav 語言切換鈕:切去中文版的目標語名,共用元件的正確行為
  if (t && hasZh(t) && out.zhVisible.length < 8) {
    out.zhVisible.push((p.className || p.tagName).toString().slice(0, 30) + '::' + t.slice(0, 40));
  }
}
// Nav / Footer 是否已渲染出英文(取第一個連結字樣)
const navLink = document.querySelector('nav a[href], header a[href]');
if (navLink) out.navEn = navLink.textContent.trim().slice(0, 30);
const footer = document.querySelector('footer');
if (footer) out.footEn = footer.textContent.trim().slice(0, 60).replace(/\s+/g, ' ');
// H1 行數(密度標準:兩行內)
const h1 = document.querySelector('h1');
if (h1) {
  out.h1 = h1.textContent.trim();
  const lh = parseFloat(getComputedStyle(h1).lineHeight) || 1;
  out.h1Lines = Math.round(h1.getBoundingClientRect().height / lh);
}
// 按鈕是否溢出容器(文字撐爆)
document.querySelectorAll('a.pq-slogan-btn, a.pq-slogan-ghost, .pq-cine-intro a').forEach((a) => {
  const r = a.getBoundingClientRect();
  if (r.right > innerWidth + 1 || r.width > innerWidth) out.btnOverflow.push(a.textContent.trim().slice(0, 24) + ' w' + Math.round(r.width));
});
out.ok = out.lang === 'en' && out.zhVisible.length === 0 && out.over <= 1 && (out.h1Lines === null || out.h1Lines <= 2) && out.btnOverflow.length === 0;
return JSON.stringify(out);
