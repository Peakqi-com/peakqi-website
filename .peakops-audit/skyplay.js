// 星空互動驗證:模擬點擊 → 用像素統計證明星座真的畫出來了(不是「看起來有掛上」而已)
const root = document.querySelector('[data-blog-sky]');
const cv = root && root.querySelector('canvas');
if (!cv) return JSON.stringify({ err: 'no canvas' });
const r = cv.getBoundingClientRect();

// 數畫布上的橘色像素(#FF6B2C 系):星座連線、環、漣漪、標籤都是這個色
const gg = cv.getContext('2d');
function orange() {
  const d = gg.getImageData(0, 0, cv.width, cv.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 16) {          // 每 4 像素取樣一次,夠準又不慢
    if (d[i] > 150 && d[i + 1] > 55 && d[i + 1] < 165 && d[i + 2] < 110) n++;
  }
  return n;
}
const settle = (ms) => new Promise((res) => setTimeout(res, ms));
const tap = (x, y) => {
  const o = { clientX: r.left + x, clientY: r.top + y, bubbles: true, pointerId: 1, isPrimary: true };
  cv.dispatchEvent(new PointerEvent('pointerdown', o));
  cv.dispatchEvent(new PointerEvent('pointerup', o));
};

await settle(600);

// 先測捲動誤判:按下後移動 40px 再放開,不該點亮任何東西。
// (必須在點擊測試「之前」做 —— 觀測完成後有 2.6 秒淡出,那段期間像素本來就在變,量不準)
const before2 = orange();
const o1 = { clientX: r.left + r.width * 0.5, clientY: r.top + r.height * 0.3, bubbles: true, pointerId: 2, isPrimary: true };
cv.dispatchEvent(new PointerEvent('pointerdown', o1));
cv.dispatchEvent(new PointerEvent('pointerup', { ...o1, clientY: o1.clientY + 40 }));
await settle(700);
const afterDrag = orange();

const before = orange();
// 在天空區(避開地面與文案)點六下,剛好觸發一次「完成觀測」
const pts = [[0.62, 0.22], [0.70, 0.34], [0.78, 0.24], [0.86, 0.40], [0.72, 0.52], [0.60, 0.42]];
for (const [px, py] of pts) { tap(r.width * px, r.height * py); await settle(220); }
await settle(700);
const after = orange();

return JSON.stringify({
  canvasPx: cv.width + 'x' + cv.height,
  orangeBefore: before,
  orangeAfterTaps: after,
  litUp: after > before * 1.5,
  dragIgnored: Math.abs(afterDrag - before2) < Math.max(40, before2 * 0.12),
  heroH: Math.round(r.height),
  overflow: document.scrollingElement.scrollWidth - innerWidth
});
