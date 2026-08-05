// Home:掃 [data-cine-review] 容器可見區間,停中點量 is-on 的 vcard 位置
const review = document.querySelector('[data-cine-review]');
if (!review) return JSON.stringify({ err: 'no review' });
const hero = document.querySelector('#hero');
const raf = () => new Promise(r => requestAnimationFrame(r));
const heroTop = hero.getBoundingClientRect().top + scrollY;
const end = heroTop + hero.offsetHeight - innerHeight;
let from = -1, to = -1;
for (let y = Math.round(heroTop); y <= end; y += 200) {
  scrollTo(0, y); await raf(); await raf(); await raf();
  if (parseFloat(getComputedStyle(review).opacity) > 0.5) { if (from < 0) from = y; to = y; }
}
const out = { vh: innerHeight, from, to };
if (from >= 0) {
  scrollTo(0, Math.round(from + (to - from) * 0.7));
  await new Promise(r => setTimeout(r, 900));
  for (let i = 0; i < 30; i++) await raf();
  const on = review.querySelector('.pq-cine-vcard.is-on') || review.querySelector('.pq-cine-vcard');
  const r = on.getBoundingClientRect();
  out.vcard = {
    top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height),
    isOn: on.classList.contains('is-on'),
    label: (on.querySelector('.top') ? on.querySelector('.top').textContent : '').trim().slice(0, 20)
  };
}
return JSON.stringify(out);
