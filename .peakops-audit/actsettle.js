// 戲演完之後:每一個字都必須回到 transform:none / opacity:1 / 原色
const burger = document.querySelector('#pq-burger');
if (!burger) return JSON.stringify({ skip: 'desktop' });
burger.click();
await new Promise(r => setTimeout(r, 600));
const dlg0 = document.querySelector('[role="dialog"][aria-modal="true"]');
const variant = dlg0 ? (dlg0.className || '').toString() : 'NONE';
// 等到 12 秒(所有齣別都宣稱 9 秒內演完)
await new Promise(r => setTimeout(r, 11500));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
const chars = Array.from(dlg.querySelectorAll('.pqm-ch'));
const idxs = Array.from(dlg.querySelectorAll('.pqm-idx'));
const check = (list, kind) => list.map((c) => {
  const cs = getComputedStyle(c);
  const m = new DOMMatrixReadOnly(cs.transform === 'none' ? '' : cs.transform);
  const moved = Math.abs(m.m41) > 0.6 || Math.abs(m.m42) > 0.6 || Math.abs(m.a - 1) > 0.03 || Math.abs(m.d - 1) > 0.03 || Math.abs(m.b) > 0.02;
  return { kind, t: c.textContent, ok: !moved && +cs.opacity > 0.98, op: +cs.opacity, x: +m.m41.toFixed(1), y: +m.m42.toFixed(1), sx: +m.a.toFixed(2), sy: +m.d.toFixed(2), color: cs.color };
}).filter(x => !x.ok);
const badC = check(chars, 'ch'), badI = check(idxs, 'idx');
const de = document.scrollingElement || document.documentElement;
return JSON.stringify({
  vw: innerWidth, vh: innerHeight, variant,
  chars: chars.length, idxs: idxs.length,
  notSettledCount: badC.length + badI.length,
  notSettled: badC.concat(badI).slice(0, 8),
  overflowX: de.scrollWidth - de.clientWidth,
  dlgOverflowX: dlg.scrollWidth - dlg.clientWidth,
  runningAnims: document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : -1
}, null, 1);
