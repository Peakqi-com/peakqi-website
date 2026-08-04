for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.9)) {
  scrollTo(0, y); await new Promise(r => requestAnimationFrame(r));
}
await new Promise(r => setTimeout(r, 500));
const flow = document.querySelector('#flow');
for (let i = 0; i < 8; i++) { scrollTo(0, Math.round(flow.getBoundingClientRect().top + scrollY + parseFloat('__O__'))); await new Promise(r => setTimeout(r, 130)); }
await new Promise(r => setTimeout(r, 1000));

// 1) 全視窗覆蓋層盤點:誰鋪在整個畫面上
const covers = [];
document.querySelectorAll('body *').forEach(el => {
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return;
  if (cs.position !== 'fixed' && cs.position !== 'absolute') return;
  const r = el.getBoundingClientRect();
  if (r.width < innerWidth * 0.7 || r.height < innerHeight * 0.5) return;
  const op = parseFloat(cs.opacity);
  if (op < 0.02) return;
  covers.push({
    tag: el.tagName, cls: (el.className || '').toString().slice(0, 40),
    id: el.id || '', pos: cs.position, z: cs.zIndex, op: +op.toFixed(2),
    filter: cs.filter !== 'none' ? cs.filter.slice(0, 30) : '',
    backdrop: (cs.backdropFilter && cs.backdropFilter !== 'none') ? cs.backdropFilter.slice(0, 30) : '',
    bgImg: cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 46) : '',
    w: Math.round(r.width), h: Math.round(r.height)
  });
});

// 2) 各段左緣:抓每個 section 裡「序號 span」的左緣
const lefts = [];
document.querySelectorAll('section[id]').forEach(sec => {
  const num = sec.querySelector('span[style*="700 14px"][style*="FF6B2C"]');
  if (!num) return;
  lefts.push({ id: sec.id, num: num.textContent.trim(), left: Math.round(num.getBoundingClientRect().left) });
});
return JSON.stringify({ vw: innerWidth, covers, lefts }, null, 1);
