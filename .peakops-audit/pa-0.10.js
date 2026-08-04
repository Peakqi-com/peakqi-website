const wrap = document.querySelector('[data-hero-wrap]');
if (!wrap) return 'no wrap';
scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
const base = Math.round(wrap.getBoundingClientRect().top + scrollY);
const track = wrap.offsetHeight - innerHeight;
const F = parseFloat('0.10');
const target = base + Math.round(track * F);
// 真捲動:分段步進,避免跳捲造成的過場假影
let y = scrollY;
while (y < target - 4) { y = Math.min(target, y + 90); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, target);
await new Promise(r => setTimeout(r, 1500));
const cv = document.querySelector('[data-hero-canvas]');
return JSON.stringify({ y: scrollY, target, track, canvasOpacity: cv && cv.style.opacity, hero: window.__pqHero });
