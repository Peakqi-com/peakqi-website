// 開發期案例素材驗證:published case 缺 cover/gallery/alt/尺寸 → 回報清單
export function validateCases({ FEATURED_MEDIA, WORKS_MEDIA }) {
  const missing = [];
  const chkImg = (o, path) => {
    if (!o) return missing.push(path + ':missing');
    if (!o.src) missing.push(path + '.src');
    if (!o.w || !o.h) missing.push(path + '.dims');
  };
  const chk = (c, kind) => {
    const p = kind + ':' + (c.slug || '?');
    if (!c.slug) missing.push(p + '.slug');
    chkImg(c.cover, p + '.cover');
    if (c.cover && !c.cover.alt) missing.push(p + '.alt');
    chkImg(c.thumbnail, p + '.thumbnail');
    if (!c.gallery || !c.gallery.length) missing.push(p + '.gallery');
    else c.gallery.forEach((g, i) => { chkImg(g, p + '.gallery[' + i + ']'); if (!g.alt) missing.push(p + '.gallery[' + i + '].alt'); });
    if (kind === 'featured' && (c.gallery || []).length < 3) missing.push(p + '.gallery<3');
    if (!c.sourcePage) missing.push(p + '.sourcePage');
  };
  (FEATURED_MEDIA || []).forEach(c => chk(c, 'featured'));
  (WORKS_MEDIA || []).forEach(c => chk(c, 'work'));
  return missing;
}
export function devReport(media) {
  const missing = validateCases(media);
  let debug = false;
  try { debug = new URLSearchParams(window.location.search).get('pqdebug') === '1'; } catch (e) {}
  if (missing.length && debug) {
    console.error('[pq] Missing Case Media Report (' + missing.length + '):', missing);
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:700;background:#D14E12;color:#fff;padding:10px 14px;border-radius:4px;font:700 12px sans-serif;max-width:70vw';
    b.textContent = '案例素材缺漏 ' + missing.length + ' 項(開發提示):' + missing.slice(0, 5).join('、') + (missing.length > 5 ? '…' : '');
    document.body.appendChild(b);
  }
  return missing;
}
