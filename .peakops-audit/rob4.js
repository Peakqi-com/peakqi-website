// 專測 04:sag 線(畫稿)與頁面線(上一卡 border-bottom)的精確差值
const grid = document.querySelector('.pq-modgrid');
const mods = Array.from(document.querySelectorAll('.pq-mod'));
// 捲到模組 4 附近並等 reveal 動畫完全結束
mods[3].scrollIntoView({ block: 'center' });
await new Promise(r => setTimeout(r, 2600));
for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r));
const out = [];
for (const idx of [1, 3]) {   // 02 當基準、04 是目標
  const m = mods[idx];
  const svg = m.querySelector('.ico svg');
  const vb = svg.viewBox.baseVal;
  const sr = svg.getBoundingClientRect();
  const scale = sr.height / vb.height;
  const sag = svg.querySelector('.sag, .bar');
  const d = sag.getAttribute('d');
  const my = parseFloat(/M\s*[\d.]+\s+([\d.]+)/.exec(d)[1]);
  const sagY = sr.top + my * scale;
  const lineY = mods[idx - 1].getBoundingClientRect().bottom - 1;   // 2px 線的中心
  out.push({ mod: idx + 1, sagY: +sagY.toFixed(1), lineY: +lineY.toFixed(1), delta: +(sagY - lineY).toFixed(1) });
}
return JSON.stringify({ vw: innerWidth, out }, null, 1);
