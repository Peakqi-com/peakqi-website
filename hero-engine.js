// PeakQi Hero 捲動分鏡引擎:pinned scroll 敘事(程序式 Canvas + 可替換影格序列)
export function createHeroEngine({ refs, manifest }) {
  const IVORY = '#F2EFE8', ORANGE = '#FF6B2C', BLUE = '#3E9BFF', GREEN = '#65E0BC';
  const PANEL = '#14171C', PANEL_B = 'rgba(242,239,232,.16)';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const ez = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const F = (wt, px) => wt + ' ' + px + 'px "Space Grotesk","Noto Sans TC",sans-serif';

  let canvas = null, ctx = null, wrap = null, stage = null;
  let W = 0, H = 0, DPR = 1, SC = 1, OX = 0, OY = 0, isMobile = false;
  let wrapTop = 0, wrapH = 1, vh = 1;
  let p = 0, sp = 0, raf = 0, t0 = performance.now();
  let destroyed = false, visible = true, staticOn = false, stopped = false;
  let io = null, mql = null, resizeTmr = 0, tries = 0;
  let seq = null, inflight = 0, loopN = 0, drawN = 0;

  // 設計座標 1200×760
  const DW = 1200, DH = 760;
  const CF = { x: 340, y: 120, w: 800, h: 560, head: 46, pad: 14, gap: 12 };
  const SW = (CF.w - CF.pad * 2 - CF.gap * 2) / 3;
  const SH = (CF.h - CF.head - CF.pad * 2 - CF.gap) / 2;
  const slot = (i) => {
    const c = i % 3, r = Math.floor(i / 3);
    return { x: CF.x + CF.pad + c * (SW + CF.gap) + SW / 2, y: CF.y + CF.head + CF.pad + r * (SH + CF.gap) + SH / 2, w: SW, h: SH };
  };
  const wins = [
    { type: 'line', title: 'LINE・23:41', mt: '客服', tick: '接住詢問', w: 250, h: 180, cx: 610, cy: 200, rot: -6, dep: 1.15, sx: 0, sy: 0 },
    { type: 'excel', title: '名單_v7.xlsx', mt: 'CRM', tick: '建立紀錄', w: 260, h: 170, cx: 920, cy: 160, rot: 4, dep: 0.85, sx: 70, sy: 40 },
    { type: 'quote', title: '報價單.pdf', mt: '報價', tick: '產生報價單', w: 220, h: 160, cx: 1080, cy: 330, rot: 7, dep: 1.3, sx: 0, sy: 0 },
    { type: 'social', title: '社群排程', mt: '行銷', tick: '排入內容', w: 240, h: 170, cx: 640, cy: 470, rot: -3, dep: 1.0, sx: 0, sy: 0 },
    { type: 'task', title: '任務清單', mt: '專案', tick: '建立任務', w: 250, h: 170, cx: 950, cy: 520, rot: 5, dep: 1.15, sx: 60, sy: 50 },
    { type: 'data', title: '營運數據', mt: '數據', tick: '更新儀表板', w: 210, h: 160, cx: 780, cy: 320, rot: -2, dep: 0.9, sx: 0, sy: 0 },
    { type: 'note', title: '備忘錄', mt: '', tick: '', w: 150, h: 120, cx: 520, cy: 590, rot: -8, dep: 1.3, sx: 0, sy: 30 }
  ];
  const X = (x) => OX + x * SC, Y = (y) => OY + y * SC, S = (v) => v * SC;
  const px = (v) => Math.max(10, Math.round(v * SC));

  // ---------- 影格序列(manifest.enabled 時啟用) ----------
  function pickTier() {
    const t = manifest && manifest.tiers;
    if (!t) return null;
    if (W >= (t.desktop?.minWidth ?? 1100)) return t.desktop;
    if (W >= (t.tablet?.minWidth ?? 700)) return t.tablet;
    return t.mobile;
  }
  function frameSrc(tier, i) { return tier.path + tier.prefix + String(i + 1).padStart(tier.pad, '0') + '.' + tier.ext; }
  function initSeq() {
    if (!manifest || !manifest.enabled) return;
    const tier = pickTier();
    if (!tier) return;
    seq = { tier, count: tier.frameCount, frames: new Array(tier.frameCount), pending: new Set(), fails: 0 };
    ensureFrames(0);
  }
  function loadFrame(i) {
    if (!seq || seq.frames[i] || seq.pending.has(i) || inflight >= 3) return;
    seq.pending.add(i); inflight++;
    const done = () => { seq && seq.pending.delete(i); inflight--; };
    const fail = () => { done(); if (seq && ++seq.fails > 6) seq = null; };
    if (window.createImageBitmap) {
      fetch(frameSrc(seq.tier, i)).then(r => { if (!r.ok) throw 0; return r.blob(); })
        .then(b => createImageBitmap(b)).then(bm => { if (seq) seq.frames[i] = bm; done(); }).catch(fail);
    } else {
      const im = new Image();
      im.onload = () => { if (seq) seq.frames[i] = im; done(); };
      im.onerror = fail;
      im.src = frameSrc(seq.tier, i);
    }
  }
  function ensureFrames(center) {
    if (!seq) return;
    for (let o = 0; o <= 6; o++) { loadFrame(clamp(center + o, 0, seq.count - 1)); if (o) loadFrame(clamp(center - o, 0, seq.count - 1)); }
    for (let i = 0; i < seq.count; i++) {
      const f = seq.frames[i];
      if (f && Math.abs(i - center) > 24) { if (f.close) f.close(); seq.frames[i] = null; }
    }
  }
  function drawSeq(q) {
    if (!seq) return false;
    const fi = Math.round(clamp(q, 0, 1) * (seq.count - 1));
    ensureFrames(fi);
    let img = seq.frames[fi];
    if (!img) { for (let o = 1; o < 10 && !img; o++) img = seq.frames[fi - o] || seq.frames[fi + o]; }
    if (!img) return false;
    const iw = img.width, ih = img.height, s = Math.max(W / iw, H / ih);
    ctx.drawImage(img, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
    return true;
  }

  // ---------- 幾何/繪圖工具 ----------
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function winPos(win, i, q, t) {
    if (!win.mt) { // note:無 slot
      const drift = Math.sin(t * 0.6 + i) * 5;
      const cap = 1 - ez(sub(q, 0.3, 0.4)); // S3 被吸收
      return { x: X(win.cx + win.sx * ez(sub(q, 0.13, 0.25))), y: Y(win.cy + drift + win.sy * ez(sub(q, 0.13, 0.25)) + (win.dep - 1) * ez(sub(q, 0, 0.42)) * 120), w: S(win.w) * cap, h: S(win.h) * cap, rot: win.rot * Math.PI / 180, a: cap, dock: 0 };
    }
    const mi = wins.indexOf(win), d0 = 0.58 + mi * 0.028, dock = ez(sub(q, d0, d0 + 0.06));
    const drift = Math.sin(t * 0.5 + i * 1.7) * 6 * (1 - dock);
    const stray = ez(sub(q, 0.13, 0.25)) * (1 - dock);
    const par = (win.dep - 1) * ez(sub(q, 0, 0.42)) * 130 * (1 - dock);
    const sl = slot(mi);
    const cx = lerp(X(win.cx + win.sx * stray), X(sl.x), dock);
    const cy = lerp(Y(win.cy + win.sy * stray + par + drift), Y(sl.y), dock);
    const w = lerp(S(win.w), S(sl.w), dock), h = lerp(S(win.h), S(sl.h), dock);
    const rot = win.rot * Math.PI / 180 * (1 - dock);
    return { x: cx, y: cy, w, h, rot, a: 1, dock, d0 };
  }
  function drawWindow(win, i, q, t, pos) {
    const ap = ez(sub(q, 0.004 + i * 0.012, 0.05 + i * 0.012));
    if (ap <= 0 || pos.a <= 0) return;
    const dim = 1 - 0.5 * ez(sub(q, 0.44, 0.5)) * (1 - ez(sub(q, 0.56, 0.63))) * (win.mt ? 1 : 0);
    ctx.save();
    ctx.globalAlpha = ap * pos.a * dim;
    ctx.translate(pos.x, pos.y); ctx.rotate(pos.rot);
    const w = pos.w, h = pos.h, x = -w / 2, y = -h / 2;
    if (!isMobile) { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10; }
    if (win.type === 'note') {
      ctx.fillStyle = '#E6E0D2'; rr(x, y, w, h, S(4)); ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.fillStyle = 'rgba(9,11,14,.85)'; ctx.font = F(700, px(12)); ctx.textAlign = 'left';
      ctx.fillText('回覆王先生!!', x + S(14), y + S(34));
      ctx.fillStyle = 'rgba(9,11,14,.5)'; ctx.font = F(400, px(10.5));
      ctx.fillText('(三天前)', x + S(14), y + S(56));
      ctx.restore(); return;
    }
    ctx.fillStyle = PANEL; rr(x, y, w, h, S(6)); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = pos.dock > 0.9 ? 'rgba(255,107,44,.35)' : PANEL_B; ctx.lineWidth = 1; rr(x, y, w, h, S(6)); ctx.stroke();
    // 標題列
    const th = S(26);
    ctx.strokeStyle = 'rgba(242,239,232,.1)'; ctx.beginPath(); ctx.moveTo(x, y + th); ctx.lineTo(x + w, y + th); ctx.stroke();
    ctx.fillStyle = win.type === 'line' ? GREEN : win.type === 'data' ? BLUE : 'rgba(242,239,232,.4)';
    ctx.beginPath(); ctx.arc(x + S(13), y + th / 2, S(3.5), 0, 7); ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = F(600, px(11));
    ctx.fillStyle = 'rgba(242,239,232,.75)';
    const label = pos.dock > 0.5 ? win.mt : win.title;
    ctx.fillText(label, x + S(24), y + th / 2 + 0.5);
    // 未讀/警示(S1–S2)
    const chaosA = 1 - pos.dock;
    if (chaosA > 0.05) {
      if (win.type === 'line') {
        const n = 1 + Math.floor(ez(sub(q, 0.08, 0.24)) * 4);
        ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(x + w - S(16), y + th / 2, S(8), 0, 7); ctx.fill();
        ctx.fillStyle = '#090B0E'; ctx.font = F(700, px(10)); ctx.textAlign = 'center';
        ctx.fillText(String(n), x + w - S(16), y + th / 2 + 0.5);
      } else if ((win.type === 'excel' || win.type === 'task') && q > 0.13 && q < 0.45) {
        ctx.globalAlpha *= 0.4 + 0.6 * Math.abs(Math.sin(t * 3));
        ctx.fillStyle = ORANGE; ctx.font = F(700, px(12)); ctx.textAlign = 'center';
        ctx.fillText('!', x + w - S(14), y + th / 2 + 0.5);
        ctx.globalAlpha = ap * pos.a * dim;
      }
    }
    drawBody(win, q, t, x, y + th, w, h - th, pos.dock);
    ctx.restore();
    // 功能 tick(入座後短暫顯示)
    if (win.mt && pos.d0) {
      const tk = ez(sub(q, pos.d0 + 0.055, pos.d0 + 0.075)) * (1 - ez(sub(q, pos.d0 + 0.13, pos.d0 + 0.16)));
      if (tk > 0.02) {
        ctx.save(); ctx.globalAlpha = tk;
        const tx = pos.x, ty = pos.y - pos.h / 2 - S(16);
        ctx.font = F(600, px(11)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tw = ctx.measureText('✓ ' + win.tick).width + S(20);
        ctx.fillStyle = 'rgba(101,224,188,.14)'; rr(tx - tw / 2, ty - S(11), tw, S(22), S(11)); ctx.fill();
        ctx.strokeStyle = 'rgba(101,224,188,.5)'; rr(tx - tw / 2, ty - S(11), tw, S(22), S(11)); ctx.stroke();
        ctx.fillStyle = GREEN; ctx.fillText('✓ ' + win.tick, tx, ty + 0.5);
        ctx.restore();
      }
    }
  }
  function drawBody(win, q, t, x, y, w, h, dock) {
    const pad = S(12);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (win.type === 'line') {
      ctx.fillStyle = 'rgba(242,239,232,.14)'; rr(x + pad, y + pad, w * 0.56, S(22), S(8)); ctx.fill();
      ctx.fillStyle = 'rgba(101,224,188,' + (0.25 + dock * 0.5) + ')'; rr(x + w - pad - w * 0.5, y + pad + S(30), w * 0.5, S(22), S(8)); ctx.fill();
      if (dock > 0.5) {
        ctx.fillStyle = GREEN; ctx.font = F(600, px(10.5));
        ctx.fillText('AI 已回覆・時段已保留', x + pad, y + h - S(12));
      } else {
        ctx.fillStyle = 'rgba(242,239,232,.14)'; rr(x + pad, y + pad + S(60), w * 0.42, S(22), S(8)); ctx.fill();
      }
    } else if (win.type === 'excel') {
      ctx.strokeStyle = 'rgba(242,239,232,.13)'; ctx.lineWidth = 1;
      const rows = 3, cols = 4, gw = (w - pad * 2) / cols, gh = (h - pad * 2 - S(4)) / rows;
      for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(x + pad, y + pad + r * gh); ctx.lineTo(x + w - pad, y + pad + r * gh); ctx.stroke(); }
      for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(x + pad + c * gw, y + pad); ctx.lineTo(x + pad + c * gw, y + pad + rows * gh); ctx.stroke(); }
      if (dock < 0.5 && q > 0.13) { // 資料缺口
        ctx.strokeStyle = 'rgba(255,107,44,.7)'; ctx.setLineDash([3, 3]);
        ctx.strokeRect(x + pad + gw * 2, y + pad + gh, gw, gh); ctx.setLineDash([]);
      }
      if (dock > 0.5) {
        const dots = [GREEN, BLUE, ORANGE];
        dots.forEach((cl, i2) => { ctx.fillStyle = cl; ctx.beginPath(); ctx.arc(x + pad + S(5), y + pad + gh * i2 + gh / 2, S(3), 0, 7); ctx.fill(); });
        ctx.fillStyle = 'rgba(242,239,232,.7)'; ctx.font = F(500, px(10.5));
        ctx.fillText('王小姐・DAY 1 已排', x + pad + S(14), y + pad + gh / 2 + S(3));
      }
    } else if (win.type === 'quote') {
      ctx.fillStyle = 'rgba(242,239,232,.16)';
      for (let i2 = 0; i2 < 3; i2++) rr(x + pad, y + pad + i2 * S(16), (w - pad * 2) * (0.9 - i2 * 0.18), S(7), S(3)), ctx.fill();
      ctx.fillStyle = dock > 0.5 ? IVORY : 'rgba(242,239,232,.6)'; ctx.font = F(700, px(15));
      ctx.fillText('NT$', x + pad, y + h - S(16));
      if (dock > 0.5) {
        ctx.fillStyle = GREEN; ctx.font = F(600, px(10.5)); ctx.textAlign = 'right';
        ctx.fillText('PDF ✓ 已產出', x + w - pad, y + h - S(16)); ctx.textAlign = 'left';
      }
    } else if (win.type === 'social') {
      const cols = 7, gw = (w - pad * 2) / cols, gh = S(14);
      const fill = dock > 0.5 ? 5 : 2;
      for (let r = 0; r < 3; r++) for (let c = 0; c < cols; c++) {
        const on = (r * cols + c) % 4 === 1 && (r * cols + c) / 4 < fill;
        ctx.fillStyle = on ? (dock > 0.5 ? 'rgba(255,107,44,.8)' : 'rgba(242,239,232,.3)') : 'rgba(242,239,232,.08)';
        rr(x + pad + c * gw + 1, y + pad + r * (gh + S(4)), gw - 2, gh, S(2)); ctx.fill();
      }
      if (dock > 0.5) { ctx.fillStyle = 'rgba(242,239,232,.65)'; ctx.font = F(500, px(10.5)); ctx.fillText('本週貼文已排 5 篇', x + pad, y + h - S(10)); }
    } else if (win.type === 'task') {
      const cw = (w - pad * 2 - S(12)) / 3;
      for (let c = 0; c < 3; c++) {
        const cx2 = x + pad + c * (cw + S(6));
        ctx.fillStyle = 'rgba(242,239,232,.07)'; rr(cx2, y + pad, cw, h - pad * 2 - S(4), S(4)); ctx.fill();
        const n = [2, 2, dock > 0.5 ? 2 : 1][c];
        for (let k = 0; k < n; k++) {
          const hot = dock > 0.5 && c === 2 && k === 1;
          ctx.fillStyle = hot ? 'rgba(101,224,188,.25)' : 'rgba(242,239,232,.16)';
          rr(cx2 + S(4), y + pad + S(6) + k * S(20), cw - S(8), S(14), S(3)); ctx.fill();
          if (hot) { ctx.strokeStyle = GREEN; rr(cx2 + S(4), y + pad + S(6) + k * S(20), cw - S(8), S(14), S(3)); ctx.stroke(); }
        }
      }
    } else if (win.type === 'data') {
      const bw = (w - pad * 2) / 4;
      const rise = dock > 0.5 ? ez(sub(q, 0.62, 0.72)) : 0.35;
      [0.4, 0.7, 0.55, 0.9].forEach((v, i2) => {
        const bh = (h - pad * 2 - S(16)) * v * (0.4 + 0.6 * rise);
        ctx.fillStyle = dock > 0.5 ? [BLUE, GREEN, BLUE, ORANGE][i2] : 'rgba(242,239,232,.22)';
        rr(x + pad + i2 * bw + S(3), y + h - pad - bh, bw - S(6), bh, S(2)); ctx.fill();
      });
      if (dock > 0.5) { ctx.fillStyle = 'rgba(242,239,232,.7)'; ctx.font = F(600, px(10.5)); ctx.fillText('回覆 28s・轉換 18%', x + pad, y + pad + S(6)); }
    }
  }
  function anchors(q, t) {
    return wins.map((w2, i) => winPos(w2, i, q, t));
  }
  function drawLinks(q, t, pos) {
    // S2 斷線
    const bA = ez(sub(q, 0.14, 0.2)) * (1 - ez(sub(q, 0.26, 0.32)));
    if (bA > 0.02) {
      ctx.save(); ctx.globalAlpha = bA; ctx.strokeStyle = 'rgba(242,239,232,.3)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.2;
      [[0, 1], [2, 4]].forEach(([a, b]) => {
        const A = pos[a], B = pos[b];
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        ctx.setLineDash([]); ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(mx - S(5), my - S(5)); ctx.lineTo(mx + S(5), my + S(5)); ctx.moveTo(mx + S(5), my - S(5)); ctx.lineTo(mx - S(5), my + S(5)); ctx.stroke();
        ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(242,239,232,.3)'; ctx.lineWidth = 1.2;
      });
      ctx.restore();
    }
    // S3 橘色訊號主線(沿節點推進)
    const le = ez(sub(q, 0.25, 0.4)) * (1 - ez(sub(q, 0.5, 0.58)));
    if (le > 0.01) {
      const pts = [{ x: X(60), y: Y(660) }, pos[6], pos[0], pos[5], pos[1], { x: X(740), y: Y(140) }].map(P => ({ x: P.x, y: P.y }));
      const segs = []; let total = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); segs.push(d); total += d; }
      const target = total * ez(sub(q, 0.25, 0.4));
      const at = (dist) => {
        let acc = 0;
        for (let i = 0; i < segs.length; i++) {
          if (dist <= acc + segs[i]) { const k = (dist - acc) / segs[i]; return { x: lerp(pts[i].x, pts[i + 1].x, k), y: lerp(pts[i].y, pts[i + 1].y, k), seg: i }; }
          acc += segs[i];
        }
        return pts[pts.length - 1];
      };
      ctx.save(); ctx.globalAlpha = le;
      ctx.strokeStyle = 'rgba(255,107,44,.18)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      let acc = 0;
      for (let i = 0; i < segs.length; i++) {
        if (target >= acc + segs[i]) ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        else { const e = at(target); ctx.lineTo(e.x, e.y); break; }
        acc += segs[i];
      }
      ctx.stroke();
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.8; ctx.stroke();
      // 沿線資料封包
      for (let k2 = 0; k2 < 3; k2++) {
        const d = target - k2 * total * 0.09 - (t * 60) % (total * 0.09);
        if (d > 0) { const P = at(Math.min(d, target)); ctx.fillStyle = k2 ? GREEN : ORANGE; ctx.beginPath(); ctx.arc(P.x, P.y, S(3.5), 0, 7); ctx.fill(); }
      }
      // 通過的節點
      let acc2 = 0;
      for (let i = 1; i < pts.length - 1; i++) { acc2 += segs[i - 1]; if (target > acc2) { ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, S(4), 0, 7); ctx.fill(); } }
      ctx.restore();
    }
    // S3 藍色資料連線(來源 → CRM)
    const cA = ez(sub(q, 0.3, 0.38)) * (1 - ez(sub(q, 0.55, 0.62)));
    if (cA > 0.02) {
      ctx.save(); ctx.globalAlpha = cA; ctx.strokeStyle = 'rgba(62,155,255,.55)'; ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 7]); ctx.lineDashOffset = -t * 40;
      [0, 2, 3].forEach(a => {
        const A = pos[a], B = pos[1];
        ctx.beginPath(); ctx.moveTo(A.x, A.y);
        ctx.quadraticCurveTo((A.x + B.x) / 2, Math.min(A.y, B.y) - S(50), B.x, B.y); ctx.stroke();
      });
      ctx.restore();
    }
    // S4 匯聚到客戶卡片
    const vA = ez(sub(q, 0.44, 0.5)) * (1 - ez(sub(q, 0.56, 0.61)));
    if (vA > 0.02) {
      ctx.save(); ctx.globalAlpha = vA; ctx.strokeStyle = 'rgba(62,155,255,.5)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 6]); ctx.lineDashOffset = -t * 30;
      const P = { x: isMobile ? W / 2 : W * 0.74, y: H / 2 };
      [0, 1, 2, 3, 4, 5].forEach(a => { const A = pos[a]; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(P.x, P.y); ctx.stroke(); });
      ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(P.x, P.y, S(4), 0, 7); ctx.fill();
      ctx.restore();
    }
  }
  function drawConsole(q, t) {
    const a = ez(sub(q, 0.56, 0.63));
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    const x = X(CF.x), y = Y(CF.y), w = S(CF.w), h = S(CF.h);
    ctx.fillStyle = 'rgba(13,15,19,.9)'; rr(x, y, w, h, S(10)); ctx.fill();
    ctx.strokeStyle = 'rgba(242,239,232,.2)'; ctx.lineWidth = 1; rr(x, y, w, h, S(10)); ctx.stroke();
    const settle = ez(sub(q, 0.88, 0.96));
    if (settle > 0) { ctx.strokeStyle = 'rgba(255,107,44,' + (0.3 + 0.12 * Math.sin(t * 1.6)) * settle + ')'; rr(x - 2, y - 2, w + 4, h + 4, S(11)); ctx.stroke(); }
    const th = S(CF.head);
    ctx.strokeStyle = 'rgba(242,239,232,.14)'; ctx.beginPath(); ctx.moveTo(x, y + th); ctx.lineTo(x + w, y + th); ctx.stroke();
    const pulse = 0.55 + 0.45 * Math.sin(t * 2.2);
    ctx.fillStyle = 'rgba(101,224,188,' + pulse + ')'; ctx.beginPath(); ctx.arc(x + S(18), y + th / 2, S(4), 0, 7); ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = IVORY; ctx.font = F(700, px(13));
    ctx.fillText('PEAKQI 營運控制台', x + S(32), y + th / 2 + 0.5);
    const kA = ez(sub(q, 0.8, 0.87));
    if (kA > 0) {
      ctx.globalAlpha = a * kA;
      ctx.fillStyle = 'rgba(242,239,232,.6)'; ctx.font = F(500, px(11)); ctx.textAlign = 'right';
      ctx.fillText('今日新客 12・平均回覆 28s・本週轉換 18%', x + w - S(64), y + th / 2 + 0.5);
      ctx.globalAlpha = a;
    }
    ctx.fillStyle = 'rgba(242,239,232,.45)'; ctx.font = F(600, px(10)); ctx.textAlign = 'right';
    ctx.fillText('LIVE', x + w - S(16), y + th / 2 + 0.5);
    ctx.restore();
  }
  function watermark(q) {
    ctx.save(); ctx.textBaseline = 'alphabetic';
    const a1 = 0.07 * (1 - ez(sub(q, 0.28, 0.42)));
    if (a1 > 0.005) {
      ctx.globalAlpha = a1; ctx.fillStyle = IVORY;
      ctx.font = '700 ' + Math.round(S(170)) + 'px "Space Grotesk",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('CHAOS', X(760), Y(120));
    }
    const a2 = 0.06 * ez(sub(q, 0.8, 0.92));
    if (a2 > 0.005) {
      ctx.globalAlpha = a2; ctx.fillStyle = ORANGE;
      ctx.font = '700 ' + Math.round(S(150)) + 'px "Space Grotesk",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('CONTROL', X(740), Y(748));
    }
    ctx.restore();
  }
  function draw(q, t) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (drawSeq(q)) return;
    watermark(q);
    const cam = 1 + 0.045 * ez(sub(q, 0.42, 0.56)) * (1 - ez(sub(q, 0.76, 0.9)));
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(cam, cam); ctx.translate(-W / 2, -H / 2);
    const pos = anchors(q, t);
    drawConsole(q, t);
    drawLinks(q, t, pos);
    wins.forEach((w2, i) => drawWindow(w2, i, q, t, pos[i]));
    ctx.restore();
  }

  // ---------- DOM 文字層 ----------
  function fadeBlock(el, q, a, b, c, d, keepCenter) {
    if (!el) return 0;
    const o = q < b ? sub(q, a, b) : 1 - sub(q, c, d);
    el.style.opacity = o.toFixed(3);
    el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
    const ty = (1 - sub(q, a, b)) * 20 - sub(q, c, d) * 16;
    if (keepCenter !== false) el.style.transform = 'translateY(calc(-50% + ' + ty.toFixed(1) + 'px))';
    return o;
  }
  function updateText(q) {
    fadeBlock(refs.t1, q, -0.2, 0, 0.09, 0.145);
    fadeBlock(refs.t2, q, 0.145, 0.19, 0.225, 0.275);
    fadeBlock(refs.t3, q, 0.26, 0.3, 0.41, 0.455);
    if (refs.t3) {
      const rows = refs.t3.querySelectorAll('[data-st]');
      rows.forEach((row, i) => {
        const on = ez(sub(q, 0.285 + i * 0.032, 0.315 + i * 0.032));
        row.style.opacity = (0.18 + 0.82 * on).toFixed(3);
        row.style.transform = 'translateX(' + ((1 - on) * 14).toFixed(1) + 'px)';
        const dot = row.firstElementChild;
        if (dot) dot.style.background = on >= 1 ? GREEN : ORANGE;
      });
    }
    fadeBlock(refs.t4, q, 0.445, 0.495, 0.565, 0.615);
    if (refs.t4) {
      const chips = refs.t4.querySelectorAll('[data-chip]');
      chips.forEach((ch, i) => {
        const on = ez(sub(q, 0.455 + i * 0.011, 0.488 + i * 0.011));
        ch.style.opacity = on.toFixed(3);
        ch.style.transform = 'translateY(' + ((1 - on) * 10).toFixed(1) + 'px)';
      });
    }
    const o5 = fadeBlock(refs.t5, q, 0.9, 0.95, 9, 10);
    if (refs.t5) refs.t5.style.pointerEvents = o5 > 0.6 ? 'auto' : 'none';
    if (refs.hint) refs.hint.style.opacity = (1 - sub(q, 0.012, 0.05)).toFixed(3);
  }

  // ---------- 量測/迴圈 ----------
  function measure() {
    if (!wrap || !stage) return;
    vh = window.innerHeight || 1;
    const r = wrap.getBoundingClientRect();
    wrapTop = r.top + (window.scrollY || window.pageYOffset || 0);
    wrapH = wrap.offsetHeight || 1;
    W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    isMobile = W < 760;
    const NAV = 68, avail = Math.max(200, H - NAV - 14);
    SC = Math.max(0.4, Math.min(W / DW, avail / DH));
    if (isMobile) SC = Math.max(0.3, Math.min(W / (DW * 0.82), avail / (DH * 1.05)));
    OX = (W - DW * SC) * (isMobile ? 0.5 : 0.72);
    OY = NAV + (H - NAV - DH * SC) * 0.5;
  }
  let lastTs = 0;
  function frame(now, snap) {
    const r0 = wrap.getBoundingClientRect();
    p = clamp(-r0.top / Math.max(1, wrapH - vh), 0, 1);
    if (snap) { sp = p; } else {
      const gap = p - sp;
      sp += gap * (Math.abs(gap) > 0.2 ? 0.5 : 0.14);
      if (Math.abs(gap) < 0.0004) sp = p;
    }
    try {
      drawN++;
      updateText(sp);
      draw(sp, now / 1000);
    } catch (e) {
      stopped = true;
      applyStatic();
    }
  }
  function loop(now) {
    if (destroyed || stopped) return;
    raf = requestAnimationFrame(loop);
    loopN++;
    lastTs = now;
    if (!visible || staticOn) return;
    frame(now - t0);
  }
  const onScrollHero = () => {
    if (destroyed || stopped || staticOn || !visible) return;
    const now = performance.now();
    if (now - lastTs > 200) { frame(now - t0, true); } // rAF 停擺時直接跟隨捲動
  };

  // ---------- 降級模式 ----------
  function applyStatic() {
    if (staticOn) return;
    staticOn = true;
    if (wrap) wrap.style.height = 'auto';
    if (stage) {
      stage.style.position = 'relative'; stage.style.height = 'auto';
      stage.style.minHeight = '0'; stage.style.overflow = 'visible';
      stage.style.display = 'flex'; stage.style.flexDirection = 'column';
      stage.style.padding = '76px clamp(20px,6vw,84px) 64px';
      const scrim = stage.querySelector('[data-scrim]');
      if (scrim) scrim.style.display = 'none';
    }
    if (refs.hint) refs.hint.style.display = 'none';
    if (refs.t3) refs.t3.style.display = 'none';
    const blocks = [refs.t1, refs.t2, refs.t4, refs.t5];
    blocks.forEach((el, i) => {
      if (!el) return;
      el.style.position = 'relative';
      el.style.left = 'auto'; el.style.right = 'auto'; el.style.top = 'auto';
      el.style.order = String(i + 1);
      el.style.margin = (i ? '44px' : '0') + ' auto 0';
      if (el !== refs.t4) { el.style.width = '100%'; el.style.maxWidth = '820px'; }
      el.style.visibility = 'visible';
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.transition = 'none';
      el.style.pointerEvents = 'auto';
      el.querySelectorAll('[data-chip]').forEach(ch => { ch.style.opacity = '1'; ch.style.transform = 'none'; });
    });
    if (canvas && ctx) {
      canvas.style.position = 'relative'; canvas.style.inset = 'auto';
      canvas.style.order = '9';
      canvas.style.display = 'block'; canvas.style.width = '100%';
      canvas.style.maxWidth = '1000px';
      canvas.style.height = '340px'; canvas.style.margin = '52px auto 0';
      W = Math.min(1000, (window.innerWidth || 1000) * 0.86); H = 340;
      DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      isMobile = W < 760;
      SC = Math.max(0.26, Math.min(W / DW, H / DH));
      OX = (W - DW * SC) * 0.5; OY = (H - DH * SC) * 0.5;
      try { draw(0.98, 2); } catch (e) { canvas.style.display = 'none'; }
    } else if (canvas) {
      canvas.style.display = 'none';
    }
  }

  // ---------- 啟動/銷毀 ----------
  const onResize = () => {
    clearTimeout(resizeTmr);
    resizeTmr = setTimeout(() => { if (!destroyed && !staticOn) { measure(); } }, 120);
  };
  function setup() {
    wrap = refs.wrap; stage = refs.stage; canvas = refs.canvas;
    if (!wrap || !stage || !canvas) {
      if (tries++ < 90 && !destroyed) { raf = requestAnimationFrame(setup); }
      return;
    }
    ctx = canvas.getContext('2d');
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!ctx || reduced) { measure0(); applyStatic(); return; }
    measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('scroll', onScrollHero, { passive: true });
    if (window.matchMedia) {
      mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      const h = () => { if (mql.matches) { stopped = true; applyStatic(); } };
      if (mql.addEventListener) mql.addEventListener('change', h); else if (mql.addListener) mql.addListener(h);
    }
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => { visible = es[0] ? es[0].isIntersecting : true; }, { rootMargin: '120px' });
      io.observe(wrap);
    }
    initSeq();
    updateText(0);
    raf = requestAnimationFrame(loop);
    window.__pqHero = {
      set: (v) => { p = sp = clamp(v, 0, 1); try { updateText(sp); draw(sp, 3); } catch (e) {} },
      static: () => { stopped = true; applyStatic(); },
      state: () => ({ p, sp, visible, stopped, staticOn, wrapH, vh, W, H, loopN, drawN, rt: wrap ? wrap.getBoundingClientRect().top : null }),
      cons: () => {
        if (staticOn || stopped || !stage) return null;
        const r = stage.getBoundingClientRect();
        return { q: sp, x: r.left + X(CF.x), y: r.top + Y(CF.y), w: S(CF.w), h: S(CF.h) };
      }
    };
  }
  function measure0() {
    vh = window.innerHeight || 1;
    if (canvas) { W = stage ? stage.clientWidth : 1; H = 340; }
  }
  function start() { if (!destroyed) setup(); }
  function destroy() {
    destroyed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    window.removeEventListener('scroll', onScrollHero);
    if (io) io.disconnect();
    if (seq) { seq.frames.forEach(f => { if (f && f.close) f.close(); }); seq = null; }
    if (window.__pqHero) delete window.__pqHero;
  }
  return { start, destroy };
}
