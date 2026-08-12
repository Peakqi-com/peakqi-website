// 接案頁(/studio)專用探針:爆版、hero 掛載、橫向軌道釘選、報價架與價格插槽、視差是否真的在動
const de = document.scrollingElement || document.documentElement;
const q = (s) => document.querySelector(s);
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
const stage = q('[data-track-stage]');
const rail = q('#s-track-rail');
const view = q('#s-track-view');
const ghost = q('.s-ghost');
const before = ghost ? ghost.style.transform : '';
await new Promise(r => setTimeout(r, 420));
for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
const after = ghost ? ghost.style.transform : '';

// 釘住的橫向軌道:卡片下緣不可超出舞台(超出 = 被裁)
let dirClip = 0;
if (stage) {
  const sr = stage.getBoundingClientRect();
  document.querySelectorAll('.s-dir').forEach(c => {
    const cr = c.getBoundingClientRect();
    dirClip = Math.max(dirClip, Math.round(cr.bottom - sr.bottom));
  });
}
// hero 舞台內容是否高過舞台(pinned 區塊的垂直裁切)
let heroClip = 0;
const hs = q('[data-hero-stage]');
if (hs) {
  const hr = hs.getBoundingClientRect();
  hs.querySelectorAll('[data-hero-copy],[data-hero-cta]').forEach(el => {
    const r = el.getBoundingClientRect();
    heroClip = Math.max(heroClip, Math.round(r.bottom - hr.bottom));
  });
}
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  overflowX: de.scrollWidth - de.clientWidth,
  pageH: de.scrollHeight,
  hero: window.__pqHero || null,
  heroClip,
  rack: { eng: document.querySelectorAll('.s-engcard').length, slots: document.querySelectorAll('.s-slot-v').length, rows: document.querySelectorAll('.s-row').length, basket: !!q('#s-basket') },
  slotText: Array.from(document.querySelectorAll('.s-slot-v')).map(e => e.textContent.trim()),
  firstRowPrice: (q('.s-rowp') || {}).textContent || null,
  dirs: document.querySelectorAll('.s-dir').length,
  caps: document.querySelectorAll('.s-cap').length,
  works: document.querySelectorAll('.s-work').length,
  steps: document.querySelectorAll('.s-step').length,
  track: { pos: stage ? getComputedStyle(stage).position : null, wrapH: R(q('[data-track-wrap]')), need: rail && view ? rail.scrollWidth - view.clientWidth : null, railX: rail ? rail.style.transform : null },
  dirClip,
  parallaxMoving: before !== after, ghostNow: after
}, null, 1);
