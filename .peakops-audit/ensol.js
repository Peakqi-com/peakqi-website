// EN Solutions 驗收 probe:goto 跳點(?sel/?hero)+ 可見中文掃描 + 爆版 + LINE 泡泡溢出 +(?click=mod)模組點擊測試
const q = new URLSearchParams(location.search);
let y = 0;
if (q.get('sel')) {
  const el = document.querySelector(q.get('sel'));
  y = el.getBoundingClientRect().top + scrollY - parseFloat(q.get('off') || '120');
} else if (q.get('hero')) {
  const root = document.querySelector(q.get('hero'));
  const wrap = root.querySelector('[data-hero-wrap]') || root;
  y = wrap.getBoundingClientRect().top + scrollY + parseFloat(q.get('f') || '0') * (wrap.offsetHeight - innerHeight);
}
scrollTo(0, Math.max(0, Math.round(y)));
await new Promise(r => setTimeout(r, 1500));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const out = { y: Math.round(y), atY: Math.round(scrollY), lang: document.documentElement.lang, title: document.title.slice(0, 60) };
// 1) 可見中文:頁面自身內容與共用件(header/footer)分開計——共用件雙語由主 session 收攏
const own = [], shared = [];
const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (w.nextNode()) {
  const t = (w.currentNode.textContent || '').trim();
  if (!t || !/[一-鿿]/.test(t)) continue;
  const el = w.currentNode.parentElement; if (!el) continue;
  const st = getComputedStyle(el);
  if (st.display === 'none' || st.visibility === 'hidden') continue;
  (el.closest('header,footer') ? shared : own).push(t.slice(0, 36));
}
out.cjkOwn = [...new Set(own)].slice(0, 12);
out.cjkShared = [...new Set(shared)].slice(0, 6);
// 2) 爆版
out.overflowX = document.documentElement.scrollWidth > innerWidth + 1 ? 'OVERFLOW ' + document.documentElement.scrollWidth : 'ok';
out.docH = document.body.scrollHeight;
// 3) LINE 泡泡溢出:訊息列超出對話卡左右緣(> 2px 才算)
const rows = Array.from(document.querySelectorAll('#capture [data-cmsg]'));
if (rows.length) {
  const cardEl = rows[0].parentElement.parentElement;
  const cr = cardEl.getBoundingClientRect();
  let over = 0;
  rows.forEach(rw => { const r = rw.getBoundingClientRect(); if (r.right - cr.right > 2 || cr.left - r.left > 2) over++; });
  out.bubbleRows = rows.length; out.bubbleOver = over;
}
// 4) 模組點擊測試(桌機 ?click=mod;比照 solclick.js)
if (q.get('click') === 'mod') {
  const mrows = Array.from(document.querySelectorAll('#modules [data-smod]'));
  const dets = Array.from(document.querySelectorAll('#modules [data-sdet]'));
  const before = dets.map(d => getComputedStyle(d).opacity);
  if (mrows[2]) mrows[2].click();
  await new Promise(r => setTimeout(r, 600));
  const shellEl = document.querySelector('#pq-sol-detshell');
  out.mod = {
    rows: mrows.length, before,
    after: dets.map(d => getComputedStyle(d).opacity),
    aria: mrows.map(r => r.getAttribute('aria-current')),
    shellDisplay: shellEl ? getComputedStyle(shellEl).display : 'none'
  };
}
return JSON.stringify(out, null, 1);
