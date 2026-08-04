// chevron 提示:尺寸、可見度、動畫是否真的在跑;展開後是否轉 180 度
const burger = document.querySelector('#pq-burger');
if (burger) { burger.click(); await new Promise(r => setTimeout(r, 500)); }
for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
const wrap = document.querySelector('[role="dialog"] .pqm-chev');
const inner = wrap && wrap.firstElementChild;
const anims = (el) => el && el.getAnimations ? el.getAnimations().map(a => ({ n: a.animationName || (a.effect && a.effect.getKeyframes && 'css'), s: a.playState })) : [];
const before = {
  wrapRect: R(wrap), innerRect: R(inner),
  fontSize: inner ? getComputedStyle(inner).fontSize : null,
  color: inner ? getComputedStyle(inner).color : null,
  transform: inner ? getComputedStyle(inner).transform : null,
  wrapAnims: anims(wrap)
};
const btn = document.querySelector('[role="dialog"] nav button');
if (btn) { btn.click(); await new Promise(r => setTimeout(r, 600)); }
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const wrap2 = document.querySelector('[role="dialog"] .pqm-chev');
const inner2 = wrap2 && wrap2.firstElementChild;
const kids = document.querySelector('[role="dialog"] .pqm-kids');
const after = {
  transform: inner2 ? getComputedStyle(inner2).transform : null,
  color: inner2 ? getComputedStyle(inner2).color : null,
  kidsPresent: !!kids,
  kidsAnims: anims(kids),
  kidLinks: document.querySelectorAll('[role="dialog"] .pqm-kids a').length,
  kidTouchMin: Math.min(...Array.from(document.querySelectorAll('[role="dialog"] .pqm-kids a')).map(a => Math.round(a.getBoundingClientRect().height)))
};
return JSON.stringify({ vw: innerWidth, before, after }, null, 1);
