await new Promise(r => setTimeout(r, 2500));
scrollTo(0, Math.round(document.body.scrollHeight * parseFloat('0.18')));
await new Promise(r => setTimeout(r, 2200));
const h = document.getElementById('secHead');
if (!h) return 'no secHead';
const cs = getComputedStyle(h);
const r = h.getBoundingClientRect();
return JSON.stringify({
  vw: innerWidth,
  bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0, 24),
  border: cs.borderLeftWidth + ' ' + cs.borderLeftColor, radius: cs.borderRadius,
  padding: cs.padding, shadow: cs.boxShadow.slice(0, 28),
  box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
  text: (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)
});
