// Home cine:掃出各節拍卡的捲動區間,停在 ?tgt= 指定卡的中點量幾何(截圖即該景)
const hero = document.querySelector('#hero');
const cards = Array.from(document.querySelectorAll('.pq-cine-card'));
const raf = () => new Promise(r => requestAnimationFrame(r));
const heroTop = hero.getBoundingClientRect().top + scrollY;
const heroH = hero.offsetHeight;
const vh = innerHeight;
const end = Math.max(0, heroTop + heroH - vh);
const ranges = {};
for (let y = Math.round(heroTop); y <= end; y += 100) {
  scrollTo(0, y); await raf(); await raf();
  const a = cards.findIndex(c => c.classList.contains('is-active'));
  if (a >= 0) { if (!ranges[a]) ranges[a] = { from: y, to: y }; ranges[a].to = y; }
}
const TARGET = +(new URLSearchParams(location.search).get('tgt') || 3);
const out = { vh, heroH, nCards: cards.length, ranges, TARGET };
const t = ranges[TARGET];
if (t) {
  scrollTo(0, Math.round((t.from + t.to) / 2));
  await new Promise(r => setTimeout(r, 900));
  for (let i = 0; i < 30; i++) await raf();
  const c = cards[TARGET], r = c.getBoundingClientRect();
  out.card = { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), active: c.classList.contains('is-active') };
}
return JSON.stringify(out);
