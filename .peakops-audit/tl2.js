const sec = document.querySelector('#p-timeline');
if (!sec) return 'no section';
// 頁面有延遲展開的長區塊,先逐段捲一次讓版面定下來,再對準本段
for (let y0 = 0; y0 < document.body.scrollHeight; y0 += Math.round(innerHeight * 0.9)) {
  scrollTo(0, y0); await new Promise(r => requestAnimationFrame(r));
}
await new Promise(r => setTimeout(r, 400));
for (let i = 0; i < 8; i++) {
  const t = sec.getBoundingClientRect().top + scrollY - innerHeight * parseFloat('__V__');
  scrollTo(0, Math.round(t));
  await new Promise(r => setTimeout(r, 120));
}
await new Promise(r => setTimeout(r, 900));
const steps = Array.from(document.querySelectorAll('.pq-tl2-step'));
const cs = getComputedStyle(sec);
return JSON.stringify({
  vw: innerWidth,
  bg: cs.backgroundColor,
  steps: steps.length,
  clips: steps.map(s => (getComputedStyle(s).clipPath || '').slice(0, 34)),
  h2Color: getComputedStyle(sec.querySelector('h2')).color,
  rects: steps.map(s => { const r = s.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) }; }),
  docOverflow: document.documentElement.scrollWidth > innerWidth + 1
});
