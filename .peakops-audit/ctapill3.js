const de = document.scrollingElement || document.documentElement;
window.scrollTo(0, Math.round(0.6 * (de.scrollHeight - innerHeight)));
await new Promise(r => setTimeout(r, 800));
window.dispatchEvent(new Event('scroll'));
await new Promise(r => setTimeout(r, 800));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const pill = document.querySelector('[data-cta]');
const evs = (window.__pqEvents || []).map(e => e.type);
return JSON.stringify({
  url: location.pathname, scrolled: Math.round(de.scrollTop),
  ratio: +(de.scrollTop / Math.max(1, de.scrollHeight - innerHeight)).toFixed(3),
  pillVisible: !!(pill && pill.offsetWidth),
  events: evs.slice(0, 12),
  stickyView: evs.includes('sticky_demo_view')
}, null, 1);
