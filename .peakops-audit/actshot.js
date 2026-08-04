// 指定齣別 + 停在指定秒數,讓 run.mjs 截到那一格
const q = new URLSearchParams(location.search);
const V = q.get('v') || '1';
const T = parseFloat(q.get('t') || '2.5');
document.querySelector('#pq-burger').click();
await new Promise(r => setTimeout(r, 700));
const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
dlg.className = 'pqm-stage pqm-v' + V;          // 換 class = 該齣的動畫從 0 重新開始
await new Promise(r => requestAnimationFrame(r));
await new Promise(r => requestAnimationFrame(r));
// 把所有彩蛋動畫暫停在 T 秒
const eggs = document.getAnimations().filter(a => {
  try { const t2 = a.effect && a.effect.target; return t2 && t2.closest && (t2.closest('.pqm-fore') || t2.closest('.pqm-seam') || t2.closest('.pqm-row')); } catch (e) { return false; }
});
eggs.forEach(a => { try { a.pause(); a.currentTime = T * 1000; } catch (e) {} });
await new Promise(r => requestAnimationFrame(r));
await new Promise(r => requestAnimationFrame(r));
const de = document.scrollingElement || document.documentElement;
return JSON.stringify({ v: V, t: T, eggAnims: eggs.length, actors: Array.from(document.querySelectorAll('.pqm-ak')).filter(a => getComputedStyle(a).display !== 'none').length, overflowX: de.scrollWidth - de.clientWidth }, null, 1);
