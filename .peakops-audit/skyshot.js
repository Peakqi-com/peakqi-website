// 演出定格截圖:用網址 hash 指定要看哪一段、停在哪個進度。
//   http://localhost:8020/blog#show=1&k=0.82     → 播獵戶座,停在 k=0.82 讓 run.mjs 截圖
//   http://localhost:8020/blog#show=-1           → 不播,只看平靜的星空
const root = document.querySelector('[data-blog-sky]');
if (!root) return JSON.stringify({ err: 'no root' });
const h = new URLSearchParams((location.hash || '').replace(/^#/, ''));
const idx = h.has('show') ? +h.get('show') : -1;
const K = h.has('k') ? +h.get('k') : 0.5;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

if (!window.__pqSky) return JSON.stringify({ err: 'no __pqSky hook' });
window.__pqSky.hush();
await wait(1200);
if (idx < 0) return JSON.stringify({ mode: 'idle', state: window.__pqSky.state(), overflow: document.scrollingElement.scrollWidth - innerWidth });

window.__pqSky.play(idx);
// 走到指定進度就停下讓 run.mjs 截圖(15000ms 是一段演出的長度)
await wait(Math.max(60, K * 15000));
const st = window.__pqSky.state();
return JSON.stringify({ show: idx, wantK: K, state: st, overflow: document.scrollingElement.scrollWidth - innerWidth }, null, 1);
