const grid = document.querySelector('.pq-modgrid');
grid.scrollIntoView();
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const mods = Array.from(document.querySelectorAll('.pq-mod'));
const out = mods.map((m, i) => {
  const svg = m.querySelector('.ico svg');
  const vb = svg.viewBox.baseVal;
  const sag = svg.querySelector('.sag, .bar');
  const sr = svg.getBoundingClientRect();
  const scale = sr.height / vb.height;
  // 弧線起點的 viewBox y(路徑 M x y 的 y)
  let sagY = null;
  if (sag) { const d = sag.getAttribute('d'); const m2 = /M\s*[\d.]+\s+([\d.]+)/.exec(d); if (m2) sagY = parseFloat(m2[1]); }
  const sagScreen = sagY === null ? null : sr.top + sagY * scale;
  // 目標線:上一張卡的 border-bottom(= 上一卡底),第一張用 grid 頂
  const target = i === 0 ? grid.getBoundingClientRect().top : mods[i - 1].getBoundingClientRect().bottom;
  return { i: i + 1, sagScreen: sagScreen === null ? null : Math.round(sagScreen), target: Math.round(target), off: sagScreen === null ? null : Math.round(sagScreen - target) };
});
return JSON.stringify({ vw: innerWidth, out }, null, 1);
