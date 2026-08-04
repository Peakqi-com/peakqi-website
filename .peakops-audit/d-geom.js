scrollTo(0, 0); await new Promise(r => setTimeout(r, 900));
const stage = document.querySelector('[data-hero-stage]');
const copy = document.querySelector('[data-hero-copy]');
const h1 = copy && copy.querySelector('h1');
const ps = copy ? Array.from(copy.querySelectorAll('p')) : [];
const media = stage && (stage.querySelector('[data-hero-canvaszone]') || stage.querySelector('[data-hero-media]'));
const cv = document.querySelector('[data-hero-canvas]');
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
const CS = (el, props) => { if (!el) return null; const c = getComputedStyle(el); const o = {}; props.forEach(p => o[p] = c[p]); return o; };
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  stage: R(stage), stageCS: CS(stage, ['display', 'gridTemplateColumns', 'alignItems', 'height']),
  copy: R(copy), copyCS: CS(copy, ['display', 'position', 'height', 'maxHeight', 'gap']),
  h1: R(h1), h1CS: CS(h1, ['fontSize', 'lineHeight', 'margin', 'height', 'maxHeight', 'position']),
  ps: ps.slice(0, 3).map(p => ({ r: R(p), cs: CS(p, ['margin', 'position', 'fontSize']), t: p.textContent.slice(0, 14) })),
  media: R(media), canvas: R(cv),
  copyKids: copy ? Array.from(copy.children).map(c => ({ tag: c.tagName, cls: (c.className || '').toString().slice(0, 30), r: R(c) })) : null
}, null, 1);
