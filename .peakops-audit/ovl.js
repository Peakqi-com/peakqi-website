// 找出固定層之間的實際重疊
await new Promise(r => setTimeout(r, 1400));
const sels = ['#plate', '#secHead', '#cards', '.card.on', '#hero', '#finale', '.dots', '#rail', '#seg', '#panel'];
const els = [];
sels.forEach(s => document.querySelectorAll(s).forEach(el => {
  if (el.offsetWidth > 0 && getComputedStyle(el).opacity !== '0' && getComputedStyle(el).display !== 'none') {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) els.push({ s, el, r, z: getComputedStyle(el).zIndex });
  }
}));
const ov = [];
for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
  const a = els[i].r, b = els[j].r;
  const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (ox > 2 && oy > 2 && !(els[i].s === '#hero' || els[j].s === '#hero') && !(els[i].s === '#finale' || els[j].s === '#finale') && !(els[i].s === '#cards' || els[j].s === '#cards'))
    ov.push({ a: els[i].s, az: els[i].z, b: els[j].s, bz: els[j].z, ox: Math.round(ox), oy: Math.round(oy) });
}
const plate = document.querySelector('#plate');
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  layers: els.map(e => ({ s: e.s, z: e.z, r: { x: Math.round(e.r.x), y: Math.round(e.r.y), w: Math.round(e.r.width), h: Math.round(e.r.height) } })),
  plateHTML: plate ? plate.outerHTML.slice(0, 300) : null,
  overlaps: ov
}, null, 1);
