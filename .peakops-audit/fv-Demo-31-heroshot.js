// Demo hero 四景動畫截圖:?f=0..1 跳到 hero 進度,回報畫布層狀態與場景索引
const q = new URLSearchParams(location.search);
const root = document.querySelector('[data-hero="demo"]');
if (!root) return JSON.stringify({ fatal: 'no hero root' });
const wrap = root.querySelector('[data-hero-wrap]');
const y = wrap.getBoundingClientRect().top + scrollY + parseFloat(q.get('f') || '0') * (wrap.offsetHeight - innerHeight);
scrollTo(0, Math.max(0, Math.round(y)));
await new Promise(r => setTimeout(r, 1100));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const cv = root.querySelector('[data-hero-canvas]');
return JSON.stringify({
  f: q.get('f'), sceneIdx: window.__pqCur, hero: window.__pqHero,
  canvasOpacity: cv ? getComputedStyle(cv).opacity : null,
  heroStatic: root.getAttribute('data-hero-static') || null,
  scrollW: document.documentElement.scrollWidth, innerW: innerWidth
}, null, 1);
