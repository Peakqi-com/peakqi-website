// 幀成本(交錯版):同一次載入裡「星空在畫面上 / 捲出畫面」交替各量三輪,
// 取兩組的中位數相減。單獨量會被機器負載與暖機順序帶著跑(實測底線會在 1.3~5.9ms 之間飄),
// 交錯之後這些飄移對兩組的影響一樣,相減就抵消掉了。
// 量的是「我的 rAF callback 開始執行的時刻 − 該幀時間戳」= 這一幀裡先註冊的動畫已經花掉的時間;
// motion-kit 的共用迴圈註冊在最前面,所以差值就是星空自己的成本。
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
const med = (a) => q(a, 0.5);
const de = document.scrollingElement;
try { if (window.__pqSky) window.__pqSky.hush(); } catch (e) {}

const ON = [], OFF = [];
for (let r = 0; r < 3; r++) {
  window.scrollTo(0, 0);
  await wait(900);
  try { if (window.__pqSky) window.__pqSky.hush(); } catch (e) {}
  ON.push(await sample(150));
  window.scrollTo(0, Math.round(de.scrollHeight * 0.92));
  await wait(900);
  OFF.push(await sample(150));
}
window.scrollTo(0, 0);
const on = [].concat(...ON), off = [].concat(...OFF);
return JSON.stringify({
  viewport: innerWidth + 'x' + innerHeight,
  hook: window.__pqSky ? window.__pqSky.mode : 'none',
  onRounds: ON.map(med), offRounds: OFF.map(med),
  on: { p50: med(on), p95: q(on, 0.95) },
  off: { p50: med(off), p95: q(off, 0.95) },
  skyCost_p50: +(med(on) - med(off)).toFixed(2),
  skyCost_p95: +(q(on, 0.95) - q(off, 0.95)).toFixed(2),
  overflow: de.scrollWidth - innerWidth
}, null, 1);
