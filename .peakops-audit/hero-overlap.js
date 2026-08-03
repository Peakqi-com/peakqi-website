// 釘住式 hero 專用重疊偵測:不排除 sticky,平滑捲過整段 hero,每一步取視口內
// 可見文字元素做兩兩相交檢查。回報最嚴重的幾個捲動位置。
await new Promise(r => setTimeout(r, 3500));
const vh = innerHeight;
// hero 範圍:第一個 section 的 wrap 高度(釘住跑道)
const sec = document.querySelector('section');
const heroEnd = Math.max(vh * 3, sec ? sec.offsetHeight + (sec.getBoundingClientRect().top + scrollY) : vh * 6);
const txt = e => ((e.innerText || '').trim().replace(/\s+/g, ' ')).slice(0, 22);
const states = [];
const step = Math.max(120, Math.floor(heroEnd / 40));
for (let y = 0; y <= heroEnd; y += step) {
  // 平滑接近(讓引擎 damping 跟上),再settle
  const from = scrollY;
  const d = y - from;
  for (let i = 1; i <= 6; i++) { scrollTo(0, from + d * i / 6); await new Promise(r => requestAnimationFrame(r)); }
  await new Promise(r => setTimeout(r, 260));
  const els = [...document.querySelectorAll('body *')].filter(e => {
    const r = e.getBoundingClientRect();
    if (r.width < 12 || r.height < 10 || r.bottom < 0 || r.top > vh) return false;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.3) return false;
    // 有效不透明度:含祖先(場景層常用父層 opacity 淡出)
    let a = 1, n = e;
    while (n && n !== document.body) { a *= parseFloat(getComputedStyle(n).opacity || 1); n = n.parentElement; }
    if (a < 0.3) return false;
    if (![...e.childNodes].some(nd => nd.nodeType === 3 && nd.textContent.trim().length > 1)) return false;
    e._r = r;
    return true;
  });
  const pairs = [];
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = els[i], b = els[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ra = a._r, rb = b._r;
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
    const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w <= 6 || h <= 6) continue;
    const inter = w * h, minA = Math.min(ra.width * ra.height, rb.width * rb.height);
    if (inter / minA < 0.3) continue;
    pairs.push({ a: txt(a), b: txt(b), r: +(inter / minA).toFixed(2) });
  }
  if (pairs.length) states.push({ y: Math.round(scrollY), n: pairs.length, top: pairs.slice(0, 4) });
}
states.sort((x, z) => z.n - x.n);
return JSON.stringify({ heroEnd: Math.round(heroEnd), worst: states.slice(0, 4), totalStates: states.length });
