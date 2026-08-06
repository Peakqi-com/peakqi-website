// 指標視差是不是「整塊移動」的真兇:模擬滑鼠橫移,看所有星是不是往同一方向一起跑
await new Promise((r) => setTimeout(r, 2600));
const S = window.__pqSky;
if (!S) return JSON.stringify({ err: 'no hook' });
S.hush();
const cv = document.querySelector('[data-blog-sky] canvas');
const r = cv.getBoundingClientRect();
const sleep = (ms) => new Promise((x) => setTimeout(x, ms));
const move = (fx, fy) => cv.dispatchEvent(new PointerEvent('pointermove', {
  clientX: r.left + r.width * fx, clientY: r.top + r.height * fy,
  bubbles: true, pointerId: 1, isPrimary: true
}));

// 先把指標放到左上並讓緩動追上
move(0.08, 0.12); await sleep(1400);
const A = S.pos();
// 再橫移到右下
move(0.92, 0.88); await sleep(1400);
const B = S.pos();

let sx = 0, sy = 0, sm = 0, n = 0, mx = 0;
for (let i = 0; i < Math.min(A.length, B.length); i++) {
  const dx = B[i][0] - A[i][0], dy = B[i][1] - A[i][1];
  const m = Math.hypot(dx, dy);
  if (m < 0.05) continue;
  sx += dx; sy += dy; sm += m; n++;
  if (m > mx) mx = m;
}
const R = sm ? Math.hypot(sx, sy) / sm : 0;
return JSON.stringify({
  計入: n,
  平均位移px: n ? +(sm / n).toFixed(2) : 0,
  最大位移px: +mx.toFixed(2),
  方向一致度R: +R.toFixed(3),
  隨機基準約: n ? +(1 / Math.sqrt(n)).toFixed(3) : null,
  判定: R > 0.6 ? '滑鼠一動整塊跟著跑(這就是使用者說的整塊移動)' : R > 0.3 ? '部分一致' : '各自獨立'
});
