// Home:掃出 .pq-cine-vcard 可見的捲動區間,停在中點量卡與視窗幾何
const v = document.querySelector('.pq-cine-vcard');
if (!v) return JSON.stringify({ err: 'no vcard' });
const hero = document.querySelector('#hero');
const raf = () => new Promise(r => requestAnimationFrame(r));
const heroTop = hero.getBoundingClientRect().top + scrollY;
const end = heroTop + hero.offsetHeight - innerHeight;
let from = -1, to = -1;
for (let y = Math.round(heroTop); y <= end; y += 150) {
  scrollTo(0, y); await raf(); await raf();
  const cs = getComputedStyle(v);
  const vis = parseFloat(cs.opacity) > 0.5 && cs.display !== 'none' && cs.visibility !== 'hidden';
  if (vis) { if (from < 0) from = y; to = y; }
}
const out = { vh: innerHeight, from, to };
if (from >= 0) {
  scrollTo(0, Math.round((from + to) / 2));
  await new Promise(r => setTimeout(r, 900));
  for (let i = 0; i < 30; i++) await raf();
  const r = v.getBoundingClientRect();
  out.vcard = { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), opacity: getComputedStyle(v).opacity };
}
return JSON.stringify(out);
