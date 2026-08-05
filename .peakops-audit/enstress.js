// EN 版型壓測:元素級溢出 / 文字裁切 / 標題行數 / 按鈕爆框 / 重疊
await new Promise((r) => setTimeout(r, 2600));
const vis = (el) => {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  let n = el;
  while (n && n !== document.body) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    n = n.parentElement;
  }
  return true;
};
const clip = [], overflow = [], heads = [], btns = [];
document.querySelectorAll('body *').forEach((el) => {
  if (!vis(el)) return;
  const cs = getComputedStyle(el);
  const tag = el.tagName;
  const label = ((el.className || '') + '|' + tag).toString().slice(0, 38);
  // 1) 文字被容器裁切(hidden 且內容超出)
  const ox = el.scrollWidth - el.clientWidth, oy = el.scrollHeight - el.clientHeight;
  const hasText = el.children.length === 0 && (el.textContent || '').trim().length > 1;
  if (hasText) {
    if (cs.overflow !== 'visible' && (ox > 2 || oy > 2)) clip.push({ el: label, ox, oy, t: el.textContent.trim().slice(0, 30) });
    if (cs.overflow === 'visible' && ox > 2) overflow.push({ el: label, ox, t: el.textContent.trim().slice(0, 30) });
  }
  // 2) 標題行數
  if (/^H[1-3]$/.test(tag)) {
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
    const lines = Math.round(el.getBoundingClientRect().height / lh);
    if (lines >= 3) heads.push({ el: label, lines, t: (el.textContent || '').trim().slice(0, 34) });
  }
  // 3) 按鈕/連結文字超出自身盒
  if ((tag === 'A' || tag === 'BUTTON') && el.scrollWidth > el.clientWidth + 2) {
    btns.push({ el: label, ox: el.scrollWidth - el.clientWidth, t: (el.textContent || '').trim().slice(0, 26) });
  }
});
return JSON.stringify({
  vw: innerWidth,
  pageOver: document.scrollingElement.scrollWidth - innerWidth,
  clipped: clip.slice(0, 8), clipN: clip.length,
  overflowed: overflow.slice(0, 8), overN: overflow.length,
  head3plus: heads.slice(0, 6), headN: heads.length,
  btnOver: btns.slice(0, 6), btnN: btns.length
});
