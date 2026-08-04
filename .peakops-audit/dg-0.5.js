const sec = document.querySelector('#diagnostic');
const grid = document.querySelector('#diagnostic [data-dgrid]');
if (!sec || !grid) return 'no section';
const top = sec.getBoundingClientRect().top + scrollY;
const target = Math.round(top + parseFloat('0.5') * sec.offsetHeight);
let y = scrollY;
while (Math.abs(y - target) > 8) { y += Math.sign(target - y) * Math.min(140, Math.abs(target - y)); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, target);
await new Promise(r => setTimeout(r, 900));
const gr = grid.getBoundingClientRect();
const fills = Array.from(document.querySelectorAll('#diagnostic [data-dmeter] > div')).map(f => f.style.width || '(css)');
const cnt = Array.from(document.querySelectorAll('#diagnostic [data-dcount]')).map(c => c.textContent.trim());
const tools = document.querySelectorAll('#diagnostic [data-dtool]');
const t0 = tools[0] && tools[0].getBoundingClientRect();
const tl = tools[tools.length - 1] && tools[tools.length - 1].getBoundingClientRect();
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  gridH: Math.round(gr.height), gridTop: Math.round(gr.top), gridBottom: Math.round(gr.bottom),
  bothOnScreen: gr.top > -20 && gr.bottom < innerHeight + 20,
  chaosBlock: t0 && tl ? { top: Math.round(t0.top), bottom: Math.round(tl.bottom) } : null,
  fills, counts: cnt,
  docOverflow: document.documentElement.scrollWidth > innerWidth + 1
});
