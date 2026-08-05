// 全站最終複查:爆版 / 文字互疊 / 觸控區 / 被遮住的文字
const F = (n) => Math.round(n);
const de = document.scrollingElement || document.documentElement;
// 掃過整頁,取最嚴重的一次
const steps = 7;
let worstOverflow = 0, overlapHits = [], occludedHits = [];
const smallTargets = [];

const rectsOverlap = (a, b) => {
  const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return ox > 3 && oy > 3 ? { ox, oy } : null;
};

for (let s = 0; s <= steps; s++) {
  window.scrollTo(0, Math.round((s / steps) * Math.max(0, de.scrollHeight - innerHeight)));
  await new Promise(r => setTimeout(r, 260));
  for (let i = 0; i < 12; i++) await new Promise(r => requestAnimationFrame(r));
  worstOverflow = Math.max(worstOverflow, de.scrollWidth - de.clientWidth);

  // 文字互疊:同一行(y 帶重疊 > 60%)且水平重疊 > 35% 的兩段可見文字
  const boxes = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const t = n.nodeValue.trim();
    if (t.length < 3) continue;
    const pe = n.parentElement;
    if (!pe) continue;
    const cs = getComputedStyle(pe);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    // 一路往上檢查:opacity 不會繼承(祖先 opacity:0 藏起來的堆疊文字會被誤判成可見,
    // Home 的 hero 有好幾層這種動畫文字,一次誤報 371 組);
    // 固定層(NAV、浮動 CTA)壓在捲動內容上是設計本來就會發生的,也不算互疊。
    let eff = 1, an = pe, fixedAnc = false;
    while (an && an !== document.body) {
      const ac = getComputedStyle(an);
      eff *= +ac.opacity;
      if (ac.position === 'fixed') fixedAnc = true;
      an = an.parentElement;
    }
    if (fixedAnc || eff < 0.3) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    const r = rg.getBoundingClientRect();
    if (r.width < 10 || r.height < 8 || r.bottom < 0 || r.top > innerHeight) continue;
    boxes.push({ t: t.slice(0, 20), r, pe });
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const A = boxes[i], B = boxes[j];
    if (A.pe.contains(B.pe) || B.pe.contains(A.pe)) continue;
    const ov = rectsOverlap(A.r, B.r);
    if (!ov) continue;
    const minH = Math.min(A.r.height, B.r.height), minW = Math.min(A.r.width, B.r.width);
    if (ov.oy > minH * 0.6 && ov.ox > minW * 0.35) {
      // 再用命中測試確認「真的看得到兩段字疊在一起」:取重疊區中心,
      // 若最上層元素不是這兩段文字之一,代表其中一段被別的東西蓋著,不是互疊。
      const mx = Math.max(1, Math.min(innerWidth - 1, (Math.max(A.r.left, B.r.left) + Math.min(A.r.right, B.r.right)) / 2));
      const my = Math.max(1, Math.min(innerHeight - 1, (Math.max(A.r.top, B.r.top) + Math.min(A.r.bottom, B.r.bottom)) / 2));
      const topEl = document.elementFromPoint(mx, my);
      if (topEl && (topEl === A.pe || topEl === B.pe || A.pe.contains(topEl) || B.pe.contains(topEl))) {
        overlapHits.push({ a: A.t, b: B.t, ox: F(ov.ox), oy: F(ov.oy), y: F(A.r.top), step: s });
      }
    }
  }
}
// 觸控區:可點元素高度 < 40px(排除純文字連結中的 inline)
document.querySelectorAll('a[href],button,[role="button"]').forEach((el) => {
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return;
  if (cs.display === 'inline') return;
  if (r.height < 40) smallTargets.push({ t: (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 18), h: F(r.height), w: F(r.width) });
});
// 去重
const uniq = (arr, key) => { const s2 = new Set(), o = []; arr.forEach(x => { const k = key(x); if (!s2.has(k)) { s2.add(k); o.push(x); } }); return o; };
return JSON.stringify({
  url: location.pathname, vw: innerWidth, vh: innerHeight,
  overflowX: worstOverflow,
  overlapCount: uniq(overlapHits, x => x.a + '|' + x.b).length,
  overlaps: uniq(overlapHits, x => x.a + '|' + x.b).slice(0, 6),
  smallTargetCount: uniq(smallTargets, x => x.t + x.h).length,
  smallTargets: uniq(smallTargets, x => x.t + x.h).slice(0, 6)
}, null, 1);
