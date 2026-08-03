// 手機逐屏掃描:文字重疊 / 水平爆版 / 小字 / 觸控目標 / 固定元素遮擋 / 長任務(卡頓訊號)
await new Promise(r => setTimeout(r, 3500));
const doc = document.documentElement;
const vw = innerWidth, vh = innerHeight;
const issues = { overlaps: [], overflow: [], tinyText: [], smallTap: [] };
let longTasks = 0, ltTotal = 0;
try {
  new PerformanceObserver(l => { for (const e of l.getEntries()) { longTasks++; ltTotal += e.duration; } })
    .observe({ entryTypes: ['longtask'] });
} catch (e) {}
const txt = e => ((e.innerText || '').trim().replace(/\s+/g, ' ')).slice(0, 26);
const isFixedish = e => {
  for (let n = e; n && n !== document.body; n = n.parentElement) {
    const p = getComputedStyle(n).position;
    if (p === 'fixed' || p === 'sticky') return true;
  }
  return false;
};
const seen = new Set();
const H = () => Math.max(doc.scrollHeight, document.body.scrollHeight);
const stepper = Math.max(220, Math.floor(vh * 0.8));
let maxOverflow = 0, steps = 0;
for (let y = 0; ; y += stepper) {
  scrollTo(0, y); await new Promise(r => setTimeout(r, 320)); steps++;
  const ofx = doc.scrollWidth - doc.clientWidth;
  if (ofx > 1 && ofx > maxOverflow) { maxOverflow = ofx; issues.overflow.push({ y: Math.round(scrollY), px: ofx }); }
  // 視口內可見的「帶文字」元素(場景舞台刻意堆疊由 opacity 控制,排除)
  const els = [...document.querySelectorAll('body *')].filter(e => {
    if (e.closest('[data-hero-scenestage]')) return false;
    const r = e.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > vh) return false;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.15) return false;
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) return false;
    e._r = r; e._fx = isFixedish(e);
    return true;
  });
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = els[i], b = els[j];
    if (a.contains(b) || b.contains(a) || a._fx || b._fx) continue;
    const ra = a._r, rb = b._r;
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
    const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w <= 4 || h <= 4) continue;
    const inter = w * h, minA = Math.min(ra.width * ra.height, rb.width * rb.height);
    if (inter / minA < 0.28) continue;
    const key = txt(a) + '|' + txt(b);
    if (seen.has(key)) continue; seen.add(key);
    issues.overlaps.push({ y: Math.round(scrollY), a: txt(a), b: txt(b), r: +(inter / minA).toFixed(2) });
  }
  for (const e of els) {
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs && fs < 11.5) {
      const k = 't|' + txt(e);
      if (!seen.has(k)) { seen.add(k); issues.tinyText.push({ y: Math.round(scrollY), t: txt(e), fs: +fs.toFixed(1) }); }
    }
  }
  if (y >= H() - vh) break;
  if (y > 250000) break; // 保險
}
// 觸控目標(全頁,含畫面外)
for (const e of document.querySelectorAll('a[href],button')) {
  const r = e.getBoundingClientRect();
  if (!r.width || !r.height || !(e.innerText || '').trim()) continue;
  if (r.height < 38) {
    const k = 'tap|' + txt(e);
    if (!seen.has(k)) { seen.add(k); issues.smallTap.push({ t: txt(e), w: Math.round(r.width), h: Math.round(r.height) }); }
  }
}
// 固定元素在視口的覆蓋比例(nav + 懸浮 CTA 等)
let fixedCover = 0;
for (const e of document.querySelectorAll('body *')) {
  if (getComputedStyle(e).position !== 'fixed' || !e.offsetWidth) continue;
  const r = e.getBoundingClientRect();
  const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
  const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
  fixedCover += w * h;
}
return JSON.stringify({
  vw, vh, docH: H(), screens: +(H() / vh).toFixed(1), steps,
  maxOverflow, longTasks, ltMs: Math.round(ltTotal),
  fixedCoverPct: +((fixedCover / (vw * vh)) * 100).toFixed(1),
  overlaps: issues.overlaps.slice(0, 40),
  overflow: issues.overflow.slice(0, 8),
  tinyText: issues.tinyText.slice(0, 15),
  smallTap: issues.smallTap.slice(0, 20)
});
