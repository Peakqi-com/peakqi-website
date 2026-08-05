// 第二幕驗收 probe:捲至舞台 → 等燈泡懸停 → pointerdown 一顆驗證縫線長出 → 連點到全縫完(healed)
const stage = document.querySelector('[data-allen-stage]');
if (!stage) return JSON.stringify({ fatal: 'no stage' });
stage.scrollIntoView({ block: 'center' });
await new Promise(r => setTimeout(r, 400));
const wait = async (fn, ms) => {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    const v = fn();
    if (v) return v;
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
};
const hover = await wait(() => stage.querySelector('[data-bulb][data-state="hover"]'), 10000);
const nBulb = stage.querySelectorAll('[data-bulb]').length;
const nStitchTotal = stage.querySelectorAll('[data-stitch]').length;
const cnt = () => stage.querySelectorAll('[data-stitch][data-on="1"]').length;
const before = cnt();
const modeBefore = stage.dataset.a2mode;
if (hover) hover.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
await new Promise(r => setTimeout(r, 2300));                 // settle ≥1.5s
const afterOne = cnt();
// 連點懸停燈泡直到全縫完(每段縫完燈泡會轉圈再回懸停,可重複派工)
for (let i = 0; i < 20 && stage.dataset.a2mode === 'broken'; i++) {
  const b = stage.querySelector('[data-bulb][data-state="hover"]');
  if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await new Promise(r => setTimeout(r, 900));
}
await new Promise(r => setTimeout(r, 1600));
const svgEl = stage.querySelector('.a2-svg');
const sr = stage.getBoundingClientRect();
return JSON.stringify({
  hoverFound: !!hover, nBulb, nStitchTotal, modeBefore,
  stitchesBefore: before, stitchesAfterOneClick: afterOne, stitchesAfterAll: cnt(),
  modeFinal: stage.dataset.a2mode,
  svgPresent: !!svgEl, dotsKept: stage.querySelectorAll('button[aria-label^="第"]').length,
  stageRect: { w: Math.round(sr.width), h: Math.round(sr.height) }
});
