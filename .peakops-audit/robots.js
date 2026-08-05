const grid = document.querySelector('.pq-modgrid');
grid.scrollIntoView();
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const R = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
const mods = Array.from(document.querySelectorAll('.pq-mod'));
const out = mods.map((m, i) => {
  const ico = m.querySelector('.ico');
  const cs = getComputedStyle(m);
  const ics = ico ? getComputedStyle(ico) : null;
  return {
    i: i + 1,
    card: R(m),
    borderTop: cs.borderTopWidth + ' ' + cs.borderTopColor.slice(0, 18),
    ico: ico ? R(ico) : null,
    icoPos: ics ? { top: ics.top, right: ics.right, w: ics.width } : null,
    gapLineToIco: ico ? Math.round(ico.getBoundingClientRect().y - m.getBoundingClientRect().y) : null
  };
});
// 上一張卡的底線(= 這張卡的上緣線?)以及 modgrid 前面的分隔線
const gcs = getComputedStyle(grid);
return JSON.stringify({ vw: innerWidth, grid: R(grid), gridCols: gcs.gridTemplateColumns.split(' ').length, mods: out }, null, 1);
