const grid = document.querySelector('.pq-modgrid');
grid.scrollIntoView({ block: 'start' });
await new Promise(r => setTimeout(r, 900));
const cards = document.querySelectorAll('.pq-mod');
const row2 = cards[3];
const y = row2.getBoundingClientRect().top + scrollY - 150;
let cur = scrollY;
while (Math.abs(cur - y) > 6) { cur += Math.sign(y - cur) * Math.min(300, Math.abs(y - cur)); scrollTo(0, cur); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, Math.round(y));
await new Promise(r => setTimeout(r, 1500));
return 'row2 top at ' + Math.round(row2.getBoundingClientRect().top);
