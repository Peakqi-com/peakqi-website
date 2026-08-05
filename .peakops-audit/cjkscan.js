// EN 頁可見中文殘留掃描:走訪所有文字節點與 aria/alt/title,列出仍含 CJK 者
await new Promise((r) => setTimeout(r, 2600));
const CJK = /[一-鿿]/;
const vis = (el) => {
  let n = el;
  while (n && n !== document.body) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    n = n.parentElement;
  }
  return true;
};
const leaks = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let t;
while ((t = walker.nextNode())) {
  const s = (t.textContent || '').trim();
  if (!s || !CJK.test(s)) continue;
  const p = t.parentElement;
  if (!p || p.tagName === 'SCRIPT' || p.tagName === 'STYLE') continue;
  if (!vis(p)) continue;
  if (s === '中文') continue;   // Nav 語言切換鈕,設計保留
  leaks.push({ where: (p.className || p.tagName).toString().slice(0, 40), text: s.slice(0, 44) });
}
const attrs = [];
document.querySelectorAll('[aria-label],[alt],[title],[placeholder]').forEach((el) => {
  ['aria-label', 'alt', 'title', 'placeholder'].forEach((a) => {
    const v = el.getAttribute(a);
    if (v && CJK.test(v) && v !== '中文') attrs.push(a + ':' + v.slice(0, 40));
  });
});
return JSON.stringify({
  lang: document.documentElement.lang,
  leakCount: leaks.length, leaks: leaks.slice(0, 14),
  attrLeaks: attrs.slice(0, 10),
  over: document.scrollingElement.scrollWidth - innerWidth
});
