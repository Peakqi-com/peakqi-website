// Home vcard:定點長沉澱抽樣(引擎 IO/節流會吃掉快掃),找到就停在那格量幾何
const review = document.querySelector('[data-cine-review]');
if (!review) return JSON.stringify({ err: 'no review' });
const hero = document.querySelector('#hero');
const heroTop = hero.getBoundingClientRect().top + scrollY;
const span = hero.offsetHeight - innerHeight;
const samples = [];
let hit = null;
for (const f of [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.94]) {
  scrollTo(0, Math.round(heroTop + f * span));
  await new Promise(r => setTimeout(r, 1100));
  const op = parseFloat(getComputedStyle(review).opacity);
  samples.push([f, op.toFixed(2)]);
  if (op > 0.5 && !hit) { hit = f; break; }
}
const out = { vh: innerHeight, samples, hit };
if (hit) {
  await new Promise(r => setTimeout(r, 700));
  const on = review.querySelector('.pq-cine-vcard.is-on') || review.querySelector('.pq-cine-vcard');
  const r = on.getBoundingClientRect();
  out.vcard = {
    top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height),
    isOn: on.classList.contains('is-on'),
    label: (on.querySelector('.top') ? on.querySelector('.top').textContent : '').trim().slice(0, 16)
  };
}
return JSON.stringify(out);
