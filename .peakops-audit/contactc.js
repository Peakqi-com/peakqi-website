const sec = document.querySelector('#contact');
sec.scrollIntoView();
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const R = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), right: Math.round(r.right) }; };
const wrap = sec.querySelector('.pq-wrap');
const p = sec.querySelector('p');
const cards = sec.querySelectorAll('a[href^="mailto"], a[href^="tel"]');
const de = document.scrollingElement || document.documentElement;
const cs = getComputedStyle(wrap);
return JSON.stringify({
  vw: innerWidth, secW: R(sec).w,
  wrap: R(wrap), wrapPad: cs.padding, wrapBox: cs.boxSizing, wrapMargin: cs.marginLeft + '/' + cs.marginRight,
  para: R(p), paraCut: R(p).right > innerWidth,
  card0: cards[0] ? R(cards[0]) : null,
  overflowX: de.scrollWidth - de.clientWidth,
  grid: getComputedStyle(wrap).gridTemplateColumns
}, null, 1);
