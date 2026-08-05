// vcard 定位父層鏈:誰是 containing block、它的視窗座標在哪
const review = document.querySelector('[data-cine-review]');
const hero = document.querySelector('#hero');
const heroTop = hero.getBoundingClientRect().top + scrollY;
const span = hero.offsetHeight - innerHeight;
scrollTo(0, Math.round(heroTop + 0.78 * span));
await new Promise(r => setTimeout(r, 1400));
const on = review.querySelector('.pq-cine-vcard.is-on') || review.querySelector('.pq-cine-vcard');
const info = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
  return {
    tag: el.tagName, cls: String(el.className).slice(0, 40), id: el.id || '',
    top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height),
    pos: cs.position, sticky: cs.position === 'sticky' ? cs.top : ''
  };
};
const chain = [info(on)];
let n = on.offsetParent, guard = 0;
while (n && guard++ < 5) { chain.push(info(n)); n = n.offsetParent; }
return JSON.stringify({ vh: innerHeight, chain });
