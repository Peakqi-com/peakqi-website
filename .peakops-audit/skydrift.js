// 「整片星空是不是當成一塊在移動」的黑箱量測 —— 不靠模組內部,只看畫布像素,
// 所以同一支探針可以直接拿去量改動前的版本。
//
// 作法:把天空切成 tile,對每個 tile 取 t0 的亮點座標表,再到 t1 的亮點遮罩上
// 掃描所有整數位移 (dx,dy),找出讓重疊數最大的那一組。
//   剛體平移 / 繞極點旋轉 → 每個 tile 都有明顯非零最佳位移,而且方向彼此一致
//   每顆星各自游移        → 最佳位移趨近 0,少數殘量的方向也散亂
// 兩個門檻各跑一次:
//   150 = 連星雲、輝光這種軟調背景都算進來(量「整個畫面」有沒有在平移)
//   300 = 只留星點本體(量「星星」有沒有在平移)
// 指標:
//   meanMag     各 tile 最佳位移量的平均(整塊移動時明顯 > 1)
//   coherence   |Σv| / Σ|v| —— 剛體 = 1.0,方向隨機 ≈ 1/√N
//   gain        最佳重疊 / 零位移重疊 —— 整塊移動時 > 1.3;原地不動時 ≈ 1.0
const root = document.querySelector('[data-blog-sky]');
const cv = root && root.querySelector('canvas');
if (!cv) return JSON.stringify({ err: 'no canvas' });
// 有 QA 掛勾就把演出排程停掉:量漂移時不能被流星雨之類的演出污染
let hushed = false;
try { if (window.__pqSky && window.__pqSky.hush) { window.__pqSky.hush(); hushed = true; } } catch (e) {}

const gg = cv.getContext('2d');
const CW = cv.width, CH = cv.height;
// 只取天空:上緣避開文案遮罩最濃的地方,下緣避開地面剪影與望遠鏡
const X0 = Math.round(CW * 0.03), X1 = Math.round(CW * 0.97);
const Y0 = Math.round(CH * 0.05), Y1 = Math.round(CH * 0.52);
const RW = X1 - X0, RH = Y1 - Y0;
const THRESHOLDS = [150, 300];

function grab() {
  const d = gg.getImageData(X0, Y0, RW, RH).data;
  const out = THRESHOLDS.map(() => new Uint8Array(RW * RH));
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = d[i] + d[i + 1] + d[i + 2];
    for (let t = 0; t < THRESHOLDS.length; t++) if (v > THRESHOLDS[t]) out[t][p] = 1;
  }
  return out;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await wait(2500);                                     // 讓開場、視差、lens 全部安定
const m0 = grab();
const DT = 10000;                                     // 10 秒:舊版天球在這段時間走 3～13px
await wait(DT);
const m1 = grab();

const R = 14;                                         // 位移搜尋半徑(px)
const COLS = 3, ROWS = 2;

function analyse(a0, a1) {
  const tiles = [];
  for (let ry = 0; ry < ROWS; ry++) {
    for (let rx = 0; rx < COLS; rx++) {
      const tx0 = Math.round(rx * RW / COLS) + R, tx1 = Math.round((rx + 1) * RW / COLS) - R;
      const ty0 = Math.round(ry * RH / ROWS) + R, ty1 = Math.round((ry + 1) * RH / ROWS) - R;
      const pts = [];
      for (let y = ty0; y < ty1; y++) {
        const row = y * RW;
        for (let x = tx0; x < tx1; x++) if (a0[row + x]) pts.push(x, y);
      }
      if (pts.length < 150) { tiles.push({ n: pts.length / 2, skip: true }); continue; }
      let best = 0, bdx = 0, bdy = 0, zero = 0;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          let s = 0;
          for (let i = 0; i < pts.length; i += 2) if (a1[(pts[i + 1] + dy) * RW + pts[i] + dx]) s++;
          if (dx === 0 && dy === 0) zero = s;
          if (s > best) { best = s; bdx = dx; bdy = dy; }
        }
      }
      tiles.push({ n: pts.length / 2, dx: bdx, dy: bdy, gain: +(best / Math.max(1, zero)).toFixed(3) });
    }
  }
  const live = tiles.filter((t) => !t.skip);
  // gain 接近 1 代表「最佳位移根本沒比原地不動好」,那個峰值是雜訊擬合出來的,不是真的位移。
  // 只有明顯贏過原地(≥1.25 倍)的 tile 才算它真的移動了。
  const moved = (t) => t.gain >= 1.25;
  let sx = 0, sy = 0, sm = 0;
  live.forEach((t) => { if (!moved(t)) return; sx += t.dx; sy += t.dy; sm += Math.hypot(t.dx, t.dy); });
  const meanMag = sm / Math.max(1, live.length);
  const coherence = sm > 0.0001 ? Math.hypot(sx, sy) / sm : 0;
  return {
    tiles: live.map((t) => ({ n: t.n, v: [t.dx, t.dy], gain: t.gain, moved: moved(t) })),
    movedTiles: live.filter(moved).length + '/' + live.length,
    meanMag: +meanMag.toFixed(2),
    meanGain: +(live.reduce((a, t) => a + t.gain, 0) / Math.max(1, live.length)).toFixed(3),
    coherence: +coherence.toFixed(3),
    verdict: (meanMag < 1.5 && coherence < 0.6) ? 'PER-STAR (no rigid drift)' : 'RIGID BLOCK MOTION'
  };
}

const res = {};
THRESHOLDS.forEach((t, i) => { res['thresh' + t] = analyse(m0[i], m1[i]); });

return JSON.stringify({ hushed, windowMs: DT, region: RW + 'x' + RH, ...res }, null, 1);
