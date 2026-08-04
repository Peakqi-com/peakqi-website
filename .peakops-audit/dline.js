// Demo 流程線:掃過整段 hero 進度,量「線的實際長度」與「圓點是否貼在線頭」
const wrap = document.querySelector('[data-hero-wrap]');
const svgLine = document.querySelector('[data-hero-line]');
const dot = document.querySelector('[data-hero-dot]');
const stops = Array.from(document.querySelectorAll('[data-hero-stop]'));
if (!wrap || !svgLine) return JSON.stringify({ fatal: 'no line' });
const vh = window.innerHeight || 1;
const absTop = wrap.getBoundingClientRect().top + window.scrollY;
const span = Math.max(1, wrap.offsetHeight - vh);
const L = svgLine.getTotalLength();
const samples = [];
for (const p of [0, 0.12, 0.25, 0.4, 0.5, 0.62, 0.78, 0.9, 1]) {
  window.scrollTo(0, Math.round(absTop + p * span));
  await new Promise(r => setTimeout(r, 120));
  for (let i = 0; i < 14; i++) await new Promise(r => requestAnimationFrame(r));
  const off = parseFloat(getComputedStyle(svgLine).strokeDashoffset) || 0;
  const drawn = L - off;                       // 目前畫出來的長度
  const frac = +(drawn / L).toFixed(3);
  // 線頭在畫面上的實際 x
  const head = svgLine.getPointAtLength(drawn);
  const dotR = dot ? dot.getBoundingClientRect() : null;
  const lineR = svgLine.getBoundingClientRect();
  // 線頭換算成畫面座標(viewBox 0 0 1200 24,preserveAspectRatio=none)
  const sx = lineR.width / 1188, headScreenX = lineR.left + (head.x - 6) * sx;
  const dotCx = dotR ? dotR.left + dotR.width / 2 : null;
  samples.push({
    p, frac,
    lineHeadX: +headScreenX.toFixed(1),
    dotX: dotCx === null ? null : +dotCx.toFixed(1),
    gap: dotCx === null ? null : +Math.abs(dotCx - headScreenX).toFixed(1),
    stopsOn: stops.filter(s => getComputedStyle(s).opacity === '1').length
  });
}
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  pathLength: +L.toFixed(1),
  pathD: svgLine.getAttribute('d'),
  stopCount: stops.length,
  hasDot: !!dot,
  samples,
  maxGap: Math.max(...samples.map(s => s.gap === null ? 0 : s.gap)),
  finalFrac: samples[samples.length - 1].frac
}, null, 1);
