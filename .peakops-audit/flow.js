for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.9)) {
  scrollTo(0, y); await new Promise(r => requestAnimationFrame(r));
}
await new Promise(r => setTimeout(r, 500));
const sec = document.querySelector('#flow');
for (let i = 0; i < 8; i++) { scrollTo(0, Math.round(sec.getBoundingClientRect().top + scrollY - 40)); await new Promise(r => setTimeout(r, 120)); }
await new Promise(r => setTimeout(r, 900));
const R = el => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), h: Math.round(r.height) }; };
const layers = Array.from(document.querySelectorAll('#flow [data-layer]'));
const out = layers.map((el, i) => {
  const box = R(el);
  // 找出這張卡裡「超出卡片下緣」的子元素
  let worst = null;
  el.querySelectorAll('*').forEach(c => {
    if (!c.getClientRects().length) return;
    const cr = R(c);
    const over = cr.bottom - box.bottom;
    if (over > 1 && (!worst || over > worst.over)) worst = { over: Math.round(over), t: (c.textContent || '').trim().slice(0, 18), tag: c.tagName };
  });
  return { i, ...box, overflowBottom: worst };
});
// 相鄰卡片是否重疊
const laps = [];
for (let i = 1; i < out.length; i++) if (out[i].top < out[i - 1].bottom) laps.push({ pair: [i - 1, i], px: out[i - 1].bottom - out[i].top });
return JSON.stringify({ vw: innerWidth, layers: out, overlaps: laps, gap: getComputedStyle(document.querySelector('#flow [data-deck]')).gap }, null, 1);
