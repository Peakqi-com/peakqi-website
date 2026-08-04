// 把 hero 捲到指定進度 hp(由網址 ?hp=0.65 帶入),讓 run.mjs 截到指定景次
const hp = parseFloat(new URLSearchParams(location.search).get('hp') || '0');
const wrap = document.querySelector('[data-hero-wrap]');
if (wrap) {
  const vh = window.innerHeight || 1;
  const absTop = wrap.getBoundingClientRect().top + window.scrollY;
  const target = absTop + hp * Math.max(1, wrap.offsetHeight - vh);
  window.scrollTo(0, Math.round(target));
  await new Promise(r => setTimeout(r, 260));
  for (let i = 0; i < 90; i++) await new Promise(r => requestAnimationFrame(r));
}
const r2 = wrap ? wrap.getBoundingClientRect() : null;
const actual = wrap ? Math.max(0, Math.min(1, -r2.top / Math.max(1, wrap.offsetHeight - (window.innerHeight || 1)))) : -1;
const kick = document.querySelector('[data-hero-kicker]');
const copyEl = document.querySelector('[data-hero-copy]');
return JSON.stringify({
  hpWanted: hp, hpActual: +actual.toFixed(3),
  scrollY: window.scrollY,
  cur: window.__pqCur,
  kicker: kick ? kick.textContent.trim() : (copyEl ? copyEl.textContent.trim().slice(0, 40) : null)
}, null, 1);
