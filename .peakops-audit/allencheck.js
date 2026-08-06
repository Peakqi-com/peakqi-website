// Allen 綁定驗收:零件都在嗎、降幀真的有生效嗎、彈簧會不會炸成 NaN。
await new Promise((r) => setTimeout(r, 1200));
const card = document.getElementById('a1');
const svg = card && card.querySelector('svg');
if (!svg) return JSON.stringify({ err: 'no svg' });

const NEED = ['shadow', 'torso', 'head', 'antenna', 'eye-l', 'eye-r', 'pupil-l', 'pupil-r',
  'happy-l', 'happy-r', 'mouth', 'chest-ring', 'chest-dot',
  'arm-l-o', 'arm-l-f', 'arm-r-o', 'arm-r-f', 'leg-l-o', 'leg-l-f', 'leg-r-o', 'leg-r-f',
  'hand-l', 'hand-r', 'foot-l', 'foot-r'];
const miss = NEED.filter((n) => !svg.querySelector('[data-p="' + n + '"]'));

// 降幀驗證:連續取樣 1.5 秒,看手臂路徑「變了幾次」。
// 60fps 平滑內插會接近 90 次;12 格/秒應該落在 18 上下。
const arm = svg.querySelector('[data-p="arm-r-f"]');
const seen = [];
let last = null, changes = 0;
const t0 = performance.now();
while (performance.now() - t0 < 1500) {
  await new Promise((r) => requestAnimationFrame(r));
  const d = arm.getAttribute('d');
  seen.push(d);
  if (d !== last) { changes++; last = d; }
}

// NaN 檢查:任何一條路徑出現 NaN,整隻角色會消失
const bad = [];
svg.querySelectorAll('path[data-p]').forEach((el) => {
  const d = el.getAttribute('d') || '';
  if (/NaN|Infinity/.test(d)) bad.push(el.getAttribute('data-p'));
});
svg.querySelectorAll('[data-p]').forEach((el) => {
  const tr = el.getAttribute('transform') || '';
  if (/NaN|Infinity/.test(tr)) bad.push(el.getAttribute('data-p') + '(transform)');
});

// 靜止態(reduced)應該完全不動
const rSvg = document.getElementById('a6').querySelector('svg');
const rArm = rSvg.querySelector('[data-p="arm-r-f"]');
const rBefore = rArm.getAttribute('d');
await new Promise((r) => setTimeout(r, 400));
const rAfter = rArm.getAttribute('d');

// 版面:角色有沒有超出畫框
const bb = svg.getBBox();

return JSON.stringify({
  缺零件: miss,
  rAF取樣數: seen.length,
  畫面更新次數: changes,
  推估幀率: +(changes / 1.5).toFixed(1),
  NaN零件: bad,
  reduced完全靜止: rBefore === rAfter,
  內容框: { x: +bb.x.toFixed(1), y: +bb.y.toFixed(1), w: +bb.width.toFixed(1), h: +bb.height.toFixed(1) },
  超出viewBox: bb.x < 0 || bb.y < 0 || bb.x + bb.width > 200 || bb.y + bb.height > 200,
  掛載數: window.__pqAllen ? window.__pqAllen.count : 0
});
