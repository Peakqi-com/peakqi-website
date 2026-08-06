// 幀成本:motion-kit 的共用迴圈註冊在最前面,所以「我自己的 rAF callback 開始執行的時刻
// 減掉這一幀的時間戳」= 這一幀裡星空(以及其他先註冊的動畫)已經花掉的時間。
// 再把 hero 捲出視窗(模組直接 return,不繪製)量同一個數字當底線,
// 兩者的差就是星空自己的成本。整頁仍然只有 motion-kit 一個繪製迴圈,這裡只是量測。
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function sample(n) {
  return new Promise((res) => {
    const arr = [];
    const step = (ts) => {
      arr.push(performance.now() - ts);
      if (arr.length < n) requestAnimationFrame(step); else res(arr);
    };
    requestAnimationFrame(step);
  });
}
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2); };
const de = document.scrollingElement;

// 1) hero 在畫面上、演出關掉(量常態成本)
try { if (window.__pqSky) window.__pqSky.hush(); } catch (e) {}
window.scrollTo(0, 0);
await wait(1500);
const on = await sample(200);

// 2) 演出進行中(量最貴的那一段:流星雨同時有多顆流星)
let play = null;
try {
  if (window.__pqSky && window.__pqSky.play(0)) {
    await wait(6500);                                // 走到流星雨密度最高的中段
    play = await sample(160);
  }
} catch (e) {}
try { if (window.__pqSky) window.__pqSky.hush(); } catch (e) {}

// 3) hero 捲出視窗:模組不繪製 → 這是「頁面其他動畫」的底線
window.scrollTo(0, Math.round(de.scrollHeight * 0.92));
await wait(1800);
const off = await sample(200);
window.scrollTo(0, 0);

const r = (a) => ({ p50: q(a, 0.5), p95: q(a, 0.95), max: +Math.max(...a).toFixed(2) });
const O = r(on), F = r(off), P = play ? r(play) : null;
return JSON.stringify({
  viewport: innerWidth + 'x' + innerHeight,
  dpr: window.devicePixelRatio,
  heroVisible: O,
  duringShow: P,
  heroOffscreen_baseline: F,
  skyCost_p50: +(O.p50 - F.p50).toFixed(2),
  skyCost_p95: +(O.p95 - F.p95).toFixed(2),
  skyCostDuringShow_p95: P ? +(P.p95 - F.p95).toFixed(2) : null,
  overflow: de.scrollWidth - innerWidth
}, null, 1);
