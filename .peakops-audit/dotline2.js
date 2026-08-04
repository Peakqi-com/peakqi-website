// 全站「圓點 vs 線頭」對齊掃描(對準站上實際屬性)
const P = parseFloat(new URLSearchParams(location.search).get('sp') || '0');
window.scrollTo(0, Math.round(P * (document.body.scrollHeight - window.innerHeight)));
await new Promise(r => setTimeout(r, 420));
for (let i = 0; i < 55; i++) await new Promise(r => requestAnimationFrame(r));
const F = (n) => +n.toFixed(1);
const seen = (el) => {
  const r = el.getBoundingClientRect(), c = getComputedStyle(el);
  return r.width > 0 && c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05
    && r.bottom > 0 && r.top < innerHeight;
};
const out = [];

// A) #p-usage:兩條 scaleX 線 + [data-pdotm]
const usage = document.querySelector('#p-usage');
if (usage) {
  const pairs = [['in', 0], ['use', 1]];
  const dots = Array.from(usage.querySelectorAll('[data-pdotm]'));
  pairs.forEach(([nm, idx]) => {
    const bar = usage.querySelector('[data-pipe="' + nm + '"]');
    const dot = dots[idx];
    if (!bar || !dot || !seen(bar) || +getComputedStyle(dot).opacity < 0.1) return;
    const br = bar.getBoundingClientRect(), dr = dot.getBoundingClientRect();
    out.push({ where: '#p-usage[' + nm + ']', headX: F(br.right), dotX: F(dr.left + dr.width / 2), gap: F(Math.abs(br.right - (dr.left + dr.width / 2))) });
  });
}

// B) 任何有 [data-dot] 的軌道:點應落在軌道上依序等分的位置,且最後一點要在線尾
document.querySelectorAll('[data-dot]').forEach((d, i, all) => {
  if (!seen(d)) return;
  const track = d.parentElement;
  if (!track) return;
  const tr = track.getBoundingClientRect(), dr = d.getBoundingClientRect();
  const sib = Array.from(track.querySelectorAll('[data-dot]'));
  const n = sib.length, k = sib.indexOf(d);
  if (n < 2) return;
  const want = tr.left + (tr.width - dr.width) * (k / (n - 1)) + dr.width / 2;
  out.push({ where: 'data-dot#' + k + '/' + n, headX: F(want), dotX: F(dr.left + dr.width / 2), gap: F(Math.abs(want - (dr.left + dr.width / 2))) });
});

// C) hero 資料線 + data-hero-dot
document.querySelectorAll('[data-hero-dot]').forEach((dot) => {
  const id = (dot.getAttribute('data-hero-dot') || '').trim();
  const svg = dot.ownerSVGElement;
  if (!svg || !seen(svg)) return;
  const line = svg.querySelector('[data-hero-line="' + id + '"]') || svg.querySelector('[data-hero-line]');
  if (!line) return;
  let L = 0; try { L = line.getTotalLength(); } catch (e) { return; }
  const off = parseFloat(getComputedStyle(line).strokeDashoffset) || 0;
  const drawn = Math.max(0, Math.min(L, L - off));
  let pt; try { pt = line.getPointAtLength(drawn); } catch (e) { return; }
  const vb = svg.viewBox.baseVal, sr = svg.getBoundingClientRect();
  const sx = sr.width / Math.max(1, vb.width);
  const headX = sr.left + (pt.x - vb.x) * sx;
  const dr = dot.getBoundingClientRect();
  out.push({ where: 'hero-dot[' + id + ']', headX: F(headX), dotX: F(dr.left + dr.width / 2), gap: F(Math.abs(headX - (dr.left + dr.width / 2))) });
});

// D) 手機 hero 進度軌 mRail 畫在 canvas 上,DOM 量不到 —— 這裡只記錄有無
return JSON.stringify({
  url: location.pathname, sp: P, vw: innerWidth,
  count: out.length,
  worst: out.length ? Math.max.apply(null, out.map(o => o.gap)) : 0,
  items: out
}, null, 1);
