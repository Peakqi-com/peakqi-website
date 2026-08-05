// Solutions hero:捲進收合態,量整組(#pq-sol-hero-grid)在舞台/視窗中的上下留白
const root = document.querySelector('[data-hero="solutions"]');
const wrap = root.querySelector('[data-hero-wrap]');
const stage = root.querySelector('[data-hero-stage]');
const grid = document.querySelector('#pq-sol-hero-grid');
const wTop = wrap.getBoundingClientRect().top + scrollY;
const span = Math.max(1, wrap.offsetHeight - innerHeight);
scrollTo(0, Math.round(wTop + 0.18 * span));
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const sr = stage.getBoundingClientRect(), gr = grid.getBoundingClientRect();
return JSON.stringify({
  vh: innerHeight,
  compact: stage.classList.contains('pq-hero-compact'),
  stage: { top: Math.round(sr.top), bottom: Math.round(sr.bottom), h: Math.round(sr.height) },
  grid: { top: Math.round(gr.top), bottom: Math.round(gr.bottom), h: Math.round(gr.height) },
  gapTop: Math.round(gr.top - sr.top),
  gapBottom: Math.round(sr.bottom - gr.bottom),
  gapTopViewport: Math.round(gr.top),
  gapBottomViewport: Math.round(innerHeight - gr.bottom)
});
