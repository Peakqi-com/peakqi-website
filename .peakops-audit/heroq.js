// i18n 驗收 probe(PeakOps hero):
//   ?q=0.7 → 以 __pqHero.state() 反推捲動量,捲到 hero 指定進度後回報;
//   ?cv=1 → 改捲到 hero canvas(靜態模式 canvas 移到文字塊後)置中,截圖驗 canvas 中文標籤零迴歸。
const qp = new URLSearchParams(location.search);
for (let i = 0; i < 40 && !window.__pqHero; i++) await new Promise(r => setTimeout(r, 100));
if (!window.__pqHero) return JSON.stringify({ err: 'no __pqHero' });
const st = window.__pqHero.state();
if (qp.get('cv')) {
  const scrim = document.querySelector('[data-scrim]');
  const stage = scrim ? scrim.parentElement : document.body;
  const cv = stage.querySelector('canvas') || document.querySelector('canvas');
  const r = cv.getBoundingClientRect();
  scrollTo(0, Math.max(0, Math.round(r.top + scrollY - (innerHeight - r.height) / 2)));
} else {
  const q = parseFloat(qp.get('q') || '0.7');
  const wrapTop = st.rt + scrollY;
  scrollTo(0, Math.round(wrapTop + q * Math.max(1, st.wrapH - st.vh)));
}
await new Promise(r => setTimeout(r, 300));
for (let i = 0; i < 90; i++) await new Promise(r => requestAnimationFrame(r));
const s2 = window.__pqHero.state();
return JSON.stringify({ p: +s2.p.toFixed(3), sp: +s2.sp.toFixed(3), draws: s2.drawN, static: s2.staticOn, y: Math.round(scrollY) });
