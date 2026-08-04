const grid = document.querySelector('.pq-modgrid');
if (!grid) return 'no grid';
const y = grid.getBoundingClientRect().top + scrollY - 40;
let cur = scrollY;
while (Math.abs(cur - y) > 8) { cur += Math.sign(y - cur) * Math.min(200, Math.abs(y - cur)); scrollTo(0, cur); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, Math.round(y + parseFloat('380')));
await new Promise(r => setTimeout(r, 1800));
return 'y=' + scrollY;
