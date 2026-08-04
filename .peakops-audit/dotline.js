// 全站「線 + 端點」對齊掃描:找出所有進度線/軌道,量端點是否貼在線的實際端點上
const P = parseFloat(new URLSearchParams(location.search).get('sp') || '0');
window.scrollTo(0, Math.round(P * (document.body.scrollHeight - window.innerHeight)));
await new Promise(r => setTimeout(r, 400));
for (let i = 0; i < 50; i++) await new Promise(r => requestAnimationFrame(r));

const F = (n) => +n.toFixed(1);
const vis = (el) => {
  const r = el.getBoundingClientRect();
  const c = getComputedStyle(el);
  return r.width > 0 && r.height >= 0 && c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05
    && r.bottom > -200 && r.top < innerHeight + 200;
};
const findings = [];

// ── 型態 A:SVG path 進度線 + 同一個 svg 內的 circle
document.querySelectorAll('svg').forEach((svg) => {
  if (!vis(svg)) return;
  const paths = Array.from(svg.querySelectorAll('path')).filter(p => {
    const s = getComputedStyle(p);
    return s.strokeDasharray && s.strokeDasharray !== 'none' && s.stroke !== 'none';
  });
  const circles = Array.from(svg.querySelectorAll('circle'));
  if (!paths.length || !circles.length) return;
  paths.forEach((p) => {
    let L = 0;
    try { L = p.getTotalLength(); } catch (e) { return; }
    if (!L) return;
    const off = parseFloat(getComputedStyle(p).strokeDashoffset) || 0;
    const drawn = Math.max(0, Math.min(L, L - off));
    if (drawn < 1 || drawn > L - 1) return;   // 只看「畫到一半」的線,那才看得出分家
    let head;
    try { head = p.getPointAtLength(drawn); } catch (e) { return; }
    const pr = p.getBoundingClientRect();
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if (!vb || !vb.width) return;
    const sx = pr.width / Math.max(1, vb.width), sy = pr.height / Math.max(1, vb.height);
    // 找離線頭最近的 circle
    let best = null;
    circles.forEach((c) => {
      const cr = c.getBoundingClientRect();
      if (cr.width === 0) return;
      const cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
      const hx = svg.getBoundingClientRect().left + head.x * sx;
      const d = Math.abs(cx - hx);
      if (!best || d < best.d) best = { d: F(d), cx: F(cx), hx: F(hx), r: F(cr.width / 2) };
    });
    if (best) findings.push({ kind: 'svg', page: location.pathname, sel: (svg.id || svg.parentElement && svg.parentElement.getAttribute('data-hero-line')) || 'svg', drawnFrac: F(drawn / L), gapPx: best.d, dotX: best.cx, headX: best.hx });
  });
});

// ── 型態 B:DOM 進度條(有 width 百分比的 bar)+ 絕對定位的圓點
document.querySelectorAll('[data-pa-bar],[data-bar],[data-rfill],[data-mfill],[data-nline],[data-ftrack]').forEach((bar) => {
  if (!vis(bar)) return;
  const track = bar.parentElement;
  if (!track) return;
  const tr = track.getBoundingClientRect(), br = bar.getBoundingClientRect();
  // 找同一個 track 內的圓點
  const dots = Array.from(track.querySelectorAll('i,span,div')).filter(el => {
    if (el === bar) return false;
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return r.width > 3 && r.width < 26 && Math.abs(r.width - r.height) < 3 && parseFloat(c.borderRadius) > 3;
  });
  if (!dots.length) return;
  // bar 的實際「線頭」x
  const headX = br.left + br.width;
  let best = null;
  dots.forEach((el) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const d = Math.abs(cx - headX);
    if (!best || d < best.d) best = { d: F(d), cx: F(cx) };
  });
  if (best) findings.push({ kind: 'dom', page: location.pathname, sel: bar.getAttribute('data-pa-bar') !== null ? 'data-pa-bar' : (bar.dataset ? Object.keys(bar.dataset)[0] : 'bar'), barW: F(br.width), trackW: F(tr.width), gapPx: best.d, dotX: best.cx, headX: F(headX) });
});

return JSON.stringify({
  url: location.pathname, sp: P, vw: innerWidth,
  count: findings.length,
  worst: findings.length ? Math.max.apply(null, findings.map(f => f.gapPx)) : 0,
  findings: findings.slice(0, 24)
}, null, 1);
