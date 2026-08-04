// 選單彩蛋總驗收:開啟後檢查爆版、擋點擊、文字可讀、動畫在跑、齣別隨機
const R = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
const burger = document.querySelector('#pq-burger');
if (!burger) return JSON.stringify({ skip: 'no burger (desktop)' });
burger.click();
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 70; i++) await new Promise(r => requestAnimationFrame(r));
const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
const de = document.scrollingElement || document.documentElement;
const rows = Array.from(dlg.querySelectorAll('.pqm-row'));
const chars = Array.from(dlg.querySelectorAll('.pqm-ch'));

// 1) 每個可點列的中心點必須命中它自己(彩蛋層不可以吃掉點擊)
const clickable = Array.from(dlg.querySelectorAll('a[href],button'));
const blocked = [];
clickable.forEach((el) => {
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return;
  const cx = Math.max(1, Math.min(innerWidth - 1, Math.round(r.left + r.width / 2)));
  const cy = Math.max(1, Math.min(innerHeight - 1, Math.round(r.top + r.height / 2)));
  const t = document.elementFromPoint(cx, cy);
  if (!(t && (t === el || el.contains(t) || t.contains(el)))) {
    blocked.push({ t: (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 14), hit: t ? (t.className || t.tagName).toString().slice(0, 22) : null });
  }
});
// 2) 每個字的最終可讀性:不可以有字停在 opacity 0 或位移超過 24px
const stuck = [];
chars.forEach((c) => {
  const cs = getComputedStyle(c);
  const m = new DOMMatrixReadOnly(cs.transform === 'none' ? '' : cs.transform);
  if (+cs.opacity < 0.12 || Math.abs(m.m41) > 24 || Math.abs(m.m42) > 24 || m.a < 0.35 || m.d < 0.35) {
    stuck.push({ t: c.textContent, op: +cs.opacity, x: Math.round(m.m41), y: Math.round(m.m42), sx: +m.a.toFixed(2), sy: +m.d.toFixed(2) });
  }
});
const anims = document.getAnimations ? document.getAnimations() : [];
const eggAnims = anims.filter(a => { try { const t = a.effect && a.effect.target; return t && t.closest && (t.closest('.pqm-seam') || t.closest('.pqm-fore') || t.closest('.pqm-row')); } catch (e) { return false; } });
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  variant: (dlg.className || '').toString(),
  overflowX: de.scrollWidth - de.clientWidth,
  dlgOverflowX: dlg.scrollWidth - dlg.clientWidth,
  dlgOverflowY: dlg.scrollHeight - dlg.clientHeight,
  rows: rows.length, chars: chars.length,
  clickables: clickable.length, blockedCount: blocked.length, blocked,
  stuckCharCount: stuck.length, stuck: stuck.slice(0, 6),
  eggAnimCount: eggAnims.length,
  eggRunning: eggAnims.filter(a => a.playState === 'running').length,
  actorsShown: Array.from(document.querySelectorAll('.pqm-ak')).filter(a => getComputedStyle(a).display !== 'none').length
}, null, 1);
