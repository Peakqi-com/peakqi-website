// 首屏引導檢測:SCROLL 提示可見度 / 右半邊畫布內容量 / 下一段內容是否探頭 / 首屏文字分布
await new Promise(r => setTimeout(r, 3500));
const vw = innerWidth, vh = innerHeight;

// 1. 捲動提示元素(SCROLL / 往下 / ↓ …)與其可見度
const hints = [...document.querySelectorAll('body *')].filter(e => {
  const t = (e.innerText || '').trim();
  if (!t || t.length > 20 || e.children.length > 2) return false;
  if (!/scroll|往下|向下|↓|▼|滑動|捲動/i.test(t)) return false;
  const r = e.getBoundingClientRect();
  return r.top < vh && r.bottom > 0 && r.width > 0 && r.height > 0;
}).map(e => {
  const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
  // 相對 #090B0E 深底估算對比(頁面 hero 皆深底)
  const m = (cs.color.match(/\d+/g) || [0,0,0]).map(Number);
  const lum = c => { c/=255; return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4); };
  const L1 = .2126*lum(m[0]) + .7152*lum(m[1]) + .0722*lum(m[2]);
  const Lbg = .2126*lum(9) + .7152*lum(11) + .0722*lum(14);
  const contrast = +(((Math.max(L1,Lbg)+.05)/(Math.min(L1,Lbg)+.05)) * parseFloat(cs.opacity)).toFixed(1);
  return { t: e.innerText.trim().slice(0,14), fs: cs.fontSize, contrast, yPct: Math.round(r.top/vh*100) };
});

// 2. hero 畫布右半邊「有畫東西」的像素比例(背景 #090B0E 之外)
let inkRight = null, inkLeft = null;
const cv = document.querySelector('[data-hero-canvas]') || document.querySelector('canvas');
if (cv && cv.getContext) {
  try {
    const g = cv.getContext('2d');
    if (g) {
      const w = cv.width, h = cv.height;
      const scan = (x0, x1) => {
        const d = g.getImageData(x0, 0, x1 - x0, h).data;
        let on = 0, tot = 0;
        for (let i = 0; i < d.length; i += 32) { tot++;
          if (Math.abs(d[i]-9) + Math.abs(d[i+1]-11) + Math.abs(d[i+2]-14) > 36) on++; }
        return +(on / tot * 100).toFixed(1);
      };
      inkLeft = scan(0, Math.floor(w/2));
      inkRight = scan(Math.floor(w/2), w);
    } else { inkRight = 'webgl'; }
  } catch (e) { inkRight = 'err:' + String(e).slice(0, 40); }
}

// 3. 首屏內文字元素在左右半邊的面積佔比
let leftPx = 0, rightPx = 0;
for (const e of document.querySelectorAll('body *')) {
  const r = e.getBoundingClientRect();
  if (r.top > vh || r.bottom < 0 || r.width < 8 || r.height < 8) continue;
  const cs = getComputedStyle(e);
  if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.15) continue;
  if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
  const cx = r.left + r.width / 2;
  const area = Math.min(r.width, vw) * Math.min(r.height, vh);
  if (cx < vw / 2) leftPx += area; else rightPx += area;
}
const half = (vw / 2) * vh;

// 4. 往下 1.2 屏內有沒有「下一段內容」探頭(捲一點點就看得到新東西?)
scrollTo(0, Math.floor(vh * 0.9)); await new Promise(r => setTimeout(r, 400));
let peekText = '';
for (const e of document.querySelectorAll('h2,h3,section,[id]')) {
  const r = e.getBoundingClientRect();
  if (r.top > vh * 0.1 && r.top < vh && (e.innerText || '').trim().length > 10) {
    peekText = (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 24); break;
  }
}
scrollTo(0, 0);
return JSON.stringify({
  vw, vh,
  hints,
  canvasInk: { left: inkLeft, right: inkRight },
  textAreaPct: { left: +(leftPx / half * 100).toFixed(0), right: +(rightPx / half * 100).toFixed(0) },
  peekAt90vh: peekText || null
});
