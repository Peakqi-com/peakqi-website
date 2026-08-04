const hero = document.getElementById('hero');
const fl = document.querySelector('[data-slogan-flash]');
if (!fl) return JSON.stringify({ fatal: 'no [data-slogan-flash] in DOM' });
const inHero = !!(hero && hero.contains(fl));
// 捲到 slogan 段(hero 最後),取樣 --k 與實際 opacity
const track = hero ? hero.offsetHeight - innerHeight : 0;
const base = hero ? Math.round(hero.getBoundingClientRect().top + scrollY) : 0;
const samples = [];
for (const F of [0.9, 0.95, 0.985, 1.0]) {
  const target = base + Math.round(track * F);
  let y = scrollY;
  while (Math.abs(y - target) > 6) { y += Math.sign(target - y) * Math.min(400, Math.abs(target - y)); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
  scrollTo(0, target);
  await new Promise(r => setTimeout(r, 700));
  const cs = getComputedStyle(fl);
  // 動畫是 4.4s 循環,取一段時間內的最大 opacity
  let peak = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < 4700) {
    peak = Math.max(peak, parseFloat(getComputedStyle(fl).opacity) || 0);
    await new Promise(r => requestAnimationFrame(r));
  }
  const r = fl.getBoundingClientRect();
  samples.push({ F, k: fl.style.getPropertyValue('--k') || '(unset)', peakOpacity: +peak.toFixed(3),
    display: cs.display, anim: cs.animationName, blend: cs.mixBlendMode, z: cs.zIndex,
    box: { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) } });
}
scrollTo(0, 0);
return JSON.stringify({ inHero, heroFound: !!hero, samples }, null, 1);
