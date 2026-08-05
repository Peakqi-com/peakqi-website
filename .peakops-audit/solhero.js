await new Promise(r => setTimeout(r, 1400));
const media = document.querySelector('[data-hero-media]');
const copy = document.querySelector('[data-hero-copy]');
const grid = document.querySelector('#pq-sol-hero-grid');
const mr = media.getBoundingClientRect(), cr = copy.getBoundingClientRect();
const g = getComputedStyle(grid);
return JSON.stringify({ vw: innerWidth, gridDisplay: g.display, gridDir: g.flexDirection, gridCols: g.gridTemplateColumns.split(' ').length,
  mediaY: Math.round(mr.y), copyY: Math.round(cr.y), mediaX: Math.round(mr.x), copyX: Math.round(cr.x),
  stackedMediaTop: mr.y < cr.y - 10 && Math.abs(mr.x - cr.x) < 40,
  sideBySide: Math.abs(mr.y - cr.y) < 200 && mr.x > cr.x + 100 }, null, 1);
