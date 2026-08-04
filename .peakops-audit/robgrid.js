const grid = document.querySelector('.pq-modgrid');
grid.scrollIntoView({ block: 'start' });
await new Promise(r => setTimeout(r, 900));
const y = grid.getBoundingClientRect().top + scrollY - 90;
let cur = scrollY;
while (Math.abs(cur - y) > 6) { cur += Math.sign(y - cur) * Math.min(300, Math.abs(y - cur)); scrollTo(0, cur); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, Math.round(y));
await new Promise(r => setTimeout(r, 1500));
const cs = getComputedStyle(document.querySelector('.pq-mod'));
return JSON.stringify({ gridTopBorder: getComputedStyle(grid).borderTopWidth + ' ' + getComputedStyle(grid).borderTopColor,
  cardBottomBorder: cs.borderBottomWidth + ' ' + cs.borderBottomColor });
