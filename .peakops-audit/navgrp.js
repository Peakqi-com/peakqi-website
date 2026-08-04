// 手機選單:收合狀態 → 展開產品 → 再量一次
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
const snap = () => {
  const d = document.querySelector('[role="dialog"][aria-modal="true"]');
  if (!d) return { opened: false };
  const btn = Array.from(d.querySelectorAll('nav button'))[0] || null;
  return {
    opened: true,
    scrollH: d.scrollHeight, clientH: d.clientHeight,
    overflowPx: d.scrollHeight - d.clientHeight,
    grpBtn: R(btn),
    grpBtnExpanded: btn ? btn.getAttribute('aria-expanded') : null,
    grpBtnText: btn ? btn.textContent.replace(/\s+/g, ' ').trim() : null,
    subCount: d.querySelectorAll('nav > div > div a').length,
    cta: R(d.querySelector('a[href="/demo"]')),
    mail: R(d.querySelector('a[href^="mailto"]')),
    rows: Array.from(d.querySelectorAll('nav > a, nav > div > button')).map(el => ({
      t: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 18), r: R(el)
    }))
  };
};
const burger = document.querySelector('#pq-burger');
if (burger) { burger.click(); await new Promise(r => setTimeout(r, 700)); }
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const collapsed = snap();
const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
const gbtn = dlg && dlg.querySelector('nav button');
if (gbtn) { gbtn.click(); await new Promise(r => setTimeout(r, 500)); }
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const expanded = snap();
// 留在展開狀態方便看截圖?不,收回來截收合狀態
const gbtn2 = document.querySelector('[role="dialog"] nav button');
if (gbtn2 && new URLSearchParams(location.search).get('keep') !== '1') { gbtn2.click(); await new Promise(r => setTimeout(r, 420)); }
for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
return JSON.stringify({ vw: innerWidth, vh: innerHeight, collapsed, expanded }, null, 1);
