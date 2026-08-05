// PeakOps pain 區:量面板與五個視窗的幾何(疊壓/裁切),並回報是否有東西在動
const wins = Array.from(document.querySelectorAll('[data-win]'));
if (!wins.length) return JSON.stringify({ err: 'no wins' });
const panel = wins[0].parentElement;
panel.scrollIntoView({ block: 'center' });
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
const pr = panel.getBoundingClientRect();
const t0 = wins.map(w => w.style.transform);
await new Promise(r => setTimeout(r, 700));
const moved = wins.map((w, i) => w.style.transform !== t0[i]);
const rects = wins.map(w => {
  const r = w.getBoundingClientRect();
  return { l: Math.round(r.left - pr.left), t: Math.round(r.top - pr.top), r: Math.round(r.right - pr.left), b: Math.round(r.bottom - pr.top), w: Math.round(r.width) };
});
// 兩兩重疊面積
const ov = [];
for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
  const a = rects[i], b = rects[j];
  const x = Math.min(a.r, b.r) - Math.max(a.l, b.l), y = Math.min(a.b, b.b) - Math.max(a.t, b.t);
  if (x > 8 && y > 8) ov.push([i, j, x + 'x' + y]);
}
return JSON.stringify({ vw: innerWidth, panel: { w: Math.round(pr.width), h: Math.round(pr.height) }, rects, clipped: rects.map(r => r.r > Math.round(pr.width) + 1 || r.l < -1), overlaps: ov, moved });
