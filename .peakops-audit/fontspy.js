// 攔截 canvas fillText,記錄一整段捲動過程中「實際畫出來的字級」
const hp0 = 0;
const proto = CanvasRenderingContext2D.prototype;
const origFill = proto.fillText;
const rec = new Map();
proto.fillText = function (txt, x, y) {
  try {
    const m = /(\d+(?:\.\d+)?)px/.exec(this.font || '');
    if (m && txt != null && String(txt).trim()) {
      const px = Math.round(parseFloat(m[1]) * 10) / 10;
      const key = px;
      const e = rec.get(key) || { px, n: 0, sample: String(txt).slice(0, 12) };
      e.n++;
      if (e.sample.length < 2 && String(txt).trim().length > 1) e.sample = String(txt).slice(0, 12);
      rec.set(key, e);
    }
  } catch (e) {}
  return origFill.apply(this, arguments);
};
const wrap = document.querySelector('[data-hero-wrap]');
if (wrap) {
  const vh = window.innerHeight || 1;
  const absTop = wrap.getBoundingClientRect().top + window.scrollY;
  const span = Math.max(1, wrap.offsetHeight - vh);
  for (let i = 0; i <= 20; i++) {
    window.scrollTo(0, Math.round(absTop + (i / 20) * span));
    await new Promise(r => setTimeout(r, 70));
    for (let f = 0; f < 6; f++) await new Promise(r => requestAnimationFrame(r));
  }
}
proto.fillText = origFill;
const list = Array.from(rec.values()).sort((a, b) => a.px - b.px);
const total = list.reduce((n, e) => n + e.n, 0);
const under = (t) => list.filter(e => e.px < t).reduce((n, e) => n + e.n, 0);
return JSON.stringify({
  url: location.pathname, vw: innerWidth, vh: innerHeight,
  distinctSizes: list.length,
  totalDraws: total,
  minPx: list.length ? list[0].px : null,
  maxPx: list.length ? list[list.length - 1].px : null,
  under10: under(10), under11: under(11), under12: under(12),
  smallest: list.slice(0, 8).map(e => ({ px: e.px, n: e.n, t: e.sample }))
}, null, 1);
