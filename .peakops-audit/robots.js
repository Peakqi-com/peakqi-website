const grid = document.querySelector('.pq-modgrid');
if (!grid) return 'no grid';
grid.scrollIntoView({ block: 'start' });
await new Promise(r => setTimeout(r, 1500));
const WIRE = ['.sag', '.bar', '.sag3', '.sag4', '.sag5', '.sag6'];
const out = [];
document.querySelectorAll('.pq-mod').forEach((card, i) => {
  const ico = card.querySelector('.ico');
  const svg = ico && ico.querySelector('svg');
  const wire = svg && svg.querySelector(WIRE[i]);
  const cr = card.getBoundingClientRect();
  const ir = ico ? ico.getBoundingClientRect() : null;
  let wireY = null, vb = null;
  if (svg && wire) {
    try {
      const b = wire.getBBox();
      vb = svg.getAttribute('viewBox');
      const parts = vb.split(/[\s,]+/).map(Number);
      // viewBox 高度 → 實際像素的換算(preserveAspectRatio 預設 meet,寬高等比)
      const sx = ir.width / parts[2], sy = ir.height / parts[3];
      const s = Math.min(sx, sy);
      const offY = (ir.height - parts[3] * s) / 2;
      wireY = ir.top + offY + (b.y + b.height / 2 - parts[1]) * s;
    } catch (e) { wireY = 'err ' + e.message; }
  }
  out.push({
    n: i + 1, cls: (card.className.match(/pqbrk\d/) || [''])[0],
    cardTop: Math.round(cr.top), icoTop: ir ? Math.round(ir.top) : null,
    icoH: ir ? Math.round(ir.height) : null, vb,
    wireY: typeof wireY === 'number' ? Math.round(wireY) : wireY,
    delta: typeof wireY === 'number' ? Math.round(wireY - cr.top) : null
  });
});
return JSON.stringify({ vw: innerWidth, rows: out }, null, 1);
