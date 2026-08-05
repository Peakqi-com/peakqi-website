const b = document.querySelector('#pq-burger'); b.click();
await new Promise(r => setTimeout(r, 600));
for (let i = 0; i < 25; i++) await new Promise(r => requestAnimationFrame(r));
const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
const seam = document.querySelector('.pqm-seam'), fore = document.querySelector('.pqm-fore');
const cs = (el) => { if (!el) return null; const c = getComputedStyle(el); return { pos: c.position, z: c.zIndex, pe: c.pointerEvents, ov: c.overflow, disp: c.display }; };
const de = document.scrollingElement || document.documentElement;
// 每個演員做 elementFromPoint(強制顯示後),確認即使在前景也不吃點擊
const actors = Array.from(document.querySelectorAll('.pqm-ak'));
actors.forEach(a => { a.style.display = 'block'; a.style.left = '40px'; a.style.top = '300px'; });
await new Promise(r => requestAnimationFrame(r));
const hit = document.elementFromPoint(60, 315);
actors.forEach(a => { a.style.display = ''; a.style.left = ''; a.style.top = ''; });
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  dlgCls: (dlg.className || '').toString(),
  seam: cs(seam), fore: cs(fore),
  actorCount: actors.length,
  actorIds: actors.map(a => (a.className || '').toString().replace('pqm-ak ', '')),
  foreOnTopHitTest: hit ? hit.tagName + '.' + (hit.className || '').toString().slice(0, 20) : null,
  chars: dlg.querySelectorAll('.pqm-ch').length,
  rows: dlg.querySelectorAll('.pqm-row').length,
  overflowX: de.scrollWidth - de.clientWidth,
  dlgOverflowY: dlg.scrollHeight - dlg.clientHeight,
  focusables: Array.from(dlg.querySelectorAll('a[href],button')).length
}, null, 1);
