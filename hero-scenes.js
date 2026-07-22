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

// ---------- Solutions:ONE SYSTEM, THREE OPERATIONS(7 scenes) ----------
function paintSolutions(g, e) {
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const s = clamp(Math.min(z.w / 500, z.h / 360), .5, mobile ? 1.3 : 1.7);
  const kS = k('sig'), kL = k('layers'), kC = k('cap'), kF = k('fol'), kN = k('nur'), kA = k('align'), kO = k('console');
  const colW = mobile ? z.w * .92 : z.w * .56;
  const colX = z.x + (mobile ? z.w * .04 : 4);
  const lh = z.h * (mobile ? .17 : .2), gapY = z.h * .065;
  const ly = (i) => z.y + z.h * .12 + i * (lh + gapY);
  const off = (i) => (1 - ez(kA)) * [22, -12, 16][i] * s;
  const layers = [
    { lab: 'CAPTURE', zh: '接客', c: C.orange, kk: kC },
    { lab: 'FOLLOW', zh: '追客', c: C.blue, kk: kF },
    { lab: 'NURTURE', zh: '養客', c: C.green, kk: kN }
  ];
  // S1 散落視窗(三深度層,layers 時收攏)
  const wins = [
    { fx: .04, fy: .02, w: 92, dep: 1.08, lab: 'LINE' },
    { fx: .5, fy: 0, w: 78, dep: .82, lab: 'EXCEL' },
    { fx: .68, fy: .3, w: 84, dep: .95, lab: '表單' },
    { fx: .1, fy: .55, w: 96, dep: .9, lab: '報價' },
    { fx: .46, fy: .7, w: 86, dep: 1.14, lab: '工作視窗' }
  ];
  const winFade = 1 - ez(sb(kL, .35, 1));
  wins.forEach((w2, i) => {
    if (mobile && i > 2) return;
    const a = ez(clamp(kS * 3 - i * .35, 0, 1)) * winFade;
    if (a <= 0.015) return;
    const ww = w2.w * s * w2.dep, wh = ww * .6;
    const li = i % 3;
    const gk = ez(kL);
    const gx = lerp(z.x + z.w * w2.fx, colX + colW * .5 - ww / 2, gk);
    const gy = lerp(z.y + z.h * w2.fy, ly(li) + lh / 2 - wh / 2, gk);
    const drift = e.tier === 'full' ? Math.sin(t * (0.6 + i * .17) + i * 2) * 3 * (w2.dep - .7) : 0;
    g.save(); g.globalAlpha = a * (0.5 + 0.5 * sb(w2.dep, .8, 1.15));
    d.rr(gx, gy + drift, ww, wh, 5);
    g.fillStyle = 'rgba(20,23,28,.92)'; g.fill();
    g.strokeStyle = 'rgba(242,239,232,.24)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(242,239,232,.13)';
    g.beginPath(); g.moveTo(gx, gy + drift + 16 * s); g.lineTo(gx + ww, gy + drift + 16 * s); g.stroke();
    d.label(w2.lab, gx + 7, gy + drift + 12 * s, 9.5 * s, 'rgba(242,239,232,.62)', 1);
    [.42, .6, .78].forEach((fy2, j) => {
      g.fillStyle = 'rgba(242,239,232,' + (0.2 - j * .045).toFixed(3) + ')';
      g.fillRect(gx + 7, gy + drift + wh * fy2, ww * (0.72 - j * .16), 2.6);
    });
    g.restore();
  });
  // S2 三個透明系統層 + 中斷/接通
  layers.forEach((L, i) => {
    const a = ez(clamp(kL * 3 - i * .5, 0, 1));
    if (a <= 0) return;
    const x = colX + off(i), y = ly(i);
    const hot = ez(L.kk);
    g.save(); g.globalAlpha = a;
    d.rr(x, y, colW, lh, 7);
    g.fillStyle = 'rgba(20,23,28,' + (0.48 + 0.34 * Math.max(hot, kO)).toFixed(2) + ')'; g.fill();
    g.strokeStyle = hot > .1 ? L.c : 'rgba(242,239,232,.22)';
    g.lineWidth = 1 + hot * .7; g.stroke();
    d.label(L.lab, x + 12, y + 16 * s, 10 * s, hot > .1 ? L.c : 'rgba(242,239,232,.55)', 1.8);
    d.han(L.zh, x + colW - 36 * s, y + 17 * s, 11 * s, 'rgba(242,239,232,.78)', 700);
    g.restore();
    if (i < 2) {
      const midX = colX + colW * .5 + (off(i) + off(i + 1)) / 2;
      const y1 = y + lh + 3, y2 = ly(i + 1) - 3;
      const broken = (1 - ez(kA)) * ez(sb(kL, .5, 1));
      if (broken > 0.02) {
        g.save(); g.globalAlpha = broken * .85;
        g.setLineDash([3, 6]); g.strokeStyle = 'rgba(242,239,232,.32)'; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(midX, y1); g.lineTo(midX, y2); g.stroke();
        g.setLineDash([]);
        const my = (y1 + y2) / 2;
        g.strokeStyle = 'rgba(242,239,232,.55)'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(midX - 4, my - 4); g.lineTo(midX + 4, my + 4);
        g.moveTo(midX + 4, my - 4); g.lineTo(midX - 4, my + 4); g.stroke();
        g.restore();
      }
      if (kA > 0) {
        const cc = i === 0 ? C.orange : C.blue;
        d.line(midX, y1, midX, y2, kA, cc, 1.8);
        if (kA > .9) {
          const pk = e.tier === 'full' ? (t * .45 + i * .5) % 1 : .5;
          d.node(midX, lerp(y1, y2, pk), 2.8, cc, .95);
        }
      }
    }
  });
  // S3 CAPTURE:LINE 進線 → 辨識 → CRM 卡
  const l0x = colX + off(0), l0y = ly(0);
  if (kC > 0) {
    const a = ez(kC);
    g.save(); g.globalAlpha = a;
    const bw = Math.min(158 * s, colW * .44);
    d.rr(l0x + 12, l0y + lh * .34, bw, Math.max(20 * s, lh * .42), 5);
    g.fillStyle = 'rgba(101,224,188,.14)'; g.fill();
    g.strokeStyle = 'rgba(101,224,188,.45)'; g.lineWidth = 1; g.stroke();
    d.han('LINE:想約週五下午', l0x + 20, l0y + lh * .34 + Math.max(14 * s, lh * .27), 10.5 * s, 'rgba(242,239,232,.88)', 600);
    ['需求', '服務', '時間', '真人?'].forEach((tx, j) => {
      const ka = ez(clamp(kC * 4 - 1 - j * .5, 0, 1));
      if (ka <= 0) return;
      g.globalAlpha = a * ka;
      d.chip(l0x + 12 + bw + 8 + j * 50 * s, l0y + lh * .4, tx, ka > .7, 9.5 * s);
    });
    g.restore();
  }
  // CRM 卡:CAPTURE 生成 → FOLLOW 沿 DAY 軌移動
  const cardBorn = ez(sb(kC, .55, 1));
  if (cardBorn > 0) {
    const cw = Math.min(120 * s, colW * .3), chh = 34 * s;
    const l1x = colX + off(1), l1y = ly(1);
    const tx0 = l0x + colW - cw - 10, ty0 = l0y + lh - chh - 6;
    const dayK = ez(kF);
    const trackX0 = l1x + 16, trackX1 = l1x + colW - cw - 12;
    const cx = lerp(tx0, lerp(trackX0, trackX1, dayK), ez(sb(kF, 0, .25)));
    const cy = lerp(ty0, l1y + lh * .5 - chh / 2, ez(sb(kF, 0, .25)));
    g.save(); g.globalAlpha = cardBorn;
    d.rr(cx, cy, cw, chh, 4);
    g.fillStyle = '#F2EFE8'; g.fill();
    g.strokeStyle = C.orange; g.lineWidth = 1.3; g.stroke();
    d.han('王小姐', cx + 8, cy + 14 * s, 10 * s, '#090B0E', 800);
    d.label(dayK > 0 ? 'FOLLOWING' : 'CRM CARD', cx + 8, cy + chh - 7 * s, 7.5 * s, '#D14E12', 1);
    g.restore();
  }
  // S4 FOLLOW:狀態導向四步(補齊需求→提供案例→確認反應→決定下一步)
  if (kF > 0) {
    const a = ez(kF), l1x = colX + off(1), l1y = ly(1);
    const ty = l1y + lh * .78;
    g.save(); g.globalAlpha = a;
    ['補齊需求', '提供案例', '確認反應', '決定下一步'].forEach((tx, j) => {
      const nx = l1x + 24 + (colW - 60) * j / 3;
      const on = kF * 4 - .4 > j;
      d.node(nx, ty, on ? 3.2 : 2.2, on ? C.blue : 'rgba(242,239,232,.3)', 1, !on);
      d.label(tx, nx - 14 * s, ty + 14 * s, 8.5 * s, on ? C.blue : 'rgba(242,239,232,.4)', 1);
      if (j < 3) d.line(nx + 5, ty, l1x + 24 + (colW - 60) * (j + 1) / 3 - 5, ty, clamp(kF * 4 - .5 - j, 0, 1), 'rgba(62,155,255,.5)', 1.2);
    });
    const hint = ['提醒已擬', '補上案例', '限時優惠', '最後關心'][clamp(Math.floor(kF * 4), 0, 3)];
    if (kF > .2 && !mobile) d.chip(l1x + colW - 86 * s, l1y + 8, hint, true, 9 * s);
    g.restore();
  }
  // S5 NURTURE:分群標籤 + 內容排程
  if (kN > 0) {
    const a = ez(kN), l2x = colX + off(2), l2y = ly(2);
    g.save(); g.globalAlpha = a;
    let xx = l2x + 12;
    ['新客', '考慮中', '老客'].forEach((tx, j) => {
      const ka = ez(clamp(kN * 3.4 - j * .5, 0, 1));
      if (ka <= 0) return;
      g.globalAlpha = a * ka;
      xx += d.chip(xx, l2y + lh * .34, tx, ka > .75, 9.5 * s) + 6;
    });
    g.globalAlpha = a;
    ['案例', '優惠', '貼文'].forEach((tx, j) => {
      const ka = ez(clamp(kN * 3 - .8 - j * .5, 0, 1));
      if (ka <= 0) return;
      const sw = Math.min(56 * s, colW * .16), sx = l2x + colW - (sw + 8) * (3 - j) - 6, sy2 = l2y + lh * .3;
      g.globalAlpha = a * ka;
      d.rr(sx, sy2, sw, lh * .5, 3);
      g.fillStyle = 'rgba(101,224,188,.08)'; g.fill();
      g.strokeStyle = 'rgba(101,224,188,.4)'; g.lineWidth = 1; g.stroke();
      d.han(tx, sx + 8, sy2 + lh * .32, 9.5 * s, 'rgba(242,239,232,.75)', 600);
    });
    g.restore();
  }
  // S6 六模組組裝(desktop 右欄 2×3;mobile 底部一列)
  const modsList = ['客服', 'CRM', '行銷', '報價', '專案', '數據'];
  if (kA > 0) {
    if (!mobile) {
      const mx = z.x + z.w * .62, mw = z.w * .36;
      const cellW = (mw - 10) / 2, cellH = Math.min(44 * s, z.h * .1);
      const gy0 = z.y + z.h * .5 - (cellH * 3 + 20) / 2;
      d.line(colX + colW + 4, z.y + z.h * .5, mx - 6, z.y + z.h * .5, ez(kA), 'rgba(242,239,232,.3)', 1.2);
      modsList.forEach((m, i) => {
        const ka = ez(clamp(kA * 5 - i * .55, 0, 1));
        if (ka <= 0) return;
        const col = i % 2, row = (i - col) / 2;
        const bx = mx + col * (cellW + 10) + (1 - ka) * 34, by = gy0 + row * (cellH + 10);
        g.save(); g.globalAlpha = ka;
        d.rr(bx, by, cellW, cellH, 4);
        g.fillStyle = 'rgba(255,107,44,' + (0.05 + 0.05 * kO).toFixed(3) + ')'; g.fill();
        g.strokeStyle = kO > .5 ? 'rgba(255,107,44,.6)' : 'rgba(242,239,232,.26)'; g.lineWidth = 1; g.stroke();
        d.label('0' + (i + 1), bx + 8, by + 14 * s, 8 * s, C.orange, .5);
        d.han(m, bx + 8, by + cellH - 9 * s, 11 * s, 'rgba(242,239,232,.85)', 700);
        g.restore();
      });
    } else {
      const by = ly(2) + lh + 14;
      modsList.forEach((m, i) => {
        const ka = ez(clamp(kA * 5 - i * .4, 0, 1));
        if (ka <= 0) return;
        g.globalAlpha = ka;
        d.chip(colX + i * (colW / 6), by, m, kO > .5, 8.5 * s);
        g.globalAlpha = 1;
      });
    }
  }
  // S7 控制台成形
  if (kO > 0) {
    const a = ez(kO);
    const fx = colX - 10, fy = z.y + z.h * .045;
    const fw = (mobile ? colW : z.x + z.w * .98 - fx) + 6, fh = z.h * .93;
    g.save(); g.globalAlpha = a;
    d.rr(fx, fy, fw, fh, 10);
    g.strokeStyle = 'rgba(255,107,44,.6)'; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = 'rgba(242,239,232,.14)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(fx, fy + 24 * s); g.lineTo(fx + fw, fy + 24 * s); g.stroke();
    d.label('PEAKQI OS · 營運控制台', fx + 12, fy + 16 * s, 9.5 * s, C.orange, 1.8);
    [C.green, C.blue, C.orange].forEach((cc, i) => {
      const on = e.tier === 'full' ? .55 + .45 * (Math.sin(t * 2 + i * 2.1) * .5 + .5) : 1;
      d.node(fx + fw - 14 - i * 14, fy + 12 * s, 2.6, cc, a * on);
    });
    if (!mobile) {
      d.tick(fx + 14, fy + fh - 13 * s, 7 * s, C.green, a);
      d.label('ONE SYSTEM · THREE OPERATIONS · 24/7', fx + 26, fy + fh - 10 * s, 9 * s, 'rgba(242,239,232,.6)', 1.6);
    }
    g.restore();
  }
}

// ---------- Cases:PROOF IN MOTION 註記層(截圖牆為 DOM,canvas 只做膠卷/框/索引註記) ----------
function paintCases(g, e) {
  const { zone: z, k, C, d, mobile } = e;
  const s = clamp(Math.min(z.w / 780, z.h / 520), .5, 1.2);
  const kd = k('detail'), kw = k('wall'), ks = k('sort'), kf = k('focus'), ki = k('index'), kc = k('cta');
  // 膠卷齒孔軌(特寫/牆),類別排列後淡出
  const railA = ez(Math.max(kd, kw)) * (1 - ez(ks)) * (1 - ez(kf));
  if (railA > 0.02) {
    [z.y + 4, z.y + z.h - 12].forEach((ry) => {
      g.globalAlpha = railA * .7;
      g.strokeStyle = 'rgba(242,239,232,.22)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(z.x, ry); g.lineTo(z.x + z.w * ez(kw), ry); g.stroke();
      for (let x = z.x + 6; x < z.x + z.w * ez(kw) - 8; x += 26 * s) g.strokeRect(x, ry + 3, 9 * s, 5 * s);
      g.globalAlpha = 1;
    });
    g.globalAlpha = railA;
    d.label('PROOF IN MOTION · P.24–53', z.x + 2, z.y + 26, 9.5 * s, 'rgba(242,239,232,.5)', 1.8);
    g.globalAlpha = 1;
  }
  // FOCUS:右區四角取景框
  const brA = ez(kf) * (1 - ez(ki));
  if (brA > 0.02 && !mobile) {
    g.save(); g.globalAlpha = brA;
    g.strokeStyle = C.orange; g.lineWidth = 1.6;
    const fx = z.x + z.w * .02, fy = z.y + z.h * .03, fw = z.w * .96, fh = z.h * .94, cl = 18 * s;
    [[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      g.beginPath(); g.moveTo(cx + dx * cl, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + dy * cl); g.stroke();
    });
    d.label('FEATURED — BEFORE / SYSTEM / RESULT', fx, fy - 7 * s, 9 * s, C.orange, 1.6);
    g.restore();
  }
  // INDEX:索引註記
  if (ki > 0) {
    g.globalAlpha = ez(ki) * (1 - ez(kc) * .4);
    d.line(z.x + 2, z.y + z.h - 30 * s, z.x + 2 + 200 * s * ez(ki), z.y + z.h - 30 * s, 1, 'rgba(242,239,232,.3)', 1);
    d.label('PEAKQI WORK INDEX — 29 PUBLISHED', z.x + 2, z.y + z.h - 14 * s, 9.5 * s, 'rgba(242,239,232,.6)', 1.8);
    g.globalAlpha = 1;
  }
  // CTA:橘框收束
  if (kc > 0) {
    g.globalAlpha = ez(kc) * .9;
    g.strokeStyle = 'rgba(255,107,44,.55)'; g.lineWidth = 1.2;
    g.strokeRect(z.x + 2, z.y + 2, (z.w - 4) * ez(kc), z.h - 4);
    d.label('NEXT: YOUR WORKFLOW →', z.x + 12, z.y + 22 * s, 10 * s, C.orange, 1.8);
    g.globalAlpha = 1;
  }
}

// ---------- Pricing:CONFIGURE YOUR OPERATING SYSTEM(7 scenes 機架組裝) ----------
function paintPricing(g, e) {
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const s = clamp(Math.min(z.w / 720, z.h / 520), .5, 1.15);
  const kR = k('racks'), k1 = k('cap'), k2 = k('assist'), k3 = k('plat'), kC = k('cmp'), kU = k('use'), kO = k('run');
  const gap = z.w * .05, rw = (z.w - gap * 2) / 3;
  const ry = z.y + z.h * .05, rh = z.h * (mobile ? .48 : .56);
  const rx = (i) => z.x + i * (rw + gap);
  const meta = [
    { zh: '接客', en: 'CAPTURE', kk: k1, c: C.orange, price: '依需求報價', mo: '預約諮詢', mods: ['自動回覆', '需求了解', '預約', '轉真人'], base: null },
    { zh: '業務助理', en: 'ASSISTANT', kk: k2, c: C.orange, price: '依需求報價', mo: '預約諮詢', mods: ['CRM', '追蹤', '跟進序列', '分析'], base: '含 A 全部', badge: '最多人選' },
    { zh: '營運平台', en: 'PLATFORM', kk: k3, c: C.blue, price: '依需求報價', mo: '預約諮詢', mods: ['行銷', '報價', '專案', '數據'], base: '含 B 全部' }
  ];
  meta.forEach((m, i) => {
    const a = ez(clamp(kR * 3 - i * .45, 0, 1));
    if (a <= 0) return;
    const x = rx(i), hot = ez(m.kk);
    g.save(); g.globalAlpha = a;
    const gh = rh * (0.3 + 0.7 * a);
    const gy = ry + rh - gh;
    d.rr(x, gy, rw, gh, 6);
    g.fillStyle = 'rgba(20,23,28,' + (0.42 + 0.35 * Math.max(hot, kO * .8)).toFixed(2) + ')'; g.fill();
    g.strokeStyle = hot > .08 ? m.c : 'rgba(242,239,232,.24)'; g.lineWidth = 1 + hot * .8; g.stroke();
    d.label(m.en, x + 9, gy + 14 * s, 8.5 * s, hot > .08 ? m.c : 'rgba(242,239,232,.5)', 1.4);
    d.han(m.zh, x + 9, gy + 29 * s, 11.5 * s, C.ivory, 800);
    if (m.badge && hot > .5) { g.globalAlpha = a * ez(sb(m.kk, .5, 1)); d.chip(x + rw - 62 * s, gy + 6, m.badge, true, 8.5 * s); g.globalAlpha = a; }
    const slotStep = gh * .6 / 4, slotTop = gy + gh * .34, slotH = slotStep - 7;
    for (let u = 0; u < 4; u++) {
      g.strokeStyle = 'rgba(242,239,232,.1)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x + 8, slotTop + (u + 1) * slotStep - 4); g.lineTo(x + rw - 8, slotTop + (u + 1) * slotStep - 4); g.stroke();
    }
    if (m.kk <= 0.02 && !mobile) d.label('EMPTY', x + rw - 44 * s, gy + 14 * s, 8 * s, 'rgba(242,239,232,.35)', 1.4);
    let row0 = 0;
    if (m.base) {
      const kb = ez(clamp(m.kk * 3, 0, 1));
      if (kb > 0) {
        g.globalAlpha = a * kb * .85;
        d.rr(x + 8, slotTop, rw - 16, slotH, 3);
        g.setLineDash([3, 4]); g.strokeStyle = 'rgba(242,239,232,.32)'; g.lineWidth = 1; g.stroke(); g.setLineDash([]);
        if (!mobile) d.han(m.base, x + 14, slotTop + slotH / 2 + 4 * s, 9 * s, 'rgba(242,239,232,.55)', 600);
        g.globalAlpha = a;
      }
      row0 = 1;
    }
    m.mods.forEach((mod, j) => {
      const rowIdx = row0 + j;
      if (rowIdx > 3) return;
      const km = ez(clamp(m.kk * 4 - rowIdx * .5, 0, 1));
      if (km <= 0) return;
      const sy = slotTop + rowIdx * slotStep;
      const sxOff = (1 - km) * 24;
      g.globalAlpha = a * km;
      d.rr(x + 8 + sxOff, sy, rw - 16, slotH, 3);
      g.fillStyle = m.c === C.blue ? 'rgba(62,155,255,.12)' : 'rgba(255,107,44,.12)'; g.fill();
      g.strokeStyle = m.c === C.blue ? 'rgba(62,155,255,.55)' : 'rgba(255,107,44,.55)'; g.lineWidth = 1; g.stroke();
      if (!mobile) d.han(mod, x + 14 + sxOff, sy + slotH / 2 + 4 * s, 9.5 * s, 'rgba(242,239,232,.88)', 700);
      d.node(x + rw - 14, sy + slotH / 2, 2, C.green, a * km);
      g.globalAlpha = a;
    });
    const kp = Math.max(ez(sb(m.kk, .55, 1)), ez(kC));
    if (kp > 0) {
      const py = ry + rh + 8;
      g.globalAlpha = a * kp;
      d.rr(x + 2, py, rw - 4, 38 * s, 4);
      g.fillStyle = 'rgba(9,11,14,.88)'; g.fill();
      g.strokeStyle = kC > 0 ? m.c : 'rgba(242,239,232,.25)'; g.lineWidth = 1.2; g.stroke();
      g.font = '700 ' + Math.max(10, 12.5 * s) + 'px "Space Grotesk",sans-serif'; g.fillStyle = C.ivory;
      g.fillText(m.price, x + 10, py + 16 * s);
      d.label(m.mo, x + 10, py + 30 * s, 8.5 * s, m.c === C.blue ? C.blue : C.orange, .3);
      g.globalAlpha = a;
    }
    if (kC > 0) {
      g.globalAlpha = ez(kC);
      d.tick(x + 8, ry + rh + 56 * s, 5.5 * s, C.green, 1);
      d.label(['4 模組', '8 模組(含A)', '12 模組(含B)'][i], x + 18, ry + rh + 59 * s, 8.5 * s, 'rgba(242,239,232,.65)', .6);
      g.globalAlpha = 1;
    }
    g.restore();
  });
  if (kC > 0) d.line(z.x, ry + rh + 66 * s, z.x + z.w, ry + rh + 66 * s, ez(kC), 'rgba(242,239,232,.16)', 1);
  if (kU > 0) {
    const a = ez(kU), ly1 = z.y + z.h * (mobile ? .84 : .82), ly2 = ly1 + z.h * .08;
    const lx0 = z.x + 4, lx1 = z.x + z.w - 4;
    g.save(); g.globalAlpha = a;
    d.line(lx0, ly1, lx1, ly1, kU, 'rgba(101,224,188,.6)', 2);
    if (e.tier === 'full' && kU >= .98) {
      g.setLineDash([6, 10]); g.lineDashOffset = -t * 30;
      g.strokeStyle = 'rgba(101,224,188,.9)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(lx0, ly1); g.lineTo(lx1, ly1); g.stroke();
      g.setLineDash([]); g.lineDashOffset = 0;
    }
    d.label('INCLUDED — 文字 AI 不限量', lx0, ly1 - 7 * s, 8.5 * s, C.green, 1.2);
    const k2u = ez(sb(kU, .15, 1));
    d.line(lx0, ly2, lx1, ly2, k2u, 'rgba(62,155,255,.6)', 2);
    for (let m2 = 1; m2 <= 8; m2++) {
      const fx2 = m2 / 9;
      if (fx2 > k2u) break;
      const mx = lx0 + (lx1 - lx0) * fx2;
      g.strokeStyle = 'rgba(62,155,255,.8)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(mx, ly2 - 4); g.lineTo(mx, ly2 + 4); g.stroke();
    }
    d.label('USAGE-BASED — 圖片・影片,用多少算多少', lx0, ly2 + 15 * s, 8.5 * s, C.blue, 1.2);
    meta.forEach((m, i) => {
      const ax = rx(i) + rw / 2;
      d.line(ax, ry + rh + 70 * s, ax, ly1 - 5, ez(sb(kU, i * .15, .6 + i * .15)), 'rgba(242,239,232,.25)', 1);
    });
    g.restore();
  }
  if (kO > 0) {
    const a = ez(kO);
    g.save(); g.globalAlpha = a;
    d.rr(z.x + 1, z.y + 1, z.w - 2, z.h - 2, 10);
    g.strokeStyle = 'rgba(255,107,44,.55)'; g.lineWidth = 1.4; g.stroke();
    d.label('PEAKQI OS — CONFIGURED', z.x + 12, z.y + 15 * s, 9 * s, C.orange, 1.8);
    meta.forEach((m, i) => {
      const on = e.tier === 'full' ? .5 + .5 * (Math.sin(t * 2.2 + i * 1.4) * .5 + .5) : 1;
      d.node(rx(i) + rw - 12, ry + rh * .44 + 8, 2.6, C.green, a * on);
    });
    d.tick(z.x + 12, z.y + z.h - 14 * s, 6 * s, C.green, a);
    d.label('RUNNING 24/7 · 不綁約 · 30 天保證', z.x + 26, z.y + z.h - 11 * s, 8.5 * s, 'rgba(242,239,232,.6)', 1.4);
    g.restore();
  }
}

// ---------- About:BUILT FROM REAL WORKFLOWS(截圖網路為 DOM;canvas 畫字格/導入流程/DAY 0–10/核心) ----------
function paintAbout(g, e) {
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const s = clamp(Math.min(z.w / 780, z.h / 520), .5, 1.2);
  const kF = k('frag'), kL = k('link'), kG = k('group'), kP = k('pipe'), kD = k('days'), kN = k('net'), kO = k('core');
  // S1 PEAKQI 結構網格大字(隨分群淡出)
  const gridA = ez(kF) * (1 - ez(kG)) * (1 - ez(kP));
  if (gridA > 0.02) {
    g.save(); g.globalAlpha = gridA;
    const fs = Math.min(z.w / 6.2, z.h / 3);
    g.font = '900 ' + fs + 'px "Space Grotesk",sans-serif';
    g.fillStyle = 'rgba(242,239,232,.06)';
    let x = z.x + 4;
    for (const ch of 'PEAKQI') {
      g.fillText(ch, x, z.y + z.h * .58);
      g.strokeStyle = 'rgba(242,239,232,.1)'; g.lineWidth = 1;
      g.strokeRect(x, z.y + z.h * .58 - fs * .74, g.measureText(ch).width, fs * .8);
      x += g.measureText(ch).width + fs * .08;
    }
    d.label('BUILT FROM REAL WORKFLOWS', z.x + 4, z.y + 18, 9.5 * s, 'rgba(242,239,232,.45)', 2.2);
    g.restore();
  }
  // S2 計數註記
  if (kL > 0 && kG < 1) {
    g.globalAlpha = ez(kL) * (1 - ez(kG));
    d.label('30+ LIVE SYSTEMS — CONNECTED', z.x + 4, z.y + z.h - 12, 9.5 * s, C.orange, 1.8);
    g.globalAlpha = 1;
  }
  if (kG > 0 && kP < 1) {
    g.globalAlpha = ez(kG) * (1 - ez(kP));
    d.label('8+ INDUSTRIES — GROUPED', z.x + 4, z.y + z.h - 12, 9.5 * s, C.blue, 1.8);
    g.globalAlpha = 1;
  }
  // S4 導入流程資料線
  if (kP > 0) {
    const a = ez(kP) * (1 - ez(kO) * .6);
    const py = z.y + z.h * (mobile ? .3 : .38);
    const names = ['理解場景', '整理資料', '建置模組', '測試校準', '上線'];
    const x0 = z.x + 14, x1 = z.x + z.w - 14;
    g.save(); g.globalAlpha = a;
    d.line(x0, py, x1, py, kP, 'rgba(242,239,232,.3)', 1.4);
    names.forEach((nm, i) => {
      const fx = i / (names.length - 1);
      const ka = ez(clamp(kP * 5 - i * .8, 0, 1));
      if (ka <= 0) return;
      const nx = x0 + (x1 - x0) * fx;
      g.globalAlpha = a * ka;
      d.node(nx, py, i === 4 ? 4 * s : 3 * s, i === 4 ? C.green : C.orange, 1, kP < fx);
      d.han(nm, nx - 26 * s, py + 20 * s, 10.5 * s, 'rgba(242,239,232,.82)', 700);
      d.label('0' + (i + 1), nx - 6 * s, py - 12 * s, 8 * s, 'rgba(242,239,232,.4)', 1);
      g.globalAlpha = a;
    });
    g.restore();
  }
  // S5 DAY 0–10 節點
  if (kD > 0) {
    const a = ez(kD) * (1 - ez(kO) * .6);
    const dy = z.y + z.h * (mobile ? .5 : .58);
    const days = ['DAY 0', 'DAY 1–4', 'DAY 5–7', 'DAY 7–10', 'DAY 10'];
    const x0 = z.x + 14, x1 = z.x + z.w - 14;
    g.save(); g.globalAlpha = a;
    d.line(x0, dy, x1, dy, kD, 'rgba(62,155,255,.5)', 1.6);
    days.forEach((nm, i) => {
      const fx = i / (days.length - 1);
      const ka = ez(clamp(kD * 5 - i * .7, 0, 1));
      if (ka <= 0) return;
      const nx = x0 + (x1 - x0) * fx;
      g.globalAlpha = a * ka;
      d.node(nx, dy, 3 * s, i === 4 ? C.green : C.blue, 1);
      d.label(nm, nx - 16 * s, dy - 10 * s, 8.5 * s, i === 4 ? C.green : 'rgba(242,239,232,.65)', .8);
      g.globalAlpha = a;
    });
    d.tick(x0, dy + 20 * s, 6 * s, C.green, a * ez(sb(kD, .7, 1)));
    g.globalAlpha = a * ez(sb(kD, .7, 1));
    d.han('最快 10 個工作天上線', x0 + 14 * s, dy + 24 * s, 11 * s, C.ivory, 800);
    g.restore();
  }
  // S7 品牌核心
  if (kO > 0) {
    const a = ez(kO);
    const cx = z.x + z.w * (mobile ? .5 : .66), cy = z.y + z.h * .46;
    g.save(); g.globalAlpha = a;
    d.ring(cx, cy, 46 * s, kO, C.orange, 2.4);
    d.ring(cx, cy, 62 * s, ez(sb(kO, .3, 1)), 'rgba(242,239,232,.2)', 1);
    g.font = '800 ' + 15 * s + 'px "Space Grotesk",sans-serif'; g.fillStyle = C.ivory; g.textAlign = 'center';
    g.fillText('PEAKQI', cx, cy - 2);
    g.font = '600 ' + 8 * s + 'px "Space Grotesk",sans-serif'; g.fillStyle = 'rgba(242,239,232,.55)';
    g.fillText('OPERATING CORE', cx, cy + 14 * s);
    g.textAlign = 'left';
    const on = e.tier === 'full' ? .5 + .5 * (Math.sin(t * 2.4) * .5 + .5) : 1;
    d.node(cx, cy - 26 * s, 2.6, C.green, a * on);
    d.label('BUILT FROM REAL WORKFLOWS — SINCE DAY ONE OF YOUR PROCESS', z.x + 4, z.y + z.h - 10, 8.5 * s, 'rgba(242,239,232,.5)', 1.4);
    g.restore();
  }
}

// ---------- Demo:BUILD YOUR DEMO SCENE(控制台為 DOM;canvas 畫資料線/取景框/摘要勾/導流箭頭) ----------
function paintDemo(g, e) {
  const { zone: z, k, C, d, mobile, t, w, h } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const s = clamp(Math.min(z.w / 520, z.h / 420), .5, 1.2);
  const kW = k('wait'), kI = k('ind'), kF = k('flow'), kB = k('build'), kM = k('match'), kS = k('sum'), kG = k('go');
  const midY = z.y + z.h * .28;
  // S1 未完成資料線 → 控制台
  if (kW > 0) {
    const a = ez(kW);
    g.save(); g.globalAlpha = a;
    const x0 = mobile ? z.x - 6 : Math.max(8, z.x - w * .3);
    d.line(x0, midY, z.x - 6, midY, kW, C.orange, 2);
    g.setLineDash([4, 8]); g.strokeStyle = 'rgba(242,239,232,.3)'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(z.x - 6, midY); g.lineTo(z.x + z.w * .3, midY); g.stroke(); g.setLineDash([]);
    d.node(x0 + 2, midY, 3.5, C.orange, a);
    const cl = 16 * s;
    g.strokeStyle = 'rgba(242,239,232,.4)'; g.lineWidth = 1.4;
    [[z.x - 4, z.y - 4, 1, 1], [z.x + z.w + 4, z.y - 4, -1, 1], [z.x - 4, z.y + z.h + 4, 1, -1], [z.x + z.w + 4, z.y + z.h + 4, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      g.beginPath(); g.moveTo(cx + dx * cl, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + dy * cl); g.stroke();
    });
    if (kI < .3) {
      d.label('等待輸入你的場景', z.x + 2, z.y - 10 * s, 9.5 * s, 'rgba(242,239,232,.55)', 1.6);
      if (e.tier === 'full' && Math.sin(t * 3.4) > 0) { g.fillStyle = C.orange; g.fillRect(z.x + 118 * s, z.y - 18 * s, 2, 10 * s); }
    }
    g.restore();
  }
  // S2/S3 節點進場側標
  if (kI > 0 && kB < 1) {
    const a = ez(kI) * (1 - ez(kB) * .7);
    g.save(); g.globalAlpha = a;
    for (let i = 0; i < 5; i++) {
      const ka = ez(clamp(kI * 3 - i * .3, 0, 1));
      d.node(z.x - 14, z.y + z.h * .18 + i * 12 * s, 2.2, C.orange, a * ka);
    }
    d.label('INDUSTRY', z.x - 14, z.y + z.h * .18 - 10 * s, 7.5 * s, C.orange, 1.2);
    g.restore();
  }
  if (kF > 0 && kB < 1) {
    const a = ez(kF) * (1 - ez(kB) * .7);
    g.save(); g.globalAlpha = a;
    for (let i = 0; i < 5; i++) {
      const ka = ez(clamp(kF * 3 - i * .3, 0, 1));
      d.node(z.x - 14, z.y + z.h * .52 + i * 12 * s, 2.2, C.blue, a * ka);
    }
    d.label('FRICTION', z.x - 14, z.y + z.h * .52 - 10 * s, 7.5 * s, C.blue, 1.2);
    g.restore();
  }
  // S4 組裝連線
  if (kB > 0) {
    const a = ez(kB);
    d.line(z.x + 14, z.y + z.h * .3, z.x + 14, z.y + z.h * .58, kB, 'rgba(255,107,44,.55)', 1.6);
    g.globalAlpha = a; d.node(z.x + 14, z.y + z.h * .3, 3, C.orange, a); d.node(z.x + 14, z.y + z.h * .58, 3, C.blue, a * ez(sb(kB, .6, 1))); g.globalAlpha = 1;
  }
  // S5 相似場景取景框
  if (kM > 0 && kG < 1) {
    const a = ez(kM) * (1 - ez(kG) * .6);
    g.save(); g.globalAlpha = a;
    g.strokeStyle = C.green; g.lineWidth = 1.4;
    const fy = z.y + z.h * .6, fh = z.h * .3, cl = 12 * s;
    [[z.x + 2, fy, 1, 1], [z.x + z.w - 2, fy, -1, 1], [z.x + 2, fy + fh, 1, -1], [z.x + z.w - 2, fy + fh, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      g.beginPath(); g.moveTo(cx + dx * cl, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + dy * cl); g.stroke();
    });
    d.label('SIMILAR SCENE', z.x + 2, fy - 6 * s, 8 * s, C.green, 1.4);
    g.restore();
  }
  // S6 摘要勾
  if (kS > 0) {
    const a = ez(kS);
    g.save(); g.globalAlpha = a;
    ['產業', '流程', '模組', '時間'].forEach((tx, i) => {
      const ka = ez(clamp(kS * 4 - i * .5, 0, 1));
      if (ka <= 0) return;
      g.globalAlpha = a * ka;
      d.tick(z.x + 8 + i * 74 * s, z.y + z.h + 16 * s, 5.5 * s, C.green, 1);
      d.han(tx, z.x + 18 + i * 74 * s, z.y + z.h + 20 * s, 9.5 * s, 'rgba(242,239,232,.7)', 600);
    });
    g.restore();
  }
  // S7 導向表單
  if (kG > 0) {
    const a = ez(kG);
    g.save(); g.globalAlpha = a;
    const gx = z.x + z.w * .5, gy0 = z.y + z.h + 6, gy1 = Math.min(h - 12, gy0 + 44 * s);
    d.line(gx, gy0, gx, gy1, kG, C.orange, 2);
    const off = e.tier === 'full' ? Math.sin(t * 2.6) * 3 : 0;
    g.strokeStyle = C.orange; g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(gx - 6 * s, gy1 - 8 * s + off); g.lineTo(gx, gy1 + off); g.lineTo(gx + 6 * s, gy1 - 8 * s + off); g.stroke();
    d.label('TO FORM', gx + 12 * s, gy1 - 4 * s, 8.5 * s, C.orange, 1.6);
    d.rr(z.x - 4, z.y - 4, z.w + 8, z.h + 8, 12);
    g.strokeStyle = 'rgba(255,107,44,.5)'; g.lineWidth = 1.4; g.stroke();
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
