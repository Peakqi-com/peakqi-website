// 三段演出的驗收:每段都要有「起 → 中 → 收」,收完回到基準狀態不留殘留;
// 演出期間點擊必須照樣有效,而且演出要優雅退場(不是硬切)。
//
// 量法:
//   1) 先 hush() 停掉自動排程,再 play(i) 指定播放,避免等 20~30 秒的隨機間隔
//   2) 整段每 700ms 取一次畫布統計(亮點數、橘色像素數)與模組狀態
//   3) 起 = 早期樣本接近基準;中 = 中段明顯高於基準;收 = 末段回到基準
//   4) 結束後 state().show 必須是 null、rain 必須是 0
const root = document.querySelector('[data-blog-sky]');
const cv = root && root.querySelector('canvas');
if (!cv || !window.__pqSky) return JSON.stringify({ err: 'no canvas / no __pqSky hook' });
const gg = cv.getContext('2d');
const rect = cv.getBoundingClientRect();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 只統計天空那一段:地面與望遠鏡是靜態的,算進去只會稀釋訊號
const SH = Math.round(cv.height * 0.7);
function stats() {
  const d = gg.getImageData(0, 0, cv.width, SH).data;
  let bright = 0, orange = 0, lum = 0;
  for (let i = 0; i < d.length; i += 16) {
    const R = d[i], G = d[i + 1], B = d[i + 2];
    lum += R + G + B;
    if (R + G + B > 300) bright++;
    if (R > 150 && G > 55 && G < 165 && B < 110) orange++;
  }
  return { bright, orange, lum: Math.round(lum / 1000) };
}
const tap = (x, y) => {
  const o = { clientX: rect.left + x, clientY: rect.top + y, bubbles: true, pointerId: 7, isPrimary: true };
  cv.dispatchEvent(new PointerEvent('pointerdown', o));
  cv.dispatchEvent(new PointerEvent('pointerup', o));
};

window.__pqSky.hush();
await wait(1200);
// 基準:連取五次取中位數,壓掉閃爍造成的抖動
const base = [];
for (let i = 0; i < 5; i++) { base.push(stats()); await wait(220); }
const med = (arr, key) => arr.map((s) => s[key]).sort((a, b) => a - b)[arr.length >> 1];
const B = { bright: med(base, 'bright'), orange: med(base, 'orange'), lum: med(base, 'lum') };

const NAMES = ['rain', 'orion', 'peak'];
const out = { base: B, shows: [] };

for (let i = 0; i < 3; i++) {
  window.__pqSky.hush();
  await wait(400);
  const t0 = performance.now();
  window.__pqSky.play(i);
  const series = [];
  for (let n = 0; n < 22; n++) {                    // 22 × 700ms ≈ 15.4 秒,剛好蓋滿一段
    await wait(700);
    const st = window.__pqSky.state();
    const s = stats();
    series.push({
      t: Math.round(performance.now() - t0),
      k: st.show ? st.show.k : null,
      dB: s.bright - B.bright,
      dO: s.orange - B.orange,
      rain: st.rain
    });
  }
  await wait(1400);
  const endSt = window.__pqSky.state();
  const endS = stats();
  const mid = series.filter((s) => s.k !== null && s.k > 0.3 && s.k < 0.7);
  const head = series.filter((s) => s.k !== null && s.k < 0.12);
  const peakB = Math.max(...series.map((s) => s.dB));
  const peakO = Math.max(...series.map((s) => s.dO));
  out.shows.push({
    name: NAMES[i],
    frames: series.length,
    kSeen: [series.find((s) => s.k !== null) ? series.find((s) => s.k !== null).k : null,
      Math.max(...series.map((s) => s.k === null ? 0 : s.k))],
    headMeanDB: head.length ? Math.round(head.reduce((a, s) => a + s.dB, 0) / head.length) : null,
    midMeanDB: mid.length ? Math.round(mid.reduce((a, s) => a + s.dB, 0) / mid.length) : null,
    peakDB: peakB, peakDO: peakO,
    maxRain: Math.max(...series.map((s) => s.rain)),
    endShowNull: endSt.show === null,
    endRain: endSt.rain,
    endDB: endS.bright - B.bright,
    endDO: endS.orange - B.orange,
    series: series.map((s) => [s.t, s.k, s.dB, s.dO, s.rain])
  });
}

// 演出期間的互動:播到一半點一下 → 演出要進入退場(out=true),而且點擊本身必須生效
window.__pqSky.hush();
await wait(400);
window.__pqSky.play(0);
await wait(4500);
const before = window.__pqSky.state();
tap(rect.width * 0.55, rect.height * 0.28);
await wait(260);
const during = window.__pqSky.state();
await wait(1600);
const after = window.__pqSky.state();
window.__pqSky.hush();
await wait(500);
const rest = window.__pqSky.state();

return JSON.stringify({
  ...out,
  interrupt: {
    showRunningBeforeTap: !!before.show,
    picksBefore: before.picks,
    picksAfterTap: during.picks,
    clickTookEffect: during.picks > before.picks,
    showEnteredExit: !!(during.show && during.show.out),
    fadeAlphaAtTap: during.show ? during.show.a : null,
    showGoneAfterFade: after.show === null,
    residual: { rain: rest.rain, show: rest.show }
  }
}, null, 1);
