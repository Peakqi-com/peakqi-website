// 說明卡盤點:找出所有「絕對/固定定位的說明卡」,量它們離螢幕邊的距離與內距
await new Promise(r => setTimeout(r, 1200));
const R = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) }; };
const cands = Array.from(document.querySelectorAll('#secHead, .card, #hero, #finale, #labels .lbl, #plate, #panel'));
const out = cands.filter(el => el.offsetWidth > 0).map(el => {
  const c = getComputedStyle(el);
  const r = R(el);
  return {
    sel: (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.toString().split(' ').join('.') : ''),
    rect: r,
    pad: c.padding,
    bg: c.backgroundImage !== 'none' ? 'GRADIENT:' + c.backgroundImage.slice(0, 40) : c.backgroundColor,
    radius: c.borderRadius,
    borderLeft: c.borderLeftWidth + ' ' + c.borderLeftColor,
    display: c.display, opacity: c.opacity,
    // 離螢幕邊的距離
    edge: { left: r.x, top: r.y, right: innerWidth - r.r, bottom: innerHeight - r.b }
  };
});
return JSON.stringify({ vw: innerWidth, vh: innerHeight, count: out.length, cards: out }, null, 1);
