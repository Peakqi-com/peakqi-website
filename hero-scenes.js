// PeakQi 內頁 Hero — Canvas 產品敘事層(每頁一個主視覺故事,同一品牌系統)
// 繪製規則:編輯感細線、面板、資料線與節點;禁止粒子/發光球/幾何體/快速旋轉。
// painter(g, env):env = { w,h,t,mobile,tier,zone,k(id),gp,C,s,F,d(工具集) }
import { HERO_SHARED } from './hero-config.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const ez = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

let grainTile = null;
function getGrain() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const im = g.createImageData(128, 128);
  for (let i = 0; i < im.data.length; i += 4) {
    const v = 200 + Math.random() * 55;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
    im.data[i + 3] = Math.random() * 255;
  }
  g.putImageData(im, 0, 0);
  grainTile = c;
  return c;
}

// 工具集:綁定 2d context
export function makeDraw(g) {
  const C = HERO_SHARED.colors;
  const d = {
    rr(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    },
    label(txt, x, y, px, color, ls, wt) {
      g.font = (wt || 600) + ' ' + Math.max(9, px) + 'px "Space Grotesk","Noto Sans TC",sans-serif';
      g.fillStyle = color || 'rgba(242,239,232,.55)';
      if (ls) { let cx = x; for (const ch of String(txt)) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + ls; } }
      else g.fillText(txt, x, y);
    },
    han(txt, x, y, px, color, wt) {
      g.font = (wt || 700) + ' ' + Math.max(10, px) + 'px "Noto Sans TC",sans-serif';
      g.fillStyle = color || C.ivory;
      g.fillText(txt, x, y);
    },
    panel(x, y, w, h, a, hot) {
      g.globalAlpha = a;
      d.rr(x, y, w, h, 6);
      g.fillStyle = 'rgba(20,23,28,.88)';
      g.fill();
      g.strokeStyle = hot ? 'rgba(255,107,44,.6)' : 'rgba(242,239,232,.18)';
      g.lineWidth = hot ? 1.4 : 1;
      g.stroke();
      g.globalAlpha = 1;
    },
    head(x, y, w, title, a, color) { // 面板標題列
      g.globalAlpha = a;
      g.strokeStyle = 'rgba(242,239,232,.14)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y + 22); g.lineTo(x + w, y + 22); g.stroke();
      g.fillStyle = color || C.orange;
      g.beginPath(); g.arc(x + 8, y + 11, 2.6, 0, TAU); g.fill();
      d.label(title, x + 18, y + 15, 10, 'rgba(242,239,232,.6)', 1.4);
      g.globalAlpha = 1;
    },
    line(x1, y1, x2, y2, k2, color, w2, dash) { // 進度線
      if (k2 <= 0) return;
      g.save();
      g.strokeStyle = color; g.lineWidth = w2 || 1.2;
      if (dash) g.setLineDash(dash);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(lerp(x1, x2, ez(k2)), lerp(y1, y2, ez(k2))); g.stroke();
      g.restore();
    },
    poly(pts, k2, color, w2) { // 進度折線
      if (k2 <= 0 || pts.length < 2) return;
      let total = 0;
      const segs = [];
      for (let i = 1; i < pts.length; i++) { const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(L); total += L; }
      let left = total * ez(k2);
      g.strokeStyle = color; g.lineWidth = w2 || 1.4; g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        if (left <= 0) break;
        const L = segs[i - 1], f = clamp(left / L, 0, 1);
        g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
        left -= L;
      }
      g.stroke();
    },
    node(x, y, r, color, a, hollow) {
      g.globalAlpha = a;
      g.beginPath(); g.arc(x, y, r, 0, TAU);
      if (hollow) { g.strokeStyle = color; g.lineWidth = 1.4; g.stroke(); }
      else { g.fillStyle = color; g.fill(); }
      g.globalAlpha = 1;
    },
    tick(x, y, sz, color, a) { // ✓
      g.save(); g.globalAlpha = a; g.strokeStyle = color || C.green; g.lineWidth = 1.8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x - sz * .5, y); g.lineTo(x - sz * .1, y + sz * .4); g.lineTo(x + sz * .55, y - sz * .38); g.stroke(); g.restore();
    },
    chip(x, y, txt, on, px) {
      px = px || 10.5;
      g.font = '600 ' + px + 'px "Space Grotesk","Noto Sans TC",sans-serif';
      const w2 = g.measureText(txt).width + 18;
      d.rr(x, y, w2, px * 2.1, px);
      g.fillStyle = on ? 'rgba(255,107,44,.14)' : 'rgba(242,239,232,.05)';
      g.fill();
      g.strokeStyle = on ? 'rgba(255,107,44,.65)' : 'rgba(242,239,232,.2)';
      g.lineWidth = 1; g.stroke();
      g.fillStyle = on ? C.orange : 'rgba(242,239,232,.55)';
      g.fillText(txt, x + 9, y + px * 1.42);
      return w2;
    },
    meter(x, y, w, h, k2, color, lbl, val) {
      g.strokeStyle = 'rgba(242,239,232,.18)'; g.lineWidth = 1;
      g.strokeRect(x, y, w, h);
      g.fillStyle = color;
      g.fillRect(x + 1.5, y + 1.5, Math.max(0, (w - 3) * clamp(k2, 0, 1)), h - 3);
      if (lbl) d.label(lbl, x, y - 7, 9.5, 'rgba(242,239,232,.5)', 1);
      if (val) { g.textAlign = 'right'; d.label(val, x + w, y - 7, 9.5, 'rgba(242,239,232,.72)'); g.textAlign = 'left'; }
    },
    ring(x, y, r, k2, color, w2) {
      g.strokeStyle = 'rgba(242,239,232,.14)'; g.lineWidth = w2 || 3;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
      if (k2 > 0) { g.strokeStyle = color; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(k2, 0, 1)); g.stroke(); }
    },
    grain(w, h, alpha) {
      const t2 = getGrain();
      g.save(); g.globalAlpha = alpha; g.globalCompositeOperation = 'overlay';
      try { g.fillStyle = g.createPattern(t2, 'repeat'); g.fillRect(0, 0, w, h); } catch (e) {}
      g.restore();
    }
  };
  return d;
}

// ---------- Solutions:一條訊息的旅程 ----------
function paintSolutions(g, e) {
  const { zone: z, k, C, d, mobile, t } = e;
  const s = clamp(Math.min(z.w / 780, z.h / 520), .5, 1.2);
  const midY = z.y + z.h * .48;
  const chX = z.x + 8, rackW = 190 * s, rackX = z.x + z.w - rackW - 6;
  const pipeX0 = chX + 88 * s, pipeX1 = rackX - 24 * s;
  const ks = k('sig'), kc = k('catch'), kf = k('follow'), kw = k('warm'), kr = k('rack'), kk = k('cta');
  // S1 四渠道
  const chans = ['LINE', 'FB', 'IG', 'WEB'];
  chans.forEach((c2, i) => {
    const a = ez(clamp(ks * 4 - i * .6, 0, 1));
    if (a <= 0) return;
    const y = midY + (i - 1.5) * 44 * s;
    d.panel(chX, y - 13 * s, 62 * s, 26 * s, a * .95, i === 0 && kc > .2);
    d.label(c2, chX + 10 * s, y + 4 * s, 10 * s, 'rgba(242,239,232,.8)', 1.2);
    d.line(chX + 62 * s, y, pipeX0, midY, a, 'rgba(242,239,232,.22)', 1);
  });
  // 主資料鏈
  d.line(pipeX0, midY, pipeX1, midY, Math.max(ks * .25, kc * .5, kf * .75, kr), 'rgba(242,239,232,.3)', 1.4);
  // 三道閘門
  const gates = [
    { kk: kc, x: .16, c: C.orange, lab: '接客', sub: '30s' },
    { kk: kf, x: .46, c: C.blue, lab: '追客', sub: 'D1·3·5·7' },
    { kk: kw, x: .76, c: C.green, lab: '養客', sub: '分眾' }
  ];
  gates.forEach((gt) => {
    const a = ez(gt.kk);
    if (a <= 0) return;
    const x = lerp(pipeX0, pipeX1, gt.x), gw = 86 * s, gh = 58 * s;
    d.panel(x - gw / 2, midY - gh - 10 * s, gw, gh, a, gt.kk > .5 && gt.kk < 1.01);
    d.han(gt.lab, x - gw / 2 + 12 * s, midY - gh + 14 * s, 13 * s, C.ivory, 800);
    d.label(gt.sub, x - gw / 2 + 12 * s, midY - gh + 32 * s, 10 * s, gt.c, 1);
    d.line(x, midY - 10 * s, x, midY, a, gt.c, 1.4);
    d.node(x, midY, 3.2 * s, gt.c, a);
  });
  // 訊息點沿線移動(捲動驅動)
  const gp = clamp((ks * .2 + kc * .25 + kf * .25 + kw * .15 + kr * .15), 0, 1);
  if (gp > 0.02) {
    const mx = lerp(pipeX0, pipeX1, gp), pulse = e.tier === 'full' ? 1 + Math.sin(t * 3) * .12 : 1;
    g.save(); g.globalAlpha = .22; g.strokeStyle = C.orange; g.lineWidth = 3;
    g.beginPath(); g.moveTo(pipeX0, midY); g.lineTo(mx, midY); g.stroke(); g.restore();
    d.node(mx, midY, 4.5 * s * pulse, C.orange, 1);
  }
  // S5 六模組機架
  if (kr > 0) {
    const rh = 168 * s, ry = midY - rh / 2;
    d.panel(rackX, ry, rackW, rh, ez(kr));
    d.head(rackX, ry, rackW, 'PEAKQI OS', ez(kr), C.green);
    const mods = ['接客', '追客', '養客', 'CRM', '報價', '數據'];
    mods.forEach((m, i) => {
      const a = ez(clamp(kr * 6 - i * .7, 0, 1));
      if (a <= 0) return;
      const col = i % 2, row = (i - col) / 2;
      const bx = rackX + 10 * s + col * (rackW - 20 * s) / 2, by = ry + 32 * s + row * 42 * s;
      g.globalAlpha = a;
      d.rr(bx, by, (rackW - 26 * s) / 2, 34 * s, 4);
      g.strokeStyle = 'rgba(255,107,44,.5)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = 'rgba(255,107,44,.07)'; g.fill();
      d.label('0' + (i + 1), bx + 7 * s, by + 14 * s, 8.5 * s, C.orange);
      d.han(m, bx + 7 * s, by + 28 * s, 10.5 * s, 'rgba(242,239,232,.85)', 700);
      g.globalAlpha = 1;
    });
  }
  // S6 KPI 收尾
  if (kk > 0 && !mobile) {
    const a = ez(kk), yy = z.y + z.h - 26 * s;
    ['REPLY < 30S', 'FOLLOW D1–7', 'ON 24/7'].forEach((tx, i) => {
      g.globalAlpha = ez(clamp(kk * 3 - i * .5, 0, 1));
      d.tick(z.x + 10 + i * 150 * s, yy - 4, 8 * s, C.green, 1);
      d.label(tx, z.x + 24 + i * 150 * s, yy, 10 * s, 'rgba(242,239,232,.7)', 1.4);
      g.globalAlpha = 1;
    });
    g.globalAlpha = a * .8;
    g.strokeStyle = 'rgba(101,224,188,.5)';
    g.strokeRect(rackX - 4, midY - 92 * s, rackW + 8, 184 * s);
    g.globalAlpha = 1;
  }
}

// ---------- Cases:打開交付檔案櫃(canvas 疊在真實截圖牆上方) ----------
function paintCases(g, e) {
  const { zone: z, k, C, d, mobile } = e;
  const s = clamp(Math.min(z.w / 780, z.h / 520), .5, 1.2);
  const kw = k('wall'), kp = k('pull'), kf = k('focus'), kpr = k('proof'), km = k('map'), kk = k('cta');
  // 膠卷齒孔軌(上下)
  const railA = ez(kw);
  if (railA > 0) {
    [z.y + 6, z.y + z.h - 14].forEach((ry) => {
      g.globalAlpha = railA * .8;
      g.strokeStyle = 'rgba(242,239,232,.22)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(z.x, ry); g.lineTo(z.x + z.w * railA, ry); g.stroke();
      for (let x = z.x + 6; x < z.x + z.w * railA - 8; x += 26 * s) {
        g.strokeRect(x, ry + 3, 9 * s, 5 * s);
      }
      g.globalAlpha = 1;
    });
    d.label('DELIVERY ARCHIVE · P.24–53', z.x, z.y + 30, 9.5 * s, 'rgba(242,239,232,.45)', 1.6);
  }
  // S2 抽出一格:橘色取景框
  if (kp > 0) {
    const a = ez(kp), fw = lerp(90 * s, 240 * s, ez(kp)), fh = fw * .62;
    const fx = z.x + z.w * .32 - fw / 2, fy = z.y + z.h * .42 - fh / 2;
    g.save(); g.globalAlpha = a;
    g.strokeStyle = C.orange; g.lineWidth = 1.6;
    const cl = 16 * s;
    [[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      g.beginPath(); g.moveTo(cx + dx * cl, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + dy * cl); g.stroke();
    });
    d.label('PULL 01', fx, fy - 8 * s, 9.5 * s, C.orange, 1.6);
    g.restore();
  }
  // S3 對焦:瀏覽器框 + 進度軸
  if (kf > 0) {
    const a = ez(kf), bw = 250 * s, bh = 150 * s;
    const bx = z.x + z.w - bw - 10, by = z.y + z.h * .2;
    d.panel(bx, by, bw, bh, a);
    d.head(bx, by, bw, 'CASE — LIVE', a, C.blue);
    const steps = ['訪談', '設定', '試跑', '上線'];
    steps.forEach((st, i) => {
      const ka = ez(clamp(kf * 4 - i * .8, 0, 1));
      if (ka <= 0) return;
      const sx = bx + 18 * s + i * (bw - 36 * s) / 3;
      g.globalAlpha = ka;
      if (i) d.line(bx + 18 * s + (i - 1) * (bw - 36 * s) / 3 + 5, by + bh * .52, sx - 5, by + bh * .52, ka, 'rgba(242,239,232,.3)', 1);
      d.node(sx, by + bh * .52, 3.4 * s, i === 3 ? C.green : C.blue, 1, i === 3 && kf < 1);
      d.han(st, sx - 11 * s, by + bh * .52 + 20 * s, 10.5 * s, 'rgba(242,239,232,.75)', 600);
      g.globalAlpha = 1;
    });
    d.label('FIXED PROCESS · TRACKABLE', bx + 14 * s, by + bh - 12 * s, 8.5 * s, 'rgba(242,239,232,.4)', 1.2);
  }
  // S4 數字蓋章
  if (kpr > 0) {
    const stamps = [
      { tx: '30+ 系統上線', c: C.orange, x: .12, y: .68, r: -4 },
      { tx: '8+ 產業實戰', c: C.blue, x: .42, y: .76, r: 3 },
      { tx: '流程可驗收', c: C.green, x: .7, y: .66, r: -2 }
    ];
    stamps.forEach((st, i) => {
      const a = ez(clamp(kpr * 3 - i * .6, 0, 1));
      if (a <= 0) return;
      const pop = 1 + (1 - a) * .35;
      g.save();
      g.translate(z.x + z.w * st.x, z.y + z.h * st.y);
      g.rotate(st.r * Math.PI / 180); g.scale(pop, pop); g.globalAlpha = a;
      g.font = '800 ' + 13 * s + 'px "Noto Sans TC",sans-serif';
      const w2 = g.measureText(st.tx).width + 26 * s;
      d.rr(0, 0, w2, 32 * s, 4);
      g.fillStyle = 'rgba(9,11,14,.85)'; g.fill();
      g.strokeStyle = st.c; g.lineWidth = 1.6; g.stroke();
      g.fillStyle = st.c; g.fillText(st.tx, 13 * s, 21 * s);
      g.restore();
    });
  }
  // S5 產業矩陣
  if (km > 0 && !mobile) {
    const inds = ['婚慶', '房仲', '餐飲', '健檢', '設計', '教育', '電商', '製造'];
    const gx = z.x + 10, gy = z.y + z.h * .84;
    inds.forEach((tx, i) => {
      const a = ez(clamp(km * 5 - i * .5, 0, 1));
      if (a <= 0) return;
      g.globalAlpha = a;
      const x = gx + (i % 8) * 88 * s;
      d.node(x, gy, 2.6 * s, C.orange, a);
      d.han(tx, x + 8 * s, gy + 4 * s, 11 * s, 'rgba(242,239,232,.75)', 600);
      g.globalAlpha = 1;
    });
  }
  // S6 收束
  if (kk > 0) {
    g.globalAlpha = ez(kk) * .9;
    g.strokeStyle = 'rgba(255,107,44,.55)'; g.lineWidth = 1.2;
    g.strokeRect(z.x + 2, z.y + 2, (z.w - 4) * ez(kk), z.h - 4);
    d.label('NEXT: YOUR INDUSTRY →', z.x + 12, z.y + z.h - 24, 10 * s, C.orange, 1.8);
    g.globalAlpha = 1;
  }
}

// ---------- Pricing:機架由小到大 ----------
function paintPricing(g, e) {
  const { zone: z, k, C, d, mobile, t } = e;
  const s = clamp(Math.min(z.w / 760, z.h / 520), .5, 1.2);
  const kfr = k('frame'), ka = k('pa'), kb = k('pb'), kc2 = k('pc'), ku = k('use'), kg = k('sure');
  const chW = Math.min(300 * s, z.w * .46), chH = 300 * s;
  const chX = z.x + 14, chY = z.y + z.h * .5 - chH / 2;
  // 機櫃外框 + 6U 刻度
  if (kfr > 0) {
    const a = ez(kfr);
    g.globalAlpha = a;
    g.strokeStyle = 'rgba(242,239,232,.3)'; g.lineWidth = 1.4;
    g.strokeRect(chX, chY, chW, chH);
    for (let i = 1; i < 6; i++) {
      const y = chY + chH / 6 * i;
      g.strokeStyle = 'rgba(242,239,232,.1)';
      g.beginPath(); g.moveTo(chX, y); g.lineTo(chX + chW, y); g.stroke();
      d.label(6 - i + 'U', chX - 20 * s, y + 3, 8.5 * s, 'rgba(242,239,232,.35)');
    }
    d.label('RACK — PEAKQI PLANS', chX, chY - 10 * s, 9.5 * s, 'rgba(242,239,232,.5)', 1.6);
    g.globalAlpha = 1;
  }
  // 三個 plan 機組:A 1U、B 2U、C 3U,由下往上疊
  const units = [
    { kk: ka, u: 1, off: 0, lab: 'A · AI 接客', price: '39K + 2.5K/月', c: C.ivory },
    { kk: kb, u: 2, off: 1, lab: 'B · AI 業務助理', price: '78K + 5K/月', c: C.orange },
    { kk: kc2, u: 3, off: 3, lab: 'C · AI 營運平台', price: '128K + 8K/月', c: C.blue }
  ];
  units.forEach((u2) => {
    const a = ez(u2.kk);
    if (a <= 0) return;
    const uh = chH / 6 * u2.u - 6, uy = chY + chH - chH / 6 * (u2.off + u2.u) + 3;
    const slide = (1 - a) * 60 * s;
    g.save(); g.globalAlpha = a;
    d.rr(chX + 5 + slide, uy, chW - 10, uh, 3);
    g.fillStyle = u2.c === C.orange ? 'rgba(255,107,44,.1)' : 'rgba(242,239,232,.05)';
    g.fill();
    g.strokeStyle = u2.c === C.ivory ? 'rgba(242,239,232,.4)' : u2.c; g.lineWidth = 1.2; g.stroke();
    d.han(u2.lab, chX + 16 + slide, uy + 17 * s, 11.5 * s, C.ivory, 800);
    d.label(u2.price, chX + 16 + slide, uy + 32 * s, 9 * s, u2.c === C.ivory ? 'rgba(242,239,232,.55)' : u2.c, .6);
    // LED
    const on = u2.kk >= 1 && e.tier === 'full' ? (Math.sin(t * 2.4 + u2.off) * .5 + .5) : 1;
    d.node(chX + chW - 16 - slide, uy + 10, 2.6 * s, C.green, a * (0.45 + 0.55 * on));
    g.restore();
  });
  // 右側:計費儀表
  const mx = chX + chW + 34 * s, mw = z.x + z.w - mx - 10;
  if (ku > 0 && mw > 90) {
    const a = ez(ku), my = chY + 10;
    d.panel(mx, my, mw, 128 * s, a);
    d.head(mx, my, mw, 'USAGE METER', a, C.blue);
    const rows = [
      { lab: '文字 AI', k: 1, val: '不限量', c: C.green },
      { lab: '圖片生成', k: .44, val: '按量', c: C.blue },
      { lab: '影片生成', k: .3, val: '按量', c: C.orange }
    ];
    rows.forEach((r, i) => {
      const ka2 = ez(clamp(ku * 3 - i * .55, 0, 1));
      if (ka2 <= 0) return;
      g.globalAlpha = ka2;
      d.meter(mx + 14 * s, my + 46 * s + i * 26 * s, mw - 28 * s, 8 * s, r.k * ka2, r.c, r.lab, r.val);
      g.globalAlpha = 1;
    });
  }
  // 保證封條
  if (kg > 0 && mw > 90) {
    const a = ez(kg), ry = chY + chH - 92 * s, rx = mx + Math.min(60 * s, mw * .25);
    g.globalAlpha = a;
    d.ring(rx, ry + 34 * s, 30 * s, kg, C.orange, 3);
    g.font = '800 ' + 15 * s + 'px "Space Grotesk",sans-serif'; g.fillStyle = C.ivory; g.textAlign = 'center';
    g.fillText('30', rx, ry + 32 * s);
    g.font = '600 ' + 8 * s + 'px "Space Grotesk",sans-serif'; g.fillStyle = 'rgba(242,239,232,.6)';
    g.fillText('DAYS', rx, ry + 44 * s);
    g.textAlign = 'left';
    d.chip(rx + 44 * s, ry + 14 * s, '不綁約', kg > .6, 10 * s);
    d.chip(rx + 44 * s, ry + 40 * s, '30 天保證', kg > .8, 10 * s);
    g.globalAlpha = 1;
  }
}

// ---------- About:內容力 × 系統力的稜線 ----------
function paintAbout(g, e) {
  const { zone: z, k, C, d, mobile } = e;
  const s = clamp(Math.min(z.w / 780, z.h / 520), .5, 1.2);
  const kp = k('peaks'), kr = k('ridge'), km = k('mile'), kme = k('method'), kn = k('net'), kk = k('cta');
  const baseY = z.y + z.h * .72;
  const P = (fx, fy) => [z.x + z.w * fx, baseY - z.h * fy];
  // 稜線:左峰(內容力)→ 鞍部 → 右峰(系統力,較高)
  const ridge = [P(0, .02), P(.14, .3), P(.24, .42), P(.34, .3), P(.46, .2), P(.6, .38), P(.72, .56), P(.84, .4), P(1, .12)];
  const kAll = clamp(kp * .45 + kr * .55, 0, 1);
  d.poly(ridge, kAll, 'rgba(242,239,232,.75)', 1.6);
  // 基準線
  d.line(z.x, baseY + 8, z.x + z.w, baseY + 8, ez(kp), 'rgba(242,239,232,.16)', 1);
  // 峰名
  if (kp > .4) {
    g.globalAlpha = ez(clamp(kp * 2 - .7, 0, 1));
    d.node(ridge[2][0], ridge[2][1], 3 * s, C.orange, 1);
    d.han('內容力', ridge[2][0] - 20 * s, ridge[2][1] - 14 * s, 12 * s, C.ivory, 800);
    g.globalAlpha = 1;
  }
  if (kr > .5) {
    g.globalAlpha = ez(clamp(kr * 2 - 1, 0, 1));
    d.node(ridge[6][0], ridge[6][1], 3.4 * s, C.orange, 1);
    d.han('系統力', ridge[6][0] - 20 * s, ridge[6][1] - 14 * s, 12 * s, C.ivory, 800);
    d.label('PEAK QI', ridge[6][0] - 22 * s, ridge[6][1] - 34 * s, 9 * s, C.orange, 2);
    g.globalAlpha = 1;
  }
  // 里程碑旗標
  if (km > 0) {
    const miles = [
      { at: 3, tx: '10 年內容製作', c: 'rgba(242,239,232,.6)' },
      { at: 5, tx: '30+ 系統交付', c: C.blue },
      { at: 7, tx: '8+ 產業', c: C.green }
    ];
    miles.forEach((m, i) => {
      const a = ez(clamp(km * 3 - i * .7, 0, 1));
      if (a <= 0) return;
      const [x, y] = ridge[m.at];
      g.globalAlpha = a;
      d.line(x, y, x, y - 30 * s, a, 'rgba(242,239,232,.35)', 1);
      d.node(x, y, 2.6 * s, C.ivory, 1);
      d.han(m.tx, x + 6 * s, y - 32 * s, 10.5 * s, m.c, 700);
      g.globalAlpha = 1;
    });
  }
  // 方法:掃描框「先看流程」
  if (kme > 0 && !mobile) {
    const a = ez(kme), bw = 170 * s, bh = 64 * s;
    const bx = z.x + z.w * .06, by = z.y + 16;
    g.save(); g.globalAlpha = a;
    g.setLineDash([5, 5]); g.strokeStyle = C.blue; g.lineWidth = 1.2;
    g.strokeRect(bx, by, bw * a, bh);
    g.setLineDash([]);
    d.label('METHOD 01', bx, by - 8 * s, 8.5 * s, C.blue, 1.6);
    d.han('先看流程,再談系統', bx + 12 * s, by + bh / 2 + 5 * s, 11.5 * s, 'rgba(242,239,232,.85)', 700);
    g.restore();
  }
  // 營運網:峰頂放射到四節點
  if (kn > 0) {
    const [sx, sy] = ridge[6];
    ['接客', 'CRM', '行銷', '報價'].forEach((tx, i) => {
      const a = ez(clamp(kn * 4 - i * .6, 0, 1));
      if (a <= 0) return;
      const ang = -Math.PI * .12 - i * Math.PI * .18;
      const nx = sx + Math.cos(ang) * 120 * s, ny = sy + Math.sin(ang) * 86 * s;
      d.line(sx, sy, nx, ny, a, 'rgba(62,155,255,.4)', 1);
      d.node(nx, ny, 2.8 * s, C.blue, a, true);
      g.globalAlpha = a;
      d.han(tx, nx + 6 * s, ny + 4 * s, 10 * s, 'rgba(242,239,232,.7)', 600);
      g.globalAlpha = 1;
    });
  }
  // 收尾 lockup
  if (kk > 0) {
    g.globalAlpha = ez(kk);
    d.label('PEAKQI — THE OPERATING LAYER', z.x + 4, z.y + z.h - 10, 10 * s, C.orange, 2.4);
    d.line(z.x + 4, z.y + z.h - 2, z.x + 4 + 250 * s, z.y + z.h - 2, kk, C.orange, 1.4);
    g.globalAlpha = 1;
  }
}

// ---------- Demo:從留下場景到 48 小時回覆 ----------
function paintDemo(g, e) {
  const { zone: z, k, C, d, mobile, t } = e;
  const s = clamp(Math.min(z.w / 780, z.h / 520), .5, 1.2);
  const kl = k('leave'), km = k('match'), kr = k('run'), kc2 = k('clock'), ks2 = k('safe'), kk = k('cta');
  // S1 表單卡
  const fw = 168 * s, fh = 128 * s, fx = z.x + 8, fy = z.y + z.h * .18;
  if (kl > 0) {
    const a = ez(kl);
    d.panel(fx, fy, fw, fh, a);
    d.head(fx, fy, fw, 'DEMO REQUEST', a, C.orange);
    [0, 1, 2].forEach((i) => {
      const ka2 = ez(clamp(kl * 3 - i * .6, 0, 1));
      if (ka2 <= 0) return;
      g.globalAlpha = ka2;
      g.strokeStyle = 'rgba(242,239,232,.25)'; g.lineWidth = 1;
      const ly = fy + 38 * s + i * 22 * s;
      g.strokeRect(fx + 12 * s, ly, fw - 24 * s, 14 * s);
      g.fillStyle = 'rgba(242,239,232,.35)';
      const tw = (fw - 34 * s) * [.7, .45, .58][i] * ka2;
      g.fillRect(fx + 16 * s, ly + 4.5 * s, tw, 5 * s);
      g.globalAlpha = 1;
    });
    if (e.tier === 'full' && kl >= 1 && km < .3 && Math.sin(t * 4) > 0) {
      g.fillStyle = C.orange; g.fillRect(fx + 16 * s + (fw - 34 * s) * .58, fy + 38 * s + 44 * s + 4.5 * s, 1.6, 6 * s);
    }
  }
  // S2 對上模組
  const cx = z.x + z.w * .5 - 70 * s, cy2 = z.y + z.h * .12, cw = 150 * s, ch = 170 * s;
  if (km > 0) {
    const a = ez(km);
    d.line(fx + fw, fy + fh / 2, cx, cy2 + ch / 2, a, 'rgba(255,107,44,.5)', 1.3);
    d.panel(cx, cy2, cw, ch, a);
    d.head(cx, cy2, cw, 'MATCH MODULES', a, C.blue);
    ['接客', '追客', 'CRM', '報價'].forEach((m, i) => {
      const ka2 = ez(clamp(km * 4 - i * .55, 0, 1));
      if (ka2 <= 0) return;
      g.globalAlpha = ka2;
      const on = i < 2;
      const by = cy2 + 34 * s + i * 32 * s;
      d.rr(cx + 12 * s, by, cw - 24 * s, 24 * s, 4);
      g.strokeStyle = on ? 'rgba(255,107,44,.55)' : 'rgba(242,239,232,.18)'; g.lineWidth = 1; g.stroke();
      if (on) { g.fillStyle = 'rgba(255,107,44,.08)'; g.fill(); }
      d.han(m, cx + 22 * s, by + 16 * s, 10.5 * s, on ? C.ivory : 'rgba(242,239,232,.5)', 700);
      if (on) d.tick(cx + cw - 24 * s, by + 12 * s, 6 * s, C.green, ka2);
      g.globalAlpha = 1;
    });
  }
  // S3 現場跑:對話視窗
  const vw = 190 * s, vh2 = 150 * s, vx = z.x + z.w - vw - 8, vy = z.y + z.h * .4;
  if (kr > 0 && !mobile) {
    const a = ez(kr);
    d.line(cx + cw, cy2 + ch * .6, vx, vy + vh2 * .3, a, 'rgba(62,155,255,.45)', 1.2);
    d.panel(vx, vy, vw, vh2, a);
    d.head(vx, vy, vw, 'LIVE RUN · 15 MIN', a, C.green);
    [{ w: .62, l: 0 }, { w: .5, l: 1 }, { w: .7, l: 0 }].forEach((b, i) => {
      const ka2 = ez(clamp(kr * 3.4 - i * .8, 0, 1));
      if (ka2 <= 0) return;
      g.globalAlpha = ka2;
      const bw = (vw - 40 * s) * b.w, by = vy + 34 * s + i * 34 * s;
      const bx = b.l ? vx + 14 * s : vx + vw - 14 * s - bw;
      d.rr(bx, by, bw, 24 * s, 6);
      g.fillStyle = b.l ? 'rgba(255,107,44,.14)' : 'rgba(242,239,232,.08)'; g.fill();
      g.strokeStyle = b.l ? 'rgba(255,107,44,.4)' : 'rgba(242,239,232,.16)'; g.stroke();
      g.globalAlpha = 1;
    });
  }
  // S4 48H 環
  if (kc2 > 0) {
    const a = ez(kc2), rx = mobile ? z.x + z.w - 60 * s : z.x + z.w * .32, ry = z.y + z.h * .74;
    g.globalAlpha = a;
    d.ring(rx, ry, 34 * s, kc2, C.orange, 3.4);
    g.font = '800 ' + 16 * s + 'px "Space Grotesk",sans-serif'; g.fillStyle = C.ivory; g.textAlign = 'center';
    g.fillText('48H', rx, ry + 5 * s);
    g.textAlign = 'left';
    d.han('內回覆與時段', rx + 44 * s, ry + 4 * s, 11 * s, 'rgba(242,239,232,.75)', 700);
    d.label('T+0 SUBMIT — T+48 REPLY', rx + 44 * s, ry + 20 * s, 8.5 * s, 'rgba(242,239,232,.45)', 1.2);
    g.globalAlpha = 1;
  }
  // S5 不推銷
  if (ks2 > 0 && !mobile) {
    g.globalAlpha = ez(ks2);
    let xx = z.x + z.w * .62;
    xx += d.chip(xx, z.y + z.h * .82, '不推銷', ks2 > .5, 10 * s) + 10;
    xx += d.chip(xx, z.y + z.h * .82, '不用先懂 AI', ks2 > .7, 10 * s) + 10;
    d.chip(xx, z.y + z.h * .82, '不合用就說', ks2 > .9, 10 * s);
    g.globalAlpha = 1;
  }
  // S6 往下箭頭
  if (kk > 0) {
    const a = ez(kk), ax = z.x + z.w * .5, ay = z.y + z.h - 34 * s;
    g.save(); g.globalAlpha = a; g.strokeStyle = C.orange; g.lineWidth = 2; g.lineCap = 'round';
    const off = e.tier === 'full' ? Math.sin(t * 2.6) * 4 : 0;
    g.beginPath(); g.moveTo(ax, ay + off); g.lineTo(ax, ay + 22 * s + off);
    g.moveTo(ax - 7 * s, ay + 14 * s + off); g.lineTo(ax, ay + 22 * s + off); g.lineTo(ax + 7 * s, ay + 14 * s + off); g.stroke();
    d.label('FORM BELOW', ax - 34 * s, ay - 8 * s, 9 * s, C.orange, 1.8);
    g.restore();
  }
}

export const painters = {
  solutions: paintSolutions,
  cases: paintCases,
  pricing: paintPricing,
  about: paintAbout,
  demo: paintDemo
};
