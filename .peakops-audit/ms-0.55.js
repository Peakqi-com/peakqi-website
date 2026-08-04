const sec = document.querySelector('#modules');
if (!sec) return 'no #modules';
const top = sec.getBoundingClientRect().top + scrollY;
const target = Math.round(top + (parseFloat('0.55')) * sec.offsetHeight);
let y = scrollY;
while (Math.abs(y - target) > 6) { y += Math.sign(target - y) * Math.min(120, Math.abs(target - y)); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, target);
await new Promise(r => setTimeout(r, 1500));
const on = Array.from(document.querySelectorAll('#modules [data-sdet]')).map(d => ({
  i: d.getAttribute('data-sdet'), op: getComputedStyle(d).opacity,
  h: Math.round(d.getBoundingClientRect().height)
}));
const grid = document.querySelector('#pq-mod-grid');
return JSON.stringify({ y: scrollY, sdets: on, gridCols: grid && getComputedStyle(grid).gridTemplateColumns, docOverflow: document.documentElement.scrollWidth > innerWidth + 1 });
