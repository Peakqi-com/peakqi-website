// 由外往內找第一個「內容比自己寬」的容器
const out = [];
const walk = (el, depth) => {
  if (depth > 14) return;
  const over = el.scrollWidth - el.clientWidth;
  if (over > 1) {
    const cs = getComputedStyle(el);
    out.push({
      depth,
      tag: el.tagName + (el.id ? '#' + el.id : '') + (el.className && el.className.toString ? '.' + el.className.toString().split(' ').slice(0,2).join('.').slice(0,26) : ''),
      clientW: el.clientWidth, scrollW: el.scrollWidth, over,
      ov: cs.overflowX, disp: cs.display, pos: cs.position,
      gtc: cs.gridTemplateColumns.slice(0, 40), flex: cs.flexWrap,
      txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24)
    });
  }
  Array.from(el.children).forEach(c => walk(c, depth + 1));
};
walk(document.documentElement, 0);
// 只留最深的幾個(真兇通常在最裡面)
out.sort((a, b) => b.depth - a.depth);
return JSON.stringify({ vw: innerWidth, count: out.length, deepest: out.slice(0, 8) }, null, 1);
