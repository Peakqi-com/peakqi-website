// Solutions 桌機:模組區點第 3 列,驗證原版點擊切換仍在(aria-current + 細節卡透明度)
const sec = document.querySelector('#modules');
const rows = Array.from(document.querySelectorAll('#modules [data-smod]'));
const dets = Array.from(document.querySelectorAll('#modules [data-sdet]'));
sec.scrollIntoView();
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
const before = dets.map(d => getComputedStyle(d).opacity);
rows[2].click();
await new Promise(r => setTimeout(r, 600));
const shell = document.querySelector('#pq-sol-detshell');
return JSON.stringify({
  rows: rows.length,
  before,
  after: dets.map(d => getComputedStyle(d).opacity),
  aria: rows.map(r => r.getAttribute('aria-current')),
  shellDisplay: shell ? getComputedStyle(shell).display : 'none',
  listPE: getComputedStyle(rows[0].parentElement).pointerEvents
});
