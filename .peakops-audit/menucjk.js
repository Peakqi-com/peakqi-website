// 開啟手機選單後掃中文殘留(選單是 sc-if,靜態掃描看不到)+ 產品子選單展開
const CJK = /[一-鿿]/;
const burger = document.querySelector('#pq-burger');
if (!burger) return JSON.stringify({ err: 'no burger' });
burger.click();
await new Promise((r) => setTimeout(r, 900));
const dlg = document.querySelector('[role="dialog"]');
if (!dlg) return JSON.stringify({ err: 'no dialog' });
// 展開產品群組(子項預設收合)
const grpBtn = Array.from(dlg.querySelectorAll('button')).find((b) => /Products|產品/.test(b.textContent || ''));
if (grpBtn) { grpBtn.click(); await new Promise((r) => setTimeout(r, 700)); }
const leaks = [];
const w = document.createTreeWalker(dlg, NodeFilter.SHOW_TEXT);
let t;
while ((t = w.nextNode())) {
  const s = (t.textContent || '').trim();
  if (!s || !CJK.test(s) || s === '中文') continue;
  const p = t.parentElement;
  if (!p || p.tagName === 'SCRIPT' || p.tagName === 'STYLE') continue;
  const cs = getComputedStyle(p);
  if (cs.display === 'none' || cs.visibility === 'hidden') continue;
  leaks.push({ cls: (p.className || p.tagName).toString().slice(0, 34), text: s.slice(0, 30) });
}
const attrs = [];
dlg.querySelectorAll('[aria-label],[alt],[title]').forEach((el) => {
  ['aria-label', 'alt', 'title'].forEach((a) => {
    const v = el.getAttribute(a);
    if (v && CJK.test(v) && v !== '中文') attrs.push(a + ':' + v.slice(0, 34));
  });
});
const dw = dlg.scrollWidth, iw = innerWidth;
return JSON.stringify({
  lang: document.documentElement.lang,
  leakCount: leaks.length, leaks: leaks.slice(0, 16),
  attrLeaks: attrs.slice(0, 8),
  dlgOver: dw - iw,
  dlgScrollH: dlg.scrollHeight, vh: innerHeight
});
