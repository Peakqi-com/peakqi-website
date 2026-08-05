// Pricing hero:捲進收合態,量 copy+media 聯集在視窗中的上下留白
const root = document.querySelector('[data-hero="pricing"]');
const wrap = root.querySelector('[data-hero-wrap]');
const stage = root.querySelector('[data-hero-stage]');
const copy = root.querySelector('[data-hero-copy]');
const media = root.querySelector('[data-hero-media]');
const wTop = wrap.getBoundingClientRect().top + scrollY;
const span = Math.max(1, wrap.offsetHeight - innerHeight);
scrollTo(0, Math.round(wTop + 0.1 * span));
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const cr = copy.getBoundingClientRect(), mr = media ? media.getBoundingClientRect() : cr;
const top = Math.min(cr.top, mr.top), bottom = Math.max(cr.bottom, mr.bottom);
const sr = stage.getBoundingClientRect();
return JSON.stringify({
  vh: innerHeight, compact: stage.classList.contains('pq-hero-compact'),
  stage: { top: Math.round(sr.top), bottom: Math.round(sr.bottom) },
  union: { top: Math.round(top), bottom: Math.round(bottom), h: Math.round(bottom - top) },
  gapTopViewport: Math.round(top), gapBottomViewport: Math.round(innerHeight - bottom)
});
