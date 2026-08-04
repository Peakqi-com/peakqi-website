// Pricing 桌機:量新版橫向三列在各寬度下的字級與是否溢出繪圖區
const hp = parseFloat(new URLSearchParams(location.search).get('hp') || '0.65');
const wrap = document.querySelector('[data-hero-wrap]');
if (wrap) {
  const vh = window.innerHeight || 1;
  const absTop = wrap.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, Math.round(absTop + hp * Math.max(1, wrap.offsetHeight - vh)));
  await new Promise(r => setTimeout(r, 260));
  for (let i = 0; i < 80; i++) await new Promise(r => requestAnimationFrame(r));
}
const stage = document.querySelector('[data-hero-stage]');
const media = stage && (stage.querySelector('[data-hero-canvaszone]') || stage.querySelector('[data-hero-media]'));
const rectIn = (el) => { let x = 0, y = 0, n = el; while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
const W = stage ? stage.clientWidth : 0, H = stage ? stage.clientHeight : 0;
let zz = media ? rectIn(media) : null;
if (!zz || zz.w < 120 || zz.h < 120) zz = { x: W * .5, y: H * .14, w: W * .46, h: H * .72 };
const pad = 6;
const z = { x: zz.x + pad, y: zz.y + pad, w: Math.max(60, zz.w - pad * 2), h: Math.max(60, zz.h - pad * 2) };
const cl = (v, a, b) => v < a ? a : v > b ? b : v;
const sw = cl(z.w / 560, .72, 1.15);
const padX = cl(z.w * .022, 10, 18);
const rowH = cl(z.h * .205, 66, 88);
const rowGap = cl(z.h * .03, 8, 14);
const rowsTop = z.y + cl(z.h * .012, 3, 8);
const rowsBottom = rowsTop + rowH * 3 + rowGap * 2;
const nameW = cl(z.w * .225, 96, 152);
const priceW = cl(z.w * .205, 92, 140);
const chipsX0 = z.x + padX + nameW + 12;
const chipsW = (z.x + z.w - padX - priceW - 12) - chipsX0;
const step = cl(((z.y + z.h) - rowsBottom) * .32, 30, 42);
const fUse = cl(11.5 * sw, 10.5, 13);
const lastBaseline = rowsBottom + step * 2 + fUse + 5;
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  zone: { x: Math.round(z.x), y: Math.round(z.y), w: Math.round(z.w), h: Math.round(z.h) },
  sw: +sw.toFixed(3),
  fonts: {
    en: +cl(10.5 * sw, 9.5, 12).toFixed(1), zh: +cl(17 * sw, 15, 19).toFixed(1),
    cnt: +cl(11 * sw, 10, 12.5).toFixed(1), mod: +cl(12.5 * sw, 11, 14).toFixed(1),
    price: +cl(14.5 * sw, 13, 17).toFixed(1), mo: +cl(11 * sw, 10, 12.5).toFixed(1),
    use: +fUse.toFixed(1)
  },
  geo: {
    rowH: Math.round(rowH), rowGap: Math.round(rowGap), nameW: Math.round(nameW),
    priceW: Math.round(priceW), chipsW: Math.round(chipsW),
    rowsBottom: Math.round(rowsBottom), zoneBottom: Math.round(z.y + z.h),
    lastBaseline: Math.round(lastBaseline),
    // 最後一行文字底部不可以超出繪圖區
    bottomSlack: Math.round(z.y + z.h - lastBaseline),
    chipsFit: chipsW > 90
  },
  minFont: Math.min(cl(10.5 * sw, 9.5, 12), cl(11 * sw, 10, 12.5), cl(12.5 * sw, 11, 14), fUse),
  consoleClean: true
}, null, 1);
