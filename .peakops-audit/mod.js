const sec = document.querySelector('#modules');
if (!sec) return 'no #modules';
const top = sec.getBoundingClientRect().top + scrollY;
scrollTo(0, Math.round(top + (parseFloat('__F__')) * sec.offsetHeight));
await new Promise(r => setTimeout(r, 1400));
const track = document.querySelector('#modules [data-ftrack]');
const card = document.querySelector('#modules [data-fcard]');
const cols = Array.from(document.querySelectorAll('#modules [data-fcol]'));
const fan = Array.from(document.querySelectorAll('#modules [data-fanim]'));
const R = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
const cr = R(card);
const overlaps = cols.map((c, i) => {
  const r = R(c);
  return { i, w: r.w, sameW: Math.abs(r.w - cr.w) <= 1, x: r.x, y: r.y };
});
return JSON.stringify({
  vertical: cols.length > 1 && cols[1].offsetTop > cols[0].offsetTop + 4,
  card: cr, trackW: track.clientWidth,
  cols: overlaps,
  fanims: fan.map(f => ({ k: f.getAttribute('data-fanim'), r: R(f), kids: f.children.length })),
  docOverflow: document.documentElement.scrollWidth > innerWidth + 1
}, null, 1);
