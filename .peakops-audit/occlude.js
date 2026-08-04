// 遮擋偵測:固定/黏著的浮層(進度軌、浮動 CTA、NAV)是否蓋住了頁面上的文字
const P = parseFloat(new URLSearchParams(location.search).get('sp') || '0');
window.scrollTo(0, Math.round(P * (document.body.scrollHeight - window.innerHeight)));
await new Promise(r => setTimeout(r, 700));
for (let i = 0; i < 45; i++) await new Promise(r => requestAnimationFrame(r));
const F = (n) => Math.round(n);
const overlays = [];
document.querySelectorAll('body *').forEach((el) => {
  const c = getComputedStyle(el);
  if (c.position !== 'fixed') return;
  if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < 0.1) return;
  const r = el.getBoundingClientRect();
  if (r.width < 20 || r.height < 8) return;
  if (r.width * r.height > innerWidth * innerHeight * 0.75) return;   // 整頁遮罩不算
  // 只取最外層的固定層
  if (el.parentElement && overlays.some(o => o.el.contains(el))) return;
  overlays.push({ el, r, z: c.zIndex, tag: el.tagName + (el.id ? '#' + el.id : '') });
});
// 頁面上的實際文字節點
const texts = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const t = node.nodeValue.trim();
  if (t.length < 4) continue;
  const pe = node.parentElement;
  if (!pe) continue;
  if (overlays.some(o => o.el.contains(pe))) continue;      // 浮層自己的字不算
  const cs = getComputedStyle(pe);
  if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.25) continue;
  const rg = document.createRange();
  rg.selectNodeContents(node);
  const rr = rg.getBoundingClientRect();
  if (rr.width < 8 || rr.height < 6) continue;
  if (rr.bottom < 0 || rr.top > innerHeight) continue;
  texts.push({ t: t.slice(0, 26), r: rr, fs: cs.fontSize });
}
const hits = [];
overlays.forEach((o) => texts.forEach((x) => {
  const ox = Math.min(o.r.right, x.r.right) - Math.max(o.r.left, x.r.left);
  const oy = Math.min(o.r.bottom, x.r.bottom) - Math.max(o.r.top, x.r.top);
  if (ox > 4 && oy > 4) {
    // 真的被遮住嗎?取文字中心點做命中測試
    const cx = Math.max(1, Math.min(innerWidth - 1, x.r.left + x.r.width / 2));
    const cy = Math.max(1, Math.min(innerHeight - 1, x.r.top + x.r.height / 2));
    const top = document.elementFromPoint(cx, cy);
    const covered = !!(top && o.el.contains(top));
    if (covered) hits.push({ overlay: o.tag, z: o.z, text: x.t, fs: x.fs, ox: F(ox), oy: F(oy), at: [F(cx), F(cy)] });
  }
}));
return JSON.stringify({
  url: location.pathname, sp: P, vw: innerWidth, vh: innerHeight,
  overlays: overlays.map(o => ({ tag: o.tag, z: o.z, r: { x: F(o.r.x), y: F(o.r.y), w: F(o.r.width), h: F(o.r.height) } })),
  textCount: texts.length,
  occludedCount: hits.length,
  occluded: hits.slice(0, 10)
}, null, 1);
