const sec = document.querySelector('#p-timeline');
if (!sec) return 'no section';
const top = sec.getBoundingClientRect().top + scrollY;
const target = Math.round(top - innerHeight * parseFloat('0.55'));
let y = scrollY;
while (Math.abs(y - target) > 8) { y += Math.sign(target - y) * Math.min(160, Math.abs(target - y)); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, target);
await new Promise(r => setTimeout(r, 900));
const steps = Array.from(document.querySelectorAll('.pq-tl2-step'));
const cs = getComputedStyle(sec);
return JSON.stringify({
  vw: innerWidth,
  bg: cs.backgroundColor,
  steps: steps.length,
  clips: steps.map(s => (getComputedStyle(s).clipPath || '').slice(0, 34)),
  h2Color: getComputedStyle(sec.querySelector('h2')).color,
  rects: steps.map(s => { const r = s.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) }; }),
  docOverflow: document.documentElement.scrollWidth > innerWidth + 1
});
