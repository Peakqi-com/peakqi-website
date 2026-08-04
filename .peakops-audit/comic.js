for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.9)) {
  scrollTo(0, y); await new Promise(r => requestAnimationFrame(r));
}
await new Promise(r => setTimeout(r, 400));
const sec = document.querySelector('#p-timeline');
for (let i = 0; i < 8; i++) { scrollTo(0, Math.round(sec.getBoundingClientRect().top + scrollY - 120)); await new Promise(r => setTimeout(r, 120)); }
await new Promise(r => setTimeout(r, 1200));
const st = document.querySelector('.pq-tl2-step');
const gh = document.querySelector('.pq-tl2-ghost');
const day = document.querySelector('.pq-tl2-step > div');
const anims = el => el ? el.getAnimations({ subtree: true }).map(a => (a.animationName || (a.effect && a.effect.getKeyframes && 'kf')) + ':' + a.playState).slice(0, 6) : [];
// 取兩個時間點的 ghost transform,證明它「持續在動」
const t1 = getComputedStyle(gh).transform;
await new Promise(r => setTimeout(r, 620));
const t2 = getComputedStyle(gh).transform;
await new Promise(r => setTimeout(r, 620));
const t3 = getComputedStyle(gh).transform;
return JSON.stringify({
  stepAnims: anims(st),
  ghostMoving: !(t1 === t2 && t2 === t3),
  samples: [t1, t2, t3].map(v => v.slice(0, 34))
});
