// 掃出各 cine 階段的捲動位置(讀左上角階段標籤的 active 項)
const de = document.scrollingElement || document.documentElement;
const found = {};
for (let sp = 0.00; sp <= 0.30; sp += 0.01) {
  window.scrollTo(0, Math.round(sp * (de.scrollHeight - innerHeight)));
  await new Promise(r => setTimeout(r, 120));
  for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r));
  const act = document.querySelector('.pq-cine-phase span.active');
  const label = act ? act.textContent.trim() : null;
  if (label && !(label in found)) found[label] = +sp.toFixed(2);
}
return JSON.stringify({ found }, null, 1);
