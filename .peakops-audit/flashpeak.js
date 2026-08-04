const hero = document.getElementById('hero');
const fl = document.querySelector('[data-slogan-flash]');
if (!fl || !hero) return 'missing';
const track = hero.offsetHeight - innerHeight;
const base = Math.round(hero.getBoundingClientRect().top + scrollY);
const target = base + Math.round(track * 0.99);
let y = scrollY;
while (Math.abs(y - target) > 6) { y += Math.sign(target - y) * Math.min(500, Math.abs(target - y)); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, target);
await new Promise(r => setTimeout(r, 900));
// 把閃光凍結在第一下的峰值(4.4s 週期的 1.5%),截圖才抓得到
// 直接關掉動畫、把不透明度設在峰值,截圖才抓得到那一幀
fl.style.animation = 'none';
fl.style.opacity = '0.62';
await new Promise(r => setTimeout(r, 260));
const cs = getComputedStyle(fl);
// 檢查是否有比它更上層的東西壓在上面
const r = fl.getBoundingClientRect();
const mid = document.elementFromPoint(Math.round(r.width / 2), Math.round(r.height / 2));
return JSON.stringify({
  k: fl.style.getPropertyValue('--k'), frozenOpacity: cs.opacity, blend: cs.mixBlendMode, z: cs.zIndex,
  topElementAtCentre: mid ? (mid.className || mid.tagName).toString().slice(0, 40) : null
});
