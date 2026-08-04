const wrap = document.querySelector('[data-hero-wrap]');
if (!wrap) return 'no wrap';
scrollTo(0, 0); await new Promise(r => setTimeout(r, 500));
const base = Math.round(wrap.getBoundingClientRect().top + scrollY);
const track = wrap.offsetHeight - innerHeight;
const cv = document.querySelector('[data-hero-canvas]');
const out = [];
for (const F of [0.08, 0.25, 0.42, 0.58, 0.75, 0.92]) {
  const target = base + Math.round(track * F);
  let y = scrollY;
  while (Math.abs(y - target) > 4) { y += Math.sign(target - y) * Math.min(90, Math.abs(target - y)); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
  scrollTo(0, target);
  await new Promise(r => setTimeout(r, 700));
  // 溢出/重疊檢查:CTA 與 canvas 繪圖區、面板是否超出可視
  const st = document.querySelector('[data-hero-stage]');
  const cta = document.querySelector('[data-hero-cta]');
  const r = { F, docOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
  if (cta) { const cr = cta.getBoundingClientRect(); r.ctaBottom = Math.round(cr.bottom); r.ctaVisible = cr.height > 2 && getComputedStyle(cta).opacity !== '0'; }
  if (st) r.stageH = Math.round(st.getBoundingClientRect().height);
  out.push(r);
}
scrollTo(0, 0);
return JSON.stringify({ track, canvasOpacity: cv && cv.style.opacity, hero: window.__pqHero, frames: out });
