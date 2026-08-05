// Demo 手機 hero:量草稿面板是否被裁切
const hp = parseFloat(new URLSearchParams(location.search).get('hp') || '0.95');
const wrap = document.querySelector('[data-hero-wrap]');
if (wrap) {
  const vh = window.innerHeight || 1;
  const absTop = wrap.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, Math.round(absTop + hp * Math.max(1, wrap.offsetHeight - vh)));
  await new Promise(r => setTimeout(r, 900));
  for (let i = 0; i < 50; i++) await new Promise(r => requestAnimationFrame(r));
}
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) }; };
const stage = document.querySelector('[data-hero-stage]');
const media = document.querySelector('[data-hero-media]');
const panel = media && (media.querySelector('div[style*="overflow-y:auto"], div[style*="overflow-y: auto"]') || media.firstElementChild);
const cta = media && Array.from(media.querySelectorAll('a,button')).slice(-1)[0];
const cs = (el, ps) => { if (!el) return null; const c = getComputedStyle(el); const o = {}; ps.forEach(p => o[p] = c[p]); return o; };
// 面板內最後一個文字元素
let lastText = null;
if (panel) {
  const all = Array.from(panel.querySelectorAll('*')).filter(e => (e.textContent || '').trim() && e.children.length === 0);
  lastText = all[all.length - 1];
}
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  stage: R(stage), media: R(media),
  mediaCS: cs(media, ['overflow', 'height', 'maxHeight']),
  panel: R(panel),
  panelCS: cs(panel, ['overflowY', 'height', 'maxHeight']),
  panelScroll: panel ? { scrollH: panel.scrollHeight, clientH: panel.clientHeight, over: panel.scrollHeight - panel.clientHeight } : null,
  lastText: lastText ? { t: lastText.textContent.trim().slice(0, 18), r: R(lastText) } : null,
  ctaInMedia: cta ? { t: (cta.textContent || '').trim().slice(0, 16), r: R(cta) } : null,
  stageBottom: stage ? Math.round(stage.getBoundingClientRect().bottom) : null,
  clipped: panel && stage ? panel.getBoundingClientRect().bottom > stage.getBoundingClientRect().bottom + 2 : null
}, null, 1);
