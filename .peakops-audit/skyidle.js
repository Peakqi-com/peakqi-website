// prefers-reduced-motion:靜置時畫布必須一個像素都不變(不跑演出、不做持續動態),
// 但點擊觀測必須完整保留。
const root = document.querySelector('[data-blog-sky]');
const cv = root && root.querySelector('canvas');
if (!cv) return JSON.stringify({ err: 'no canvas' });
const gg = cv.getContext('2d');
const rect = cv.getBoundingClientRect();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const snap = () => gg.getImageData(0, 0, cv.width, cv.height).data;
const diff = (a, b) => {
  let n = 0;
  for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
  return n;
};

await wait(2000);
const a = snap();
await wait(5000);                                    // 靜置 5 秒:一般模式下這段會有大量像素在動
const b = snap();
const idleDiff = diff(a, b);

// 排程 API 在 reduced 下必須拒絕播放
let playRejected = null;
try { playRejected = window.__pqSky ? window.__pqSky.play(1) === false : null; } catch (e) { playRejected = 'throw'; }
await wait(1200);
const c = snap();
const afterPlayDiff = diff(b, c);

// 點擊:必須真的畫出東西來
const o = { clientX: rect.left + rect.width * 0.5, clientY: rect.top + rect.height * 0.25, bubbles: true, pointerId: 3, isPrimary: true };
cv.dispatchEvent(new PointerEvent('pointerdown', o));
cv.dispatchEvent(new PointerEvent('pointerup', o));
await wait(900);
const d = snap();
const clickDiff = diff(c, d);
// 點完再靜置一次:必須重新回到「零變動」
await wait(2500);
const e = snap();
const settleDiff = diff(d, e);

return JSON.stringify({
  mode: window.__pqSky ? window.__pqSky.mode : 'no-hook',
  canvas: cv.width + 'x' + cv.height,
  idleDiffPx: idleDiff,
  afterPlayDiffPx: afterPlayDiff,
  playRejected,
  clickDiffPx: clickDiff,
  clickWorks: clickDiff > 200,
  settleAfterClickDiffPx: settleDiff,
  pass: idleDiff === 0 && afterPlayDiff === 0 && clickDiff > 200 && settleDiff === 0
}, null, 1);
