// Pricing hero:量出桌機真實 zone 尺寸(重現 hero-kit computeZone 的計算)
const stage = document.querySelector('[data-hero-stage]');
const media = stage && (stage.querySelector('[data-hero-canvaszone]') || stage.querySelector('[data-hero-media]'));
const cv = document.querySelector('[data-hero-canvas]');
const rectIn = (el) => {
  let x = 0, y = 0, n = el;
  while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
};
const W = stage ? stage.clientWidth : 0, H = stage ? stage.clientHeight : 0;
let z = media ? rectIn(media) : null;
if (!z || z.w < 120 || z.h < 120) z = { x: W * .5, y: H * .14, w: W * .46, h: H * .72 };
const pad = 6;
const zone = { x: z.x + pad, y: z.y + pad, w: Math.max(60, z.w - pad * 2), h: Math.max(60, z.h - pad * 2) };
// paintPricing 內的推導量
const s = Math.max(.5, Math.min(1.15, Math.min(zone.w / 720, zone.h / 520)));
const gap = zone.w * .05, rw = (zone.w - gap * 2) / 3;
const rh = zone.h * .50;
return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  stage: { W, H },
  media: z ? { x: Math.round(z.x), y: Math.round(z.y), w: Math.round(z.w), h: Math.round(z.h) } : null,
  zone: { x: Math.round(zone.x), y: Math.round(zone.y), w: Math.round(zone.w), h: Math.round(zone.h) },
  s: +s.toFixed(3),
  derived: {
    rackW: Math.round(rw), rackH: Math.round(rh), gap: Math.round(gap),
    slotStep: Math.round(Math.max(9, rh * .6 / 4)),
    slotH: Math.round(Math.max(4, Math.max(9, rh * .6 / 4) - 7)),
    fMod: +Math.max(12, 9.5 * s).toFixed(1),
    fZh: +Math.max(15, 11.5 * s).toFixed(1),
    priceBoxTop: Math.round(zone.y + zone.h * .05 + rh + 10),
    priceBoxH: Math.round(Math.max(13.5, 12.5 * s) + Math.max(10, 8.5 * s) + 22),
    modCountY: Math.round(zone.y + zone.h * .05 + rh + 10 + (Math.max(13.5, 12.5 * s) + Math.max(10, 8.5 * s) + 22) + 15),
    zoneBottom: Math.round(zone.y + zone.h),
    usageLine1Y: Math.round(zone.y + zone.h * .82)
  },
  canvas: cv ? { w: cv.offsetWidth, h: cv.offsetHeight } : null
}, null, 1);
