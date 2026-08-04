for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.9)) {
  scrollTo(0, y); await new Promise(r => requestAnimationFrame(r));
}
await new Promise(r => setTimeout(r, 500));
const sec = document.querySelector('#portfolio');
for (let i = 0; i < 8; i++) { scrollTo(0, Math.round(sec.getBoundingClientRect().top + scrollY - 60)); await new Promise(r => setTimeout(r, 120)); }
await new Promise(r => setTimeout(r, 900));
const cards = Array.from(document.querySelectorAll('#portfolio a[data-tilt]'));
const gallery = cards.map(a => {
  const t = a.querySelector('span[style*="800 17px"]');
  const cat = a.querySelector('span[style*="letter-spacing:.18em"]');
  return { t: t ? t.textContent.trim() : '?', cat: cat ? cat.textContent.trim() : '' };
});
const caseTitles = Array.from(document.querySelectorAll('#cases h3')).map(h => h.textContent.trim());
const dupes = gallery.filter(g => caseTitles.some(c => c.indexOf(g.t) === 0 || g.t.indexOf(c) === 0));
return JSON.stringify({ caseTitles, gallery, dupes, count: gallery.length, docOverflow: document.documentElement.scrollWidth > innerWidth + 1 }, null, 1);
