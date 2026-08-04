// 逐格走過整段 hero,比對「DOM 文案 kicker 的階段數字」與「畫布進度軌的數字」
const wrap = document.querySelector('[data-hero-wrap]');
if (!wrap) return 'no wrap';
scrollTo(0, 0); await new Promise(r => setTimeout(r, 700));
const base = Math.round(wrap.getBoundingClientRect().top + scrollY);
const track = wrap.offsetHeight - innerHeight;
const bad = [];
const seen = [];
for (let i = 0; i <= 60; i++) {
  const F = i / 60;
  scrollTo(0, base + Math.round(track * F));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 520));   // 等 DOM 文案的淡入淡出過場走完再比對
  // 目前顯示中的場景區塊(opacity 1)
  const vis = Array.from(document.querySelectorAll('[data-hero-scene]'))
    .filter(el => parseFloat(getComputedStyle(el).opacity) > 0.9);
  if (!vis.length) continue;
  const kick = vis[0].querySelector('span');
  const m = kick && kick.textContent.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) continue;
  seen.push(+m[1]);
  if (window.__pqCur != null && +m[1] !== window.__pqCur + 1) {
    bad.push({ F: +F.toFixed(3), copy: +m[1], canvas: window.__pqCur + 1 });
  }
}
scrollTo(0, 0);
return JSON.stringify({ steps: Array.from(new Set(seen)), mismatches: bad.slice(0, 12), total: bad.length });
