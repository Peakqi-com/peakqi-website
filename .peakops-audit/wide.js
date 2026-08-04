// 找出把頁面撐寬的元素
const de = document.scrollingElement || document.documentElement;
const docW = de.clientWidth;
const bad = [];
document.querySelectorAll('body *').forEach((el) => {
  const r = el.getBoundingClientRect();
  if (r.width < 1) return;
  const right = r.left + r.width + window.scrollX;
  if (right > docW + 2 || r.left + window.scrollX < -2) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') return;
    // 只留「自己超出、但父層沒超出」的最外層元凶
    const p = el.parentElement;
    if (p) {
      const pr = p.getBoundingClientRect();
      if (pr.left + pr.width + window.scrollX > docW + 2) return;
    }
    bad.push({
      tag: el.tagName + (el.id ? '#' + el.id : '') + (el.className && el.className.toString ? '.' + el.className.toString().split(' ')[0].slice(0, 18) : ''),
      x: Math.round(r.left), w: Math.round(r.width), right: Math.round(right), over: Math.round(right - docW),
      cs: { pos: cs.position, ov: cs.overflowX, minW: cs.minWidth, w: cs.width, ws: cs.whiteSpace, disp: cs.display },
      txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 26)
    });
  }
});
return JSON.stringify({ url: location.pathname, vw: innerWidth, docW, scrollW: de.scrollWidth, overflowX: de.scrollWidth - docW, count: bad.length, bad: bad.slice(0, 8) }, null, 1);
