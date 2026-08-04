scrollTo(0, Math.round(document.body.scrollHeight * 0.35));
await new Promise(r => setTimeout(r, 1400));
const a = document.querySelector('a[data-cta]');
if (!a) return JSON.stringify({ found: false });
const r = a.getBoundingClientRect();
return JSON.stringify({
  found: true, href: a.getAttribute('href'), target: a.getAttribute('target'),
  rel: a.getAttribute('rel'), label: a.textContent.replace(/\s+/g, ' ').trim(),
  aria: a.getAttribute('aria-label'),
  box: { w: Math.round(r.width), h: Math.round(r.height), right: Math.round(innerWidth - r.right) },
  fitsViewport: r.left >= 0 && r.right <= innerWidth
});
