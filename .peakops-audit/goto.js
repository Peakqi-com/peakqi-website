// 通用跳點:?hero=<rootSel>&f=0.8 → hero wrap 進度 f;?sel=<sel>&off=120 → 元素頂上留 off
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
return JSON.stringify({ y: Math.round(y), atY: Math.round(scrollY) });
