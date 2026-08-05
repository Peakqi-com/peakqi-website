// Pricing hero 收合態:列出舞台欄內各子元素的實際佔位,找出隱形高度
const root = document.querySelector('[data-hero="pricing"]');
const wrap = root.querySelector('[data-hero-wrap]');
const stage = root.querySelector('[data-hero-stage]');
const wTop = wrap.getBoundingClientRect().top + scrollY;
const span = Math.max(1, wrap.offsetHeight - innerHeight);
scrollTo(0, Math.round(wTop + 0.1 * span));
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const col = Array.from(stage.children).find(c => c.tagName === 'DIV');
const info = (el, name) => {
  const r = el.getBoundingClientRect();
  return { name, top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) };
};
const out = { vh: innerHeight, compact: stage.classList.contains('pq-hero-compact'), col: info(col, 'col'), kids: [] };
Array.from(col.children).forEach((k, i) => out.kids.push(info(k, 'k' + i)));
const cz = root.querySelector('[data-hero-canvaszone]');
if (cz) out.cz = info(cz, 'canvaszone');
const ss = root.querySelector('[data-hero-scenestage]');
if (ss) out.ss = info(ss, 'scenestage');
const racks = document.querySelector('#p-hero-racks');
if (racks) out.racks = info(racks, 'racks');
return JSON.stringify(out);
