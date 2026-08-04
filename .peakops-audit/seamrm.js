const burger = document.querySelector('#pq-burger');
if (burger) { burger.click(); await new Promise(r => setTimeout(r, 700)); }
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const seam = document.querySelector('.pqm-seam');
const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
const cs = seam ? getComputedStyle(seam) : null;
const seamAnims = document.getAnimations ? document.getAnimations().filter(a => { try { return a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.pqm-seam'); } catch(e){ return false; } }).length : -1;
const rows = dlg ? Array.from(dlg.querySelectorAll('nav > a, nav > div > button')).map(e => ({ t: e.textContent.replace(/\s+/g,' ').trim().slice(0,10), vis: e.getBoundingClientRect().height > 0 && getComputedStyle(e).opacity !== '0' })) : [];
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  seamPresent: !!seam,
  seamDisplay: cs ? cs.display : null,
  seamAnimCount: seamAnims,
  totalAnims: document.getAnimations ? document.getAnimations().length : -1,
  rowsAllVisible: rows.every(r => r.vis), rows: rows.length,
  ctaVisible: !!(dlg && dlg.querySelector('a[href="/demo"]') && dlg.querySelector('a[href="/demo"]').getBoundingClientRect().height > 0)
}, null, 1);
