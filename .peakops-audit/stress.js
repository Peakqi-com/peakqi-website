const wrap = document.querySelector('[data-hero-wrap]');
if (!wrap) return 'no wrap';
const base = Math.round(wrap.getBoundingClientRect().top + scrollY);
const track = wrap.offsetHeight - innerHeight;
const cv = document.querySelector('[data-hero-canvas]');
// 粗暴來回:模擬使用者快速上下滑,逼出過場中間態的極端尺寸
const seq = [0, .5, .99, .1, 1, .3, .97, 0, .93, 1, .02, .88, 1];
for (const F of seq) {
  scrollTo(0, base + Math.round(track * F));
  for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r));
}
// 再慢慢走一次尾段
for (let F = 0.8; F <= 1.001; F += 0.01) {
  scrollTo(0, base + Math.round(track * F));
  for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r));
}
await new Promise(r => setTimeout(r, 1200));
return JSON.stringify({ canvasOpacity: cv.style.opacity, at: scrollY, hero: window.__pqHero });
