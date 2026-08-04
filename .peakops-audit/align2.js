for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.9)) {
  scrollTo(0, y); await new Promise(r => requestAnimationFrame(r));
}
scrollTo(0, 0);
await new Promise(r => setTimeout(r, 800));
const out = [];
document.querySelectorAll('section[id]').forEach(sec => {
  const h2 = sec.querySelector('h2');
  const eyebrowRow = sec.querySelector('div > span');
  const wrapEl = sec.querySelector('div[style*="max-width"]');
  const L = el => el ? Math.round(el.getBoundingClientRect().left) : null;
  const W = el => el ? Math.round(el.getBoundingClientRect().width) : null;
  out.push({ id: sec.id, h2Left: L(h2), wrapLeft: L(wrapEl), wrapW: W(wrapEl),
    h2: h2 ? h2.textContent.trim().slice(0, 12) : '' });
});
return JSON.stringify({ vw: innerWidth, sections: out.filter(s => s.h2Left != null) }, null, 1);
