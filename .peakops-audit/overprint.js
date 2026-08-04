// 疊印偵測:掃過整段 hero,記錄「同一幀、同一個 y 帶上」是否有兩段以上文字重疊
const proto = CanvasRenderingContext2D.prototype;
const origFill = proto.fillText;
let frame = [];
const clashes = [];
proto.fillText = function (txt, x, y) {
  try {
    const m = /(\d+(?:\.\d+)?)px/.exec(this.font || '');
    const px = m ? parseFloat(m[1]) : 12;
    const t = String(txt);
    if (t.trim() && t.length > 3 && this.globalAlpha > 0.08) {
      const w = this.measureText(t).width;
      frame.push({ t: t.slice(0, 30), x, y, w, px, a: +this.globalAlpha.toFixed(2) });
    }
  } catch (e) {}
  return origFill.apply(this, arguments);
};
const checkFrame = () => {
  for (let i = 0; i < frame.length; i++) for (let j = i + 1; j < frame.length; j++) {
    const a = frame[i], b = frame[j];
    if (Math.abs(a.y - b.y) > Math.max(a.px, b.px) * 0.7) continue;   // 不同行
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    if (ox > Math.min(a.w, b.w) * 0.35 && a.t !== b.t) {
      clashes.push({ a: a.t, b: b.t, y: Math.round(a.y), overlapPx: Math.round(ox), aA: a.a, bA: b.a });
    }
  }
  frame = [];
};
const wrap = document.querySelector('[data-hero-wrap]');
if (wrap) {
  const vh = window.innerHeight || 1;
  const absTop = wrap.getBoundingClientRect().top + window.scrollY;
  const span = Math.max(1, wrap.offsetHeight - vh);
  for (let i = 0; i <= 40; i++) {
    window.scrollTo(0, Math.round(absTop + (i / 40) * span));
    await new Promise(r => setTimeout(r, 60));
    await new Promise(r => requestAnimationFrame(r));
    frame = [];
    await new Promise(r => requestAnimationFrame(r));   // 這一幀完整記錄
    checkFrame();
  }
}
proto.fillText = origFill;
// 去重
const uniq = [];
const key = (c) => c.a + '|' + c.b + '|' + c.y;
const seen2 = new Set();
clashes.forEach(c => { if (!seen2.has(key(c))) { seen2.add(key(c)); uniq.push(c); } });
return JSON.stringify({
  url: location.pathname, vw: innerWidth,
  clashCount: uniq.length,
  clashes: uniq.slice(0, 12)
}, null, 1);
