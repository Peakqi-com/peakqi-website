// 最嚴苛:把五隻同時推到「最大露出」的相位,再檢查爆版與壓字
const burger = document.querySelector('#pq-burger');
if (burger) { burger.click(); await new Promise(r => setTimeout(r, 800)); }
for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r));
const R = (el) => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) }; };
// 主動畫(母動畫)名稱 → 各自的最大露出時間點(佔週期比例),掃 0~1 找出 boundingRect 最深入畫面的相位
const MAIN = ['pqmSeamHang', 'pqmSeamL', 'pqmSeamR', 'pqmSeamRise', 'pqmSeamBob'];
const nks = Array.from(document.querySelectorAll('.pqm-nk'));
const anims = document.getAnimations().filter(a => MAIN.indexOf(a.animationName) >= 0);
const worst = [];
anims.forEach((a) => {
  const el = a.effect.target;
  const dur = a.effect.getComputedTiming().duration;
  a.pause();
  let best = null;
  for (let s = 0; s <= 200; s++) {
    a.currentTime = dur * (s / 200);
    const r = el.getBoundingClientRect();
    // 「深入畫面」= 左緣越大越深(右側獸看右緣越小越深);用面積在視窗內的部分衡量
    const vx = Math.max(0, Math.min(innerWidth, r.right) - Math.max(0, r.left));
    const vy = Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top));
    const area = vx * vy;
    if (!best || area > best.area) best = { area, t: dur * (s / 200) };
  }
  a.currentTime = best.t;
  worst.push({ name: a.animationName, t: Math.round(best.t), area: Math.round(best.area) });
});
await new Promise(r => requestAnimationFrame(r));
await new Promise(r => requestAnimationFrame(r));
const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
const de = document.scrollingElement || document.documentElement;
// 文字/連結矩形:小獸的可見部分不可以與它們相交
const texts = Array.from(dlg.querySelectorAll('nav a, nav button, a[href="/demo"], a[href^="mailto"], a[href^="tel"], [role="dialog"] > div:first-of-type span')).map(el => ({ t: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 12), r: R(el) }));
const boxes = nks.map(el => ({ cls: (el.className || '').toString().replace('pqm-nk ', ''), r: R(el) }));
const overlaps = [];
boxes.forEach(b => texts.forEach(t => {
  const ox = Math.min(b.r.r, t.r.r) - Math.max(b.r.x, t.r.x);
  const oy = Math.min(b.r.b, t.r.b) - Math.max(b.r.y, t.r.y);
  if (ox > 0 && oy > 0) overlaps.push({ m: b.cls, txt: t.t, ox: +ox.toFixed(1), oy: +oy.toFixed(1) });
}));
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  worst,
  boxes,
  // 露出畫面內的寬度(左右獸)
  exposure: boxes.map(b => ({ cls: b.cls, inLeft: +Math.max(0, b.r.r - 0).toFixed(1), inRight: +Math.max(0, innerWidth - b.r.x).toFixed(1) })),
  docScrollW: de.scrollWidth, docClientW: de.clientWidth,
  dlgScrollW: dlg.scrollWidth, dlgClientW: dlg.clientWidth,
  overflowX: de.scrollWidth - de.clientWidth,
  overlapCount: overlaps.length,
  overlaps: overlaps.slice(0, 12)
}, null, 1);
