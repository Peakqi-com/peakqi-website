const wrap = document.querySelector('[data-hero-wrap]');
if (!wrap) return 'no wrap';
scrollTo(0, 0); await new Promise(r => setTimeout(r, 600));
const base = Math.round(wrap.getBoundingClientRect().top + scrollY);
const track = wrap.offsetHeight - innerHeight;
const stage = document.querySelector('[data-hero-stage]');
const copy = stage.querySelector('[data-hero-copy]');
const rectIn = (el) => { let y = 0, n = el; while (n && n !== stage) { y += n.offsetTop; n = n.offsetParent; } return y; };
const out = [];
for (const F of [0.1, 0.3, 0.5, 0.7, 0.9]) {
  const target = base + Math.round(track * F);
  let y = scrollY;
  while (Math.abs(y - target) > 5) { y += Math.sign(target - y) * Math.min(110, Math.abs(target - y)); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
  scrollTo(0, target);
  await new Promise(r => setTimeout(r, 800));
  const H = stage.clientHeight;
  const cb = rectIn(copy) + copy.offsetHeight + 12;
  const top = Math.max(cb, H * .2);
  out.push({ F, H, copyBottom: Math.round(cb), zoneTop: Math.round(top), zoneH: Math.round(Math.max(150, H - 74 - top)), zoneW: innerWidth - 20 });
}
scrollTo(0, 0);
return JSON.stringify({ vw: innerWidth, vh: innerHeight, frames: out });
