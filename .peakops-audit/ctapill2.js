const de = document.scrollingElement || document.documentElement;
window.scrollTo(0, Math.round(0.6 * (de.scrollHeight - innerHeight)));
await new Promise(r => setTimeout(r, 1500));
for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r));
const pill = document.querySelector('[data-cta]');
return JSON.stringify({ url: location.pathname, scrolled: Math.round(de.scrollTop), pillVisible: !!(pill && pill.offsetWidth) }, null, 1);
