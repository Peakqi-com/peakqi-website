// Pricing hero 幾何與場景比對:p、活躍景、舞台/機架/進度軌位置、機架是否被裁
const root = document.querySelector('[data-hero="pricing"]');
const wrap = root.querySelector('[data-hero-wrap]');
const stage = root.querySelector('[data-hero-stage]');
const wTop = wrap.getBoundingClientRect().top + scrollY;
const span = Math.max(1, wrap.offsetHeight - innerHeight);
scrollTo(0, Math.round(wTop + 0.97 * span));
await new Promise((r) => setTimeout(r, 1500));
for (let i = 0; i < 30; i++) await new Promise((r) => requestAnimationFrame(r));
const r = wrap.getBoundingClientRect();
const p = Math.max(0, Math.min(1, -r.top / span));
const sc = stage.getBoundingClientRect();
const racks = document.querySelector('#p-hero-racks');
const rk = racks ? racks.getBoundingClientRect() : null;
const rail = root.querySelector('[data-hero-progress]');
const rl = rail ? rail.getBoundingClientRect() : null;
// 目前顯示中的場景(opacity 最高者)
let act = '', best = -1;
root.querySelectorAll('[data-hero-scene]').forEach((el) => {
  const o = parseFloat(getComputedStyle(el).opacity);
  if (o > best) { best = o; act = el.getAttribute('data-hero-scene'); }
});
return JSON.stringify({
  vh: innerHeight, p: +p.toFixed(3), activeScene: act,
  wrapH: wrap.offsetHeight, span,
  stage: { top: Math.round(sc.top), bottom: Math.round(sc.bottom), h: Math.round(sc.height) },
  racks: rk ? { top: Math.round(rk.top), bottom: Math.round(rk.bottom), clippedBy: Math.round(rk.bottom - sc.bottom) } : null,
  rail: rl ? { top: Math.round(rl.top), bottom: Math.round(rl.bottom), display: getComputedStyle(rail).display } : null,
  railOverRacks: (rk && rl) ? (rl.top < rk.bottom && rl.bottom > rk.top) : null
});
