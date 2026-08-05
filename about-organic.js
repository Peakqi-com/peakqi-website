// /about hero「生長的墨枝」painter:有機生成 × 高端時尚打版 × 工程結晶
// 五核心 = 五種生長型態:
//   idea 創意     種子迸發,枝系野長,尖端有生長火花
//   craft 細節    細脈補齊,打版刻度與導圓規線(couture pattern-draft)
//   content 數位內容 枝頭結出「內容框」,樹液光點沿枝流動
//   culture 文化轉型 墨圈(enso)掃過,整株由象牙換季成青
//   tech 技術力   節點結晶成架構格,掃描線走過,底下仍在呼吸
// 樹以固定種子生成於 0..1 正規化空間,繪製時映射到 zone —— zone 逐幀跟隨
// 文案收合也不會重長;整檔無第二個 rAF,一切時間動態吃引擎傳入的 t。
import { painters } from './hero-scenes.js';

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const ez = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── 樹生成(正規化座標,y 向下;基部在 (0.5, 1)) ──────────────────
function buildTree(mobile) {
  const r = rng(mobile ? 20260805 : 19911024);
  const maxLv = mobile ? 4 : 5;
  const segs = [], tips = [], joints = [];
  function grow(x0, y0, ang, len, lv, ordBase) {
    if (lv > maxLv) { tips.push({ x: x0, y: y0, ph: r() * 6.28, ord: ordBase }); return; }
    const kids = lv === 0 ? 3 : (r() < .3 && lv < 3 ? 3 : 2);
    const x1 = x0 + Math.cos(ang) * len;
    const y1 = y0 + Math.sin(ang) * len;
    const bend = (r() - .5) * len * .9;
    const mx = (x0 + x1) / 2 - Math.sin(ang) * bend;
    const my = (y0 + y1) / 2 + Math.cos(ang) * bend;
    const ord = clamp(ordBase + (r() * .5 + .5) * (1 / (maxLv + 1)), 0, .985);
    segs.push({ x0, y0, cx: mx, cy: my, x1, y1, lv, ord: ordBase, ph: r() * 6.28 });
    if (lv <= 1) joints.push({ x: x1, y: y1, lv, ph: r() * 6.28 });
    for (let i = 0; i < kids; i++) {
      const spread = (i - (kids - 1) / 2) * (.55 + r() * .3) + (r() - .5) * .34;
      grow(x1, y1, ang + spread, len * (.6 + r() * .16), lv + 1, ord);
    }
  }
  grow(.5, 1.0, -Math.PI / 2 + (r() - .5) * .1, mobile ? .3 : .32, 0, 0);
  segs.sort((a, b) => a.ord - b.ord);
  tips.forEach((tp, i) => { tp.i = i; });
  // 亂數種子長出的樹冠常偏一邊:量外接框後整株水平置中
  let mnx = 1, mxx = 0;
  segs.forEach((s) => { mnx = Math.min(mnx, s.x0, s.x1, s.cx); mxx = Math.max(mxx, s.x0, s.x1, s.cx); });
  const dx = .5 - (mnx + mxx) / 2;
  segs.forEach((s) => { s.x0 += dx; s.cx += dx; s.x1 += dx; });
  tips.forEach((tp) => { tp.x += dx; });
  joints.forEach((j) => { j.x += dx; });
  return { segs, tips, joints, maxLv };
}
let _tree = { m: null, t: null };
function tree(mobile) {
  if (_tree.m !== mobile) _tree = { m: mobile, t: buildTree(mobile) };
  return _tree.t;
}

// 二次貝茲 de Casteljau:取 0..q 的局部曲線
function part(x0, y0, cx, cy, x1, y1, q) {
  const ax = lerp(x0, cx, q), ay = lerp(y0, cy, q);
  const bx = lerp(cx, x1, q), by = lerp(cy, y1, q);
  return { cx: ax, cy: ay, x1: lerp(ax, bx, q), y1: lerp(ay, by, q) };
}
// 二次貝茲上取點
function qAt(s, u) {
  const w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
  return { x: w0 * s.x0 + w1 * s.cx + w2 * s.x1, y: w0 * s.y0 + w1 * s.cy + w2 * s.y1 };
}

painters.aboutOrganic = function paintAboutOrganic(g, e) {
  const { zone: z, k, C, d, mobile, t, aid } = e;
  const T = tree(mobile);
  const kI = ez(k('idea')), kC = ez(k('craft')), kN = ez(k('content')), kU = ez(k('culture')), kT = ez(k('tech'));
  // 生長總量:創意長主幹、細節補脈、內容前全株成形
  const G = .42 * kI + .3 * kC + .28 * kN;
  if (G <= 0.001) return;
  // 風擺加強版:基礎振幅加倍 + 每 ~16s 一陣風(gust 最高再放大 2.4 倍),樹要看得出在活
  const gust = 1 + 1.4 * Math.pow(Math.max(0, Math.sin(t * .38)), 3);
  const sway = (lv, ph) => Math.sin(t * .8 + ph) * (lv * lv) * (mobile ? .8 : 1) * gust;
  const X = (nx) => z.x + nx * z.w;
  const Y = (ny) => z.y + ny * z.h;
  // 換季掃描角(culture):由樹心向外的角度波前
  const ccx = .5, ccy = mobile ? .48 : .45;
  const sweep = kU * Math.PI * 2.15;
  const segCol = (s) => {
    const angN = Math.atan2(s.cy - ccy, s.cx - ccx) + Math.PI * .5; // 從頂端順時針
    const a2 = angN < 0 ? angN + Math.PI * 2 : angN;
    const turned = kU > 0.02 && a2 < sweep;
    return turned ? C.green : C.ivory;
  };

  g.save();
  // ── 枝系本體 ──
  T.segs.forEach((s) => {
    if (s.ord >= G) return;
    const q = ez(sub(G, s.ord, s.ord + .1));
    // 細節景之前,末梢兩級只到骨架;craft 進場才補滿細脈
    const fine = s.lv >= T.maxLv - 1;
    // 亮度與線寬加粗版:實機回饋「幾乎看不清楚」——主幹要像主幹
    const a = (fine ? .3 + .55 * Math.max(kC, kN) : .62 + .34 / (s.lv + 1)) * (1 - kT * .12);
    const wdt = Math.max(.8, (mobile ? 4.4 : 4.8) / (s.lv + 1));
    const sw = sway(s.lv, s.ph), swm = sw * .6;
    const p2 = part(s.x0, s.y0, s.cx, s.cy, s.x1, s.y1, q);
    g.strokeStyle = segCol(s) === C.green
      ? 'rgba(101,224,188,' + a.toFixed(3) + ')'
      : 'rgba(242,239,232,' + a.toFixed(3) + ')';
    g.lineWidth = wdt; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(X(s.x0), Y(s.y0));
    g.quadraticCurveTo(X(p2.cx) + swm, Y(p2.cy), X(p2.x1) + sw, Y(p2.y1));
    g.stroke();
    // 生長前緣:剛長出的那一小段掛一顆橘色生長點(創意景最活躍)
    if (q < 1 && q > .05) {
      const gp2 = qAt(s, q);
      const ga = (.5 + .5 * Math.sin(t * 4 + s.ph)) * (1 - kU);
      d.node(X(gp2.x) + sw, Y(gp2.y), mobile ? 2 : 2.4, C.orange, .35 + .55 * ga);
    }
  });

  // ── S1 創意:飄浮的種子(常駐但創意景最亮) ──
  const seedA = .18 + .6 * kI * (1 - kN);
  if (seedA > .05) {
    for (let i = 0; i < 10; i++) {
      const ph = i * 2.4;
      const sx = .5 + Math.sin(t * .3 + ph) * (.3 + i * .022);
      const sy = .34 + Math.cos(t * .24 + ph * 1.7) * .26 - i * .012;
      d.node(X(sx), Y(sy), i % 3 ? 1.7 : 2.6, i % 4 === 3 ? C.blue : C.orange, seedA * (.4 + .6 * Math.abs(Math.sin(t * 1.1 + ph))));
    }
  }

  // ── S2 細節:打版刻度 + 導圓規線 ──
  if (kC > .02) {
    const aC = kC * (1 - kU * .6);
    g.strokeStyle = 'rgba(242,239,232,' + (.6 * aC).toFixed(3) + ')';
    g.lineWidth = 1;
    T.segs.forEach((s, i) => {
      if (s.lv < 2 || s.lv > 3 || i % 3 || s.ord >= G) return;
      const kk = ez(sub(kC, (i % 7) * .09, .45 + (i % 7) * .09));
      if (kk <= .02) return;
      [.35, .7].forEach((u) => {
        const p0 = qAt(s, u), p1 = qAt(s, u + .02);
        const dx = X(p1.x) - X(p0.x), dy = Y(p1.y) - Y(p0.y);
        const L = Math.hypot(dx, dy) || 1;
        const nx2 = -dy / L * 3.4 * kk, ny2 = dx / L * 3.4 * kk;
        g.beginPath();
        g.moveTo(X(p0.x) - nx2, Y(p0.y) - ny2);
        g.lineTo(X(p0.x) + nx2, Y(p0.y) + ny2);
        g.stroke();
      });
    });
    // 導圓:三個關節上的虛線小圓(打版規線)
    g.setLineDash([2.5, 3.5]);
    T.joints.forEach((j, i) => {
      if (i % 2) return;
      const kk = ez(sub(kC, .2 + i * .07, .7 + i * .07));
      if (kk <= .02) return;
      g.strokeStyle = 'rgba(242,239,232,' + (.45 * aC * kk).toFixed(3) + ')';
      g.beginPath();
      g.arc(X(j.x), Y(j.y), (mobile ? 7 : 9) * kk, 0, Math.PI * 2);
      g.stroke();
    });
    g.setLineDash([]);
  }

  // ── S3 數位內容:枝頭內容框 + 樹液光點 ──
  if (kN > .02 || kU > .02) {
    T.tips.forEach((tp) => {
      const kk = ez(sub(kN, (tp.i % 9) * .06, .5 + (tp.i % 9) * .06));
      if (kk <= .02) return;
      const wither = ez(sub(kU, .15 + (tp.i % 5) * .1, .55 + (tp.i % 5) * .1)); // 換季時凋零
      const a = kk * (1 - wither);
      if (a <= .02) return;
      const swx = Math.sin(t * .55 + tp.ph) * (mobile ? 1.6 : 2.2);
      const bw = (mobile ? 11 : 15) * kk, bh = bw * .72;
      const bx = X(tp.x) + swx - bw / 2, by = Y(tp.y) - bh / 2;
      g.globalAlpha = a;
      d.rr(bx, by, bw, bh, 2);
      g.fillStyle = 'rgba(9,11,14,.75)'; g.fill();
      g.strokeStyle = tp.i % 3 ? 'rgba(62,155,255,.75)' : 'rgba(255,107,44,.7)';
      g.lineWidth = .9; g.stroke();
      g.strokeStyle = 'rgba(242,239,232,.55)'; g.lineWidth = .8;
      g.beginPath();
      g.moveTo(bx + bw * .2, by + bh * .42); g.lineTo(bx + bw * .8, by + bh * .42);
      g.moveTo(bx + bw * .2, by + bh * .66); g.lineTo(bx + bw * .62, by + bh * .66);
      g.stroke();
      g.globalAlpha = 1;
      // 凋零 → 花瓣飄離
      if (wither > .05 && wither < .95) {
        const px2 = bx + bw / 2 + wither * 26 * Math.sin(tp.ph * 3);
        const py2 = by - wither * (mobile ? 30 : 44);
        d.node(px2, py2, 1.6, C.green, (1 - wither) * .8);
      }
    });
    // 樹液光點:沿三條中層枝循環流動(內容=會一直長出來)
    const sapN = mobile ? 6 : 9;
    const flow = T.segs.filter((s) => s.lv === 1 || s.lv === 2);
    for (let i = 0; i < sapN && flow.length; i++) {
      const s = flow[(i * 5) % flow.length];
      if (s.ord >= G) continue;
      const u = (t * (.22 + i * .04) + i * .37) % 1;
      const p0 = qAt(s, u);
      d.node(X(p0.x), Y(p0.y), 2.2, i % 2 ? C.blue : C.orange, (.25 + .65 * kN) * (1 - kT * .4));
    }
  }

  // ── S4 文化轉型:墨圈 enso 掃過 ──
  if (kU > .02 && kU < 1) {
    const R = Math.min(z.w, z.h) * (mobile ? .34 : .4) * (.8 + .2 * kU);
    const a0 = -Math.PI / 2;
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(101,224,188,' + (.55 * Math.sin(Math.PI * kU)).toFixed(3) + ')';
    g.lineWidth = mobile ? 2.6 : 3.4;
    g.beginPath(); g.arc(X(ccx), Y(ccy), R, a0, a0 + sweep); g.stroke();
    g.strokeStyle = 'rgba(242,239,232,' + (.22 * Math.sin(Math.PI * kU)).toFixed(3) + ')';
    g.lineWidth = 1;
    g.beginPath(); g.arc(X(ccx), Y(ccy), R + 5, a0, a0 + sweep * .96); g.stroke();
    // 筆鋒:弧前端一點濃墨
    const tipA = a0 + sweep;
    d.node(X(ccx) + Math.cos(tipA) * R, Y(ccy) + Math.sin(tipA) * R, 3.2, C.green, .9 * Math.sin(Math.PI * kU) + .1);
  }

  // ── S5 技術力:節點結晶 + 架構格 + 掃描線 ──
  if (kT > .02) {
    const J = T.joints;
    g.strokeStyle = 'rgba(101,224,188,' + (.34 * kT).toFixed(3) + ')';
    g.lineWidth = .9;
    for (let i = 0; i < J.length; i++) {
      const kk = ez(sub(kT, i * .05, .5 + i * .05));
      if (kk <= .02) continue;
      const j0 = J[i], j1 = J[(i + 2) % J.length];
      g.globalAlpha = kk;
      g.beginPath(); g.moveTo(X(j0.x), Y(j0.y)); g.lineTo(X(j1.x), Y(j1.y)); g.stroke();
      g.globalAlpha = 1;
      d.node(X(j0.x), Y(j0.y), 2.4, C.green, kk * (.5 + .5 * Math.sin(t * 2 + j0.ph)));
    }
    // 基座接地線 + 掃描線
    g.strokeStyle = 'rgba(242,239,232,' + (.25 * kT).toFixed(3) + ')';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(X(.2), Y(1) + .5); g.lineTo(X(.8), Y(1) + .5); g.stroke();
    const sy2 = Y((t * .09) % 1);
    g.strokeStyle = 'rgba(101,224,188,' + (.16 * kT).toFixed(3) + ')';
    g.beginPath(); g.moveTo(z.x, sy2); g.lineTo(z.x + z.w, sy2); g.stroke();
  }

  // ── 場景字幕:時尚編輯式小標(左下) ──
  const names = { idea: 'CREATIVITY', craft: 'DETAIL', content: 'DIGITAL CONTENT', culture: 'CULTURE SHIFT', tech: 'ENGINEERING' };
  const idx = { idea: '01', craft: '02', content: '03', culture: '04', tech: '05' }[aid] || '01';
  if (names[aid]) {
    const fy = z.y + z.h - 6;
    d.label('PEAKQI CORE ' + idx + ' / 05', z.x + 2, fy - (mobile ? 13 : 15), mobile ? 8 : 8.5, C.orange, 1.6);
    d.label(names[aid], z.x + 2, fy, mobile ? 9.5 : 10.5, 'rgba(242,239,232,.6)', 2.2);
  }
  g.restore();
};
