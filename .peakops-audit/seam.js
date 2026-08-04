// 縫縫獸彩蛋驗收:不擋點擊、不爆版、動畫真的在跑、reduced-motion 全關
const burger = document.querySelector('#pq-burger');
if (burger) { burger.click(); await new Promise(r => setTimeout(r, 900)); }
for (let i = 0; i < 60; i++) await new Promise(r => requestAnimationFrame(r));
const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
const seam = document.querySelector('.pqm-seam');
const nks = Array.from(document.querySelectorAll('.pqm-nk'));
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
// 每隻小獸的中心點做 elementFromPoint:必須命中底下的連結/按鈕或 dialog,不可以命中 .pqm-*
const hits = nks.map((el, i) => {
  const r = el.getBoundingClientRect();
  const cx = Math.max(1, Math.min(innerWidth - 1, Math.round(r.x + r.width / 2)));
  const cy = Math.max(1, Math.min(innerHeight - 1, Math.round(r.y + r.height / 2)));
  const t = document.elementFromPoint(cx, cy);
  return {
    i, cls: (el.className || '').toString().replace('pqm-nk ', ''),
    box: R(el),
    at: [cx, cy],
    hitTag: t ? t.tagName : null,
    hitCls: t ? (t.className || '').toString().slice(0, 26) : null,
    blocked: !!(t && (t.className || '').toString().indexOf('pqm-') === 0)
  };
});
const anims = document.getAnimations ? document.getAnimations().map(a => a.animationName || 'css').filter(Boolean) : [];
const seamAnims = document.getAnimations ? document.getAnimations()
  .filter(a => { try { return a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.pqm-seam'); } catch (e) { return false; } })
  .map(a => ({ n: a.animationName, s: a.playState })) : [];
const de = document.scrollingElement || document.documentElement;
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  seamPresent: !!seam,
  seamCS: seam ? (() => { const c = getComputedStyle(seam); return { position: c.position, zIndex: c.zIndex, pointerEvents: c.pointerEvents, overflow: c.overflow, display: c.display }; })() : null,
  monsterCount: nks.length,
  // 爆版檢查:dialog 與文件都不可以有水平捲軸
  dlgScrollW: dlg ? dlg.scrollWidth : 0, dlgClientW: dlg ? dlg.clientWidth : 0,
  docScrollW: de.scrollWidth, docClientW: de.clientWidth,
  dlgScrollH: dlg ? dlg.scrollHeight : 0, dlgClientH: dlg ? dlg.clientHeight : 0,
  hits,
  blockedCount: hits.filter(h => h.blocked).length,
  seamAnimNames: seamAnims,
  seamAnimRunning: seamAnims.filter(a => a.s === 'running').length,
  totalAnims: anims.length,
  // 焦點序列不可改變
  focusables: dlg ? Array.from(dlg.querySelectorAll('a[href],button')).map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 12)) : []
}, null, 1);
