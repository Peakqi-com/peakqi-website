// 打開手機選單並量測:觸控區、是否需要捲動、各項位置
const burger = document.querySelector('#pq-burger');
if (burger) { burger.click(); await new Promise(r => setTimeout(r, 700)); }
for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r));
const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
const items = dlg ? Array.from(dlg.querySelectorAll('nav > *')).map(el => ({
  tag: el.tagName,
  text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 30),
  r: R(el)
})) : [];
const subs = dlg ? Array.from(dlg.querySelectorAll('nav div div a')).map(a => ({
  t: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 20), r: R(a)
})) : [];
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  opened: !!dlg,
  dialog: R(dlg),
  scrollH: dlg ? dlg.scrollHeight : 0,
  clientH: dlg ? dlg.clientHeight : 0,
  overflowPx: dlg ? dlg.scrollHeight - dlg.clientHeight : 0,
  closeBtn: R(dlg && dlg.querySelector('button')),
  items, subs,
  cta: R(dlg && dlg.querySelector('a[href="/demo"]'))
}, null, 1);
