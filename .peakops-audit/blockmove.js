// 「整片星空是不是當成一塊在移動」的量化檢驗(獨立於 Agent 自己寫的探針)
//
// 方法:從畫布抓亮點質心 → 間隔 Δt 再抓一次 → 最近鄰配對 → 得到每顆星的位移向量。
// 指標 R = |Σv| / Σ|v|(圓形統計的合成向量長度):
//   R → 1  所有星往同一方向走 = 整塊平移(使用者不要的)
//   R → 0  方向各自獨立      = 每顆星自己動(使用者要的)
// 純平移的畫面 R 會非常接近 1;隨機方向大約落在 1/√n 附近。
await new Promise((r) => setTimeout(r, 2600));
const cv = document.querySelector('[data-blog-sky] canvas');
if (!cv) return JSON.stringify({ err: 'no canvas' });
const g = cv.getContext('2d');
const W = cv.width, H = cv.height;

// 亮點質心:掃描亮度高於門檻的像素,用簡單的區域合併求中心
function centroids() {
  const d = g.getImageData(0, 0, W, H).data;
  const seen = new Uint8Array(W * H);
  const out = [];
  const TH = 112;                                  // 只取夠亮的星,避開星雲與背景
  const lum = (i) => (d[i] * 0.3 + d[i + 1] * 0.6 + d[i + 2] * 0.1);
  for (let y = 2; y < H - 2; y += 2) {
    for (let x = 2; x < W - 2; x += 2) {
      const p = y * W + x;
      if (seen[p]) continue;
      if (lum(p * 4) < TH) continue;
      // 泛洪合併鄰近亮點,避免一顆星被算成好幾個
      let sx = 0, sy = 0, n = 0;
      const st = [[x, y]];
      seen[p] = 1;
      while (st.length && n < 400) {
        const [cx, cy] = st.pop();
        sx += cx; sy += cy; n++;
        for (let dy = -2; dy <= 2; dy += 2) {
          for (let dx = -2; dx <= 2; dx += 2) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 2 || ny < 2 || nx >= W - 2 || ny >= H - 2) continue;
            const q = ny * W + nx;
            if (seen[q]) continue;
            if (lum(q * 4) < TH) continue;
            seen[q] = 1; st.push([nx, ny]);
          }
        }
      }
      if (n >= 1 && n < 260) out.push([sx / n, sy / n]);
    }
  }
  return out;
}

const DT = 1800;
const ROUNDS = 4;

// 最近鄰配對(半徑內才算同一顆),四輪合併以壓低統計雜訊
const R_MATCH = 26;
const vecs = [];
const first = centroids();
let prev = first;
let lastN = 0;
for (let r0 = 0; r0 < ROUNDS; r0++) {
  await new Promise((r) => setTimeout(r, DT));
  const cur = centroids();
  for (const a of prev) {
    let best = null, bd = R_MATCH;
    for (const b of cur) {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const dd = Math.hypot(dx, dy);
      if (dd < bd) { bd = dd; best = [dx, dy]; }
    }
    if (best && bd > 0.35) vecs.push(best);
  }
  lastN = cur.length;
  prev = cur;
}

let sx = 0, sy = 0, sm = 0;
for (const [dx, dy] of vecs) { sx += dx; sy += dy; sm += Math.hypot(dx, dy); }
const R = sm > 0 ? Math.hypot(sx, sy) / sm : 0;

// 靜置時畫面是不是還活著:兩幀之間有多少像素改變
function frameBytes() { return g.getImageData(0, 0, W, H).data; }
const f1 = frameBytes();
await new Promise((r) => setTimeout(r, 700));
const f2 = frameBytes();
let moved = 0;
for (let i = 0; i < f1.length; i += 64) if (Math.abs(f1[i] - f2[i]) > 10) moved++;

return JSON.stringify({
  取樣星數: [first.length, lastN],
  配對數: vecs.length,
  平均位移px: vecs.length ? +(sm / vecs.length).toFixed(2) : 0,
  方向一致度R: +R.toFixed(3),
  判定: R < 0.35 ? '各自獨立(合格)' : R < 0.6 ? '偏向一致(可疑)' : '整塊移動(不合格)',
  隨機基準約: vecs.length ? +(1 / Math.sqrt(vecs.length)).toFixed(3) : null,
  靜置時變動取樣點: moved,
  畫面仍在動: moved > 0
});
