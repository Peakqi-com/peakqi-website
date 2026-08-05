// hero 高度中英比對:copy 欄高、h1 行數、副標行數、舞台內容是否超出被裁
await new Promise((r) => setTimeout(r, 2400));
const root = document.querySelector('[data-hero]');
if (!root) return JSON.stringify({ skip: 'no hero' });
const stage = root.querySelector('[data-hero-stage]');
const copy = root.querySelector('[data-hero-copy]');
const h1 = root.querySelector('h1');
const sub = h1 ? h1.parentElement.querySelector('p') : null;
const lines = (el) => {
  if (!el) return 0;
  const cs = getComputedStyle(el);
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
  return Math.round(el.getBoundingClientRect().height / lh);
};
const sc = stage ? stage.getBoundingClientRect() : null;
// 舞台內最深的子元素底緣 → 是否被 overflow:hidden 裁掉
let deepest = 0;
if (stage) stage.querySelectorAll('*').forEach((el) => {
  const r = el.getBoundingClientRect();
  if (r.height > 4 && r.bottom > deepest) deepest = r.bottom;
});
return JSON.stringify({
  lang: document.documentElement.lang,
  copyH: copy ? Math.round(copy.getBoundingClientRect().height) : 0,
  h1Lines: lines(h1), subLines: lines(sub),
  stageH: sc ? Math.round(sc.height) : 0,
  contentClip: sc ? Math.round(deepest - sc.bottom) : 0
});
