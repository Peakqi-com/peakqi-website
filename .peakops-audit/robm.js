const grid = document.querySelector('.pq-modgrid');
grid.scrollIntoView({ block: 'start' });
await new Promise(r => setTimeout(r, 900));
const cards = document.querySelectorAll('.pq-mod');
const t = cards[parseInt('__N__', 10)];
const y = t.getBoundingClientRect().top + scrollY - 120;
let cur = scrollY;
while (Math.abs(cur - y) > 6) { cur += Math.sign(y - cur) * Math.min(300, Math.abs(y - cur)); scrollTo(0, cur); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, Math.round(y));
await new Promise(r => setTimeout(r, 1400));
return 'card top ' + Math.round(t.getBoundingClientRect().top);
