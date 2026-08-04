const grid = document.querySelector('#diagnostic [data-dgrid]');
if (!grid) return 'no grid';
// 捲到「整組置中」再往前後各取樣,看得到升高與接管
const gTop = grid.getBoundingClientRect().top + scrollY;
const h = grid.offsetHeight;
const centre = Math.round(gTop - (innerHeight - h) / 2);
const off = parseFloat('0');
const target = centre + Math.round(off);
let y = scrollY;
while (Math.abs(y - target) > 8) { y += Math.sign(target - y) * Math.min(140, Math.abs(target - y)); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, target);
await new Promise(r => setTimeout(r, 800));
const gr = grid.getBoundingClientRect();
const fills = Array.from(document.querySelectorAll('#diagnostic [data-dmeter] > div')).map(f => f.style.width || '(css)');
const cols = Array.from(document.querySelectorAll('#diagnostic [data-dmeter] > div')).map(f => f.style.background || '');
const cnt = Array.from(document.querySelectorAll('#diagnostic [data-dcount]')).map(c => c.textContent.trim());
return JSON.stringify({
  off, gridH: Math.round(gr.height), top: Math.round(gr.top), bottom: Math.round(gr.bottom),
  bothOnScreen: gr.top > -10 && gr.bottom < innerHeight + 10,
  fills, colors: cols.slice(0, 2), counts: cnt.slice(0, 3),
  docOverflow: document.documentElement.scrollWidth > innerWidth + 1
});
