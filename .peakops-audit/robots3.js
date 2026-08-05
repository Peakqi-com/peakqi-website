const grid = document.querySelector('.pq-modgrid');
grid.scrollIntoView();
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const mods = Array.from(document.querySelectorAll('.pq-mod'));
const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
const out = mods.map((m, i) => {
  const svg = m.querySelector('.ico svg');
  const vb = svg.viewBox.baseVal;
  const sr = svg.getBoundingClientRect();
  const scale = sr.height / vb.height;
  // 每隻畫稿都有一條白遮帶 rect(蓋在頁面線上的那段),取其垂直中心當「畫稿的線」
  const band = Array.from(svg.querySelectorAll('rect')).find(r => (r.getAttribute('fill') || '') === '#F2EFE8');
  if (!band) return { i: i + 1, off: null };
  const by = parseFloat(band.getAttribute('y')) + parseFloat(band.getAttribute('height')) / 2;
  const bandScreen = sr.top + by * scale;
  const row = Math.floor(i / cols);
  const target = row === 0 ? grid.getBoundingClientRect().top : mods[i - cols].getBoundingClientRect().bottom;
  return { i: i + 1, row, off: Math.round(bandScreen - target) };
});
return JSON.stringify({ vw: innerWidth, cols, out }, null, 1);
