const wrap = document.querySelector('[data-hero-wrap]');
let col = document.querySelector('[data-hero-copy]');
if (col && !col.querySelector(':scope > h1')) {
  const inner = Array.from(col.children).find(x => x.querySelector && x.querySelector(':scope > h1'));
  if (inner) col = inner;
}
if (!wrap || !col) return JSON.stringify({ fatal: 'no wrap/col' });
scrollTo(0, 0); await new Promise(r => setTimeout(r, 600));
const base = Math.round(wrap.getBoundingClientRect().top + scrollY);
const has = () => col.classList.contains('pq-hero-compact');
const clps = Array.from(col.querySelectorAll('.pq-clp'));
const maxH = clps.map(el => el.style.maxHeight || '(css)');
const step = async (dy) => {
  scrollTo(0, base + dy);
  await new Promise(r => setTimeout(r, 40));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
};
let collapseAt = -1;
for (let y = 0; y <= 80; y += 3) { await step(y); if (has()) { collapseAt = y; break; } }
// 收合過程取樣:文案欄高度應單調下降,不應長時間不動(空跑)
const t0 = performance.now(); const samples = [];
while (performance.now() - t0 < 620) {
  samples.push(Math.round(col.getBoundingClientRect().height));
  await new Promise(r => requestAnimationFrame(r));
}
const first = samples[0], last = samples[samples.length - 1];
let stallFrames = 0, mv = 0;
for (let i = 1; i < samples.length; i++) { if (samples[i] === samples[i - 1]) stallFrames++; else mv++; }
let flips = 0, prev = has();
for (const y of [40, 22, 55, 15, 66, 24]) { await step(y); if (has() !== prev) { flips++; prev = has(); } }
scrollTo(0, 0); await new Promise(r => setTimeout(r, 500));
return JSON.stringify({ collapseAt, flips, maxH, colH: [first, last], stallFrames, movingFrames: mv, backAtTop: !has() });
