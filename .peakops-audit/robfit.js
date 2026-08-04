const grid = document.querySelector('.pq-modgrid');
grid.scrollIntoView({ block: 'center' });
await new Promise(r => setTimeout(r, 1500));
const WIRE = ['.sag', '.bar', '.sag3', '.sag4', '.sag5', '.sag6'];
const out = [];
document.querySelectorAll('.pq-mod').forEach((card, i) => {
  const ico = card.querySelector('.ico');
  const svg = ico && ico.querySelector('svg');
  if (!svg) return;
  const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
  let bb = null;
  try { bb = svg.getBBox(); } catch (e) {}
  const wire = svg.querySelector(WIRE[i]);
  let wy = null;
  try { const w = wire.getBBox(); wy = w.y + w.height / 2; } catch (e) {}
  const ir = ico.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  const scale = ir.height / vb[3];
  out.push({
    n: i + 1, cls: (card.className.match(/pqbrk\d/) || [''])[0],
    vbH: vb[3], icoH: Math.round(ir.height), scale: +scale.toFixed(3),
    bbox: bb ? { y: +bb.y.toFixed(1), h: +bb.height.toFixed(1), bottom: +(bb.y + bb.height).toFixed(1) } : null,
    wireY: wy == null ? null : +wy.toFixed(1),
    // 線目前落在身體的百分比位置(0=頭頂 1=腳底)
    seatPct: bb && wy != null ? +((wy - bb.y) / bb.height).toFixed(3) : null,
    curTop: Math.round(ir.top - cr.top)
  });
});
return JSON.stringify({ vw: innerWidth, robots: out }, null, 1);
