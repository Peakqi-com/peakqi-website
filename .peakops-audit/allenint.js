// Allen 舞台整合驗收:載入指定幕(?allenact=N)→ 確認幕已掛、三點切換、點另一幕能切
const stage = document.querySelector('[data-allen-stage]');
if (!stage) return JSON.stringify({ err: 'no stage' });
stage.scrollIntoView({ block: 'center' });
await new Promise((r) => setTimeout(r, 2200));
const dots = Array.from(stage.querySelectorAll('button[aria-label^="第"]'));
const svgN = stage.querySelectorAll('svg').length;
const kids = stage.children.length;
// 目前亮的是哪顆
const onIdx = dots.findIndex((b) => b.style.background.indexOf('rgb(255, 107, 44)') >= 0 || b.style.background.indexOf('#FF6B2C') >= 0);
// 切到另一幕
let switched = null;
if (dots.length === 3) {
  const tgt = (onIdx + 1) % 3;
  dots[tgt].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  dots[tgt].click();
  await new Promise((r) => setTimeout(r, 2200));
  const on2 = Array.from(stage.querySelectorAll('button[aria-label^="第"]')).findIndex((b) => b.style.background.indexOf('rgb(255, 107, 44)') >= 0);
  switched = { to: tgt, on: on2, svgN2: stage.querySelectorAll('svg').length };
}
return JSON.stringify({
  vw: innerWidth, dots: dots.length, onIdx, svgN, kids,
  over: document.scrollingElement.scrollWidth - innerWidth,
  switched
});
