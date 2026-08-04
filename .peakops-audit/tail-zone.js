const wrap = document.querySelector('[data-hero-wrap]');
if (!wrap) return 'no wrap';
scrollTo(0, 0); await new Promise(r => setTimeout(r, 500));
const base = Math.round(wrap.getBoundingClientRect().top + scrollY);
const track = wrap.offsetHeight - innerHeight;
const stage = document.querySelector('[data-hero-stage]');
const copy = stage.querySelector('[data-hero-copy]');
const cta = stage.querySelector('[data-hero-cta]');
const cv = document.querySelector('[data-hero-canvas]');
const rectIn = (el) => { let y = 0, n = el; while (n && n !== stage) { y += n.offsetTop; n = n.offsetParent; } return y; };
const out = [];
for (const F of [0.86, 0.93, 0.96, 0.985, 1.0]) {
  const target = base + Math.round(track * F);
  let y = scrollY;
  while (Math.abs(y - target) > 4) { y += Math.sign(target - y) * Math.min(80, Math.abs(target - y)); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
  scrollTo(0, target);
  await new Promise(r => setTimeout(r, 900));
  const H = stage.clientHeight;
  const cb = rectIn(copy) + copy.offsetHeight + 12;
  const top = Math.max(cb, H * .2);
  const cr = cta ? cta.getBoundingClientRect() : null;
  out.push({
    F, H, copyBottom: Math.round(cb), zoneTop: Math.round(top), zoneH: Math.round(Math.max(150, H - 74 - top)),
    ctaVisible: !!(cr && cr.height > 4), canvasOpacity: cv.style.opacity
  });
}
scrollTo(0, 0);
return JSON.stringify(out, null, 1);
