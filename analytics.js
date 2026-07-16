// PeakQi Analytics Adapter — 可替換事件介面(不綁平台、無未經同意的追蹤)
// 接入方式:部署時把 sink 換成 gtag/plausible/自家 API;預設只進 window.__pqEvents(記憶體)。
// 開發環境(?pqdebug=1)才輸出 console。
export const EVENTS = [
  'nav_demo_click', 'hero_demo_click', 'hero_case_click',
  'sticky_demo_view', 'sticky_demo_click',
  'case_view', 'case_cta_click',
  'pricing_plan_view', 'pricing_cta_click',
  'demo_form_start', 'demo_form_error', 'demo_form_submit', 'demo_form_success',
  'contact_click'
];
let sink = null; // 部署時:setSink((name, data) => yourAnalytics.track(name, data))
export function setSink(fn) { sink = typeof fn === 'function' ? fn : null; }
export function track(name, data) {
  const e = { type: name, ts: Date.now(), ...(data || {}) };
  (window.__pqEvents = window.__pqEvents || []).push(e);
  if (window.__pqEvents.length > 400) window.__pqEvents.splice(0, 100);
  try { window.dispatchEvent(new CustomEvent('pq:event', { detail: e })); } catch (err) {}
  if (sink) { try { sink(name, e); } catch (err) {} }
  try {
    if (new URLSearchParams(window.location.search).get('pqdebug') === '1') console.info('[pq]', name, e);
  } catch (err) {}
}
export function wireOnceObserver(el, name, data) {
  if (!el || !('IntersectionObserver' in window)) return () => {};
  let fired = false;
  const io = new IntersectionObserver(es => {
    if (!fired && es[0] && es[0].isIntersecting) { fired = true; track(name, data); io.disconnect(); }
  }, { threshold: 0.4 });
  io.observe(el);
  return () => io.disconnect();
}
