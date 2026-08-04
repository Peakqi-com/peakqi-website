const grid = document.querySelector('.pq-modgrid');
if (!grid) return 'no grid';
grid.scrollIntoView({ block: 'center' });
await new Promise(r => setTimeout(r, 1600));
const WIRE = ['.sag', '.bar', '.sag3', '.sag4', '.sag5', '.sag6'];
const out = [];
document.querySelectorAll('.pq-mod').forEach((card, i) => {
  const ico = card.querySelector('.ico');
  const svg = ico && ico.querySelector('svg');
  const wire = svg && svg.querySelector(WIRE[i]);
  const cr = card.getBoundingClientRect();
  // 卡片「上緣那條線」= 上一列的 border-bottom 或 grid 的 border-top,實際就在 card.top
  const lineY = cr.top;
  let wireY = null, wireBox = null;
  if (wire) {
    const wr = wire.getBoundingClientRect();      // 含所有 transform 的真實位置
    wireBox = { top: Math.round(wr.top), bottom: Math.round(wr.bottom), h: Math.round(wr.height) };
    wireY = wr.top + wr.height / 2;
  }
  const ir = ico ? ico.getBoundingClientRect() : null;
  out.push({
    n: i + 1, cls: (card.className.match(/pqbrk\d/) || [''])[0],
    lineY: Math.round(lineY),
    icoTop: ir ? Math.round(ir.top) : null, icoH: ir ? Math.round(ir.height) : null,
    vb: svg ? svg.getAttribute('viewBox') : null,
    wireBox,
    delta: wireY == null ? null : Math.round(wireY - lineY)   // +下沉 / -上浮
  });
});
return JSON.stringify({ vw: innerWidth, rows: out }, null, 1);
