// 星空總驗收(獨立於 Agent 自寫的探針,用它留下的 __pqSky 掛勾取精確資料)
//   A. 位移向量方向一致度 R —— 直接讀真實星座標,不靠像素質心
//   B. 三段演出各自跑得完、結束後回到基準
//   C. 演出期間點擊仍然有效
await new Promise((r) => setTimeout(r, 2400));
const S = window.__pqSky;
if (!S) return JSON.stringify({ err: 'no __pqSky hook' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cv = document.querySelector('[data-blog-sky] canvas');
const g = cv.getContext('2d');
const out = { mode: S.mode };

// ── A. 精確位移統計:同一批星,間隔取樣,算方向合成向量 ──
S.hush();                                          // 先停掉演出,避免演出的動態污染量測
await sleep(900);
const P0 = S.pos();
await sleep(2400);
const P1 = S.pos();
let sx = 0, sy = 0, sm = 0, n = 0;
for (let i = 0; i < Math.min(P0.length, P1.length); i++) {
  const dx = P1[i][0] - P0[i][0], dy = P1[i][1] - P0[i][1];
  const m = Math.hypot(dx, dy);
  if (m < 0.05) continue;                          // 完全沒動的不列入方向統計
  sx += dx; sy += dy; sm += m; n++;
}
out.位移 = {
  星數: P0.length, 計入: n,
  平均位移px: n ? +(sm / n).toFixed(2) : 0,
  方向一致度R: sm ? +(Math.hypot(sx, sy) / sm).toFixed(3) : 0,
  隨機基準約: n ? +(1 / Math.sqrt(n)).toFixed(3) : null
};
out.位移.判定 = out.位移.方向一致度R < 0.3 ? '各自獨立(合格)' : out.位移.方向一致度R < 0.6 ? '偏向一致' : '整塊移動(不合格)';

// ── B. 三段演出 ──
function ink() {                                   // 畫面「有多少東西」的粗略指標
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  let s = 0;
  for (let i = 0; i < d.length; i += 400) s += d[i] + d[i + 1] + d[i + 2];
  return Math.round(s / 1000);
}
const base = ink();
out.演出 = [];
for (let i = 0; i < 3; i++) {
  const ok = S.play(i);
  if (!ok) { out.演出.push({ i, skip: 'reduced' }); continue; }
  const marks = [];
  for (const at of [1200, 5200, 9200, 13200]) {
    await sleep(at - (marks.length ? [1200, 5200, 9200, 13200][marks.length - 1] : 0));
    const st = S.state();
    marks.push({ k: st.show ? st.show.k : null, rain: st.rain, ink: ink() });
  }
  await sleep(3400);                               // 等它自己跑完 15 秒
  const after = S.state();
  out.演出.push({
    i, 過程: marks,
    結束後仍在演: !!after.show,
    k有推進: marks.every((m, j) => j === 0 || (m.k != null && marks[j - 1].k != null && m.k > marks[j - 1].k)),
    墨量峰值: Math.max(...marks.map((m) => m.ink)),
    基準墨量: base
  });
  S.hush();
  await sleep(700);
}

// ── C. 演出期間點擊仍有效 ──
S.play(0);
await sleep(1600);
const picksBefore = S.state().picks;
const r = cv.getBoundingClientRect();
const o = { clientX: r.left + r.width * 0.62, clientY: r.top + r.height * 0.3, bubbles: true, pointerId: 9, isPrimary: true };
cv.dispatchEvent(new PointerEvent('pointerdown', o));
cv.dispatchEvent(new PointerEvent('pointerup', o));
await sleep(700);
const stAfter = S.state();
out.演出期間互動 = { 點前: picksBefore, 點後: stAfter.picks, 有效: stAfter.picks > picksBefore, 演出已退場: !stAfter.show || stAfter.show.out };
S.hush();

out.pageOverflow = document.scrollingElement.scrollWidth - innerWidth;
return JSON.stringify(out);
