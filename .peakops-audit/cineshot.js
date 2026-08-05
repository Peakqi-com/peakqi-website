const sp = parseFloat(new URLSearchParams(location.search).get('sp') || '0');
const de = document.scrollingElement || document.documentElement;
window.scrollTo(0, Math.round(sp * (de.scrollHeight - innerHeight)));
await new Promise(r => setTimeout(r, 1600));
for (let i = 0; i < 60; i++) await new Promise(r => requestAnimationFrame(r));
const act = document.querySelector('.pq-cine-phase span.active');
const card = document.querySelector('.pq-cine-card.is-active') || document.querySelector('.pq-cine-vcard.is-on') || document.querySelector('.pq-cine-intro.is-active');
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { y: Math.round(r.y), b: Math.round(r.bottom), h: Math.round(r.height) }; };
return JSON.stringify({ sp, phase: act ? act.textContent.trim() : null, card: R(card), vh: innerHeight, cardClipped: card ? card.getBoundingClientRect().bottom > innerHeight + 2 : null }, null, 1);
