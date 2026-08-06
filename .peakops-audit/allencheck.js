// Allen 綁定驗收:零件齊全、降幀生效、彈簧不炸 NaN、七種表情確實長得不一樣。
await new Promise((r) => setTimeout(r, 1400));
const card = document.getElementById('a1');
const svg = card && card.querySelector('svg');
if (!svg) return JSON.stringify({ err: 'no svg' });

const NEED = ['shadow', 'torso', 'head', 'antenna', 'eye-l', 'eye-r', 'pupil-l', 'pupil-r',
  'iris-l', 'iris-r', 'happy-l', 'happy-r', 'brow-l', 'brow-r',
  'mouth', 'm-line', 'm-open', 'm-teeth', 'm-tongue', 'chest-ring', 'chest-dot',
  'arm-l-o', 'arm-l-f', 'arm-l-h', 'arm-r-o', 'arm-r-f', 'arm-r-h',
  'leg-l-o', 'leg-l-f', 'leg-l-h', 'leg-r-o', 'leg-r-f', 'leg-r-h',
  'hand-l', 'hand-r', 'foot-l', 'foot-r'];
const miss = NEED.filter((n) => !svg.querySelector('[data-p="' + n + '"]'));

// 降幀:連續取樣 1.5 秒,看手臂路徑變了幾次。60fps 平滑內插會接近 90 次;
// 12 格/秒應該落在 18 上下。
const arm = svg.querySelector('[data-p="arm-r-f"]');
let last = null, changes = 0, samples = 0;
const t0 = performance.now();
while (performance.now() - t0 < 1500) {
  await new Promise((r) => requestAnimationFrame(r));
  samples++;
  const d = arm.getAttribute('d');
  if (d !== last) { changes++; last = d; }
}

// NaN:任何一條路徑出現 NaN,整隻角色會消失
const bad = [];
svg.querySelectorAll('[data-p]').forEach((el) => {
  const s = (el.getAttribute('d') || '') + '|' + (el.getAttribute('transform') || '') + '|' + (el.getAttribute('r') || '');
  if (/NaN|Infinity/.test(s)) bad.push(el.getAttribute('data-p'));
});

// 七種表情:抓每一格的臉部特徵,確認彼此真的不同(不是掛上去但全長一樣)
const faces = (window.__pqAllen ? window.__pqAllen.locked : []).map(({ key, card: c }) => {
  const s = c.querySelector('svg');
  const g = (n, a) => { const el = s.querySelector('[data-p="' + n + '"]'); return el ? el.getAttribute(a) : null; };
  const o = (n) => { const el = s.querySelector('[data-p="' + n + '"]'); return el ? +(el.style.opacity || 1) : null; };
  const eyeScale = /scale\(1,([\d.]+)\)/.exec(g('eye-l', 'transform') || '');
  return {
    表情: key,
    笑眼: +(o('happy-l') || 0).toFixed(2),
    眼開度: eyeScale ? +(+eyeScale[1]).toFixed(2) : null,
    眉: +(o('brow-l') || 0).toFixed(2),
    瞳孔r: g('iris-l', 'r'),
    張嘴: +(o('m-open') || 0).toFixed(2),
    牙: +(o('m-teeth') || 0).toFixed(2),
    嘴形: (g('m-line', 'd') || '').slice(0, 18),
  };
});
// 指紋去重:七種表情的臉部參數組合應該有七個不同值
const fp = new Set(faces.map((f) => [f.笑眼, f.眉, f.瞳孔r, f.張嘴, f.牙, f.嘴形].join('/')));

// reduced 應完全不動
const rSvg = document.getElementById('a5').querySelector('svg');
const rArm = rSvg.querySelector('[data-p="arm-r-f"]');
const rBefore = rArm.getAttribute('d');
await new Promise((r) => setTimeout(r, 400));

const bb = svg.getBBox();
return JSON.stringify({
  缺零件: miss,
  rAF取樣: samples, 畫面更新: changes, 推估幀率: +(changes / 1.5).toFixed(1),
  NaN零件: bad,
  reduced靜止: rBefore === rArm.getAttribute('d'),
  內容框: { x: +bb.x.toFixed(1), y: +bb.y.toFixed(1), w: +bb.width.toFixed(1), h: +bb.height.toFixed(1) },
  超出viewBox: bb.x < 0 || bb.y < 0 || bb.x + bb.width > 200 || bb.y + bb.height > 200,
  表情數: faces.length, 相異表情數: fp.size,
  表情明細: faces,
}, null, 1);
