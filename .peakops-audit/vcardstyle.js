// vcard computed style at review segment
const review = document.querySelector('[data-cine-review]');
const hero = document.querySelector('#hero');
const heroTop = hero.getBoundingClientRect().top + scrollY;
const span = hero.offsetHeight - innerHeight;
scrollTo(0, Math.round(heroTop + 0.78 * span));
await new Promise(r => setTimeout(r, 1400));
const on = review.querySelector('.pq-cine-vcard.is-on') || review.querySelector('.pq-cine-vcard');
const cs = getComputedStyle(on);
const r = on.getBoundingClientRect();
return JSON.stringify({
  rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) },
  top: cs.top, bottom: cs.bottom, transform: cs.transform, maxHeight: cs.maxHeight,
  inline: on.getAttribute('style') || ''
});
