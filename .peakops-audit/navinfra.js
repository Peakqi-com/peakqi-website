const out = [];
for (let round = 0; round < 6; round++) {
  const b = document.querySelector('#pq-burger');
  b.click(); await new Promise(r => setTimeout(r, 260));
  for (let i = 0; i < 12; i++) await new Promise(r => requestAnimationFrame(r));
  const seam = document.querySelector('.pqm-seam');
  out.push(seam ? (seam.className || '').toString() : 'NO-SEAM');
  const close = document.querySelector('[role="dialog"] button[aria-label="關閉選單"]');
  if (close) close.click();
  await new Promise(r => setTimeout(r, 200));
}
document.querySelector('#pq-burger').click();
await new Promise(r => setTimeout(r, 500));
for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
const dlg = document.querySelector('[role="dialog"]');
const rows = Array.from(dlg.querySelectorAll('.pqm-row')).map(el => ({
  cls: (el.className || '').toString(),
  tag: el.tagName,
  chars: Array.from(el.querySelectorAll('.pqm-ch')).map(c => c.textContent),
  chDisplay: el.querySelector('.pqm-ch') ? getComputedStyle(el.querySelector('.pqm-ch')).display : null
}));
const de = document.scrollingElement || document.documentElement;
return JSON.stringify({
  vw: innerWidth,
  variantsSeen: out,
  distinct: Array.from(new Set(out)).length,
  rowCount: rows.length,
  rows,
  totalChars: dlg.querySelectorAll('.pqm-ch').length,
  overflowX: de.scrollWidth - de.clientWidth,
  dlgOverflowY: dlg.scrollHeight - dlg.clientHeight
}, null, 1);
