// 藍圖標註卡:掃出可見時機,量 SVG 文字寬 vs 卡片寬(不換行 → 溢出即爆卡)
const hero = document.querySelector('#hero');
const svg = document.querySelector('.pq-cine-annot');
if (!svg) return JSON.stringify({ err: 'no annot' });
const top = hero.getBoundingClientRect().top + scrollY;
const span = hero.offsetHeight - innerHeight;
const raf = () => new Promise((r) => requestAnimationFrame(r));
const out = [];
for (const f of [0.2, 0.24, 0.28, 0.32, 0.36, 0.4]) {
  scrollTo(0, Math.round(top + f * span));
  await new Promise((r) => setTimeout(r, 700));
  for (let i = 0; i < 12; i++) await raf();
  if (parseFloat(getComputedStyle(svg).opacity) < 0.1) continue;
  const cards = Array.from(svg.querySelectorAll('rect.card, .card'));
  const texts = Array.from(svg.querySelectorAll('text'));
  texts.forEach((tx) => {
    const s = (tx.textContent || '').trim();
    if (!s) return;
    let bb; try { bb = tx.getBBox(); } catch (e) { return; }
    // 找同組卡片(最近的 rect)
    let best = null, bd = 1e9;
    cards.forEach((c) => {
      let cb; try { cb = c.getBBox ? c.getBBox() : null; } catch (e) { return; }
      if (!cb) return;
      const d = Math.abs(cb.y - bb.y) + Math.abs(cb.x - bb.x);
      if (d < bd) { bd = d; best = cb; }
    });
    if (!best) return;
    const over = Math.round((bb.x + bb.width) - (best.x + best.width));
    if (over > -2) out.push({ f, t: s.slice(0, 30), over, textW: Math.round(bb.width), cardW: Math.round(best.width) });
  });
  if (out.length) break;
}
return JSON.stringify({ found: out.length, items: out.slice(0, 8) });
