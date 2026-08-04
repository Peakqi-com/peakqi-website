const de = document.scrollingElement || document.documentElement;
const docW = de.clientWidth;
// 找出所有 right 超過 docW 的元素,不做「父層沒超出」的過濾,並依 right 排序
const all = [];
document.querySelectorAll('body *').forEach((el) => {
  const r = el.getBoundingClientRect();
  if (r.width < 1) return;
  const cs = getComputedStyle(el);
  if (cs.position === 'fixed') return;
  const right = r.left + r.width + window.scrollX;
  if (right > docW + 2) all.push({
    tag: el.tagName + (el.id ? '#' + el.id : '') + (el.className && el.className.toString ? '.' + el.className.toString().split(' ').slice(0,2).join('.').slice(0, 24) : ''),
    depth: (() => { let n = 0, p = el; while (p.parentElement) { n++; p = p.parentElement; } return n; })(),
    x: Math.round(r.left), w: Math.round(r.width), right: Math.round(right),
    ov: cs.overflowX, disp: cs.display, ws: cs.whiteSpace, ls: cs.letterSpacing,
    txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30)
  });
});
all.sort((a, b) => b.depth - a.depth);
return JSON.stringify({ docW, scrollW: de.scrollWidth, count: all.length, deepest: all.slice(0, 10) }, null, 1);
