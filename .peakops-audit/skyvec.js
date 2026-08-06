// 逐星位移向量:直接跟模組拿每顆中層星的畫面座標,量「它們是不是往同一個方向走」。
// 這是 skydrift.js(像素黑箱)的精確版 —— 給得出每顆星實際走了幾 px、方向差多少度。
//
// 指標:
//   meanMag      每顆星在取樣視窗內的位移量平均(px)
//   sumVecMag    所有位移向量「相加」之後的長度 / 顆數 —— 剛體平移時 = meanMag
//   coherence    sumVecMag / meanMag。整片一起走 = 1.0;方向完全隨機 ≈ 1/√N
//   dirHist      方向分佈(8 個象限各幾顆)—— 平移時會全部擠在一兩格
//   maxMag       單顆最大位移,用來確認「畫面還是活的」,不是被凍住
const root = document.querySelector('[data-blog-sky]');
if (!window.__pqSky || !window.__pqSky.pos) return JSON.stringify({ err: 'no __pqSky hook' });
try { window.__pqSky.hush(); } catch (e) {}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await wait(1500);
const SPANS = [3000, 10000];
const out = {};
for (const DT of SPANS) {
  const a = window.__pqSky.pos();
  await wait(DT);
  const b = window.__pqSky.pos();
  const n = Math.min(a.length, b.length);
  let sx = 0, sy = 0, sm = 0, mx = 0;
  const hist = [0, 0, 0, 0, 0, 0, 0, 0];
  const sample = [];
  for (let i = 0; i < n; i++) {
    const dx = b[i][0] - a[i][0], dy = b[i][1] - a[i][1];
    const m = Math.hypot(dx, dy);
    sx += dx; sy += dy; sm += m;
    if (m > mx) mx = m;
    if (m > 0.05) hist[((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8)]++;
    if (sample.length < 10) sample.push([+dx.toFixed(2), +dy.toFixed(2)]);
  }
  const meanMag = sm / n;
  const sumVecMag = Math.hypot(sx, sy) / n;
  out['span' + DT] = {
    stars: n,
    meanMag: +meanMag.toFixed(3),
    sumVecMag: +sumVecMag.toFixed(3),
    coherence: +(meanMag > 0 ? sumVecMag / meanMag : 0).toFixed(4),
    randomBaseline: +(1 / Math.sqrt(n)).toFixed(4),
    maxMag: +mx.toFixed(2),
    dirHist: hist,
    first10: sample
  };
}
return JSON.stringify({ mode: window.__pqSky.mode, ...out }, null, 1);
