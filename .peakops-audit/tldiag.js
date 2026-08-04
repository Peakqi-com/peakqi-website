const P = parseFloat(new URLSearchParams(location.search).get('sp') || '0.86');
window.scrollTo(0, Math.round(P * (document.body.scrollHeight - window.innerHeight)));
await new Promise(r => setTimeout(r, 500));
for (let i = 0; i < 60; i++) await new Promise(r => requestAnimationFrame(r));
const sec = document.querySelector('#timeline');
const cont = document.getElementById('pq-tl');
const line = sec && sec.querySelector('[data-tline]');
const dots = sec ? Array.from(sec.querySelectorAll('[data-dot]')) : [];
const cr = cont.getBoundingClientRect(), lr = line.getBoundingClientRect();
const vertical = getComputedStyle(cont).flexDirection === 'column';
const reach = vertical ? (lr.bottom - cr.top) : (lr.right - cr.left);
// 手動測試:把第 4 顆點設成暗色,看引擎會不會在下一幀把它改回亮色
dots[3].style.background = 'rgba(0,255,0,1)';
await new Promise(r => setTimeout(r, 300));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const after = getComputedStyle(dots[3]).backgroundColor;
return JSON.stringify({
  vw: innerWidth,
  secInView: cr.top < innerHeight && cr.bottom > 0,
  flexDir: getComputedStyle(cont).flexDirection,
  vertical,
  contRect: { t: Math.round(cr.top), h: Math.round(cr.height), w: Math.round(cr.width) },
  lineRect: { t: Math.round(lr.top), b: Math.round(lr.bottom), h: Math.round(lr.height) },
  lineTransform: getComputedStyle(line).transform,
  lineOrigin: getComputedStyle(line).transformOrigin,
  reach: Math.round(reach),
  dotPos: dots.map(d => { const r = d.getBoundingClientRect(); return Math.round((vertical ? r.top + r.height / 2 : r.left + r.width / 2) - (vertical ? cr.top : cr.left)); }),
  dotBg: dots.map(d => getComputedStyle(d).backgroundColor),
  engineOverwroteTestDot: after !== 'rgb(0, 255, 0)',
  testDotAfter: after,
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
}, null, 1);
