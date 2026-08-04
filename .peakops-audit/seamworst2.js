// 最嚴苛(修正版):量「會動的 svg」而非固定 nook;文字清單排除彩蛋自身
const burger = document.querySelector('#pq-burger');
if (burger) { burger.click(); await new Promise(r => setTimeout(r, 800)); }
for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r));
const F = (n) => +n.toFixed(1);
const R = (el) => { const r = el.getBoundingClientRect(); return { x: F(r.x), y: F(r.y), w: F(r.width), h: F(r.height), r: F(r.right), b: F(r.bottom) }; };
const MAIN = ['pqmSeamHang', 'pqmSeamL', 'pqmSeamR', 'pqmSeamRise', 'pqmSeamBob'];
const svgs = Array.from(document.querySelectorAll('.pqm-nk > svg'));
const anims = document.getAnimations().filter(a => MAIN.indexOf(a.animationName) >= 0);
const worst = [];
anims.forEach((a) => {
  const el = a.effect.target;
  const dur = a.effect.getComputedTiming().duration;
  a.pause();
  let best = null;
  for (let s = 0; s <= 240; s++) {
    a.currentTime = dur * (s / 240);
    const r = el.getBoundingClientRect();
    const vx = Math.max(0, Math.min(innerWidth, r.right) - Math.max(0, r.left));
    const vy = Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top));
    const area = vx * vy;
    if (!best || area > best.area) best = { area, t: dur * (s / 240), vx: F(vx), vy: F(vy) };
  }
  a.currentTime = best.t;
  worst.push({ name: a.animationName, tSec: F(best.t / 1000), visW: best.vx, visH: best.vy, area: Math.round(best.area) });
});
await new Promise(r => requestAnimationFrame(r));
await new Promise(r => requestAnimationFrame(r));
const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
const de = document.scrollingElement || document.documentElement;
// 真正的文字/可點元素,排除彩蛋層
const texts = Array.from(dlg.querySelectorAll('nav a, nav button, a[href="/demo"], a[href^="mailto"], a[href^="tel"]'))
  .filter(el => !el.closest('.pqm-seam'))
  .map(el => ({ t: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 14), r: R(el) }));
const boxes = svgs.map(el => ({ cls: (el.parentElement.className || '').toString().replace('pqm-nk ', ''), r: R(el) }));
const overlaps = [];
boxes.forEach(b => texts.forEach(t => {
  const ox = Math.min(b.r.r, t.r.r) - Math.max(b.r.x, t.r.x);
  const oy = Math.min(b.r.b, t.r.b) - Math.max(b.r.y, t.r.y);
  if (ox > 0 && oy > 0) overlaps.push({ m: b.cls, txt: t.t, ox: F(ox), oy: F(oy) });
}));
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  worst, boxes,
  // 每隻在畫面內露出多少
  exposure: boxes.map(b => ({
    cls: b.cls,
    visW: F(Math.max(0, Math.min(innerWidth, b.r.r) - Math.max(0, b.r.x))),
    visH: F(Math.max(0, Math.min(innerHeight, b.r.b) - Math.max(0, b.r.y)))
  })),
  overflowX: de.scrollWidth - de.clientWidth,
  dlgOverflowX: dlg.scrollWidth - dlg.clientWidth,
  dlgOverflowY: dlg.scrollHeight - dlg.clientHeight,
  overlapCount: overlaps.length,
  overlaps: overlaps.slice(0, 10)
}, null, 1);
