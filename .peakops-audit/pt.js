await new Promise(r => setTimeout(r, 1400));
const pts = [[195, 50], [120, 50], [250, 50], [100, 22]];
const out = pts.map(([x, y]) => ({
  at: [x, y],
  stack: document.elementsFromPoint(x, y).slice(0, 4).map(e => e.tagName + (e.id ? '#' + e.id : '') + (e.className && e.className.toString ? '.' + e.className.toString().split(' ')[0] : ''))
}));
const brand = document.querySelector('#brand, .brand, header, #topbar');
return JSON.stringify({ vw: innerWidth, out, brandHTML: brand ? brand.outerHTML.slice(0, 400) : 'none',
  bodyTop: Array.from(document.body.children).map(c => c.tagName + (c.id ? '#' + c.id : '')) }, null, 1);
