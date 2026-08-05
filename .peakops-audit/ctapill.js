await new Promise(r => setTimeout(r, 1200));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const pill = document.querySelector('[data-cta]');
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
let dismissed = null; try { dismissed = sessionStorage.getItem('pqCtaDismissed'); } catch (e) {}
return JSON.stringify({ url: location.pathname, vw: innerWidth, pill: R(pill), pillVisible: !!(pill && pill.offsetWidth), dismissed }, null, 1);
