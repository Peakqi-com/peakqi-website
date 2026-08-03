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
  // 站點旅程重設計(2026-08):七站沿左軌直列,編號 01-07 等寬對齊(與文案 kicker 同基準);
  // 訊息 token 沿軌滑行;當前站展開內容小景,完成站收緊湊列+綠勾,未來站灰待命。
  // 桌機/手機同一語言,只差尺寸;所有字級帶下限(手機可讀鐵律)。
  // 注意:d.panel/head/chip 會覆寫 globalAlpha,每次畫前要重設。
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const S = clamp(Math.min(z.w / 520, z.h / 460), mobile ? .95 : .6, 1.25);
  const fs = Math.max(12, 12.5 * S);      // 站名
  const fsS = Math.max(9.5, 10 * S);      // 輔助/編號
  const fsB = Math.max(11, 11.5 * S);     // 站內內容

  const IDS = ['sig', 'layers', 'cap', 'fol', 'nur', 'align', 'console'];
  const NAMES = ['詢問進來', '辨識需求', '回應與建檔', '安排下一步', '延續脈絡', '流程接通', '營運視圖'];
  const ks = IDS.map(id => k(id));
  // 當前站 = 最後一個 k>0.02 的站;其 k 即展開進度
  let cur = 0;
  ks.forEach((v, i) => { if (v > 0.02) cur = i; });

  const railX = z.x + Math.max(30, z.w * .07);
  const bodyX = railX + Math.max(34, 26 * S);
  const bodyW = z.x + z.w - bodyX - Math.max(8, z.w * .02);
  const top = z.y + Math.max(10, z.h * .02);
  const botPad = Math.max(8, z.h * .02);
  const availH = z.h - (top - z.y) - botPad;

  // 站高:當前站展開(大),其餘緊湊 —— 高度以動畫比例平滑分配
  const wErr = ks.map((v, i) => {
    const openK = i === cur ? ez(sb(v, .05, .35)) : (i < cur ? 1 - ez(sb(ks[cur], .0, .3)) * 0 : 0);
    return i === cur ? ez(sb(v, .04, .3)) : 0;
  });
  const rowH = Math.max(26, Math.min(34, availH / 10.5));
  const openH = Math.min(availH - rowH * (IDS.length - 1), Math.max(rowH * 3.4, availH * .34));
  const hs = ks.map((v, i) => rowH + (openH - rowH) * (i === cur ? ez(sb(v, .04, .28)) : 0));
  const ys = [];
  let acc = top;
  hs.forEach(h => { ys.push(acc); acc += h; });

  // 左軌 + token
  g.save();
  g.strokeStyle = 'rgba(242,239,232,.14)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(railX, top + 6); g.lineTo(railX, acc - 6); g.stroke();
  // token 位置:目前站中心往下一站漸進
  const curProg = ez(sb(ks[cur], .0, 1));
  const tokY = ys[cur] + Math.min(hs[cur] * .5, rowH * .5) + (cur < IDS.length - 1 ? 0 : 0);
  const glow = .5 + .5 * Math.sin(t * 2.6);
  g.globalAlpha = .35 * glow;
  g.beginPath(); g.arc(railX, tokY, 9, 0, TAU); g.fillStyle = C.orange; g.fill();
  g.globalAlpha = 1;
  g.beginPath(); g.arc(railX, tokY, 4.2, 0, TAU); g.fillStyle = C.orange; g.fill();

  // 每站:編號(等寬右對齊)+ 名稱 + 狀態
  IDS.forEach((id, i) => {
    const v = ks[i];
    const y0 = ys[i], h0 = hs[i];
    const isCur = i === cur, done = i < cur, future = i > cur;
    const aRow = future ? .38 : 1;
    const cy = y0 + Math.min(h0 * .5, rowH * .5);
    // 節點
    d.node(railX, cy, done ? 3.4 : (isCur ? 0 : 2.4), done ? C.green : 'rgba(242,239,232,.35)', done ? 1 : (future ? .5 : 0), !done);
    // 編號:monospace 右對齊到固定欄(數字對齊)
    g.globalAlpha = aRow;
    g.font = '700 ' + fsS + 'px "Space Grotesk",monospace';
    g.fillStyle = isCur ? C.orange : (done ? 'rgba(101,224,188,.85)' : 'rgba(242,239,232,.4)');
    g.textAlign = 'right';
    g.fillText('0' + (i + 1), railX - 12, cy + fsS * .36);
    g.textAlign = 'left';
    // 站名
    g.font = (isCur ? '800 ' : '600 ') + fs + 'px "Noto Sans TC",sans-serif';
    g.fillStyle = isCur ? C.ivory : (done ? 'rgba(242,239,232,.78)' : 'rgba(242,239,232,.45)');
    g.fillText(NAMES[i], bodyX, cy + fs * .36);
    // 完成勾
    if (done) d.tick(bodyX + g.measureText(NAMES[i]).width + 16, cy, Math.max(5, 5.5 * S), C.green, 1);
    g.globalAlpha = 1;

    // 當前站展開內容(內容區從站名下一行開始)
    if (isCur) {
      const openA = ez(sb(v, .1, .4));
      if (openA > 0.02 && h0 > rowH * 1.6) {
        const ix = bodyX, iy = y0 + rowH * 1.05, iw = bodyW, ih = h0 - rowH * 1.15;
        g.save(); g.globalAlpha = openA;
        d.rr(ix, iy, iw, ih, 8);
        g.fillStyle = 'rgba(20,23,28,.82)'; g.fill();
        g.strokeStyle = 'rgba(255,107,44,.45)'; g.lineWidth = 1.2; g.stroke();
        drawStation(i, ix, iy, iw, ih, v, openA);
        g.restore(); g.globalAlpha = 1;
      }
    }
  });
  g.restore();

  // ── 各站小景(畫在展開盒內;p = 該站 k)
  function drawStation(i, x, y, w, h, kv, a) {
    const pad = Math.max(10, 12 * S);
    const cx2 = x + pad, cw = w - pad * 2;
    const line1 = y + pad + fsB * .9;
    const kk = ez(sb(kv, .18, .8));
    g.globalAlpha = a;
    if (i === 0) { // 詢問進來:LINE 泡泡 + 來源列
      bub(cx2, y + pad, Math.min(cw * .86, 300), '請問到府服務多少錢?', 'rgba(101,224,188,.14)', 'rgba(101,224,188,.5)');
      g.globalAlpha = a * kk;
      d.label('LINE・網站表單・電話', cx2, y + h - pad * .7, fsS, 'rgba(242,239,232,.5)', .8);
    } else if (i === 1) { // 辨識需求:欄位晶片逐一亮
      let xx = cx2;
      ['需求:到府清潔', '時段:週五下午', '價格:待人工'].forEach((tx2, j) => {
        const kc = ez(sb(kv, .15 + j * .18, .4 + j * .18));
        if (kc <= 0.02) return;
        g.globalAlpha = a * kc;
        xx += d.chip(xx, line1 - fsS, tx2, j === 2, fsS) + 8;
        if (xx > cx2 + cw - 60) { xx = cx2; }
      });
      g.globalAlpha = a * ez(sb(kv, .6, .9));
      d.label('AI 辨識・敏感項標記待確認', cx2, y + h - pad * .7, fsS, 'rgba(242,239,232,.5)', .8);
    } else if (i === 2) { // 回應與建檔:回覆泡泡 + CRM 卡生成
      bub(cx2, y + pad, Math.min(cw * .9, 320), '已為您保留時段,細節由專人確認', 'rgba(255,107,44,.12)', 'rgba(255,107,44,.5)');
      const kc = ez(sb(kv, .4, .75));
      if (kc > 0.02) {
        const cw2 = Math.min(150 * S, cw * .6), chy = y + h - pad - Math.max(30, 32 * S);
        g.globalAlpha = a * kc;
        d.rr(cx2, chy, cw2, Math.max(28, 30 * S), 4);
        g.fillStyle = '#F2EFE8'; g.fill();
        g.strokeStyle = C.orange; g.lineWidth = 1.2; g.stroke();
        g.font = '800 ' + fsS + 'px "Noto Sans TC",sans-serif'; g.fillStyle = '#090B0E';
        g.fillText('王小姐', cx2 + 8, chy + Math.max(12, 12 * S));
        g.font = '600 ' + Math.max(8.5, 8.5 * S) + 'px "Space Grotesk",sans-serif'; g.fillStyle = '#D14E12';
        g.fillText('CRM CARD ・ 負責人已指定', cx2 + 8, chy + Math.max(23, 24 * S));
      }
    } else if (i === 3) { // 安排下一步:四步點軌
      const m0 = cx2 + 6, m1 = cx2 + cw - 6, ty2 = y + h * .46;
      ['補齊需求', '提供案例', '確認反應', '決定下一步'].forEach((tx2, j) => {
        const nx = m0 + (m1 - m0) * j / 3;
        const on = kv * 3.2 - .3 > j;
        d.node(nx, ty2, on ? 3.2 : 2.2, on ? C.blue : 'rgba(242,239,232,.3)', a, !on);
        g.globalAlpha = a;
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = on ? C.blue : 'rgba(242,239,232,.45)';
        g.textAlign = j === 0 ? 'left' : (j === 3 ? 'right' : 'center');
        g.fillText(tx2, j === 0 ? nx - 4 : (j === 3 ? nx + 4 : nx), ty2 + Math.max(16, 17 * S));
        g.textAlign = 'left';
        if (j < 3) d.line(nx + 5, ty2, m0 + (m1 - m0) * (j + 1) / 3 - 5, ty2, clamp(kv * 3.2 - .45 - j, 0, 1), 'rgba(62,155,255,.5)', 1.2);
      });
      g.globalAlpha = a * ez(sb(kv, .7, .95));
      d.label('AI 擬稿・人確認才送出', cx2, y + h - pad * .7, fsS, 'rgba(101,224,188,.8)', .8);
    } else if (i === 4) { // 延續脈絡:同一份脈絡 → 三個用途
      g.globalAlpha = a;
      d.han('同一份客戶脈絡', cx2, line1, fsB, 'rgba(242,239,232,.85)', 700);
      let xx = cx2;
      ['報價', '案例', '後續服務'].forEach((tx2, j) => {
        const kc = ez(sb(kv, .25 + j * .18, .5 + j * .18));
        if (kc <= 0.02) return;
        g.globalAlpha = a * kc;
        xx += d.chip(xx, y + h * .52, tx2, true, fsS) + 8;
      });
    } else if (i === 5) { // 流程接通:模組節點連線
      const mods = ['客服', 'CRM', '行銷', '報價', '專案', '數據'];
      const m0 = cx2 + 8, m1 = cx2 + cw - 8, my = y + h * .5;
      mods.forEach((tx2, j) => {
        const nx = m0 + (m1 - m0) * j / 5;
        const on = kv * 5.4 - .3 > j;
        if (j < 5) d.line(nx + 4, my, m0 + (m1 - m0) * (j + 1) / 5 - 4, my, clamp(kv * 5.4 - .4 - j, 0, 1), 'rgba(101,224,188,.45)', 1.2);
        d.node(nx, my, on ? 3 : 2, on ? C.green : 'rgba(242,239,232,.3)', a, !on);
        g.globalAlpha = a * (on ? 1 : .45);
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = on ? 'rgba(242,239,232,.85)' : 'rgba(242,239,232,.4)';
        g.textAlign = 'center';
        g.fillText(tx2, nx, my + Math.max(16, 17 * S));
        g.textAlign = 'left';
      });
      g.globalAlpha = a * ez(sb(kv, .75, .95));
      d.label('既有工具保留・資料線後方接通', cx2, y + h - pad * .7, fsS, 'rgba(242,239,232,.5)', .8);
    } else { // 營運視圖:三個統計膠囊(呼吸)
      const st = [['12', '今日新客', C.ivory], ['28s', '平均回覆', C.blue], ['18%', '本週轉換', C.green]];
      const gw2 = (cw - 16) / 3;
      st.forEach((r, j) => {
        const kc = ez(sb(kv, .15 + j * .16, .4 + j * .16));
        if (kc <= 0.02) return;
        const bx = cx2 + j * (gw2 + 8);
        g.globalAlpha = a * kc;
        d.rr(bx, y + pad, gw2, h - pad * 2, 6);
        g.fillStyle = 'rgba(242,239,232,.05)'; g.fill();
        g.strokeStyle = 'rgba(242,239,232,.16)'; g.lineWidth = 1; g.stroke();
        g.font = '700 ' + Math.max(15, 17 * S) + 'px "Space Grotesk",sans-serif';
        g.fillStyle = r[2];
        g.textAlign = 'center';
        g.fillText(r[0], bx + gw2 / 2, y + h * .46);
        g.font = '500 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = 'rgba(242,239,232,.55)';
        g.fillText(r[1], bx + gw2 / 2, y + h * .46 + Math.max(15, 16 * S));
        g.textAlign = 'left';
      });
    }
    g.globalAlpha = a;
  }
  function bub(x, y, w2, txt, fill, stroke) {
    const bh = Math.max(26, 28 * S);
    d.rr(x, y, w2, bh, 10);
    g.fillStyle = fill; g.fill();
    g.strokeStyle = stroke; g.lineWidth = 1; g.stroke();
    g.font = '600 ' + fsB + 'px "Noto Sans TC",sans-serif';
    g.fillStyle = 'rgba(242,239,232,.9)';
    g.fillText(txt, x + 10, y + bh * .66);
  }
}

function paintCases(g, e) {
  // 場域情境舞台(2026-08 無圖重設計):五景同構——產業徽章+幾何場域圖+對話帶+狀態晶片。
  // 純 canvas 幾何,不用截圖;桌機/手機同語言;字級帶下限;交叉切換乾淨(前景快退)。
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const S = clamp(Math.min(z.w / 520, z.h / 460), mobile ? .95 : .62, 1.25);
  const fs = Math.max(12, 12.5 * S), fsS = Math.max(9.5, 10 * S), fsB = Math.max(11, 11.5 * S);
  const ks = { wed: k('wed'), int: k('int'), rea: k('rea'), bea: k('bea'), sum: k('sum') };
  const pw = Math.min(z.w * .94, 430);
  const px0 = z.x + (z.w - pw) / 2;
  const py0 = z.y + Math.max(8, z.h * .02);
  const ph = Math.min(z.h - (py0 - z.y) - Math.max(8, z.h * .02), Math.max(300, z.h * .9));

  const order = ['wed', 'int', 'rea', 'bea', 'sum'];
  const NAME = { wed: '婚禮婚慶', int: '室內設計', rea: '房仲不動產', bea: '美業預約', sum: 'YOUR TURN' };
  const HUE = { wed: C.orange, int: C.orange, rea: C.blue, bea: C.green, sum: C.green };

  order.forEach((id, idx) => {
    const kv = ks[id];
    if (kv <= 0.02) return;
    const nxt = order[idx + 1];
    const fd = nxt ? 1 - ez(sb(ks[nxt], .04, .3)) * .97 : 1;
    const a = ez(sb(kv, .02, .3)) * fd;
    if (a <= 0.02) return;
    g.save();
    // 外框面板
    d.rr(px0, py0, pw, ph, 10);
    g.globalAlpha = a * .96;
    g.fillStyle = 'rgba(17,20,24,.9)'; g.fill();
    g.strokeStyle = id === 'sum' ? 'rgba(101,224,188,.5)' : 'rgba(255,107,44,.4)';
    g.lineWidth = 1.3; g.stroke();
    // 徽章列:編號(等寬)+ 產業名 + 律動點
    const hy = py0 + Math.max(20, 22 * S);
    g.globalAlpha = a;
    g.font = '700 ' + fsS + 'px "Space Grotesk",monospace';
    g.fillStyle = HUE[id];
    g.fillText('0' + (idx + 1) + ' / 05', px0 + 14, hy);
    g.font = '800 ' + fs + 'px "Noto Sans TC",sans-serif';
    g.fillStyle = C.ivory;
    g.fillText(NAME[id], px0 + 14 + Math.max(58, 62 * S), hy);
    d.node(px0 + pw - 18, hy - fs * .32, 3, HUE[id], a * (.5 + .5 * Math.sin(t * 2.4 + idx)), false);
    // 場域圖形區(中段)與對話帶(下段)
    const gy = hy + Math.max(10, 12 * S);
    const gh = ph * .44;
    const cy2 = py0 + ph - Math.max(12, 14 * S);
    drawScene(id, kv, a, px0 + 14, gy, pw - 28, gh);
    convo(id, kv, a, px0 + 14, gy + gh + Math.max(8, 10 * S), pw - 28, cy2 - (gy + gh) - Math.max(26, 30 * S));
    chips(id, kv, a, px0 + 14, cy2);
    g.restore(); g.globalAlpha = 1;
  });

  // ── 場域圖形(幾何純繪,kv 驅動建構)
  function drawScene(id, kv, a, x, y, w, h) {
    const kk = ez(sb(kv, .1, .5));
    const cx2 = x + w / 2;
    g.globalAlpha = a * kk;
    g.lineWidth = Math.max(1.4, 1.6 * S);
    if (id === 'wed') { // 拱門+彩點+日期卡
      g.strokeStyle = C.orange;
      g.beginPath(); g.arc(cx2, y + h * .95, h * .78, Math.PI, Math.PI * 2 * (0.5 + 0.5 * kk) ); g.stroke();
      g.beginPath(); g.arc(cx2, y + h * .95, h * .58, Math.PI, Math.PI + Math.PI * kk); g.stroke();
      for (let i = 0; i < 7; i++) {
        const ang = Math.PI + (i + .5) / 7 * Math.PI;
        const rr2 = h * .68, bx = cx2 + Math.cos(ang) * rr2, by = y + h * .95 + Math.sin(ang) * rr2;
        const tw = ez(sb(kv, .25 + i * .06, .45 + i * .06));
        d.node(bx, by, 2.4 + (i % 3) * .7, [C.orange, C.green, C.blue][i % 3], a * tw * (.6 + .4 * Math.sin(t * 3 + i)), false);
      }
      const dk = ez(sb(kv, .4, .7));
      if (dk > .02) {
        g.globalAlpha = a * dk;
        const cw2 = Math.max(86, 96 * S);
        d.rr(cx2 - cw2 / 2, y + h * .4, cw2, Math.max(30, 34 * S), 5);
        g.fillStyle = 'rgba(9,11,14,.9)'; g.fill();
        g.strokeStyle = 'rgba(255,107,44,.55)'; g.stroke();
        g.textAlign = 'center';
        g.font = '800 ' + Math.max(13, 14 * S) + 'px "Space Grotesk",sans-serif';
        g.fillStyle = C.ivory; g.fillText('6 / 14', cx2, y + h * .4 + Math.max(14, 15 * S));
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = 'rgba(242,239,232,.6)'; g.fillText('檔期已保留', cx2, y + h * .4 + Math.max(26, 29 * S));
        g.textAlign = 'left';
      }
    } else if (id === 'int') { // 房間線框:牆/窗/沙發/光
      g.strokeStyle = C.orange;
      const rx = x + w * .18, rw2 = w * .64, ry = y + h * .12, rh2 = h * .74;
      g.strokeRect(rx, ry, rw2 * kk, rh2);
      if (kk > .5) {
        const k2 = ez(sb(kv, .3, .6));
        g.globalAlpha = a * k2;
        g.strokeRect(rx + rw2 * .08, ry + rh2 * .14, rw2 * .3, rh2 * .3); // 窗
        g.beginPath(); // 沙發
        g.moveTo(rx + rw2 * .5, ry + rh2 * .72);
        g.lineTo(rx + rw2 * .92, ry + rh2 * .72);
        g.stroke();
        d.rr(rx + rw2 * .52, ry + rh2 * .54, rw2 * .34, rh2 * .18, 4); g.stroke();
        const lk = ez(sb(kv, .5, .8));
        g.globalAlpha = a * lk * (.5 + .5 * Math.sin(t * 2));
        g.fillStyle = 'rgba(255,107,44,.16)';
        g.beginPath(); g.moveTo(rx + rw2 * .23, ry + rh2 * .14);
        g.lineTo(rx + rw2 * .05, ry + rh2 * .95); g.lineTo(rx + rw2 * .45, ry + rh2 * .95);
        g.closePath(); g.fill();
      }
    } else if (id === 'rea') { // 房子+定位釘+時段
      g.strokeStyle = C.blue;
      const hw = Math.min(w * .4, h * 1.1), hx = cx2 - hw / 2, hy2 = y + h * .3, hh = h * .55;
      g.beginPath();
      g.moveTo(hx, hy2 + hh * .35 + hh * .65 * (1 - kk));
      g.lineTo(hx, hy2 + hh); g.lineTo(hx + hw, hy2 + hh); g.lineTo(hx + hw, hy2 + hh * .35);
      g.stroke();
      const rk = ez(sb(kv, .25, .5));
      g.globalAlpha = a * rk;
      g.beginPath(); g.moveTo(hx - hw * .1, hy2 + hh * .38); g.lineTo(cx2, hy2 - h * .08); g.lineTo(hx + hw * 1.1, hy2 + hh * .38); g.stroke();
      const pk = ez(sb(kv, .45, .7));
      if (pk > .02) {
        g.globalAlpha = a * pk;
        const py2 = hy2 - h * .28 - Math.sin(t * 2.2) * 3;
        g.fillStyle = C.blue;
        g.beginPath(); g.arc(cx2, py2, Math.max(5, 6 * S), 0, TAU); g.fill();
        g.beginPath(); g.moveTo(cx2 - 5, py2 + 3); g.lineTo(cx2, py2 + Math.max(12, 14 * S)); g.lineTo(cx2 + 5, py2 + 3); g.closePath(); g.fill();
        g.textAlign = 'center';
        g.font = '700 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = 'rgba(242,239,232,.85)';
        g.fillText('週六 14:00 帶看', cx2, hy2 + hh + Math.max(16, 18 * S));
        g.textAlign = 'left';
      }
    } else if (id === 'bea') { // 預約時段格:2x3,一格點亮+勾
      const cols = 3, rows = 2;
      const gw2 = (w * .8) / cols, gh2 = h * .36;
      const gx0 = x + w * .1, gy0 = y + h * .12;
      let n = 0;
      for (let r2 = 0; r2 < rows; r2++) for (let c2 = 0; c2 < cols; c2++) {
        const kc = ez(sb(kv, .12 + n * .07, .3 + n * .07));
        if (kc > .02) {
          const bx = gx0 + c2 * gw2, by = gy0 + r2 * (gh2 + 8);
          const hot = n === 4;
          g.globalAlpha = a * kc;
          d.rr(bx + 3, by, gw2 - 6, gh2, 5);
          g.fillStyle = hot ? 'rgba(101,224,188,.16)' : 'rgba(242,239,232,.05)'; g.fill();
          g.strokeStyle = hot ? 'rgba(101,224,188,.6)' : 'rgba(242,239,232,.18)'; g.stroke();
          g.textAlign = 'center';
          g.font = '600 ' + fsS + 'px "Space Grotesk",sans-serif';
          g.fillStyle = hot ? C.green : 'rgba(242,239,232,.55)';
          g.fillText(['10:00', '11:30', '14:00', '15:30', '17:00', '19:00'][n], bx + gw2 / 2, by + gh2 * .58);
          g.textAlign = 'left';
          if (hot) {
            const tk = ez(sb(kv, .5, .75));
            if (tk > .02) d.tick(bx + gw2 - 14, by + 12, Math.max(4.5, 5 * S), C.green, a * tk);
          }
        }
        n++;
      }
      const rk2 = ez(sb(kv, .6, .85));
      if (rk2 > .02) {
        g.globalAlpha = a * rk2;
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = 'rgba(101,224,188,.85)';
        g.fillText('前一日 18:00 自動提醒已排', gx0, gy0 + rows * (gh2 + 8) + Math.max(14, 16 * S));
      }
    } else { // sum:四場域小徽章 → 中央合流
      const icons = ['婚', '裝', '房', '美'];
      icons.forEach((tx2, i) => {
        const ang = -Math.PI / 2 + i * Math.PI / 2;
        const rr2 = Math.min(w, h) * .34;
        const kc = ez(sb(kv, .1 + i * .08, .3 + i * .08));
        const conv = ez(sb(kv, .45, .75));
        const bx = cx2 + Math.cos(ang) * rr2 * (1 - conv * .55);
        const by = y + h * .5 + Math.sin(ang) * rr2 * (1 - conv * .55);
        if (kc <= .02) return;
        g.globalAlpha = a * kc;
        g.beginPath(); g.arc(bx, by, Math.max(13, 15 * S), 0, TAU);
        g.fillStyle = 'rgba(9,11,14,.9)'; g.fill();
        g.strokeStyle = [C.orange, C.orange, C.blue, C.green][i]; g.lineWidth = 1.4; g.stroke();
        g.textAlign = 'center';
        g.font = '700 ' + fsB + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = 'rgba(242,239,232,.9)';
        g.fillText(tx2, bx, by + fsB * .36);
        g.textAlign = 'left';
        d.line(bx, by, cx2, y + h * .5, ez(sb(kv, .5, .8)), 'rgba(101,224,188,.35)', 1);
      });
      const ck = ez(sb(kv, .6, .85));
      if (ck > .02) {
        g.globalAlpha = a * ck;
        g.beginPath(); g.arc(cx2, y + h * .5, Math.max(9, 10 * S) * (1 + .08 * Math.sin(t * 2.6)), 0, TAU);
        g.fillStyle = 'rgba(101,224,188,.2)'; g.fill();
        g.strokeStyle = C.green; g.lineWidth = 1.6; g.stroke();
      }
    }
    g.globalAlpha = a;
  }

  // ── 對話帶:詢問(左)→ AI 回覆(右)
  function convo(id, kv, a, x, y, w, h) {
    const Q = { wed: '請問 6 月還有檔期嗎?', int: '三房想改北歐風,怎麼算?', rea: '這間還在嗎?想約看屋', bea: '週五染髮有位子嗎?', sum: '把這流程換成你的產業?' };
    const A2 = { wed: '已保留 6/14,細節專人確認', int: '已建檔,設計師今日回覆', rea: '已排週六 14:00 帶看', bea: '已預約,改期直接回這裡', sum: '15 分鐘,用你的場景跑一次' };
    const bh = Math.max(24, 26 * S);
    const k1 = ez(sb(kv, .18, .42));
    if (k1 > .02) {
      g.globalAlpha = a * k1;
      bubble(x, y, Math.min(w * .78, 250), bh, Q[id], 'rgba(242,239,232,.08)', 'rgba(242,239,232,.25)', false);
    }
    const k2 = ez(sb(kv, .42, .68));
    if (k2 > .02) {
      g.globalAlpha = a * k2;
      const bw2 = Math.min(w * .82, 270);
      bubble(x + w - bw2, y + bh + 8, bw2, bh, A2[id], 'rgba(101,224,188,.13)', 'rgba(101,224,188,.5)', true);
    }
  }
  function bubble(x, y, w, h, txt, fill, stroke, ai) {
    d.rr(x, y, w, h, 9);
    g.fillStyle = fill; g.fill();
    g.strokeStyle = stroke; g.lineWidth = 1; g.stroke();
    g.font = '600 ' + fsB + 'px "Noto Sans TC",sans-serif';
    g.fillStyle = ai ? 'rgba(212,244,232,.95)' : 'rgba(242,239,232,.85)';
    g.fillText(txt, x + 10, y + h * .66);
  }

  // ── 底部狀態晶片列(統一位置=數字/狀態對齊)
  function chips(id, kv, a, x, yBase) {
    const rows = {
      wed: ['檔期詢問 ✓', '保留 ✓', '專人確認'],
      int: ['需求整理 ✓', '案件卡 ✓', '設計師接手'],
      rea: ['物件比對 ✓', '帶看排程 ✓', '回報屋主'],
      bea: ['預約 ✓', '提醒已排 ✓', '回頭客名單'],
      sum: ['接住詢問', '自動建檔', '持續跟進']
    }[id];
    let xx = x;
    rows.forEach((tx2, j) => {
      const kc = ez(sb(kv, .55 + j * .1, .78 + j * .1));
      if (kc <= .02) return;
      g.globalAlpha = a * kc;
      xx += d.chip(xx, yBase - Math.max(18, 20 * S), tx2, j === rows.length - 1, fsS) + 7;
    });
  }
}

function paintPricing(g, e) {
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const s = clamp(Math.min(z.w / 720, z.h / 520), .5, 1.15);
  const kR = k('racks'), k1 = k('cap'), k2 = k('assist'), k3 = k('plat'), kC = k('cmp'), kU = k('use'), kO = k('run');
  const fadeO = 1 - ez(sb(kO, 0, .45)) * .98; // 終幕:kO 到 0.45 前舊圖層就要全退,不拖尾
  const gap = z.w * .05, rw = (z.w - gap * 2) / 3;
  const ry = z.y + z.h * .05, rh = z.h * (mobile ? .48 : .56);
  const rx = (i) => z.x + i * (rw + gap);
  const meta = [
    { zh: '接客', en: 'CAPTURE', kk: k1, c: C.orange, price: '依需求報價', mo: '預約諮詢', mods: ['自動回覆', '需求了解', '預約', '轉真人'], base: null },
    { zh: '業務助理', en: 'ASSISTANT', kk: k2, c: C.orange, price: '依需求報價', mo: '預約諮詢', mods: ['CRM', '追蹤', '跟進序列', '分析'], base: '含 A 全部', badge: '最多人選' },
    { zh: '營運平台', en: 'PLATFORM', kk: k3, c: C.blue, price: '依需求報價', mo: '預約諮詢', mods: ['行銷', '報價', '專案', '數據'], base: '含 B 全部' }
  ];
  meta.forEach((m, i) => {
    const a = ez(clamp(kR * 3 - i * .45, 0, 1)) * fadeO;
    if (a <= 0.12) return; // 終幕淡出末端 gh/slotH 會變負(IndexSizeError → canvas 全滅),提早跳出
    const x = rx(i), hot = ez(m.kk);
    g.save(); g.globalAlpha = a;
    const gh = rh * (0.3 + 0.7 * a);
    const gy = ry + rh - gh;
    d.rr(x, gy, rw, gh, 6);
    g.fillStyle = 'rgba(20,23,28,' + (0.42 + 0.35 * Math.max(hot, kO * .8)).toFixed(2) + ')'; g.fill();
    g.strokeStyle = hot > .08 ? m.c : 'rgba(242,239,232,.24)'; g.lineWidth = 1 + hot * .8; g.stroke();
    d.label(m.en, x + 9, gy + Math.max(12, 14 * s), 8.5 * s, hot > .08 ? m.c : 'rgba(242,239,232,.5)', 1.4);
    d.han(m.zh, x + 9, gy + Math.max(29, 29 * s) + 2, 11.5 * s, C.ivory, 800);
    if (m.badge && hot > .5) { g.globalAlpha = a * ez(sb(m.kk, .5, 1)); d.chip(x + rw - 62 * s, gy + 6, m.badge, true, 8.5 * s); g.globalAlpha = a; }
    const slotStep = Math.max(9, gh * .6 / 4), slotTop = gy + gh * .34, slotH = Math.max(4, slotStep - 7);
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
      const sxOff = Math.min((1 - km) * 24, 8); // 滑入位移夾限,晶片不出卡框
      g.globalAlpha = a * km;
      d.rr(x + 8 + sxOff, sy, rw - 16, slotH, 3);
      g.fillStyle = m.c === C.blue ? 'rgba(62,155,255,.12)' : 'rgba(255,107,44,.12)'; g.fill();
      g.strokeStyle = m.c === C.blue ? 'rgba(62,155,255,.55)' : 'rgba(255,107,44,.55)'; g.lineWidth = 1; g.stroke();
      if (!mobile) d.han(mod, x + 14 + sxOff, sy + slotH / 2 + 4 * s, 9.5 * s, 'rgba(242,239,232,.88)', 700);
      d.node(x + rw - 14, sy + slotH / 2, 2, C.green, a * km);
      g.globalAlpha = a;
    });
    const kp = Math.max(ez(sb(m.kk, .55, 1)), ez(kC));
    if (kp > 0 && !mobile) { // 手機:牌高塞不下兩行必疊印,CTA 下方 DOM 晶片已有同資訊
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
    if (kC > 0 && fadeO > 0.05 && !mobile) {
      g.globalAlpha = ez(kC) * fadeO;
      d.tick(x + 8, ry + rh + 56 * s, 5.5 * s, C.green, 1);
      d.label(['4 模組', '8 模組(含A)', '12 模組(含B)'][i], x + 18, ry + rh + 59 * s, 8.5 * s, 'rgba(242,239,232,.65)', .6);
      g.globalAlpha = 1;
    }
    g.restore();
  });
  if (kC > 0 && fadeO > 0.05) d.line(z.x, ry + rh + 66 * s, z.x + z.w, ry + rh + 66 * s, ez(kC) * fadeO, 'rgba(242,239,232,.16)', 1);
  if (kU > 0 && fadeO > 0.05) {
    const a = ez(kU) * fadeO, ly1 = z.y + z.h * (mobile ? .84 : .82), ly2 = ly1 + z.h * .08;
    const lx0 = z.x + 4, lx1 = z.x + z.w - 4;
    g.save(); g.globalAlpha = a;
    d.line(lx0, ly1, lx1, ly1, kU, 'rgba(101,224,188,.6)', 2);
    if (e.tier === 'full' && kU >= .98) {
      g.setLineDash([6, 10]); g.lineDashOffset = -t * 30;
      g.strokeStyle = 'rgba(101,224,188,.9)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(lx0, ly1); g.lineTo(lx1, ly1); g.stroke();
      g.setLineDash([]); g.lineDashOffset = 0;
    }
    d.label('INCLUDED — 文字 AI 不限量', lx0, ly1 - Math.max(10, 7 * s), 8.5 * s, C.green, 1.2);
    const k2u = ez(sb(kU, .15, 1));
    d.line(lx0, ly2, lx1, ly2, k2u, 'rgba(62,155,255,.6)', 2);
    for (let m2 = 1; m2 <= 8; m2++) {
      const fx2 = m2 / 9;
      if (fx2 > k2u) break;
      const mx = lx0 + (lx1 - lx0) * fx2;
      g.strokeStyle = 'rgba(62,155,255,.8)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(mx, ly2 - 4); g.lineTo(mx, ly2 + 4); g.stroke();
    }
    d.label('USAGE-BASED — 圖片・影片,用多少算多少', lx0, ly2 + Math.max(16, 15 * s), 8.5 * s, C.blue, 1.2);
    meta.forEach((m, i) => {
      const ax = rx(i) + rw / 2;
      d.line(ax, ry + rh + 70 * s, ax, ly1 - 5, ez(sb(kU, i * .15, .6 + i * .15)), 'rgba(242,239,232,.25)', 1);
    });
    g.restore();
  }
  if (kO > 0) {
    // 終幕重設計:大字、大藥丸、心跳線(原三櫃小字全部讓位,不再擁擠)
    const a = ez(kO);
    const cx = z.x + z.w / 2;
    g.save(); g.globalAlpha = a;
    d.rr(z.x + 1, z.y + 1, z.w - 2, z.h - 2, 12);
    g.strokeStyle = 'rgba(255,107,44,' + (0.35 + 0.2 * Math.sin(t * 1.6)).toFixed(2) + ')'; g.lineWidth = 1.6; g.stroke();
    // 狀態列:呼吸綠點 + 大標
    const inK = ez(sb(kO, .35, .75));
    g.globalAlpha = a * inK;
    const hy = z.y + z.h * (mobile ? .2 : .24);
    const pulse = .55 + .45 * Math.sin(t * 2.4);
    d.node(cx - (mobile ? 74 : 96) * s, hy - 6 * s, 4.5 * s, C.green, a * pulse);
    g.textAlign = 'center';
    d.label('PEAKQI OS · RUNNING', cx + 10 * s, hy - z.h * .085, Math.max(10, 11 * s), C.orange, 2.2);
    d.han('系統上線,開始運作', cx, hy, Math.max(16, 21 * s), C.ivory, 900);
    g.textAlign = 'left';
    // 三個大藥丸:方案名 + 綠勾(逐一亮起)
    const pw = Math.min(rw, 190 * s), ph = Math.max(34, 42 * s);
    const py = z.y + z.h * (mobile ? .38 : .42);
    meta.forEach((m, i) => {
      const ka = ez(sb(kO, .42 + i * .12, .68 + i * .12));
      if (ka <= 0.01) return;
      const px2 = z.x + i * (rw + gap) + (rw - pw) / 2;
      g.globalAlpha = a * inK * ka;
      d.rr(px2, py, pw, ph, ph / 2);
      g.fillStyle = 'rgba(20,23,28,.85)'; g.fill();
      g.strokeStyle = m.c === C.blue ? 'rgba(62,155,255,.7)' : 'rgba(255,107,44,.7)'; g.lineWidth = 1.4; g.stroke();
      d.tick(px2 + 16 * s, py + ph / 2 + 1, Math.max(5, 6.5 * s), C.green, a * ka);
      d.han(m.zh, px2 + 30 * s, py + ph / 2 + 5 * s, Math.max(11.5, 13 * s), C.ivory, 800);
      g.globalAlpha = a;
    });
    // 心跳線:運作中的生命感(整條隨時間流動)
    const wy = z.y + z.h * (mobile ? .66 : .7);
    const seg = 44;
    g.globalAlpha = a * inK;
    g.strokeStyle = 'rgba(101,224,188,.75)'; g.lineWidth = 2; g.beginPath();
    for (let i2 = 0; i2 <= seg; i2++) {
      const fx2 = i2 / seg;
      const px3 = z.x + z.w * .06 + z.w * .88 * fx2;
      const beat = Math.exp(-Math.pow(((fx2 * 3 + (e.tier === 'full' ? t * .5 : 0)) % 1) - .5, 2) * 90);
      const py3 = wy - beat * z.h * .06 * (1 + .15 * Math.sin(t * 3));
      if (i2 === 0) g.moveTo(px3, py3); else g.lineTo(px3, py3);
    }
    g.stroke();
    // 底部說明:誠實中性(移除未經確認的 24/7/不綁約/保證字樣)
    g.textAlign = 'center';
    d.label('FIRST PHASE LIVE', cx, z.y + z.h * (mobile ? .8 : .82), Math.max(8.5, 9.5 * s), 'rgba(242,239,232,.5)', 2);
    d.han('第一階段上線・依實際使用持續調整', cx, z.y + z.h * (mobile ? .87 : .89), Math.max(11, 12.5 * s), 'rgba(242,239,232,.75)', 600);
    g.textAlign = 'left';
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
    g.save(); g.globalAlpha *= (1 - ez(kN)); d.label('8+ INDUSTRIES — GROUPED', z.x + 4, z.y + z.h - 12, 9.5 * s, C.blue, 1.8); g.restore();
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
    if (!mobile) d.label('INDUSTRY', z.x - 14, z.y + z.h * .18 - 10 * s, 7.5 * s, C.orange, 1.2);
    g.restore();
  }
  if (kF > 0 && kB < 1) {
    const a = ez(kF) * (1 - ez(kB) * .7);
    g.save(); g.globalAlpha = a;
    for (let i = 0; i < 5; i++) {
      const ka = ez(clamp(kF * 3 - i * .3, 0, 1));
      d.node(z.x - 14, z.y + z.h * .52 + i * 12 * s, 2.2, C.blue, a * ka);
    }
    if (!mobile) d.label('FRICTION', z.x - 14, z.y + z.h * .52 - 10 * s, 7.5 * s, C.blue, 1.2);
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


// ---------- METHOD:導入方法(盤點 → 定義 → 驗證 → 上線與改善) ----------
function paintMethod(g, e) {
  // 重設計(2026-08):四景皆為單一置頂聚焦面板,手機靜止即完整構圖、不散落不被摺線裁切。
  // 注意:d.panel/head/chip 內部會覆寫 globalAlpha,整幕淡出必須摺進每個 alpha 參數,
  // 且每次畫文字前都要重設 g.globalAlpha。
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const s = clamp(Math.min(z.w / 520, z.h / 420), .55, 1.15);
  const kM = k('map'), kG = k('goal'), kP = k('pilot'), kL = k('live');
  const cx = z.x + z.w * .5;
  const pw = Math.min(z.w * .94, 470);
  const px0 = cx - pw / 2;
  const py0 = z.y + Math.min(18, z.h * .04);
  const rh = Math.max(30, Math.min(40, z.h * .085));
  const fs = Math.max(11.5, 12.5 * s);
  const fsS = Math.max(9.5, 10 * s);

  // S1 現況盤點:單一面板,四條來源列逐一掃描點亮,問題晶片在列後浮現
  if (kM > 0) {
    const fd = 1 - ez(sb(kG, .05, .35)) * .97;
    const a = ez(kM) * fd;
    if (a > 0.02) {
      g.save();
      const rows = [['LINE 對話', '詢問 ×12'], ['網站表單', '需求 ×5'], ['試算表', '名單 ×3'], ['CRM', '案件 ×8']];
      const chips = ['重複輸入 ×3', '漏追 ×2', '責任不清 ×1'];
      const ph = 26 + rows.length * rh + rh * 1.05;
      d.panel(px0, py0, pw, ph, a * .96, false);
      d.head(px0, py0, pw, mobile ? '現況盤點' : 'INTAKE — 現況盤點', a, C.orange);
      rows.forEach((r, i) => {
        const kr = ez(sb(kM, .12 + i * .1, .4 + i * .1));
        if (kr <= 0.01) return;
        const ry = py0 + 26 + i * rh;
        if (kr < 1 && kr > .15) { g.globalAlpha = a * (1 - kr) * .5; g.fillStyle = 'rgba(255,107,44,.14)'; g.fillRect(px0 + 2, ry + 3, (pw - 4) * kr, rh - 6); }
        g.globalAlpha = a * kr;
        d.han(r[0], px0 + 14, ry + rh * .62, fs, 'rgba(242,239,232,.88)', 700);
        g.globalAlpha = a * kr * .85;
        d.label(r[1], px0 + pw * .5, ry + rh * .58, fsS, 'rgba(242,239,232,.5)', .4);
        d.node(px0 + pw - 16, ry + rh * .5, 3, kr >= 1 ? C.green : C.orange, a * kr, kr < 1);
        if (i < rows.length - 1) { g.globalAlpha = a * .5; g.strokeStyle = 'rgba(242,239,232,.1)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px0 + 10, ry + rh); g.lineTo(px0 + pw - 10, ry + rh); g.stroke(); }
      });
      let chx = px0 + 12;
      const chy = py0 + 26 + rows.length * rh + rh * .18;
      chips.forEach((tx, i) => {
        const kc = ez(sb(kM, .55 + i * .1, .8 + i * .1));
        if (kc <= 0.02) return;
        g.globalAlpha = a * kc;
        g.font = '600 ' + fsS + 'px "Space Grotesk","Noto Sans TC",sans-serif';
        const w2 = g.measureText(tx).width + 16;
        d.rr(chx, chy, w2, fsS * 2.1, fsS);
        g.fillStyle = 'rgba(255,107,44,.13)'; g.fill();
        g.strokeStyle = 'rgba(255,107,44,.55)'; g.lineWidth = 1; g.stroke();
        g.fillStyle = 'rgba(242,239,232,.85)';
        g.fillText(tx, chx + 8, chy + fsS * 1.45);
        chx += w2 + 8;
      });
      g.restore(); g.globalAlpha = 1;
    }
  }

  // S2 定義第一階段:PHASE 1 面板,三條定義列 + 完成勾
  if (kG > 0) {
    const fd = 1 - ez(sb(kP, .05, .35)) * .97;
    const a = ez(kG) * fd;
    if (a > 0.02) {
      g.save();
      const defs = [['目標', '回覆不漏接'], ['範圍', 'LINE 客服・一段流程'], ['人工確認', '報價與例外由人把關']];
      const ph = 26 + defs.length * rh + rh * .5;
      d.panel(px0, py0, pw, ph, a * .96, true);
      d.head(px0, py0, pw, mobile ? '第一階段' : 'PHASE 1 — 定義第一階段', a, C.orange);
      defs.forEach((r, i) => {
        const kr = ez(sb(kG, .15 + i * .14, .45 + i * .14));
        if (kr <= 0.01) return;
        const ry = py0 + 26 + i * rh;
        g.globalAlpha = a * kr;
        d.label(r[0], px0 + 14, ry + rh * .58, fsS, C.orange, .8);
        d.han(r[1], px0 + Math.max(76, pw * .26), ry + rh * .62, fs, 'rgba(242,239,232,.9)', 700);
        d.node(px0 + pw - 16, ry + rh * .5, 3, C.orange, a * kr, kr < 1);
      });
      const kt = ez(sb(kG, .62, .85));
      if (kt > 0.02) {
        const ty2 = py0 + 26 + defs.length * rh + rh * .22;
        d.tick(px0 + 18, ty2, Math.max(6, 7 * s), C.green, a * kt);
        g.globalAlpha = a * kt;
        d.han('範圍確認,先做最有價值的一段', px0 + 32, ty2 + 4, fsS + 1, 'rgba(101,224,188,.9)', 600);
      }
      const kf = ez(sb(kG, .3, .7));
      if (kf > 0.02) {
        g.globalAlpha = a * kf * .8;
        g.setLineDash([5, 6]); g.strokeStyle = 'rgba(255,107,44,.5)'; g.lineWidth = 1;
        d.rr(px0 - 7, py0 - 7, pw + 14, ph + 14, 10); g.stroke(); g.setLineDash([]);
      }
      g.restore(); g.globalAlpha = 1;
    }
  }

  // S3 建立驗證:管線面板(詢問→辨識→AI/人工→下一步)+ 人工確認閘 + 測試列
  if (kP > 0) {
    const fd = 1 - ez(sb(kL, .05, .35)) * .97;
    const a = ez(kP) * fd;
    if (a > 0.02) {
      g.save();
      const ph = 26 + rh * 2.4 + rh * .9;
      d.panel(px0, py0, pw, ph, a * .96, false);
      d.head(px0, py0, pw, mobile ? '建立驗證' : 'PILOT — 建立驗證', a, C.blue);
      const steps = ['詢問', '辨識', 'AI/人工', '下一步'];
      const ty2 = py0 + 26 + rh * 1.15;
      const m0 = px0 + Math.max(26, pw * .08), m1 = px0 + pw - Math.max(26, pw * .08);
      steps.forEach((tx, i) => {
        const nx = m0 + (m1 - m0) * i / 3;
        const on = kP * 3.4 - .35 > i;
        d.node(nx, ty2, on ? 3.4 : 2.4, on ? C.blue : 'rgba(242,239,232,.3)', a, !on);
        g.globalAlpha = a;
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = on ? C.blue : 'rgba(242,239,232,.45)';
        g.textAlign = i === 0 ? 'left' : (i === steps.length - 1 ? 'right' : 'center');
        g.fillText(tx, i === 0 ? nx - 4 : (i === steps.length - 1 ? nx + 6 : nx), ty2 + rh * .62);
        g.textAlign = 'left';
        if (i < 3) d.line(nx + 6, ty2, m0 + (m1 - m0) * (i + 1) / 3 - 6, ty2, clamp(kP * 3.4 - .5 - i, 0, 1), 'rgba(62,155,255,.5)', 1.2);
      });
      const kg2 = ez(sb(kP, .45, .7));
      if (kg2 > 0.02) {
        const gx = m0 + (m1 - m0) * 2 / 3;
        g.globalAlpha = a * kg2;
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        const gt = '人工確認';
        const gw = g.measureText(gt).width + 14;
        d.rr(gx - gw / 2, ty2 - rh * .95, gw, fsS * 2, fsS);
        g.fillStyle = 'rgba(101,224,188,.12)'; g.fill();
        g.strokeStyle = 'rgba(101,224,188,.55)'; g.lineWidth = 1; g.stroke();
        g.fillStyle = 'rgba(101,224,188,.95)';
        g.fillText(gt, gx - gw / 2 + 7, ty2 - rh * .95 + fsS * 1.4);
        d.line(gx, ty2 - rh * .95 + fsS * 2, gx, ty2 - 6, kg2, 'rgba(101,224,188,.5)', 1, [3, 4]);
      }
      const kr2 = ez(sb(kP, .6, .9));
      if (kr2 > 0.02) {
        const ry = py0 + 26 + rh * 2.05;
        g.globalAlpha = a * kr2;
        d.node(px0 + 18, ry + rh * .32, 2.8, C.green, a * kr2 * (0.55 + 0.45 * Math.sin(t * 2.4)), false);
        d.han('實際使用者測試中・回饋直接改流程', px0 + 32, ry + rh * .42, fsS + 1.5, 'rgba(242,239,232,.8)', 600);
      }
      g.restore(); g.globalAlpha = 1;
    }
  }

  // S4 上線與改善:LIVE 面板(上線 tick / 觀察 pulse / 每週調整循環)
  if (kL > 0) {
    const a = ez(kL);
    if (a > 0.02) {
      g.save();
      const rows = [
        ['tick', '第一階段上線', '標準模組最快 10 個工作天'],
        ['pulse', '觀察實際使用與例外', '例外自動記錄'],
        ['cycle', '每週小幅調整', '依使用數據持續改善']
      ];
      const ph = 26 + rows.length * rh + rh * .35;
      d.panel(px0, py0, pw, ph, a * .96, true);
      d.head(px0, py0, pw, mobile ? '上線運作' : 'LIVE — 上線與改善', a, C.green);
      rows.forEach((r, i) => {
        const kr = ez(sb(kL, .12 + i * .16, .42 + i * .16));
        if (kr <= 0.01) return;
        const ry = py0 + 26 + i * rh;
        const icx = px0 + 18, icy = ry + rh * .5;
        if (r[0] === 'tick') d.tick(icx, icy, Math.max(5.5, 6.5 * s), C.green, a * kr);
        else if (r[0] === 'pulse') d.node(icx, icy, 3, C.green, a * kr * (0.5 + 0.5 * Math.sin(t * 2.2)), false);
        else {
          g.globalAlpha = a * kr; g.strokeStyle = C.green; g.lineWidth = 1.4;
          const rr2 = Math.max(5, 6 * s), a0 = t * 1.5;
          g.beginPath(); g.arc(icx, icy, rr2, a0, a0 + Math.PI * 1.5); g.stroke();
          const hx = icx + Math.cos(a0 + Math.PI * 1.5) * rr2, hy = icy + Math.sin(a0 + Math.PI * 1.5) * rr2;
          g.beginPath(); g.arc(hx, hy, 1.6, 0, TAU); g.fillStyle = C.green; g.fill();
        }
        g.globalAlpha = a * kr;
        d.han(r[1], px0 + 34, ry + rh * .62, fs, 'rgba(242,239,232,.92)', 700);
        if (!mobile || pw > 380) { g.globalAlpha = a * kr * .8; d.label(r[2], px0 + Math.max(150, pw * .5), ry + rh * .58, fsS, 'rgba(242,239,232,.45)', .3); }
      });
      const kb = ez(sb(kL, .6, .9));
      if (kb > 0.02) {
        g.globalAlpha = a * kb;
        d.han('不是一次到位,而是先把一段做順,再擴大。', px0 + 14, py0 + ph - rh * .28, fsS + 1, 'rgba(101,224,188,.85)', 600);
      }
      g.restore(); g.globalAlpha = 1;
    }
  }
}

export const painters = {
  solutions: paintSolutions,
  cases: paintCases,
  pricing: paintPricing,
  about: paintAbout,
  demo: paintDemo,
  method: paintMethod
};
