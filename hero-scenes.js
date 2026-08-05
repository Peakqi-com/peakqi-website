// PeakQi 內頁 Hero — Canvas 產品敘事層(每頁一個主視覺故事,同一品牌系統)
// 繪製規則:編輯感細線、面板、資料線與節點;禁止粒子/發光球/幾何體/快速旋轉。
// painter(g, env):env = { w,h,t,mobile,tier,zone,k(id),gp,C,s,F,d(工具集) }
import { HERO_SHARED } from './hero-config.js';
import { t } from './i18n.js';

// ★ 各 painter 都會 `const { ..., t } = e` 把「動畫時間軸」解構成 t,直接遮蔽 i18n 的 t
//   (實測 TypeError: t is not a function → 引擎連錯三次就把畫布永久關掉)。
//   全檔取字一律用別名 tt(zh, en):語意與 t 完全相同,中文站回傳 zh、/en/ 回傳 en。
const tt = t;

// ── i18n 共用字串:同一句中文在多個景重複出現時,單一翻譯來源(中文站回傳值與原字串完全相同)
const T_INQ_IN = tt('詢問進來', 'Inquiry in');
const T_HUMAN = tt('人工確認', 'Human check');
const T_WEBFORM = tt('網站表單', 'Web form');
const T_QUOTE = tt('報價', 'Quotes');
const T_CASES = tt('案例', 'Cases');
const T_SLOT_HELD = tt('已為您保留時段,細節由專人確認', 'Slot held — we confirm details');
const T_KEEP_TOOLS = tt('既有工具保留・資料線後方接通', 'Your tools stay · data connects behind');
const T_INCLUDED = tt('INCLUDED — 文字 AI 不限量', 'INCLUDED — unlimited text AI');
const T_USAGE = tt('USAGE-BASED — 圖片・影片,用多少算多少', 'USAGE-BASED — image · video, pay per use');
const T_SCOPE_OK = tt('範圍確認,先做最有價值的一段', 'Scope set — highest-value piece first');
const T_USER_TEST = tt('實際使用者測試中・回饋直接改流程', 'Real users testing · feedback tunes the flow');
const T_SYS_LIVE = tt('系統上線,開始運作', 'System live, running');
const T_AUDIT = tt('現況盤點', 'Current state');
const T_VALIDATE = tt('建立驗證', 'Build & validate');
const IND_WED = tt('婚禮婚慶', 'Weddings');
const IND_INT = tt('室內設計', 'Interiors');
const IND_REA = tt('房仲不動產', 'Real estate');
const T_CUSTOM_QUOTE = tt('依需求報價', 'Custom quote');
const T_BOOK_CALL = tt('預約諮詢', 'Book a call');
const NEXT4 = [tt('補齊需求', 'Fill in needs'), tt('提供案例', 'Send cases'), tt('確認反應', 'Check reply'), tt('決定下一步', 'Decide next')];
const MODS6 = [tt('客服', 'Support'), 'CRM', tt('行銷', 'Marketing'), T_QUOTE, tt('專案', 'Projects'), tt('數據', 'Data')];
const STAT3 = [tt('今日新客', 'New today'), tt('平均回覆', 'Avg reply'), tt('本週轉換', 'Weekly conv.')];
const SRC4 = [[tt('LINE 對話', 'LINE chats'), tt('詢問 ×12', 'Inquiries ×12')], [T_WEBFORM, tt('需求 ×5', 'Needs ×5')], [tt('試算表', 'Sheets'), tt('名單 ×3', 'Lists ×3')], ['CRM', tt('案件 ×8', 'Cases ×8')]];
const ISSUE3 = [tt('重複輸入 ×3', 'Double entry ×3'), tt('漏追 ×2', 'Missed ×2'), tt('責任不清 ×1', 'No owner ×1')];
const DEF3 = [[tt('目標', 'Goal'), tt('回覆不漏接', 'No dropped replies')], [tt('範圍', 'Scope'), tt('LINE 客服・一段流程', 'LINE support · one flow')], [T_HUMAN, tt('報價與例外由人把關', 'Quotes & exceptions stay human')]];
const STEP4 = [tt('詢問', 'Inquiry'), tt('辨識', 'Parse'), tt('AI/人工', 'AI/human'), tt('下一步', 'Next')];
const LIVE3 = [
  ['tick', tt('第一階段上線', 'Phase one live'), tt('標準模組最快 10 個工作天', 'Standard modules in as few as 10 days')],
  ['pulse', tt('觀察實際使用與例外', 'Watch usage & exceptions'), tt('例外自動記錄', 'Exceptions auto-logged')],
  ['cycle', tt('每週小幅調整', 'Small weekly tweaks'), tt('依使用數據持續改善', 'Tuned by usage data')]
];

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

// 手機共用進度軌:計數獨立一行右對齊,圓點滿版打到最右(端點半徑內縮才不會被裁)
// 回傳「內容起始 y」,呼叫端據此往下排版。
function mRail(g, d, C, t, x, w, y, n, cur, fs) {
  g.save();
  g.font = '700 ' + fs + 'px "Space Grotesk",monospace';
  g.fillStyle = C.orange; g.textAlign = 'right'; g.globalAlpha = 1;
  g.fillText(String(cur + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0'), x + w, y + fs);
  g.textAlign = 'left';
  const ry = y + fs + 16, r0 = 6;
  const x0 = x + r0, x1 = x + w - r0;
  for (let i = 0; i < n; i++) {
    const dx = x0 + (x1 - x0) * i / Math.max(1, n - 1);
    const on = i < cur, isCur = i === cur;
    if (i < n - 1) {
      const nx = x0 + (x1 - x0) * (i + 1) / (n - 1);
      d.line(dx + r0 + 3, ry, nx - r0 - 3, ry, on ? 1 : 0, 'rgba(101,224,188,.45)', 1.6);
    }
    if (isCur) { // 當前站:外圈脈動(子動畫)
      g.globalAlpha = .18 + .16 * Math.sin(t * 2.8);
      g.beginPath(); g.arc(dx, ry, r0 + 4.5, 0, TAU); g.fillStyle = C.orange; g.fill();
      g.globalAlpha = 1;
    }
    d.node(dx, ry, isCur ? r0 : 3.6, isCur ? C.orange : (on ? C.green : 'rgba(242,239,232,.32)'), isCur ? 1 : (on ? .95 : .5), !on && !isCur);
  }
  g.restore(); g.globalAlpha = 1;
  return ry + r0 + 14;
}

// 工具集:綁定 2d context
export function makeDraw(g) {
  const C = HERO_SHARED.colors;
  const d = {
    rr(x, y, w, h, r) {
      // 空間被壓縮時尺寸可能算成負數/NaN,arcTo 會丟 IndexSizeError;
      // 畫布只要連錯 3 次就會被永久關掉(使用者看到的是「動畫整個消失」),故在此收斂。
      if (!(w > 0) || !(h > 0)) { g.beginPath(); return; }
      r = Math.max(0, Math.min(r, w / 2, h / 2));
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
    // ★ 這三個工具原本結尾寫死 g.globalAlpha = 1,而不是還原呼叫前的值。
    //   後果:面板正在淡出時,緊接著畫的文字卻用滿版不透明度 ——
    //   Method 實測「實際使用者測試中」a=1.00 疊在「每週小幅調整」a=0.40 上面。
    //   改用 save/restore(與 d.tick / d.line 一致),整類疊印問題一次消掉。
    panel(x, y, w, h, a, hot) {
      g.save();
      g.globalAlpha *= a;
      d.rr(x, y, w, h, 6);
      g.fillStyle = 'rgba(20,23,28,.88)';
      g.fill();
      g.strokeStyle = hot ? 'rgba(255,107,44,.6)' : 'rgba(242,239,232,.18)';
      g.lineWidth = hot ? 1.4 : 1;
      g.stroke();
      g.restore();
    },
    head(x, y, w, title, a, color) { // 面板標題列
      g.save();
      g.globalAlpha *= a;
      g.strokeStyle = 'rgba(242,239,232,.14)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y + 22); g.lineTo(x + w, y + 22); g.stroke();
      g.fillStyle = color || C.orange;
      g.beginPath(); g.arc(x + 8, y + 11, 2.6, 0, TAU); g.fill();
      d.label(title, x + 18, y + 15, 10, 'rgba(242,239,232,.6)', 1.4);
      g.restore();
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
      g.save();
      g.globalAlpha = a;
      g.beginPath(); g.arc(x, y, r, 0, TAU);
      if (hollow) { g.strokeStyle = color; g.lineWidth = 1.4; g.stroke(); }
      else { g.fillStyle = color; g.fill(); }
      g.restore();
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
  let fs = Math.max(13.5, 12.5 * S);      // 站名
  let fsS = Math.max(11, 10 * S);         // 輔助/編號
  let fsB = Math.max(12.5, 11.5 * S);     // 站內內容(手機可讀鐵律:再拉高)
  if (mobile) { fs = Math.max(17, fs); fsS = Math.max(13, fsS); fsB = Math.max(16, fsB); } // 手機大字方針:大方、爽

  const IDS = ['sig', 'layers', 'cap', 'fol', 'nur', 'align', 'console'];
  const NAMES = [T_INQ_IN, tt('辨識需求', 'Identify need'), tt('回應與建檔', 'Reply & file'), tt('安排下一步', 'Set next step'), tt('延續脈絡', 'Keep context'), tt('流程接通', 'Connect flows'), tt('營運視圖', 'Ops view')];
  const ks = IDS.map(id => k(id));
  // 當前站一律採用 hero-kit 傳來的 ai/aid(與 DOM 文案層同一個判定),
  // 自行用 k>0.02 推算會慢文案一步 → 出現「文案 03 / 軌道 02」。
  let cur = IDS.indexOf(e.aid);
  if (cur < 0) { cur = 0; ks.forEach((v, i) => { if (v > 0.02) cur = i; }); }

  // ── 手機:單景舞台(吸睛版)——進度軌 + 一次一個大場景物件
  //    母動畫:物件隨捲動 進場(上移+旋轉+淡入)/退場(上飄+反旋+淡出)
  //    子動畫:物件自身持續動作(打字點/掃描光/浮動/巡遊 token/衛星軌道/接通火花/數字閃爍)
  if (mobile) {
    const kv = ks[cur];
    const px0 = z.x + 2;
    const pw = z.w - 4;
    // 面板依該景實際內容裁高(有多少畫多少),整組再於可用高度內置中,下方不留大片空白
    const railH = fsS + 36;
    const availH = z.h - railH - 6;
    const vhOf = (i) => Math.max(130, Math.min(availH, [176, 258, 258, 196, 258, 196, 248][i]));
    // 進度軌永遠先畫:尾段 CTA 回歸把空間壓縮時,畫面也不會整塊變空白
    const vy = mRail(g, d, C, t, px0, pw, z.y + 2 + Math.min(56, Math.max(0, (availH - vhOf(cur)) / 2)), IDS.length, cur, fsS);
    if (availH < 130) return;

    // 母動畫:上一景上飄順旋淡出的同時,這一景由下升起逆旋淡入 —— 交叉換場,不會出現空畫面
    // aP = 卡片本體透明度(先實體到位,擋住上一景的殘影);aa = 卡內內容透明度(隨後長出來)
    const stage = (i, kvi, aa, dy, rot, aP) => {
      const h2 = vhOf(i);
      g.save();
      const cxp = px0 + pw / 2, cyp = vy + h2 / 2;
      g.translate(cxp, cyp + dy);
      g.rotate(rot * Math.PI / 180);
      g.translate(-cxp, -cyp);
      g.globalAlpha = aP;
      d.rr(px0, vy, pw, h2, 12);
      g.fillStyle = 'rgba(15,18,22,.97)'; g.fill();
      g.strokeStyle = 'rgba(255,107,44,.35)'; g.lineWidth = 1.2; g.stroke();
      mScene(i, kvi, aa, px0 + 14, vy + 12, pw - 28, h2 - 24);
      g.restore(); g.globalAlpha = 1;
    };
    const eIn = ez(sb(kv, .02, .28));
    const card = ez(sb(kv, .005, .1));   // 卡片本體:一進場就成形
    if (cur > 0) { // 前一景先讓位:壓暗、上飄離場
      const go = ez(sb(kv, 0, .18));
      if (1 - go > .02) stage(cur - 1, 1, (1 - go) * .8, -go * 76, go * 3, (1 - go) * .85);
    }
    if (card > .02) stage(cur, kv, eIn, (1 - card) * 36, (1 - card) * -3.5, card);
    return;
  }


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

  // ── 手機大場景(吸睛版,子動畫濃度高)
  function mScene(i, kv, a, x, y, w, h) {
    const kk = ez(sb(kv, .12, .6));
    const cx2 = x + w / 2;
    const bh = Math.max(28, 30 * S);
    g.globalAlpha = a;
    if (i === 0) { // 詢問進來:LINE 對話頭 + 打字點 → 泡泡彈入 + 來源晶片浮動
      g.beginPath(); g.arc(x + 16, y + 14, 12, 0, TAU);
      g.fillStyle = 'rgba(101,224,188,.2)'; g.fill();
      g.strokeStyle = C.green; g.lineWidth = 1.4; g.stroke();
      g.font = '700 ' + fsS + 'px "Noto Sans TC",sans-serif'; g.fillStyle = C.green;
      g.textAlign = 'center'; g.fillText(tt('客', 'C'), x + 16, y + 18); g.textAlign = 'left';
      d.label(tt('LINE・新訊息', 'LINE · New message'), x + 34, y + 18, fsS, 'rgba(242,239,232,.6)', .8);
      const bk = ez(sb(kv, .18, .42));
      if (bk < 1) { // 打字點(子動畫)
        g.globalAlpha = a * (1 - bk);
        for (let j2 = 0; j2 < 3; j2++) {
          const bob = Math.sin(t * 6 + j2 * .9) * 3;
          d.node(x + 20 + j2 * 12, y + 46 + bob, 3, 'rgba(242,239,232,.55)', 1, false);
        }
      }
      if (bk > 0.02) {
        const pop = 1 + (1 - ez(sb(kv, .18, .5))) * .06; // 彈入 wobble
        g.save(); g.translate(x + 10, y + 40); g.scale(pop, pop);
        g.globalAlpha = a * bk;
        d.rr(0, 0, Math.min(w * .84, 268), bh, 11);
        g.fillStyle = 'rgba(101,224,188,.16)'; g.fill();
        g.strokeStyle = 'rgba(101,224,188,.55)'; g.stroke();
        g.font = '600 ' + fsB + 'px "Noto Sans TC",sans-serif'; g.fillStyle = 'rgba(242,239,232,.92)';
        g.fillText(tt('請問到府服務多少錢?可以這週嗎?', 'Price for a visit? This week?'), 10, bh * .66);
        g.restore();
      }
      let xx = x;
      ['LINE', T_WEBFORM, tt('電話', 'Phone')].forEach((tx2, j2) => {
        const kc = ez(sb(kv, .45 + j2 * .12, .68 + j2 * .12));
        if (kc <= .02) return;
        g.globalAlpha = a * kc;
        const bob = Math.sin(t * 1.8 + j2 * 1.3) * 2.5; // 晶片浮動(子)
        xx += d.chip(xx, y + h - Math.max(22, 24 * S) + bob, tx2, j2 === 0, fsS) + 8;
      });
    } else if (i === 1) { // 辨識需求:掃描卡 + 掃描光束(子) + 欄位落位
      const cw2 = Math.min(w * .9, 300), ch2 = h * .62, sx = cx2 - cw2 / 2, sy = y + 8;
      d.rr(sx, sy, cw2, ch2, 8);
      g.fillStyle = 'rgba(9,11,14,.7)'; g.fill();
      g.strokeStyle = 'rgba(255,107,44,.4)'; g.stroke();
      const beamY = sy + ch2 * (0.5 + 0.45 * Math.sin(t * 1.6)); // 掃描光束
      g.globalAlpha = a * .5;
      const grd = g.createLinearGradient(0, beamY - 12, 0, beamY + 12);
      grd.addColorStop(0, 'rgba(255,107,44,0)'); grd.addColorStop(.5, 'rgba(255,107,44,.3)'); grd.addColorStop(1, 'rgba(255,107,44,0)');
      g.fillStyle = grd; g.fillRect(sx + 2, beamY - 12, cw2 - 4, 24);
      g.globalAlpha = a;
      [[tt('需求', 'Need'), tt('到府清潔', 'Home cleaning')], [tt('時段', 'Slot'), tt('週五下午', 'Fri afternoon')], [tt('價格', 'Price'), tt('待人工確認', 'Human review')]].forEach((r2, j2) => {
        const kc = ez(sb(kv, .15 + j2 * .16, .4 + j2 * .16));
        if (kc <= .02) return;
        const ry2 = sy + 14 + j2 * (ch2 - 24) / 3;
        g.globalAlpha = a * kc;
        d.label(r2[0], sx + 12 + (1 - kc) * 18, ry2 + 8, fsS, j2 === 2 ? C.orange : 'rgba(242,239,232,.5)', .8);
        d.han(r2[1], sx + 12 + Math.max(52, 56 * S) + (1 - kc) * 18, ry2 + 10, fsB, 'rgba(242,239,232,.9)', 700);
        d.node(sx + cw2 - 16, ry2 + 4, 2.8, j2 === 2 ? C.orange : C.green, a * kc, kc < 1);
      });
      g.globalAlpha = a * ez(sb(kv, .6, .85));
      d.label(tt('AI 辨識中・敏感項標記給人', 'AI parses · sensitive items to humans'), x, y + h - 8, fsS, 'rgba(242,239,232,.5)', .8);
    } else if (i === 2) { // 回應與建檔:回覆泡泡 + CRM 卡蓋章浮動(子)
      const bk = ez(sb(kv, .12, .38));
      if (bk > .02) {
        g.globalAlpha = a * bk;
        const bw2 = Math.min(w * .9, 290);
        d.rr(x + w - bw2, y + 6, bw2, bh, 11);
        g.fillStyle = 'rgba(101,224,188,.15)'; g.fill();
        g.strokeStyle = 'rgba(101,224,188,.5)'; g.stroke();
        g.font = '600 ' + fsB + 'px "Noto Sans TC",sans-serif'; g.fillStyle = 'rgba(212,244,232,.95)';
        g.fillText(T_SLOT_HELD, x + w - bw2 + 10, y + 6 + bh * .66);
      }
      const ck = ez(sb(kv, .35, .65));
      if (ck > .02) {
        const flo = Math.sin(t * 1.6) * 3; // 卡片浮動(子)
        const cw2 = Math.min(w * .7, 210), chh = Math.max(56, 62 * S);
        const sx = cx2 - cw2 / 2, sy = y + h * .42 + flo;
        g.globalAlpha = a * ck;
        d.rr(sx, sy, cw2, chh, 6);
        g.fillStyle = '#F2EFE8'; g.fill();
        g.strokeStyle = C.orange; g.lineWidth = 1.4; g.stroke();
        g.font = '800 ' + Math.max(13, 14 * S) + 'px "Noto Sans TC",sans-serif'; g.fillStyle = '#090B0E';
        g.fillText(tt('王小姐・到府清潔', 'Ms. Wang · Home cleaning'), sx + 10, sy + 20);
        g.font = '600 ' + fsS + 'px "Space Grotesk",sans-serif'; g.fillStyle = '#D14E12';
        g.fillText(tt('CRM CARD・負責人已指定', 'CRM CARD · Owner assigned'), sx + 10, sy + chh - 12);
        const stk = ez(sb(kv, .6, .8)); // 蓋章(子:落下+微震)
        if (stk > .02) {
          const drop = (1 - stk) * -14;
          g.save(); g.translate(sx + cw2 - 26, sy + 22 + drop);
          g.rotate(-.28 + stk * .1); g.globalAlpha = a * stk;
          g.strokeStyle = C.green; g.lineWidth = 2;
          g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.stroke();
          d.tick(0, 0, 6, C.green, 1);
          g.restore();
        }
      }
    } else if (i === 3) { // 安排下一步:token 巡遊四站(子:沿線滑行)
      const m0 = x + 14, m1 = x + w - 14, ty2 = y + h * .34;
      const steps = NEXT4;
      // 進度正規化:本景 82% 前一定抵達最後一站(舊式 kv*3.2-.3 對末站需要 kv>1.03,永遠到不了)
      const conn = ez(sb(kv, .06, .82)) * (steps.length - 1);
      steps.forEach((tx2, j2) => {
        const nx = m0 + (m1 - m0) * j2 / 3;
        const on = conn >= j2 - .02;
        d.node(nx, ty2, on ? 3.6 : 2.4, on ? C.blue : 'rgba(242,239,232,.3)', a, !on);
        g.globalAlpha = a;
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = on ? C.blue : 'rgba(242,239,232,.45)';
        g.textAlign = j2 === 0 ? 'left' : (j2 === 3 ? 'right' : 'center');
        // 交錯兩排:窄機(360)四個站名同一排會互相撞在一起
        g.fillText(tx2, j2 === 0 ? nx - 4 : (j2 === 3 ? nx + 4 : nx),
          ty2 + (j2 % 2 ? Math.max(38, 40 * S) : Math.max(19, 21 * S)));
        g.textAlign = 'left';
        if (j2 < 3) d.line(nx + 6, ty2, m0 + (m1 - m0) * (j2 + 1) / 3 - 6, ty2, clamp(conn - j2, 0, 1), 'rgba(62,155,255,.5)', 1.4);
      });
      // token 巡遊(子動畫):持續往前跑,但不超過已接通的範圍;接通完成後可跑到最後一站
      const tokX = m0 + (m1 - m0) * Math.min((t * .32) % 1, conn / 3);
      g.globalAlpha = a * ez(sb(kv, .3, .6));
      g.beginPath(); g.arc(tokX, ty2, 6, 0, TAU);
      g.fillStyle = 'rgba(62,155,255,.25)'; g.fill();
      d.node(tokX, ty2, 3.2, C.blue, 1, false);
      const rk = ez(sb(kv, .6, .85));
      if (rk > .02) {
        g.globalAlpha = a * rk;
        const shake = Math.sin(t * 10) * ez(sb(kv, .6, .7)) * 1.6; // 鈴鐺微震(子)
        g.save(); g.translate(x + 8 + shake, y + h - Math.max(24, 26 * S));
        let xx2 = 0;
        xx2 += d.chip(0, 0, tt('提醒已排', 'Reminder set'), true, fsS) + 8;
        d.chip(xx2, 0, tt('AI 擬稿・人確認', 'AI drafts · human OK'), false, fsS);
        g.restore();
      }
    } else if (i === 4) { // 延續脈絡:中心檔案 + 三衛星軌道(子:公轉)
      const oy = y + h * .46, orad = Math.min(w * .3, h * .34);
      const ck = ez(sb(kv, .12, .4));
      g.globalAlpha = a * ck;
      g.beginPath(); g.arc(cx2, oy, Math.max(22, 24 * S), 0, TAU);
      g.fillStyle = 'rgba(255,107,44,.14)'; g.fill();
      g.strokeStyle = C.orange; g.lineWidth = 1.6; g.stroke();
      g.font = '700 ' + fsS + 'px "Noto Sans TC",sans-serif'; g.fillStyle = C.ivory;
      g.textAlign = 'center'; g.fillText(tt('客戶脈絡', 'Context'), cx2, oy + 4); g.textAlign = 'left';
      g.globalAlpha = a * ck * .5;
      g.setLineDash([3, 6]);
      g.beginPath(); g.arc(cx2, oy, orad, 0, TAU); g.strokeStyle = 'rgba(242,239,232,.3)'; g.lineWidth = 1; g.stroke();
      g.setLineDash([]);
      [T_QUOTE, T_CASES, tt('服務', 'Care')].forEach((tx2, j2) => {
        const kc = ez(sb(kv, .3 + j2 * .14, .55 + j2 * .14));
        if (kc <= .02) return;
        const ang = t * .7 + j2 * Math.PI * 2 / 3; // 公轉(子)
        const bx = cx2 + Math.cos(ang) * orad, by = oy + Math.sin(ang) * orad * .74;
        g.globalAlpha = a * kc;
        g.beginPath(); g.arc(bx, by, Math.max(18, 19 * S), 0, TAU);
        g.fillStyle = 'rgba(9,11,14,.92)'; g.fill();
        g.strokeStyle = [C.orange, C.blue, C.green][j2]; g.lineWidth = 1.4; g.stroke();
        g.font = '700 ' + fsS + 'px "Noto Sans TC",sans-serif'; g.fillStyle = 'rgba(242,239,232,.9)';
        g.textAlign = 'center'; g.fillText(tx2, bx, by + 4); g.textAlign = 'left';
      });
      g.globalAlpha = a * ez(sb(kv, .65, .9));
      d.label(tt('同一份脈絡,不用重新整理', 'One context, no re-explaining'), x, y + h - 8, fsS, 'rgba(242,239,232,.55)', .8);
    } else if (i === 5) { // 流程接通:模組逐一接通 + 火花(子) + 流動虛線(子)
      const mods = MODS6;
      const m0 = x + 16, m1 = x + w - 16, my = y + h * .42;
      const conn = ez(sb(kv, .06, .8)) * (mods.length - 1); // 正規化:本景 80% 前接通到最後一個模組
      mods.forEach((tx2, j2) => {
        const nx = m0 + (m1 - m0) * j2 / 5;
        const on = conn >= j2 - .02;
        if (j2 < 5 && on) { // 流動虛線(子)
          g.save(); g.strokeStyle = 'rgba(101,224,188,.55)'; g.lineWidth = 1.4;
          g.setLineDash([5, 7]); g.lineDashOffset = -t * 26;
          g.beginPath(); g.moveTo(nx + 5, my); g.lineTo(m0 + (m1 - m0) * (j2 + 1) / 5 - 5, my); g.stroke();
          g.restore();
        }
        d.node(nx, my, on ? 3.4 : 2.2, on ? C.green : 'rgba(242,239,232,.3)', a, !on);
        if (Math.abs(conn - j2) < .5) { // 接通火花(子)
          const sp = 1 - Math.abs(conn - j2) * 2;
          g.globalAlpha = a * Math.max(0, sp);
          g.beginPath(); g.arc(nx, my, 9 + sp * 5, 0, TAU);
          g.strokeStyle = 'rgba(101,224,188,.6)'; g.lineWidth = 1; g.stroke();
        }
        g.globalAlpha = a * (on ? 1 : .5);
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = on ? 'rgba(242,239,232,.9)' : 'rgba(242,239,232,.4)';
        g.textAlign = 'center'; g.fillText(tx2, nx, my + Math.max(19, 21 * S)); g.textAlign = 'left';
      });
      g.globalAlpha = a * ez(sb(kv, .7, .95));
      d.label(T_KEEP_TOOLS, x, y + h - 8, fsS, 'rgba(242,239,232,.55)', .8);
    } else { // 營運視圖:三統計磚 + 火花線(子:描繪循環)
      const st = [['12', STAT3[0], C.ivory], ['28s', STAT3[1], C.blue], ['18%', STAT3[2], C.green]];
      const gw2 = (w - 20) / 3;
      st.forEach((r2, j2) => {
        // 收在本景 52% 前跑完:尾景 CTA 回來時,步驟已經演完(順序是先動畫、後按鈕)
        const kc = ez(sb(kv, .06 + j2 * .1, .28 + j2 * .1));
        if (kc <= .02) return;
        const bx = x + j2 * (gw2 + 10);
        g.globalAlpha = a * kc;
        d.rr(bx, y + 6, gw2, h * .52, 8);
        g.fillStyle = 'rgba(242,239,232,.05)'; g.fill();
        g.strokeStyle = 'rgba(242,239,232,.18)'; g.stroke();
        const blink = j2 === 0 ? (Math.sin(t * 3.4) > .92 ? .72 : 1) : 1; // 數字更新閃動(子,不做到像沒亮)
        g.globalAlpha = a * kc * blink;
        g.font = '700 ' + Math.max(17, 19 * S) + 'px "Space Grotesk",sans-serif';
        g.fillStyle = r2[2]; g.textAlign = 'center';
        g.fillText(r2[0], bx + gw2 / 2, y + 6 + h * .28);
        g.globalAlpha = a * kc;
        g.font = '500 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = 'rgba(242,239,232,.55)';
        g.fillText(r2[1], bx + gw2 / 2, y + 6 + h * .28 + Math.max(16, 18 * S));
        g.textAlign = 'left';
      });
      const lk = ez(sb(kv, .34, .6)); // 火花線循環(子);同樣提前跑完
      if (lk > .02) {
        const ly2 = y + h * .78;
        g.globalAlpha = a * lk;
        g.strokeStyle = 'rgba(101,224,188,.6)'; g.lineWidth = 1.6;
        g.beginPath();
        const seg2 = 30;
        for (let j2 = 0; j2 <= seg2; j2++) {
          const fx2 = j2 / seg2;
          const wave = Math.sin(fx2 * 7 + t * 2.4) * h * .05 * (0.4 + 0.6 * fx2);
          const px2 = x + 8 + (w - 16) * fx2;
          if (j2 === 0) g.moveTo(px2, ly2 + wave); else g.lineTo(px2, ly2 + wave);
        }
        g.stroke();
      }
    }
    g.globalAlpha = a;
  }

  // ── 各站小景(畫在展開盒內;p = 該站 k)
  function drawStation(i, x, y, w, h, kv, a) {
    const pad = Math.max(10, 12 * S);
    const cx2 = x + pad, cw = w - pad * 2;
    const line1 = y + pad + fsB * .9;
    const kk = ez(sb(kv, .18, .8));
    g.globalAlpha = a;
    if (i === 0) { // 詢問進來:LINE 泡泡 + 來源列
      bub(cx2, y + pad, Math.min(cw * .86, 300), tt('請問到府服務多少錢?', 'How much for a home visit?'), 'rgba(101,224,188,.14)', 'rgba(101,224,188,.5)');
      g.globalAlpha = a * kk;
      d.label(tt('LINE・網站表單・電話', 'LINE · Web form · Phone'), cx2, y + h - pad * .7, fsS, 'rgba(242,239,232,.5)', .8);
    } else if (i === 1) { // 辨識需求:欄位晶片逐一亮
      let xx = cx2;
      [tt('需求:到府清潔', 'Need: home cleaning'), tt('時段:週五下午', 'Slot: Fri afternoon'), tt('價格:待人工', 'Price: human review')].forEach((tx2, j) => {
        const kc = ez(sb(kv, .15 + j * .18, .4 + j * .18));
        if (kc <= 0.02) return;
        g.globalAlpha = a * kc;
        xx += d.chip(xx, line1 - fsS, tx2, j === 2, fsS) + 8;
        if (xx > cx2 + cw - 60) { xx = cx2; }
      });
      g.globalAlpha = a * ez(sb(kv, .6, .9));
      d.label(tt('AI 辨識・敏感項標記待確認', 'AI parses · flags await human check'), cx2, y + h - pad * .7, fsS, 'rgba(242,239,232,.5)', .8);
    } else if (i === 2) { // 回應與建檔:回覆泡泡 + CRM 卡生成
      bub(cx2, y + pad, Math.min(cw * .9, 320), T_SLOT_HELD, 'rgba(255,107,44,.12)', 'rgba(255,107,44,.5)');
      const kc = ez(sb(kv, .4, .75));
      if (kc > 0.02) {
        const cw2 = Math.min(150 * S, cw * .6), chy = y + h - pad - Math.max(30, 32 * S);
        g.globalAlpha = a * kc;
        d.rr(cx2, chy, cw2, Math.max(28, 30 * S), 4);
        g.fillStyle = '#F2EFE8'; g.fill();
        g.strokeStyle = C.orange; g.lineWidth = 1.2; g.stroke();
        g.font = '800 ' + fsS + 'px "Noto Sans TC",sans-serif'; g.fillStyle = '#090B0E';
        g.fillText(tt('王小姐', 'Ms. Wang'), cx2 + 8, chy + Math.max(12, 12 * S));
        g.font = '600 ' + Math.max(8.5, 8.5 * S) + 'px "Space Grotesk",sans-serif'; g.fillStyle = '#D14E12';
        g.fillText(tt('CRM CARD ・ 負責人已指定', 'CRM CARD · Owner assigned'), cx2 + 8, chy + Math.max(23, 24 * S));
      }
    } else if (i === 3) { // 安排下一步:四步點軌
      const m0 = cx2 + 6, m1 = cx2 + cw - 6, ty2 = y + h * .46;
      NEXT4.forEach((tx2, j) => {
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
      d.label(tt('AI 擬稿・人確認才送出', 'AI drafts · human OK before send'), cx2, y + h - pad * .7, fsS, 'rgba(101,224,188,.8)', .8);
    } else if (i === 4) { // 延續脈絡:同一份脈絡 → 三個用途
      g.globalAlpha = a;
      d.han(tt('同一份客戶脈絡', 'One customer context'), cx2, line1, fsB, 'rgba(242,239,232,.85)', 700);
      let xx = cx2;
      [T_QUOTE, T_CASES, tt('後續服務', 'Follow-up')].forEach((tx2, j) => {
        const kc = ez(sb(kv, .25 + j * .18, .5 + j * .18));
        if (kc <= 0.02) return;
        g.globalAlpha = a * kc;
        xx += d.chip(xx, y + h * .52, tx2, true, fsS) + 8;
      });
    } else if (i === 5) { // 流程接通:模組節點連線
      const mods = MODS6;
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
      d.label(T_KEEP_TOOLS, cx2, y + h - pad * .7, fsS, 'rgba(242,239,232,.5)', .8);
    } else { // 營運視圖:三個統計膠囊(呼吸)
      const st = [['12', STAT3[0], C.ivory], ['28s', STAT3[1], C.blue], ['18%', STAT3[2], C.green]];
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
  const { zone: z, k, C, d, mobile, t, gp } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const S = clamp(Math.min(z.w / 520, z.h / 460), mobile ? .95 : .62, 1.25);
  // 手機字級拉到與其他 hero 一致(原本 12/11/9.5 太小);版面改用「理想高度」佈局,
  // 矮視窗(iPhone mini 開著工具列只剩 267px)再整組等比縮小 —— 縮的是整體,不會壓到互相重疊。
  const fs = mobile ? 16 : Math.max(12, 12.5 * S);
  const fsS = mobile ? 13 : Math.max(9.5, 10 * S);
  const fsB = mobile ? 15 : Math.max(11, 11.5 * S);
  const ks = { wed: k('wed'), int: k('int'), rea: k('rea'), bea: k('bea'), sum: k('sum') };
  const pw = Math.min(z.w * .94, 430);
  const px0 = z.x + (z.w - pw) / 2;
  const availH = z.h - Math.max(8, z.h * .02) * 2;
  const ph = mobile ? 372 : Math.min(availH, Math.max(300, z.h * .9));
  const sc = mobile ? Math.min(1, availH / ph) : 1;
  const py0 = z.y + Math.max(8, z.h * .02) + Math.max(0, (availH - ph * sc) / 2);

  const order = ['wed', 'int', 'rea', 'bea', 'sum'];
  const NAME = { wed: IND_WED, int: IND_INT, rea: IND_REA, bea: tt('美業預約', 'Beauty'), sum: 'YOUR TURN' };
  const HUE = { wed: C.orange, int: C.orange, rea: C.blue, bea: C.green, sum: C.green };

  // ── 開場 ident:五場域星陣(2026-08 使用者回饋:靜止首屏的畫面與場域 01 完全重複)
  // gp<0.06 只畫獨立開場——五個場域色點沿三圈橢圓導軌慢速環繞核心光圈,軌跡拖尾、
  // 依序點亮+擴散圈,下方 PROOF IN MOTION 動態字距逐字浮現;首載跑一次 boot 序列。
  // 0.06–0.12 交棒:光圈張開、整陣放大淡出;場景卡以同區間 lead 淡入接手
  // (既有五場景繪製本體不動,只在總 alpha 乘上交棒係數)。
  const introA = 1 - ez(sb(gp, .06, .12));
  const lead = ez(sb(gp, .055, .125));
  if (introA > 0.02) introIdent(introA);

  order.forEach((id, idx) => {
    const kv = ks[id];
    if (kv <= 0.02) return;
    const nxt = order[idx + 1];
    // 卡片全部畫在同一個 px0/py0。原本舊卡淡出與新卡淡入的區間重疊
    // (實測舊卡 a=0.59、新卡 a=0.48 同時在畫),兩張卡的編號與產業名直接疊印成亂碼。
    // 改成不重疊的接力:舊卡在下一景 12% 前就退乾淨,新卡 13% 之後才開始進場。
    const fd = nxt ? 1 - ez(sb(ks[nxt], 0, .12)) : 1;
    const a = ez(sb(kv, .13, .34)) * fd * lead; // lead=開場 ident 交棒係數(gp<0.055 場景卡完全讓位)
    if (a <= 0.02) return;
    g.save();
    // 空間不足時整組等比縮小(以面板上緣中點為錨),版面座標維持在理想尺寸
    if (sc < 1) { g.translate(px0 + pw / 2, py0); g.scale(sc, sc); g.translate(-(px0 + pw / 2), -py0); }
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
        g.fillStyle = 'rgba(242,239,232,.6)'; g.fillText(tt('檔期已保留', 'Date reserved'), cx2, y + h * .4 + Math.max(26, 29 * S));
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
        g.fillText(tt('週六 14:00 帶看', 'Sat 14:00 viewing'), cx2, hy2 + hh + Math.max(16, 18 * S));
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
        g.fillText(tt('前一日 18:00 自動提醒已排', 'Reminder set · 18:00 day before'), gx0, gy0 + rows * (gh2 + 8) + Math.max(14, 16 * S));
      }
    } else { // sum:四場域小徽章 → 中央合流
      const icons = [tt('婚', 'W'), tt('裝', 'I'), tt('房', 'R'), tt('美', 'B')];
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
    const Q = { wed: tt('請問 6 月還有檔期嗎?', 'Any June dates left?'), int: tt('三房想改北歐風,怎麼算?', '3-room Nordic redo — price?'), rea: tt('這間還在嗎?想約看屋', 'Still listed? Can I view?'), bea: tt('週五染髮有位子嗎?', 'Any color slots Friday?'), sum: tt('把這流程換成你的產業?', 'Your industry, same flow?') };
    const A2 = { wed: tt('已保留 6/14,細節專人確認', '6/14 held — we confirm details'), int: tt('已建檔,設計師今日回覆', 'Filed — designer replies today'), rea: tt('已排週六 14:00 帶看', 'Viewing set: Sat 14:00'), bea: tt('已預約,改期直接回這裡', 'Booked — reply here to change'), sum: tt('15 分鐘,用你的場景跑一次', '15 min — run your scenario') };
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
      wed: [tt('檔期詢問 ✓', 'Inquiry ✓'), tt('保留 ✓', 'Held ✓'), tt('專人確認', 'Team confirms')],
      int: [tt('需求整理 ✓', 'Brief ✓'), tt('案件卡 ✓', 'Case card ✓'), tt('設計師接手', 'To designer')],
      rea: [tt('物件比對 ✓', 'Matched ✓'), tt('帶看排程 ✓', 'Viewing set ✓'), tt('回報屋主', 'Owner updated')],
      bea: [tt('預約 ✓', 'Booked ✓'), tt('提醒已排 ✓', 'Reminder ✓'), tt('回頭客名單', 'Repeat clients')],
      sum: [tt('接住詢問', 'Catch leads'), tt('自動建檔', 'Auto-file'), tt('持續跟進', 'Follow up')]
    }[id];
    let xx = x;
    rows.forEach((tx2, j) => {
      const kc = ez(sb(kv, .55 + j * .1, .78 + j * .1));
      if (kc <= .02) return;
      g.globalAlpha = a * kc;
      xx += d.chip(xx, yBase - Math.max(18, 20 * S), tx2, j === rows.length - 1, fsS) + 7;
    });
  }

  // ── 開場 ident 繪製:五場域星陣+光圈(與五場景互斥,不共用任何場景元素)
  function introIdent(A) {
    if (paintCases._t0 === undefined) paintCases._t0 = t;      // 首載 boot 序列基準
    const boot = ez(clamp((t - paintCases._t0) / 1.8, 0, 1));
    const ex = 1 - A;                                          // 交棒進度(0=靜止,1=已讓位)
    const cx = z.x + z.w / 2, cyO = z.y + z.h * .40;           // 星陣核心;字區留在下方
    const SC = clamp(Math.min(z.w / 520, z.h / 420), .7, 1.3);
    const rx = Math.min(z.w * .44, 340), ry = Math.min(z.h * .30, 210);
    const rot = gp * 1.8;                                      // 0–0.06 捲動也有微轉回饋
    g.save();
    const scl = 1 + ex * .14;                                  // 交棒:整陣以核心為錨放大淡出
    g.translate(cx, cyO); g.scale(scl, scl); g.translate(-cx, -cyO);

    // 星塵:確定性偽隨機、極低調明滅(氛圍層;非粒子系統)
    for (let i = 0; i < 18; i++) {
      const h1 = Math.sin(i * 127.1) * 43758.5453, h2 = Math.sin(i * 311.7) * 12543.85;
      d.node(cx + (h1 - Math.floor(h1) - .5) * 2.1 * rx, cyO + (h2 - Math.floor(h2) - .5) * 2.1 * ry,
        i % 4 === 0 ? 1.3 : .9, C.ivory,
        A * boot * (.04 + .1 * (.5 + .5 * Math.sin(t * (.6 + (i % 5) * .23) + i * 1.7))), false);
    }

    // 三圈橢圓導軌:boot 期掃線畫入;外圈虛線緩轉+一段橙色掠弧
    [.58, .79, 1].forEach((fr, ri) => {
      const sweep = ez(clamp(boot * 1.7 - ri * .22, 0, 1));
      if (sweep <= 0.01) return;
      g.globalAlpha = A * (ri === 2 ? .17 : .1);
      g.strokeStyle = '#F2EFE8'; g.lineWidth = 1;
      if (ri === 2) { g.setLineDash([3, 8]); g.lineDashOffset = -t * 5; }
      g.beginPath(); g.ellipse(cx, cyO, rx * fr, ry * fr, 0, -Math.PI / 2, -Math.PI / 2 + TAU * sweep); g.stroke();
      g.setLineDash([]);
      if (ri === 2 && sweep > .98) {
        const a0 = t * .3 + rot;
        g.globalAlpha = A * .55; g.strokeStyle = C.orange; g.lineWidth = 1.5;
        g.beginPath(); g.ellipse(cx, cyO, rx, ry, 0, a0, a0 + .9); g.stroke();
      }
    });

    // 五場域節點(色點=場域,不用字):各自軌道慢速環繞,拖尾+依序點亮+擴散圈
    const FR = [.42, .58, .72, .86, 1];
    const OM = [.3, -.22, .18, -.15, .12];
    const PH0 = [0, 2.5, 4.4, 1.2, 5.5];
    const HUEI = [C.orange, C.orange, C.blue, C.green, C.green];
    const nodeR = Math.max(3.2, 4.2 * SC);
    const pos = [], bri = [];
    for (let i = 0; i < 5; i++) {
      const bIn = ez(clamp(boot * 6 - i * 1.05, 0, 1));      // 首載依序點亮
      const th = PH0[i] + t * OM[i] + rot;
      const px = cx + Math.cos(th) * rx * FR[i];
      const py = cyO + Math.sin(th) * ry * FR[i];
      const ph = ((t * .85 - i * (TAU / 5)) % TAU + TAU) % TAU;
      const flash = ph < Math.PI ? Math.pow(Math.sin(ph), 3) : 0;   // 循環輪點(常駐律動)
      const b = (.4 + .6 * flash) * bIn;
      pos.push([px, py]); bri.push(b);
      if (bIn <= 0.02) continue;
      for (let j = 1; j <= 9; j++) {                         // 軌跡拖尾:漸細漸淡
        const th2 = th - Math.sign(OM[i]) * j * .06;
        d.node(cx + Math.cos(th2) * rx * FR[i], cyO + Math.sin(th2) * ry * FR[i],
          nodeR * (1 - j / 11) * .55, HUEI[i], A * b * (1 - j / 10) * .4, false);
      }
      d.node(px, py, nodeR * 2.3, HUEI[i], A * b * .12, false);
      d.node(px, py, nodeR, HUEI[i], A * (.5 + .5 * b), false);
      if (flash > 0.01) {                                    // 點亮時往外擴散一圈
        const pf = ph / Math.PI;
        d.node(px, py, nodeR + pf * 15, HUEI[i], A * (1 - pf) * .4 * bIn, true);
      }
    }
    // 星陣連線:相鄰節點依亮度浮現
    g.globalAlpha = A;
    for (let i = 0; i < 5; i++) {
      const jn = (i + 1) % 5;
      d.line(pos[i][0], pos[i][1], pos[jn][0], pos[jn][1], 1,
        'rgba(242,239,232,' + (.05 + .13 * Math.min(bri[i], bri[jn])).toFixed(3) + ')', 1);
    }

    // 核心光圈:五葉快門弧(慢轉;交棒時張開+外推)+律動核+內細環
    const rC = Math.max(15, 19 * SC) + ex * 30;
    g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a0 = i * (TAU / 5) + t * .35 + rot + ex * 1.3;
      const span = (TAU / 5) * .62 * boot * (1 - ex * .75);
      if (span <= 0.01) continue;
      g.globalAlpha = A * .85; g.strokeStyle = C.orange; g.lineWidth = Math.max(1.6, 2 * SC);
      g.beginPath(); g.arc(cx, cyO, rC, a0, a0 + span); g.stroke();
    }
    g.lineCap = 'butt';
    d.node(cx, cyO, Math.max(2.6, 3.2 * SC) * (1 + .16 * Math.sin(t * 2.6)), C.orange, A * boot, false);
    g.globalAlpha = A * .3 * boot; g.strokeStyle = '#F2EFE8'; g.lineWidth = 1;
    g.beginPath(); g.arc(cx, cyO, rC * .62, 0, TAU); g.stroke();

    // PROOF IN MOTION:動態字距展開+掃描高光;字級由「最大字距」反解,任何時刻不爆版
    const WM = 'PROOF IN MOTION';
    const availW = Math.min(z.w * .88, 680);
    g.font = '700 10px "Space Grotesk",sans-serif';
    const w10 = g.measureText(WM).width;
    const TRmax = .42;
    const fs2 = Math.max(13, Math.min(34, z.h * .17, availW / (w10 / 10 + (WM.length - 1) * TRmax)));
    const expand = clamp(.34 + .1 * Math.sin(t * .7) + .8 * ez(sb(gp, 0, .07)), 0, 1);
    const track = fs2 * TRmax * (.32 + .68 * expand) + ex * fs2 * .35; // 交棒時逐字散開(幅度收斂,不掃到左欄)
    const exFade = clamp(1 - ex * .9, 0, 1);                           // 字比星陣先退,不壓到進場卡的晶片列
    g.font = '700 ' + fs2 + 'px "Space Grotesk",sans-serif';
    let tw2 = track * (WM.length - 1);
    const lets = [];
    for (const ch of WM) { const wch = g.measureText(ch).width; lets.push([ch, wch]); tw2 += wch; }
    let lx = cx - tw2 / 2;
    const ty = z.y + z.h * .8;
    g.textAlign = 'left';
    lets.forEach((lt, i) => {
      const la = ez(clamp(boot * 6.5 - i * .3, 0, 1));        // 首載逐字浮現
      if (la > 0.02) {
        const sIdx = (t * 2.2) % (WM.length + 6) - 3;          // 掃描高光循環
        const glow = Math.max(0, 1 - Math.abs(i - sIdx) / 2.2);
        g.globalAlpha = A * exFade * la * (.6 + .4 * glow);
        g.fillStyle = glow > .5 ? C.orange : C.ivory;
        g.fillText(lt[0], lx, ty + (1 - la) * 8);
      }
      lx += lt[1] + track;
    });
    g.globalAlpha = A * exFade * clamp(1 - ex * 1.8, 0, 1) * ez(clamp(boot * 2 - .5, 0, 1)) * .85;
    g.font = '600 ' + Math.max(11, mobile ? 13 : 11.5 * SC) + 'px "Noto Sans TC",sans-serif';
    g.fillStyle = 'rgba(242,239,232,.62)';
    g.textAlign = 'center';
    g.fillText(tt('五個場域・同一套流程', 'Five industries · one flow'), cx, ty + Math.max(17, fs2 * .78));
    g.textAlign = 'left';
    g.restore(); g.globalAlpha = 1;
  }
}

// ---------- Pricing 桌機:橫向三列(用寬度排,不跟高度硬拚) ----------
// 舊版三座直立機架擠在「寬而矮」的繪圖區(1440 實測 zone 631x366),實測出四個缺陷:
//   1. 費用通道兩行標籤 8.5*s -> 5.98px,等於看不到
//   2. 分隔線畫在 y426,而價格框佔 390-436 -> 線從框中間穿過去
//   3. rowIdx>3 直接丟掉第四個模組:B 少了「分析」、C 少了「數據」,下面卻寫著 8/12 模組
//   4. INCLUDED 標籤與模組數列只差 18px,字高 12 -> 疊印
// 改成一列一個方案:左方案名 + 模組數、中模組晶片(窄螢幕自動折兩行)、右價格。
// 字級只跟繪圖區「寬度」走,不再被高度連累。手機維持原欄式(手機本來就不畫字)。
function pricingRowsDesktop(g, e, ctx) {
  const z = e.zone, C = e.C, d = e.d, mob = !!e.mobile;
  const sb = ctx.sb, meta = ctx.meta, kR = ctx.kR, kC = ctx.kC, kU = ctx.kU, fadeO = ctx.fadeO;
  const sw = clamp(z.w / 560, .72, 1.15);
  const fEn = clamp(10.5 * sw, 9.5, 12);
  const fZh = clamp(17 * sw, 15, 19);
  const fCnt = clamp(11 * sw, 10, 12.5);
  const fMod0 = clamp(12.5 * sw, 11, 14);
  const fPrice = clamp(14.5 * sw, 13, 17);
  const fMo = clamp(11 * sw, 10, 12.5);
  const fUse = clamp(11.5 * sw, 10.5, 13);

  const padX = clamp(z.w * .022, 10, 18);
  const rowH = clamp(z.h * .205, 66, 88);
  const rowGap = clamp(z.h * .03, 8, 14);
  const rowsTop = z.y + clamp(z.h * .012, 3, 8);
  const rowsBottom = rowsTop + rowH * 3 + rowGap * 2;
  // 手機繪圖區只有 308-375 寬,中欄放不下五顆晶片(實測只剩 76-143px)。
  // 改成上下兩段:第一段左名稱右價格,第二段晶片自己一行、吃滿整列寬度。
  const nameW = mob ? (z.w - padX * 2) * .52 : clamp(z.w * .225, 96, 152);
  const priceW = mob ? (z.w - padX * 2) * .44 : clamp(z.w * .205, 92, 140);
  const chipsX0 = mob ? (z.x + padX) : (z.x + padX + nameW + 12);
  const chipsW = mob ? (z.w - padX * 2) : ((z.x + z.w - padX - priceW - 12) - chipsX0);
  const counts = [tt('4 模組', '4 modules'), tt('8 模組(含 A)', '8 modules (+A)'), tt('12 模組(含 B)', '12 modules (+B)')];

  meta.forEach(function (m, i) {
    const ka = ez(clamp(kR * 3 - i * .45, 0, 1));
    const a = ka * fadeO;
    if (a <= .12) return;
    const hot = ez(m.kk), on = Math.max(hot, ez(kC));
    const ry = rowsTop + i * (rowH + rowGap);
    g.save(); g.globalAlpha = a; g.translate((1 - ka) * -22, 0);   // 母動畫:整列由左滑入

    d.rr(z.x, ry, z.w, rowH, 8);
    g.fillStyle = 'rgba(20,23,28,' + (.4 + .34 * Math.max(hot, ez(kC) * .7)).toFixed(2) + ')'; g.fill();
    g.strokeStyle = hot > .08 ? m.c : 'rgba(242,239,232,.2)'; g.lineWidth = 1 + hot * .8; g.stroke();
    if (hot > .02) {   // 左軌:亮起來代表這一列是現在講的方案
      g.save(); g.globalAlpha = a * hot; d.rr(z.x, ry, 3.2, rowH, 2); g.fillStyle = m.c; g.fill(); g.restore();
    }

    // 左欄:EN / 中文 / 模組數
    const tx = z.x + padX;
    const yEn = ry + (mob ? rowH * .21 : rowH * .27);
    const yZh = yEn + fZh + (mob ? rowH * .06 : rowH * .09);
    const yCnt = mob ? yZh : (yZh + fCnt + rowH * .10);   // 手機:模組數與中文同一行、靠右
    d.label(m.en, tx, yEn, fEn, hot > .08 ? m.c : 'rgba(242,239,232,.5)', 1.4);
    d.han(m.zh, tx, yZh, fZh, C.ivory, 800);
    const kc2 = Math.max(ez(sb(m.kk, .5, 1)), ez(kC));
    if (kc2 > .02) {
      g.globalAlpha = a * kc2;
      if (mob) {   // 與中文同一行、靠右,把左半留給方案名
        g.font = '600 ' + fCnt + 'px "Space Grotesk","Noto Sans TC",sans-serif';
        const cw2 = g.measureText(counts[i]).width + (counts[i].length - 1) * .5;
        const cx2 = z.x + z.w - padX - cw2;
        d.tick(cx2 - 12, yCnt - fCnt * .34, clamp(6.5 * sw, 6, 8), C.green, 1);
        d.label(counts[i], cx2, yCnt, fCnt, 'rgba(242,239,232,.75)', .5);
      } else {
        d.tick(tx + 5, yCnt - fCnt * .34, clamp(6.5 * sw, 6, 8), C.green, 1);
        d.label(counts[i], tx + 16, yCnt, fCnt, 'rgba(242,239,232,.75)', .5);
      }
      g.globalAlpha = a;
    }

    // 中欄:模組晶片。含 A/含 B 當第一顆虛線晶片,四個模組全部畫(不再丟第四個)
    const chips = (m.base ? [{ t: m.base, dash: true }] : []).concat(m.mods.map(function (t2) { return { t: t2, dash: false }; }));
    const chipH = clamp(rowH * .30, 20, 27);
    const chipGap = 7, lineGap = 6;
    let fMod = fMod0, rows2 = null;
    for (let tryN = 0; tryN < 5 && !rows2; tryN++) {
      g.font = '600 ' + fMod + 'px "Noto Sans TC",sans-serif';
      const pad2 = clamp(9 * sw, 7, 11);
      const ws = chips.map(function (c) { return g.measureText(c.t).width + pad2 * 2; });
      const out = [[]];
      let cur = 0, wsum = 0, ok = true;
      for (let j = 0; j < chips.length; j++) {
        const need = ws[j] + (out[cur].length ? chipGap : 0);
        if (wsum + need > chipsW && out[cur].length) {
          if (cur === 1) { ok = false; break; }   // 只允許兩行,放不下就縮字重試
          cur = 1; out.push([]); wsum = ws[j];
        } else wsum += need;
        out[cur].push({ t: chips[j].t, dash: chips[j].dash, w: ws[j] });
      }
      if (ok) rows2 = out; else fMod *= .92;
    }
    if (!rows2) rows2 = [chips.map(function (c) { return { t: c.t, dash: c.dash, w: chipsW / chips.length - chipGap }; })];
    if (rows2.length === 2 && rows2[1].length === 1 && rows2[0].length >= 3) rows2[1].unshift(rows2[0].pop());
    const chipsH = rows2.length * chipH + (rows2.length - 1) * lineGap;
    let cy = mob ? (yZh + rowH * .12) : (ry + (rowH - chipsH) / 2), seq = 0;
    rows2.forEach(function (rowChips) {
      let cx = chipsX0;
      rowChips.forEach(function (c) {
        const km = ez(clamp(m.kk * 4 - seq * .42, 0, 1));
        seq++;
        if (km <= .01) { cx += c.w + chipGap; return; }
        const dx = Math.min((1 - km) * 18, 10);   // 滑入位移夾限,晶片不出中欄
        g.globalAlpha = a * km;
        d.rr(cx + dx, cy, c.w, chipH, 4);
        if (c.dash) {
          g.setLineDash([3, 4]); g.strokeStyle = 'rgba(242,239,232,.4)'; g.lineWidth = 1; g.stroke(); g.setLineDash([]);
          g.fillStyle = 'rgba(242,239,232,.9)';
        } else {
          // 子動畫:晶片逐顆輪巡微亮(相位吃列序與顆序,三列不同步)
          const gl = Math.max(0, Math.sin(e.t * 1.8 - (i * 5 + seq) * .9));
          const ca = (base) => (base + .1 * gl).toFixed(3);
          g.fillStyle = m.c === C.blue ? 'rgba(62,155,255,' + ca(.13) + ')' : 'rgba(255,107,44,' + ca(.13) + ')'; g.fill();
          g.strokeStyle = m.c === C.blue ? 'rgba(62,155,255,' + (.6 + .3 * gl).toFixed(3) + ')' : 'rgba(255,107,44,' + (.6 + .3 * gl).toFixed(3) + ')'; g.lineWidth = 1; g.stroke();
          g.fillStyle = 'rgba(242,239,232,.95)';
        }
        g.font = '600 ' + fMod + 'px "Noto Sans TC",sans-serif';
        g.fillText(c.t, cx + dx + (c.w - g.measureText(c.t).width) / 2, cy + chipH / 2 + fMod * .36);
        g.globalAlpha = a;
        cx += c.w + chipGap;
      });
      cy += chipH + lineGap;
    });

    // 右欄:價格(兩行都置中;d.label 逐字繪製不吃 textAlign,所以自己量寬)
    const bx = z.x + z.w - padX - priceW;
    const kp = Math.max(ez(sb(m.kk, .5, 1)), ez(kC));
    if (kp > .02 && mob) {   // 手機:價格不畫外框(高度不夠),放在第一行右側
      g.globalAlpha = a * kp;
      g.font = '700 ' + fPrice + 'px "Noto Sans TC",sans-serif';
      const pw2 = g.measureText(m.price).width;
      g.fillStyle = m.c === C.blue ? C.blue : C.orange;
      g.fillText(m.price, z.x + z.w - padX - pw2, yEn + 1);
      g.globalAlpha = a;
    } else if (kp > .02) {
      const boxH = fPrice + fMo + 20, by = ry + (rowH - boxH) / 2;
      g.globalAlpha = a * kp;
      d.rr(bx, by, priceW, boxH, 5);
      g.fillStyle = 'rgba(9,11,14,.9)'; g.fill();
      g.strokeStyle = kC > 0 ? m.c : 'rgba(242,239,232,.28)'; g.lineWidth = 1.2; g.stroke();
      g.font = '700 ' + fPrice + 'px "Noto Sans TC",sans-serif'; g.fillStyle = C.ivory;
      g.fillText(m.price, bx + (priceW - g.measureText(m.price).width) / 2, by + fPrice + 7);
      g.font = '600 ' + fMo + 'px "Noto Sans TC",sans-serif';
      g.fillStyle = m.c === C.blue ? C.blue : C.orange;
      g.fillText(m.mo, bx + (priceW - g.measureText(m.mo).width) / 2, by + fPrice + fMo + 12);
      g.globalAlpha = a;
    }
    // 「最多人選」放在列「內」右上角、價格框正上方的空白帶。
    // 原本做成騎在列縫上的晶片:列縫只有 11px、晶片高 20px,結果又小又被上下兩列切掉。
    if (m.badge && on > .45 && !mob) {   // 手機那一行右側已經給了模組數,不再塞徽章
      const bp = clamp(9.5 * sw, 8.5, 11);
      g.font = '600 ' + bp + 'px "Space Grotesk","Noto Sans TC",sans-serif';
      const bw = g.measureText(m.badge).width + (m.badge.length - 1) * .6;
      g.globalAlpha = a * ez(sb(on, .45, .85));
      d.label(m.badge, bx + priceW - bw, ry + rowH * .16, bp, C.orange, .6);
      g.globalAlpha = a;
    }
    g.restore();
  });

  // 費用通道:整段移到三列之下,不再與價格框打架;標籤字級 10.5-13(舊版 5.98px)
  if (kU > 0 && fadeO > .05) {
    const a = ez(kU) * fadeO;
    const step = clamp(((z.y + z.h) - rowsBottom) * .32, 30, 42);
    const ly1 = rowsBottom + step, ly2 = ly1 + step;
    const lx0 = z.x + 2, lx1 = z.x + z.w - 2;
    g.save(); g.globalAlpha = a;
    d.line(z.x, rowsBottom + 12, z.x + z.w, rowsBottom + 12, 1, 'rgba(242,239,232,.14)', 1);
    d.line(lx0, ly1, lx1, ly1, kU, 'rgba(101,224,188,.6)', 2);
    if (kU >= .98) {   // 流動虛線不再鎖 full:手機(lite)已有 30fps 連續重繪,凍住只是浪費
      g.setLineDash([6, 10]); g.lineDashOffset = -e.t * 30;
      g.strokeStyle = 'rgba(101,224,188,.9)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(lx0, ly1); g.lineTo(lx1, ly1); g.stroke();
      g.setLineDash([]); g.lineDashOffset = 0;
    }
    d.label(T_INCLUDED, lx0, ly1 - 9, fUse, C.green, 1.1);
    const k2u = ez(sb(kU, .15, 1));
    d.line(lx0, ly2, lx1, ly2, k2u, 'rgba(62,155,255,.6)', 2);
    for (let m2 = 1; m2 <= 8; m2++) {
      const fx2 = m2 / 9;
      if (fx2 > k2u) break;
      const mx = lx0 + (lx1 - lx0) * fx2;
      g.strokeStyle = 'rgba(62,155,255,.8)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(mx, ly2 - 4); g.lineTo(mx, ly2 + 4); g.stroke();
    }
    d.label(T_USAGE, lx0, ly2 + fUse + 5, fUse, C.blue, 1.1);
    g.restore();
  }
}

function paintPricing(g, e) {
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const s = clamp(Math.min(z.w / 720, z.h / 520), .5, 1.15);
  // 這個區塊「寬但矮」,縮放被高度那一項壓住(桌機實測 s≈0.63 → 模組字只剩 6px,等於看不到)。
  // 字級一律另給絕對下限,不跟著 s 一起被壓扁。
  const fEn = Math.max(9.5, 8.5 * s);      // CAPTURE / ASSISTANT
  const fZh = Math.max(15, 11.5 * s);      // 接客 / 業務助理
  const fMod = Math.max(12, 9.5 * s);      // 模組列
  const fBase = Math.max(11.5, 9 * s);     // 含 A 全部
  const fPrice = Math.max(13.5, 12.5 * s);
  const fMo = Math.max(10, 8.5 * s);
  const kR = k('racks'), k1 = k('cap'), k2 = k('assist'), k3 = k('plat'), kC = k('cmp'), kU = k('use'), kO = k('run');
  const fadeO = 1 - ez(sb(kO, 0, .45)) * .98; // 終幕:kO 到 0.45 前舊圖層就要全退,不拖尾
  const gap = z.w * .05, rw = (z.w - gap * 2) / 3;
  const ry = z.y + z.h * .05, rh = z.h * (mobile ? .48 : .50);   // 桌機收到 .50:下方要放得下價格框與模組數列
  const rx = (i) => z.x + i * (rw + gap);
  const meta = [
    { zh: tt('接客', 'Intake'), en: 'CAPTURE', kk: k1, c: C.orange, price: T_CUSTOM_QUOTE, mo: T_BOOK_CALL, mods: [tt('自動回覆', 'Auto-reply'), tt('需求了解', 'Qualify'), tt('預約', 'Booking'), tt('轉真人', 'Handoff')], base: null },
    { zh: tt('業務助理', 'Assistant'), en: 'ASSISTANT', kk: k2, c: C.orange, price: T_CUSTOM_QUOTE, mo: T_BOOK_CALL, mods: ['CRM', tt('追蹤', 'Tracking'), tt('跟進序列', 'Sequences'), tt('分析', 'Analytics')], base: tt('含 A 全部', 'All of A'), badge: tt('最多人選', 'Most popular') },
    { zh: tt('營運平台', 'Platform'), en: 'PLATFORM', kk: k3, c: C.blue, price: T_CUSTOM_QUOTE, mo: T_BOOK_CALL, mods: MODS6.slice(2), base: tt('含 B 全部', 'All of B') }
  ];
  // 手機原本走欄式,但欄式在手機只畫卡框與空晶片、一個字都沒有(等於看不懂),
  // 現在同樣走橫向三列,只是列內改成上下兩段。舊欄式保留在 else 分支不再使用。
  if (false) {   // 舊欄式(保留備查)
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
      d.label(m.en, x + 9, gy + Math.max(13, 14 * s), fEn, hot > .08 ? m.c : 'rgba(242,239,232,.5)', 1.4);
      d.han(m.zh, x + 9, gy + Math.max(32, 29 * s) + 2, fZh, C.ivory, 800);
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
          if (!mobile) d.han(m.base, x + 14, slotTop + slotH / 2 + fBase * .36, fBase, 'rgba(242,239,232,.6)', 600);
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
        if (!mobile) d.han(mod, x + 14 + sxOff, sy + slotH / 2 + fMod * .36, fMod, 'rgba(242,239,232,.92)', 700);
        d.node(x + rw - 14, sy + slotH / 2, 2, C.green, a * km);
        g.globalAlpha = a;
      });
      const kp = Math.max(ez(sb(m.kk, .55, 1)), ez(kC));
      if (kp > 0 && !mobile) { // 手機:牌高塞不下兩行必疊印,CTA 下方 DOM 晶片已有同資訊
        const py = ry + rh + 10;
        const boxH = fPrice + fMo + 22;      // 兩行文字 + 上下內距;不再用 38*s(字放大後會掉出框)
        g.globalAlpha = a * kp;
        d.rr(x + 2, py, rw - 4, boxH, 4);
        g.fillStyle = 'rgba(9,11,14,.88)'; g.fill();
        g.strokeStyle = kC > 0 ? m.c : 'rgba(242,239,232,.25)'; g.lineWidth = 1.2; g.stroke();
        g.font = '700 ' + fPrice + 'px "Space Grotesk",sans-serif'; g.fillStyle = C.ivory;
        g.fillText(m.price, x + 11, py + fPrice + 6);
        d.label(m.mo, x + 11, py + fPrice + fMo + 13, fMo, m.c === C.blue ? C.blue : C.orange, .3);
        g.globalAlpha = a;
      }
      if (kC > 0 && fadeO > 0.05 && !mobile) {
        g.globalAlpha = ez(kC) * fadeO;
        const cy3 = ry + rh + 10 + (fPrice + fMo + 22) + 15;   // 接在價格框下方,不再用固定倍率
        d.tick(x + 9, cy3, Math.max(6, 6.5 * s), C.green, 1);
        d.label([tt('4 模組', '4 modules'), tt('8 模組(含A)', '8 modules (+A)'), tt('12 模組(含B)', '12 modules (+B)')][i], x + 21, cy3 + 4, Math.max(11, 9 * s), 'rgba(242,239,232,.75)', .6);
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
      if (kU >= .98) {   // 手機 30fps 連續重繪已存在,流動虛線不再鎖 full
        g.setLineDash([6, 10]); g.lineDashOffset = -t * 30;
        g.strokeStyle = 'rgba(101,224,188,.9)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(lx0, ly1); g.lineTo(lx1, ly1); g.stroke();
        g.setLineDash([]); g.lineDashOffset = 0;
        // 子動畫:兩條計費通道各一顆巡邏光點
        const fd1 = (t * .14) % 1, fd2 = (t * .11 + .4) % 1;
        d.node(lx0 + (lx1 - lx0) * fd1, ly1, 2.5, C.green, a);
        d.node(lx0 + (lx1 - lx0) * fd2, ly2, 2.5, C.blue, a * ez(sb(kU, .15, 1)));
      }
      d.label(T_INCLUDED, lx0, ly1 - Math.max(10, 7 * s), 8.5 * s, C.green, 1.2);
      const k2u = ez(sb(kU, .15, 1));
      d.line(lx0, ly2, lx1, ly2, k2u, 'rgba(62,155,255,.6)', 2);
      for (let m2 = 1; m2 <= 8; m2++) {
        const fx2 = m2 / 9;
        if (fx2 > k2u) break;
        const mx = lx0 + (lx1 - lx0) * fx2;
        g.strokeStyle = 'rgba(62,155,255,.8)'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(mx, ly2 - 4); g.lineTo(mx, ly2 + 4); g.stroke();
      }
      d.label(T_USAGE, lx0, ly2 + Math.max(16, 15 * s), 8.5 * s, C.blue, 1.2);
      meta.forEach((m, i) => {
        const ax = rx(i) + rw / 2;
        d.line(ax, ry + rh + 70 * s, ax, ly1 - 5, ez(sb(kU, i * .15, .6 + i * .15)), 'rgba(242,239,232,.25)', 1);
      });
      g.restore();
    }
  } else {
    pricingRowsDesktop(g, e, { sb: sb, meta: meta, kR: kR, kC: kC, kU: kU, fadeO: fadeO });
  }
  if (kO > 0) {
    // 終幕重設計:大字、大藥丸、心跳線(原三櫃小字全部讓位,不再擁擠)
    const a = ez(kO);
    const cx = z.x + z.w / 2;
    g.save(); g.globalAlpha = a;
    d.rr(z.x + 1, z.y + 1, z.w - 2, z.h - 2, 12);
    g.strokeStyle = 'rgba(255,107,44,' + (0.35 + 0.2 * Math.sin(t * 1.6)).toFixed(2) + ')'; g.lineWidth = 1.6; g.stroke();
    // 狀態列:呼吸綠點 + 大標
    // d.label 是「逐字往右畫」、不吃 textAlign —— 用它畫置中字會整串從中心往右偏。
    // 這裡自己量寬度置中(含字距),綠點也改成貼著標題左緣,而不是固定偏移量。
    const labelC = (txt, ccx, y, px, color, ls) => {
      g.font = '600 ' + Math.max(9, px) + 'px "Space Grotesk","Noto Sans TC",sans-serif';
      const w = g.measureText(txt).width + (String(txt).length - 1) * (ls || 0);
      d.label(txt, ccx - w / 2, y, px, color, ls);
    };
    const inK = ez(sb(kO, .5, .82));   // 卡片在 kO≈0.46 才退乾淨,終幕晚一步進場才不會疊印
    g.globalAlpha = a * inK;
    const hy = z.y + z.h * (mobile ? .16 : .26);
    const pulse = .55 + .45 * Math.sin(t * 2.4);
    const fTitle = mobile ? Math.max(19, 21 * s) : Math.max(23, 25 * s);
    const fKick = mobile ? Math.max(10, 11 * s) : Math.max(12, 12.5 * s);
    labelC('PEAKQI OS · RUNNING', cx, hy - fTitle - 14, fKick, C.orange, 2.2);
    g.font = '900 ' + fTitle + 'px "Noto Sans TC",sans-serif';
    const tW = g.measureText(T_SYS_LIVE).width;
    d.node(cx - tW / 2 - Math.max(14, 16 * s), hy - fTitle * .3, Math.max(5, 5.5 * s), C.green, a * pulse);
    g.textAlign = 'center';
    d.han(T_SYS_LIVE, cx, hy, fTitle, C.ivory, 900);
    g.textAlign = 'left';
    // 三個大藥丸:方案名 + 綠勾(逐一亮起)
    const fPill = mobile ? Math.max(12, 13 * s) : Math.max(15, 15 * s);
    const pw = Math.min(rw, 210 * s), ph = Math.max(38, fPill * 2.9);
    const py = z.y + z.h * (mobile ? .3 : .42);
    meta.forEach((m, i) => {
      const ka = ez(sb(kO, .54 + i * .1, .78 + i * .1));
      if (ka <= 0.01) return;
      const px2 = z.x + i * (rw + gap) + (rw - pw) / 2;
      g.globalAlpha = a * inK * ka;
      d.rr(px2, py, pw, ph, ph / 2);
      g.fillStyle = 'rgba(20,23,28,.85)'; g.fill();
      g.strokeStyle = m.c === C.blue ? 'rgba(62,155,255,.7)' : 'rgba(255,107,44,.7)'; g.lineWidth = 1.4; g.stroke();
      d.tick(px2 + 17, py + ph / 2 + 1, Math.max(5.5, 6.5 * s), C.green, a * ka);
      d.han(m.zh, px2 + 33, py + ph / 2 + fPill * .36, fPill, C.ivory, 800);
      g.globalAlpha = a;
    });
    if (mobile) {
      // 手機終幕原本只有標題+藥丸+心跳線,整面偏空:補「A→B→C 串接軌」與模組數,
      // 軌上一顆巡邏光點常駐流動,畫面才有「運作中」的密度
      const railK = ez(sb(kO, .62, .9));
      if (railK > 0.02) {
        const rely = py + ph + Math.max(14, z.h * .05);
        const x0 = z.x + rw / 2, x1 = z.x + 2 * (rw + gap) + rw / 2;
        g.globalAlpha = a * inK * railK;
        d.line(x0, rely, x1, rely, railK, 'rgba(242,239,232,.25)', 1);
        meta.forEach((m2, i2) => {
          d.node(z.x + i2 * (rw + gap) + rw / 2, rely, 2.5, m2.c === C.blue ? C.blue : C.orange, a * inK * railK);
        });
        const fd = (t * .16) % 1;
        d.node(x0 + (x1 - x0) * fd, rely, 3, C.green, a * inK * railK);
        const fTal = Math.max(10, 10.5 * s);
        [tt('4 模組', '4 modules'), tt('8 模組', '8 modules'), tt('12 模組', '12 modules')].forEach((txt, i2) => {
          labelC(txt, z.x + i2 * (rw + gap) + rw / 2, rely + fTal + 12, fTal, 'rgba(242,239,232,.6)', .5);
        });
        g.globalAlpha = a * inK;
      }
    }
    // 心跳線:運作中的生命感(整條隨時間流動)
    const wy = z.y + z.h * (mobile ? .66 : .7);
    const seg = 44;
    g.globalAlpha = a * inK;
    g.strokeStyle = 'rgba(101,224,188,.75)'; g.lineWidth = 2; g.beginPath();
    for (let i2 = 0; i2 <= seg; i2++) {
      const fx2 = i2 / seg;
      const px3 = z.x + z.w * .06 + z.w * .88 * fx2;
      const beat = Math.exp(-Math.pow(((fx2 * 3 + t * .5) % 1) - .5, 2) * 90); // 心跳流速不鎖 full:手機也要活著
      const py3 = wy - beat * z.h * .06 * (1 + .15 * Math.sin(t * 3));
      if (i2 === 0) g.moveTo(px3, py3); else g.lineTo(px3, py3);
    }
    g.stroke();
    // 底部說明:誠實中性(移除未經確認的 24/7/不綁約/保證字樣)
    labelC('FIRST PHASE LIVE', cx, z.y + z.h * (mobile ? .8 : .84), mobile ? Math.max(9, 9.5 * s) : Math.max(10.5, 10.5 * s), 'rgba(242,239,232,.5)', 2);
    g.textAlign = 'center';
    d.han(tt('第一階段上線・依實際使用持續調整', 'Phase one live · tuned with real use'), cx, z.y + z.h * (mobile ? .87 : .91), mobile ? Math.max(11, 12.5 * s) : Math.max(13.5, 13.5 * s), 'rgba(242,239,232,.75)', 600);
    g.textAlign = 'left';
    g.restore();
  }
}

// ---------- About:BUILT FROM REAL WORKFLOWS(截圖網路為 DOM;canvas 畫字格/導入流程/DAY 0–10/核心) ----------
function paintAbout(g, e) {
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const s = clamp(Math.min(z.w / 780, z.h / 520), .5, 1.2);
  // 字級只跟繪圖區「寬度」走(等於 canvas 內的 vw),不跟 s 共用。
  // s = min(w/W0, h/H0) 在「寬而矮」的區塊會被高度那一項壓垮:本頁桌機實測
  // s=0.704,9.5*s 只有 6.7px,全靠 d.label 內建的 9px 硬下限才沒有消失。
  const ts = clamp(z.w / 780, .62, 1.2);
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
    (() => {   // 疊在截圖牆上,沒有底板等於看不到
      const fsK = Math.max(10.5, 9.5 * ts);
      g.font = '600 ' + fsK + 'px "Space Grotesk","Noto Sans TC",sans-serif';
      const tw = g.measureText('BUILT FROM REAL WORKFLOWS').width + 24 * 2.2;
      const keep = g.globalAlpha;
      d.rr(z.x, z.y + 18 - fsK - 5, tw + 16, fsK + 12, 4);
      g.globalAlpha = keep * .78; g.fillStyle = 'rgba(9,11,14,.9)'; g.fill(); g.globalAlpha = keep;
      d.label('BUILT FROM REAL WORKFLOWS', z.x + 8, z.y + 18, fsK, 'rgba(242,239,232,.7)', 2.2);
    })();
    g.restore();
  }
  // S2 計數註記
  // 這兩行原本畫在同一個 y,而且交接期間兩者都是半透明可見 —— 直接疊印成一團亂碼。
  // 改成硬交接:以 kG 為界,同一時間只會有一行存在,各自在自己的半區淡入淡出。
  // 另外它們疊在 DOM 截圖牆上,不給底板等於看不到,所以先鋪一塊窄底板再寫字。
  const noteFs = Math.max(10.5, 9.5 * ts);
  const notePlate = (txt, ls) => {
    g.font = '600 ' + noteFs + 'px "Space Grotesk","Noto Sans TC",sans-serif';
    const w = g.measureText(txt).width + (txt.length - 1) * ls;
    const bx = z.x, by = z.y + z.h - 12 - noteFs - 5;
    d.rr(bx, by, w + 16, noteFs + 12, 4);
    const keep = g.globalAlpha;
    g.globalAlpha = keep * .82; g.fillStyle = 'rgba(9,11,14,.9)'; g.fill();
    g.globalAlpha = keep;
  };
  const swG = ez(kG);
  if (kL > 0 && swG < .5) {
    g.globalAlpha = ez(kL) * (1 - swG * 2);
    notePlate('30+ LIVE SYSTEMS — CONNECTED', 1.8);
    d.label('30+ LIVE SYSTEMS — CONNECTED', z.x + 8, z.y + z.h - 12, noteFs, C.orange, 1.8);
    g.globalAlpha = 1;
  } else if (swG >= .5 && kP < 1) {
    g.globalAlpha = Math.min(1, (swG - .5) * 2) * (1 - ez(kP)) * (1 - ez(kN));
    notePlate('8+ INDUSTRIES — GROUPED', 1.8);
    d.label('8+ INDUSTRIES — GROUPED', z.x + 8, z.y + z.h - 12, noteFs, C.blue, 1.8);
    g.globalAlpha = 1;
  }
  // S4 導入流程資料線
  if (kP > 0) {
    const a = ez(kP) * (1 - ez(kO) * .6);
    const py = z.y + z.h * (mobile ? .3 : .38);
    const names = [tt('理解場景', 'Scope'), tt('整理資料', 'Data prep'), tt('建置模組', 'Build'), tt('測試校準', 'Calibrate'), tt('上線', 'Launch')];
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
      d.han(nm, nx - 26 * s, py + 20 * s, Math.max(12.5, 10.5 * ts), 'rgba(242,239,232,.82)', 700);
      d.label('0' + (i + 1), nx - 6 * s, py - 12 * s, Math.max(10.5, 8 * ts), 'rgba(242,239,232,.4)', 1);
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
      d.label(nm, nx - 16 * s, dy - 10 * s, Math.max(10.5, 8.5 * ts), i === 4 ? C.green : 'rgba(242,239,232,.65)', .8);
      g.globalAlpha = a;
    });
    d.tick(x0, dy + 20 * s, 6 * s, C.green, a * ez(sb(kD, .7, 1)));
    g.globalAlpha = a * ez(sb(kD, .7, 1));
    d.han(tt('最快 10 個工作天上線', 'Live in as few as 10 working days'), x0 + 14 * s, dy + 24 * s, Math.max(12.5, 11 * ts), C.ivory, 800);
    g.restore();
  }
  // S7 品牌核心
  if (kO > 0) {
    const a = ez(kO);
    const cx = z.x + z.w * (mobile ? .5 : .66), cy = z.y + z.h * .46;
    g.save(); g.globalAlpha = a;
    d.ring(cx, cy, 46 * s, kO, C.orange, 2.4);
    d.ring(cx, cy, 62 * s, ez(sb(kO, .3, 1)), 'rgba(242,239,232,.2)', 1);
    g.font = '800 ' + Math.max(15, 15 * ts) + 'px "Space Grotesk",sans-serif'; g.fillStyle = C.ivory; g.textAlign = 'center';
    g.fillText('PEAKQI', cx, cy - 2);
    g.font = '600 ' + Math.max(10.5, 8 * ts) + 'px "Space Grotesk",sans-serif'; g.fillStyle = 'rgba(242,239,232,.55)';
    g.fillText('OPERATING CORE', cx, cy + 14 * s);
    g.textAlign = 'left';
    const on = e.tier === 'full' ? .5 + .5 * (Math.sin(t * 2.4) * .5 + .5) : 1;
    d.node(cx, cy - 26 * s, 2.6, C.green, a * on);
    d.label('BUILT FROM REAL WORKFLOWS — SINCE DAY ONE OF YOUR PROCESS', z.x + 4, z.y + z.h - 10, Math.max(10.5, 8.5 * ts), 'rgba(242,239,232,.5)', 1.4);
    g.restore();
  }
}

// ---------- Demo:BUILD YOUR FIRST AI FLOW(四任務各一景:選卡牆 → 流程斷點 → 模組組裝 → 確認送出) ----------
// 2026-08 重寫:草稿面板移出 hero 成獨立 #draft section,畫布重新成為主視覺。
// 每景 = 對應任務文案的主題圖像 + k 進場轉場 + t 驅動的常駐子動畫
// (手機引擎已半幀率連續重繪,子動畫一律不鎖 e.tier==='full')。
function paintDemo(g, e) {
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const isStatic = e.tier === 'static';
  const IDS = ['ind', 'flow', 'build', 'go'];
  const ks = IDS.map((id) => k(id));
  let cur = IDS.indexOf(e.aid);
  if (cur < 0) { cur = 0; ks.forEach((v, i) => { if (v > 0.02) cur = i; }); }
  // 手機:共用進度軌先畫(reduced 靜態關鍵畫面空間小,略過軌只畫主構圖)
  let y0 = z.y + 2, availH = z.h - 4;
  if (mobile && !isStatic && z.h > 230) {
    const vy = mRail(g, d, C, t, z.x + 2, z.w - 4, z.y + 2, IDS.length, cur, Math.max(12, Math.min(13, z.w / 30)));
    y0 = vy; availH = z.y + z.h - vy - 4;
  }
  if (availH < 96) return;
  // 手機是方形舞台(data-hero-zone="square"):以寬為主放大,內容吃滿正方形;各景高度護欄自縮
  const s = mobile
    ? clamp(Math.min(z.w / 430, availH / 360), .8, 1.25)
    : clamp(Math.min(z.w / 560, availH / 380), .62, 1.25);
  let fs = Math.max(12.5, 13 * s), fsS = Math.max(10.5, 10.5 * s);
  if (mobile && !isStatic) { fs = Math.max(15.5, fs); fsS = Math.max(12, fsS); } // 手機可讀鐵律
  const pw = Math.min(z.w - (mobile ? 4 : 12), 640);
  const px = z.x + (z.w - pw) / 2;
  const fadeOut = (kNext) => 1 - ez(sb(kNext, .04, .38)) * .97;   // 交叉換場:下一景進場時本景淡出
  const place = (ph) => y0 + Math.max(4, (availH - ph) / 2);      // 面板在可用高度內垂直置中
  const kI = ks[0], kF = ks[1], kB = ks[2], kG = ks[3];

  // ── 任務 1/4 選擇情境:產業選卡牆,游標輪巡點選,底部「相似場景」預覽列即時更新
  if (kI > .01) {
    const a = ez(kI) * fadeOut(kF);
    if (a > .04) {
      const gap = 10 * s;
      const prevH = Math.max(30, 36 * s);
      let chh = clamp(52 * s, 34, 64);
      let ph = 32 + chh * 2 + gap + 14 + prevH + 16;
      if (ph > availH - 4) { chh = Math.max(24, (availH - 4 - 32 - gap - 14 - prevH - 16) / 2); ph = Math.min(availH - 4, 32 + chh * 2 + gap + 14 + prevH + 16); }
      const py = place(ph);
      const dy = (1 - ez(kI)) * 26;   // 進場:整景由下浮升
      g.save(); g.translate(0, dy); g.globalAlpha = a;
      d.panel(px, py, pw, ph, .96, false);
      d.head(px, py, pw, tt('TASK 01 — 選擇情境', 'TASK 01 — Pick a scenario'), 1, C.orange);
      const LBL = [IND_WED, IND_INT, IND_REA, tt('教育培訓', 'Education'), tt('團購電商', 'E-commerce'), tt('更多產業', 'More industries')];
      const inX = px + 12, inW = pw - 24;
      const cw = (inW - gap * 2) / 3;
      const hov = Math.floor(t / 1.15) % 6;   // 子動畫:游標每 1.15s 輪巡下一張選卡
      for (let i = 0; i < 6; i++) {
        const kc = ez(clamp(kI * 2.4 - i * .18, 0, 1));   // 進場:選卡逐張浮入
        if (kc <= .02) continue;
        const cx0 = inX + (i % 3) * (cw + gap), cy0 = py + 32 + Math.floor(i / 3) * (chh + gap) + (1 - kc) * 8;
        const on = i === hov;
        g.globalAlpha = a * kc;
        d.rr(cx0, cy0, cw, chh, 6);
        g.fillStyle = on ? 'rgba(255,107,44,.16)' : 'rgba(242,239,232,.05)'; g.fill();
        g.strokeStyle = on ? 'rgba(255,107,44,.85)' : 'rgba(242,239,232,.2)'; g.lineWidth = on ? 1.5 : 1; g.stroke();
        if (on) {   // 游標落卡:外框脈動
          g.globalAlpha = a * kc * (.3 + .3 * Math.sin(t * 4.2));
          d.rr(cx0 - 3, cy0 - 3, cw + 6, chh + 6, 8); g.strokeStyle = C.orange; g.lineWidth = 1; g.stroke();
          g.globalAlpha = a * kc;
        }
        g.textAlign = 'center';
        d.han(LBL[i], cx0 + cw / 2, cy0 + chh / 2 + fsS * .38, fsS, on ? C.orange : 'rgba(242,239,232,.82)', 600);
        g.textAlign = 'left';
      }
      const kp = ez(sb(kI, .4, .9));
      const pvY = py + ph - prevH - 12;
      if (kp > .02 && pvY >= py + 32 + chh * 2 + gap + 6) {   // 預覽列:選到哪卡,相似場景跟著換;塞不下(reduced 迷你幀)則略過
        g.globalAlpha = a * kp;
        d.rr(inX, pvY, inW, prevH, 5); g.fillStyle = 'rgba(101,224,188,.07)'; g.fill();
        g.strokeStyle = 'rgba(101,224,188,.4)'; g.lineWidth = 1; g.stroke();
        d.node(inX + 13, pvY + prevH / 2, 3, C.green, a * kp * (.55 + .45 * Math.sin(t * 2.8)));
        d.han(tt('相似場景更新中:', 'Similar cases: ') + LBL[hov], inX + 24, pvY + prevH / 2 + fsS * .36, fsS, 'rgba(242,239,232,.75)', 600);
        if (inW > 330) {
          const bw = inW * .2, bx = inX + inW - bw - 12;
          g.strokeStyle = 'rgba(242,239,232,.18)'; g.lineWidth = 1; g.strokeRect(bx, pvY + prevH / 2 - 2, bw, 4);
          g.fillStyle = C.green; g.fillRect(bx + 1, pvY + prevH / 2 - 1, Math.max(0, (bw - 2) * ((t * .5) % 1)), 2);
        }
      }
      g.restore();
    }
  }

  // ── 任務 2/4 找出卡點:流程線在「人工跟進」前斷開,訊息 token 流到斷點就過不去
  if (kF > .01) {
    const a = ez(kF) * fadeOut(kB);
    if (a > .04) {
      const ph = Math.min(availH - 4, clamp(200 * s, 150, 240));
      const py = place(ph);
      const dy = (1 - ez(kF)) * 26;
      g.save(); g.translate(0, dy); g.globalAlpha = a;
      d.panel(px, py, pw, ph, .96, false);
      d.head(px, py, pw, tt('TASK 02 — 找出卡點', 'TASK 02 — Find the bottleneck'), 1, C.blue);
      const NAMES = [T_INQ_IN, tt('AI 回覆', 'AI reply'), tt('人工跟進', 'Human follow-up'), tt('成交', 'Closed')];
      const ly = py + ph * .44;
      const inX = px + Math.max(20, pw * .07), inW = pw - Math.max(40, pw * .14);
      const xs = NAMES.map((_, i) => inX + inW * i / 3);
      const gapA = xs[1] + (xs[2] - xs[1]) * .3, gapB = xs[1] + (xs[2] - xs[1]) * .7;
      const kl = ez(sb(kF, .05, .6));   // 進場:線分三段依序畫出
      d.line(xs[0], ly, gapA, ly, clamp(kl * 3, 0, 1), 'rgba(242,239,232,.5)', 1.6);
      if (kl > .34) { g.save(); g.setLineDash([3, 6]); d.line(gapA, ly, gapB, ly, clamp((kl - .34) * 3, 0, 1), 'rgba(255,107,44,.6)', 1.4); g.restore(); }
      if (kl > .67) d.line(gapB, ly, xs[3], ly, clamp((kl - .67) * 3, 0, 1), 'rgba(242,239,232,.5)', 1.6);
      NAMES.forEach((nm, i) => {
        const kn = ez(clamp(kF * 2.6 - i * .3, 0, 1));
        if (kn <= .02) return;
        const broken = i === 2;
        d.node(xs[i], ly, 4.5 * s + 1, broken ? C.orange : (i === 3 ? C.green : C.blue), a * kn, broken);
        g.globalAlpha = a * kn;
        // 標籤置中於節點,但夾在面板內:英文首尾字(Inquiry in / Closed)比中文寬,
        // 純置中會被畫到面板外(實測 EN 兩端各溢出約 6–10px)
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        const halfW = g.measureText(nm).width / 2;
        const lx = clamp(xs[i], px + 8 + halfW, px + pw - 8 - halfW);
        g.textAlign = 'center';
        d.han(nm, lx, ly + 22 * s + 6, fsS, broken ? C.orange : 'rgba(242,239,232,.72)', broken ? 800 : 600);
        g.textAlign = 'left';
      });
      const kt2 = ez(sb(kF, .3, .6));
      for (let j = 0; j < 3; j++) {   // 子動畫:token 由左流入,到斷點前淡出(訊息過不去)
        const f2 = (t * .3 + j * .34) % 1;
        const tx = xs[0] + f2 * (gapA - 10 - xs[0]);
        const fadeT = f2 > .82 ? 1 - (f2 - .82) / .18 : 1;
        d.node(tx, ly - 9 * s, 2.4, C.ivory, a * .6 * fadeT * kt2);
      }
      const kw2 = ez(sb(kF, .35, .68));
      if (kw2 > .02) {   // 斷點警示:脈動圈 + 標籤
        const gx = (gapA + gapB) / 2;
        const pulse = .5 + .5 * Math.sin(t * 3.6);
        d.node(gx, ly, 3, C.orange, a * kw2);
        g.globalAlpha = a * kw2 * (.25 + .35 * pulse);
        g.beginPath(); g.arc(gx, ly, 9 + pulse * 4, 0, TAU); g.strokeStyle = C.orange; g.lineWidth = 1.2; g.stroke();
        g.globalAlpha = a * kw2;
        g.textAlign = 'center';
        d.han(tt('最卡的一段', 'Where it stalls'), gx, ly - 20 * s - 4, fsS, C.orange, 800);
        g.textAlign = 'left';
      }
      const kc2 = ez(sb(kF, .55, .88));
      if (kc2 > .02 && ph >= 132) {   // 勾選卡點 → 草稿即時加入節點(reduced 迷你關鍵幀空間不足時略過,避免與節點標籤疊字)
        g.globalAlpha = a * kc2;
        const cy2 = py + ph - Math.max(24, 28 * s);
        d.tick(px + 20, cy2, 6, C.green, a * kc2);
        d.han(tt('已勾選:人工跟進 — 草稿即時加入節點', 'Picked: human follow-up — added to draft'), px + 34, cy2 + fsS * .38, fsS, 'rgba(242,239,232,.78)', 600);
      }
      g.restore();
    }
  }

  // ── 任務 3/4 組合第一階段:模組滑進虛線草稿框,右側人工確認邊界閘門常駐脈動
  if (kB > .01) {
    const a = ez(kB) * fadeOut(kG);
    if (a > .04) {
      const ph = Math.min(availH - 4, clamp(216 * s, 168, 262));
      const py = place(ph);
      const dy = (1 - ez(kB)) * 26;
      g.save(); g.translate(0, dy); g.globalAlpha = a;
      d.panel(px, py, pw, ph, .96, false);
      d.head(px, py, pw, tt('TASK 03 — 組合第一階段', 'TASK 03 — Assemble phase 1'), 1, C.orange);
      const fx = px + 14, fw = pw * .56, fy = py + 36, fh = ph - 36 - Math.max(34, 40 * s);
      g.save(); g.setLineDash([5, 6]); g.strokeStyle = 'rgba(242,239,232,.3)'; g.lineWidth = 1.2;
      d.rr(fx, fy, fw, fh, 8); g.stroke(); g.restore();
      d.label('DRAFT', fx + 8, fy - 5, Math.max(9.5, fsS * .8), 'rgba(242,239,232,.45)', 1.4);
      const MODS = [[tt('AI 接住詢問', 'AI catches inquiries'), C.orange], [tt('需求辨識', 'Needs analysis'), C.blue], [tt('報價草稿', 'Quote draft'), C.ivory]];
      // 三塊模組必須完整落在虛線框內:間距與內距依框高縮放,不用固定值硬撐
      const bTop = fh < 110 ? 8 : 12, bgap = fh < 110 ? 6 : 8;
      const bh = Math.max(18, (fh - bTop * 2 - bgap * 2) / 3);
      // reduced 迷你關鍵幀框高可能塞不下三塊:能放幾塊畫幾塊,絕不溢出框線
      const nFit = clamp(Math.floor((fh - bTop) / (bh + bgap)), 1, 3);
      MODS.slice(0, nFit).forEach((mrow, i) => {
        const kr = ez(sb(kB, .08 + i * .16, .4 + i * .16));   // 進場:模組一塊塊滑入
        if (kr <= .02) return;
        const bx = fx + 10 - (1 - kr) * 44, by = fy + bTop + i * (bh + bgap);
        g.globalAlpha = a * kr;
        d.rr(bx, by, fw - 20, bh, 5);
        g.fillStyle = 'rgba(242,239,232,.06)'; g.fill();
        g.strokeStyle = 'rgba(242,239,232,.22)'; g.lineWidth = 1; g.stroke();
        d.node(bx + 12, by + bh / 2, 2.6, mrow[1], a * kr);
        d.han(mrow[0], bx + 22, by + bh / 2 + fsS * .36, fsS, 'rgba(242,239,232,.85)', 600);
      });
      const scY = fy + 8 + (fh - 16) * (.5 + .5 * Math.sin(t * 1.5));   // 子動畫:組裝掃描線上下巡
      g.globalAlpha = a * .35; g.strokeStyle = C.orange; g.lineWidth = 1;
      g.beginPath(); g.moveTo(fx + 4, scY); g.lineTo(fx + fw - 4, scY); g.stroke();
      const kg2 = ez(sb(kB, .35, .7));
      if (kg2 > .02) {   // 人工確認邊界:閘門線 + 常駐脈動節點
        const gLX = px + pw * .66;
        g.save(); g.setLineDash([4, 5]);
        d.line(gLX, fy + 2, gLX, fy + fh - 2, kg2, 'rgba(101,224,188,.55)', 1.2);
        g.restore();
        const gy2 = fy + fh * .3;
        const pulse2 = .5 + .5 * Math.sin(t * 2.6);
        d.node(gLX, gy2, 3.4, C.green, a * kg2);
        g.globalAlpha = a * kg2 * (.25 + .3 * pulse2);
        g.beginPath(); g.arc(gLX, gy2, 8 + pulse2 * 3, 0, TAU); g.strokeStyle = C.green; g.lineWidth = 1; g.stroke();
        g.globalAlpha = a * kg2;
        d.han(tt('人工確認邊界', 'Human sign-off'), gLX + 12, gy2 + fsS * .36, fsS, C.green, 800);
        if (fh >= 70) {
          g.globalAlpha = a * kg2 * .85;
          d.han(tt('敏感動作停在這裡', 'Sensitive steps wait'), gLX + 12, gy2 + fsS * 1.9, Math.max(10, fsS * .88), 'rgba(242,239,232,.6)', 500);
          d.han(tt('由真人確認', 'for human review'), gLX + 12, gy2 + fsS * 3.2, Math.max(10, fsS * .88), 'rgba(242,239,232,.6)', 500);
        }
      }
      const mk = ez(sb(kB, .2, .95));   // 底部進度計:第一版草稿組裝中
      const my = py + ph - Math.max(20, 24 * s);
      g.globalAlpha = a;
      d.meter(px + 14, my - 3, pw * .42, 6, mk, C.orange, null, null);
      d.han(mk > .96 ? tt('第一版草稿完成', 'First draft ready') : tt('第一版草稿組裝中', 'Assembling first draft'), px + 14 + pw * .42 + 12, my + 3, fsS, mk > .96 ? C.green : 'rgba(242,239,232,.7)', 600);
      g.restore();
    }
  }

  // ── 任務 4/4 確認並送出:草稿帶入表單欄位逐一打勾,紙飛機沿行軍虛線送出
  if (kG > .01) {
    const a = ez(kG);
    if (a > .04) {
      const ph = Math.min(availH - 4, clamp(206 * s, 160, 252));
      const py = place(ph);
      const dy = (1 - ez(kG)) * 26;
      g.save(); g.translate(0, dy); g.globalAlpha = a;
      d.panel(px, py, pw, ph, .96, false);
      d.head(px, py, pw, tt('TASK 04 — 確認並送出', 'TASK 04 — Confirm & send'), 1, C.green);
      const cw2 = Math.min(pw * .55, 300), cx2 = px + 14, cy0 = py + 36, chh2 = ph - 36 - 16;
      d.rr(cx2, cy0, cw2, chh2, 6); g.fillStyle = 'rgba(242,239,232,.05)'; g.fill();
      g.strokeStyle = 'rgba(242,239,232,.22)'; g.lineWidth = 1; g.stroke();
      const FLD = [tt('產業', 'Industry'), tt('最卡的流程', 'Bottleneck'), tt('聯絡方式', 'Contact')];
      FLD.forEach((nm, i) => {
        const kr = ez(sb(kG, .06 + i * .14, .34 + i * .14));   // 進場:欄位逐一帶入 + 打勾
        if (kr <= .02) return;
        const ry = cy0 + 10 + i * (chh2 - 20) / 3;
        if (ry + fsS + 20 > cy0 + chh2) return;   // 迷你關鍵幀塞不下的欄位直接略過,不疊字
        const lw = cw2 - 24;
        g.globalAlpha = a * kr;
        if (chh2 >= 84) d.han(nm, cx2 + 12, ry + fsS, Math.max(10, fsS * .88), 'rgba(242,239,232,.55)', 500);
        g.strokeStyle = 'rgba(242,239,232,.25)'; g.lineWidth = 1;
        g.strokeRect(cx2 + 12, ry + fsS + 6, lw, Math.max(12, 14 * s));
        g.fillStyle = 'rgba(255,107,44,.3)';
        g.fillRect(cx2 + 13, ry + fsS + 7, Math.max(0, (lw - 2) * kr), Math.max(10, 14 * s - 2));
        d.tick(cx2 + lw + 4, ry + fsS + 2, 5.5, C.green, a * ez(sb(kr, .7, 1)));
      });
      const sx = cx2 + cw2 + 16, ex = px + pw - 26, eyTop = py + 52;
      const sy = cy0 + chh2 * .62;
      const kSend = ez(sb(kG, .42, .82));
      if (kSend > .02 && ex - sx > 40) {   // 送出路徑:行軍虛線(t 驅動)+ 紙飛機沿線飛
        g.save();
        g.globalAlpha = a * kSend;
        g.setLineDash([5, 7]); g.lineDashOffset = -((t * 26) % 12);
        const pts = [[sx, sy], [lerp(sx, ex, .52), lerp(sy, eyTop, .78)], [ex, eyTop]];
        d.poly(pts, kSend, 'rgba(101,224,188,.7)', 1.5);
        g.setLineDash([]);
        const L1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
        const L2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
        const dist = (L1 + L2) * ez(kSend);
        let hx, hy, ang;
        if (dist <= L1) { const f3 = clamp(dist / Math.max(1, L1), 0, 1); hx = lerp(pts[0][0], pts[1][0], f3); hy = lerp(pts[0][1], pts[1][1], f3); ang = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]); }
        else { const f3 = clamp((dist - L1) / Math.max(1, L2), 0, 1); hx = lerp(pts[1][0], pts[2][0], f3); hy = lerp(pts[1][1], pts[2][1], f3); ang = Math.atan2(pts[2][1] - pts[1][1], pts[2][0] - pts[1][0]); }
        g.translate(hx, hy + Math.sin(t * 2.6) * 2.5); g.rotate(ang);   // 子動畫:紙飛機上下輕擺
        g.fillStyle = C.green;
        g.beginPath(); g.moveTo(9, 0); g.lineTo(-5, -5); g.lineTo(-2, 0); g.lineTo(-5, 5); g.closePath(); g.fill();
        g.restore();
      }
      const kO = ez(sb(kG, .72, 1));
      if (kO > .02) {   // 完成環 + 勾:草稿送出、安排討論(內容以評估與討論為準)
        g.save(); g.globalAlpha = a * kO;
        const rr2 = Math.max(11, 13 * s), rx = ex, ry2 = eyTop - 4;
        d.ring(rx, ry2, rr2, kO, C.green, 2);
        d.tick(rx, ry2 + 1, rr2 * .6, C.green, a * kO * ez(sb(kO, .55, 1)));
        g.globalAlpha = a * kO;
        g.textAlign = 'right';
        d.han(tt('草稿送出,安排討論', 'Draft sent, discussion next'), px + pw - 14, ry2 + rr2 + fsS + 8, fsS, 'rgba(242,239,232,.8)', 600);
        g.textAlign = 'left';
        g.restore();
      }
      g.restore();
    }
  }
}


// ---------- METHOD:導入方法(盤點 → 定義 → 驗證 → 上線與改善) ----------
function paintMethod(g, e) {
  // 重設計(2026-08):四景皆為單一置頂聚焦面板,手機靜止即完整構圖、不散落不被摺線裁切。
  // 注意:d.panel/head/chip 內部會覆寫 globalAlpha,整幕淡出必須摺進每個 alpha 參數,
  // 且每次畫文字前都要重設 g.globalAlpha。
  const { zone: z, k, C, d, mobile, t } = e;
  const sb = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const kM = k('map'), kG = k('goal'), kP = k('pilot'), kL = k('live');
  if (mobile) { paintMethodMobile(g, e, sb, [kM, kG, kP, kL]); return; }
  // 桌機:大螢幕要撐得起來(舊上限 470px/1.15 讓 1900px 螢幕上的面板顯得很小)
  const s = clamp(Math.min(z.w / 520, z.h / 420), .55, 1.5);
  const cx = z.x + z.w * .5;
  const pw = Math.min(z.w * .96, 660);
  const px0 = cx - pw / 2;
  const rh = Math.max(30, Math.min(54, z.h * .095));
  const pyOf = (ph) => z.y + Math.max(12, (z.h - ph) / 2);   // 面板在繪圖區內垂直置中
  const fs = Math.max(11.5, 13 * s);
  const fsS = Math.max(9.5, 10.5 * s);

  // S1 現況盤點:單一面板,四條來源列逐一掃描點亮,問題晶片在列後浮現
  if (kM > 0) {
    const fd = 1 - ez(sb(kG, .05, .35)) * .97;
    const a = ez(kM) * fd;
    if (a > 0.02) {
      g.save();
      const rows = SRC4;
      const chips = ISSUE3;
      const ph = 26 + rows.length * rh + rh * 1.05;
      const py0 = pyOf(ph);
      d.panel(px0, py0, pw, ph, a * .96, false);
      d.head(px0, py0, pw, mobile ? T_AUDIT : tt('INTAKE — 現況盤點', 'INTAKE — Current state'), a, C.orange);
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
      const defs = DEF3;
      const ph = 26 + defs.length * rh + rh * .5;
      const py0 = pyOf(ph);
      d.panel(px0, py0, pw, ph, a * .96, true);
      d.head(px0, py0, pw, mobile ? tt('第一階段', 'Phase 1') : tt('PHASE 1 — 定義第一階段', 'PHASE 1 — Define the scope'), a, C.orange);
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
        d.han(T_SCOPE_OK, px0 + 32, ty2 + 4, fsS + 1, 'rgba(101,224,188,.9)', 600);
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
      const py0 = pyOf(ph);
      d.panel(px0, py0, pw, ph, a * .96, false);
      d.head(px0, py0, pw, mobile ? T_VALIDATE : tt('PILOT — 建立驗證', 'PILOT — Build & validate'), a, C.blue);
      const steps = STEP4;
      const ty2 = py0 + 26 + rh * 1.15;
      const m0 = px0 + Math.max(26, pw * .08), m1 = px0 + pw - Math.max(26, pw * .08);
      const conn = ez(sb(kP, .06, .78)) * (steps.length - 1); // 正規化:末站也會接到(舊式需 kP>0.98)
      steps.forEach((tx, i) => {
        const nx = m0 + (m1 - m0) * i / 3;
        const on = conn >= i - .02;
        d.node(nx, ty2, on ? 3.4 : 2.4, on ? C.blue : 'rgba(242,239,232,.3)', a, !on);
        g.globalAlpha = a;
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        g.fillStyle = on ? C.blue : 'rgba(242,239,232,.45)';
        g.textAlign = i === 0 ? 'left' : (i === steps.length - 1 ? 'right' : 'center');
        g.fillText(tx, i === 0 ? nx - 4 : (i === steps.length - 1 ? nx + 6 : nx), ty2 + rh * .62);
        g.textAlign = 'left';
        if (i < 3) d.line(nx + 6, ty2, m0 + (m1 - m0) * (i + 1) / 3 - 6, ty2, clamp(conn - i, 0, 1), 'rgba(62,155,255,.5)', 1.4);
      });
      const kg2 = ez(sb(kP, .45, .7));
      if (kg2 > 0.02) {
        const gx = m0 + (m1 - m0) * 2 / 3;
        g.globalAlpha = a * kg2;
        g.font = '600 ' + fsS + 'px "Noto Sans TC",sans-serif';
        const gt = T_HUMAN;
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
        d.han(T_USER_TEST, px0 + 32, ry + rh * .42, fsS + 1.5, 'rgba(242,239,232,.8)', 600);
      }
      g.restore(); g.globalAlpha = 1;
    }
  }

  // S4 上線與改善:LIVE 面板(上線 tick / 觀察 pulse / 每週調整循環)
  if (kL > 0) {
    const a = ez(kL);
    if (a > 0.02) {
      g.save();
      const rows = LIVE3;
      const ph = 26 + rows.length * rh + rh * .35;
      const py0 = pyOf(ph);
      d.panel(px0, py0, pw, ph, a * .96, true);
      d.head(px0, py0, pw, mobile ? tt('上線運作', 'Live & running') : tt('LIVE — 上線與改善', 'LIVE — Launch & improve'), a, C.green);
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
        d.han(tt('不是一次到位,而是先把一段做順,再擴大。', 'Not all at once — smooth one flow, then expand.'), px0 + 14, py0 + ph - rh * .28, fsS + 1, 'rgba(101,224,188,.85)', 600);
      }
      g.restore(); g.globalAlpha = 1;
    }
  }
}

// ---------- Method 手機:單景大舞台(母動畫=整組物件隨捲動移動/旋轉/淡入出;子動畫=物件自身持續動作) ----------
function paintMethodMobile(g, e, sb, ks) {
  const { zone: z, C, d, t } = e;
  // 與 DOM 文案層同一個判定(見 hero-kit 的 ai/aid),不自行用 k>0.02 推算
  let cur = ['map', 'goal', 'pilot', 'live'].indexOf(e.aid);
  if (cur < 0) { cur = 0; ks.forEach((v, i) => { if (v > 0.02) cur = i; }); }
  const kv = ks[cur], nk = cur < 3 ? ks[cur + 1] : 0;
  const fsT = 19.5, fsM = 16.5, fsN = 13;     // 手機大字方針:標題/內容/註記
  const AK = [C.orange, C.orange, C.blue, C.green];
  const BD = ['rgba(255,107,44,.5)', 'rgba(255,107,44,.5)', 'rgba(62,155,255,.5)', 'rgba(101,224,188,.5)'];
  const TITLE = [T_AUDIT, tt('定義第一階段', 'Define phase one'), T_VALIDATE, tt('上線與改善', 'Launch & improve')];
  const SUB = [tt('四個來源匯成一份問題清單', 'Four sources, one problem list'), tt('講清楚做什麼、不做什麼', 'Clear on what we do and skip'), tt('一段流程,跑得起來才算數', 'One flow that actually runs'), tt('先把一段做順,再擴大', 'Smooth one flow, then expand')];
  const x = z.x + 2, w = z.w - 4, pad = 16;
  // 面板依「該景實際內容」裁高(有多少畫多少,空間不足時各列自動壓縮),整組再於可用高度內置中
  const railH = fsN + 36;
  const avail = z.h - railH - 6;
  const headH = pad + fsT + fsN + 21 + 16;
  const chipH = fsN * 2.1;
  g.font = '600 ' + fsN + 'px "Space Grotesk","Noto Sans TC",sans-serif';
  const chipRows = ISSUE3
    .reduce((acc, tx) => g.measureText(tx).width + 18 + acc, 16) > w - pad * 2 ? 2 : 1;
  const needOf = (i) => headH + [4 * 54 + 10 + chipRows * (chipH + 8), 3 * 58 + 44, 150, 3 * 62 + 34][i] + pad;
  // 空間不足時「整組等比縮小」,而不是把列高壓到下限 —— 壓下限會讓每一列的字互相疊在一起
  // (iPhone 12 mini 這種矮視窗最明顯)。縮到 0.72 為止,再不夠才讓它裁切。
  const sc = Math.max(0.72, Math.min(1, avail / needOf(cur)));
  const hOf = (i) => needOf(i);
  const drawnH = needOf(cur) * sc;
  const cy0 = mRail(g, d, C, t, x, w, z.y + 2 + Math.min(56, Math.max(0, (avail - drawnH) / 2)), 4, cur, fsN);
  if (avail < 120) return;

  // 母動畫:上一景上飄順旋淡出的同時,這一景由下升起逆旋淡入 —— 交叉換場,不會出現空畫面
  // aP = 卡片本體透明度(先實體到位,擋住上一景殘影);a = 卡內內容透明度(隨後長出來)
  const drawScene = (cur, kv, a, dy, rot, aP) => {
    const h = hOf(cur);
    g.save();
    // 等比縮小以左上為錨,版面座標維持在「理想尺寸」下計算,列與列之間永遠不會壓到
    if (sc < 1) { g.translate(x + w / 2, cy0); g.scale(sc, sc); g.translate(-(x + w / 2), -cy0); }
    const cxp = x + w / 2, cyp = cy0 + h / 2;
    g.translate(cxp, cyp + dy);
    g.rotate(rot * Math.PI / 180);
    g.translate(-cxp, -cyp);
    g.globalAlpha = aP;
    d.rr(x, cy0, w, h, 14);
  g.fillStyle = 'rgba(15,18,22,.97)'; g.fill();
  g.strokeStyle = BD[cur]; g.lineWidth = 1.3; g.stroke();

  g.globalAlpha = a;
  g.font = '800 ' + fsT + 'px "Noto Sans TC",sans-serif'; g.fillStyle = C.ivory;
  g.fillText(TITLE[cur], x + pad, cy0 + pad + fsT);
  g.globalAlpha = a * .58;
  g.font = '500 ' + fsN + 'px "Noto Sans TC",sans-serif'; g.fillStyle = 'rgba(242,239,232,.92)';
  g.fillText(SUB[cur], x + pad, cy0 + pad + fsT + fsN + 9);
  const hy = cy0 + pad + fsT + fsN + 21;
  g.globalAlpha = a * .5;
  g.strokeStyle = 'rgba(242,239,232,.14)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x + pad, hy); g.lineTo(x + w - pad, hy); g.stroke();
  g.globalAlpha = a;

  const bx = x + pad, bw = w - pad * 2, by = hy + 16, bh = cy0 + h - pad - by;

  if (cur === 0) { // 現況盤點:四來源列 + 掃描光束(子)+ 問題晶片浮動(子)
    const chipTop = by + bh - chipRows * chipH - (chipRows - 1) * 8;
    const areaH = Math.max(64, chipTop - by - 10);          // 壓縮時仍給四列最低可讀高度
    const rh = Math.max(16, Math.min(54, areaH / 4));
    const chipsFit = chipTop > by + rh * 4 - 2;             // 放不下就不畫晶片,不硬擠
    const beam = by + areaH * (.5 + .5 * Math.sin(t * .85));
    SRC4.forEach((r, i) => {
      const kr = ez(sb(kv, .1 + i * .09, .38 + i * .09));
      if (kr <= .01) return;
      const ry = by + i * rh, slide = (1 - kr) * 26;
      const near = 1 - Math.min(1, Math.abs(beam - (ry + rh / 2)) / (rh * .95));
      g.globalAlpha = a * kr * (.08 + .2 * near);
      d.rr(bx - 8, ry, bw + 16, rh - 6, 8); g.fillStyle = AK[0]; g.fill();
      g.globalAlpha = a * kr;
      g.font = '700 ' + fsM + 'px "Noto Sans TC",sans-serif'; g.fillStyle = 'rgba(242,239,232,.94)';
      g.fillText(r[0], bx + 2 - slide, ry + rh * .58);
      g.globalAlpha = a * kr * .62;
      g.font = '600 ' + fsN + 'px "Space Grotesk","Noto Sans TC",sans-serif';
      g.fillStyle = 'rgba(242,239,232,.92)'; g.textAlign = 'right';
      g.fillText(r[1], bx + bw - 20 + slide, ry + rh * .56); g.textAlign = 'left';
      d.node(bx + bw - 5, ry + rh * .45, 3.8, kr >= 1 ? C.green : C.orange, a * kr * (.5 + .5 * near), kr < 1);
    });
    let chx = bx, chy = chipTop;
    ISSUE3.forEach((tx, i) => {
      const kc = ez(sb(kv, .5 + i * .1, .74 + i * .1));
      if (kc <= .02 || !chipsFit) return;
      g.font = '600 ' + fsN + 'px "Space Grotesk","Noto Sans TC",sans-serif';
      const cw = g.measureText(tx).width + 18;
      if (chx + cw > bx + bw) { chx = bx; chy += chipH + 8; }  // 不爆版:自動換行
      g.globalAlpha = a * kc;
      d.chip(chx, chy + Math.sin(t * 1.7 + i * 1.2) * 2.6, tx, true, fsN);
      chx += cw + 8;
    });
  } else if (cur === 1) { // 第一階段:三條定義 + 行進虛線範圍框(子)+ 打勾落下(子)
    const rh = Math.max(22, Math.min(58, (bh - 44) / 3));
    g.save();
    g.globalAlpha = a * ez(sb(kv, .18, .5)) * .85;
    g.setLineDash([6, 7]); g.lineDashOffset = -t * 18;
    g.strokeStyle = 'rgba(255,107,44,.6)'; g.lineWidth = 1.2;
    d.rr(bx - 8, by - 10, bw + 16, rh * 3 + 14, 10); g.stroke();
    g.restore();
    DEF3.forEach((r, i) => {
      const kr = ez(sb(kv, .12 + i * .13, .42 + i * .13));
      if (kr <= .01) return;
      const ry = by + i * rh, rise = (1 - kr) * 18;
      g.globalAlpha = a * kr;
      g.font = '700 ' + fsN + 'px "Noto Sans TC",sans-serif'; g.fillStyle = C.orange;
      g.fillText(r[0], bx + 2, ry + fsN + 4 + rise);
      g.font = '700 ' + fsM + 'px "Noto Sans TC",sans-serif'; g.fillStyle = 'rgba(242,239,232,.95)';
      g.fillText(r[1], bx + 2, ry + fsN + fsM + 12 + rise);
    });
    const kt = ez(sb(kv, .58, .84));
    if (kt > .02) {
      const ty = by + rh * 3 + 26 + (1 - kt) * -16 + Math.sin(t * 3.2) * 1.2 * kt;
      d.tick(bx + 10, ty, 8.5, C.green, a * kt);
      g.globalAlpha = a * kt;
      g.font = '600 ' + fsN + 'px "Noto Sans TC",sans-serif'; g.fillStyle = 'rgba(101,224,188,.92)';
      g.fillText(T_SCOPE_OK, bx + 28, ty + 5);
    }
  } else if (cur === 2) { // 建立驗證:管線 + token 巡遊經閘門停頓(子)+ 資料線流動(子)
    const steps = STEP4;
    const py = Math.max(by + 58, by + bh * .46);   // 閘門畫在節點上方 50px,不可低於面板上緣
    const m0 = bx + 20, m1 = bx + bw - 20;
    const conn = ez(sb(kv, .06, .78)) * (steps.length - 1); // 正規化:本景 78% 前一定接到最後一站
    steps.forEach((tx, i) => {
      const nx = m0 + (m1 - m0) * i / 3, on = conn >= i - .02;
      if (i < 3) {
        const nx2 = m0 + (m1 - m0) * (i + 1) / 3;
        if (on) {
          g.save(); g.globalAlpha = a;
          g.strokeStyle = 'rgba(62,155,255,.55)'; g.lineWidth = 1.6;
          g.setLineDash([5, 7]); g.lineDashOffset = -t * 24;
          g.beginPath(); g.moveTo(nx + 9, py); g.lineTo(nx2 - 9, py); g.stroke();
          g.restore();
        } else d.line(nx + 9, py, nx2 - 9, py, clamp(conn - i, 0, 1), 'rgba(62,155,255,.45)', 1.5);
      }
      d.node(nx, py, on ? 5 : 3.4, on ? C.blue : 'rgba(242,239,232,.3)', a, !on);
      g.globalAlpha = a * (on ? 1 : .5);
      g.font = '700 ' + fsN + 'px "Noto Sans TC",sans-serif';
      g.fillStyle = on ? 'rgba(242,239,232,.92)' : 'rgba(242,239,232,.45)';
      g.textAlign = i === 0 ? 'left' : (i === 3 ? 'right' : 'center');
      g.fillText(tx, i === 0 ? nx - 7 : (i === 3 ? nx + 7 : nx), py + 27);
      g.textAlign = 'left';
    });
    const kg = ez(sb(kv, .3, .6));
    if (kg > .02) {
      const gx = m0 + (m1 - m0) * 2 / 3, gy = py - 50;
      g.font = '700 ' + fsN + 'px "Noto Sans TC",sans-serif';
      const gt = T_HUMAN, gw = g.measureText(gt).width + 22;
      g.globalAlpha = a * kg * (.1 + .12 * Math.sin(t * 2.4));   // 閘門光暈脈動(子)
      d.rr(gx - gw / 2 - 6, gy - 5, gw + 12, fsN * 2.1 + 10, 16); g.fillStyle = C.green; g.fill();
      g.globalAlpha = a * kg;
      d.rr(gx - gw / 2, gy, gw, fsN * 2.1, fsN);
      g.fillStyle = 'rgba(101,224,188,.14)'; g.fill();
      g.strokeStyle = 'rgba(101,224,188,.6)'; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = 'rgba(101,224,188,.95)';
      g.fillText(gt, gx - gw / 2 + 11, gy + fsN * 1.45);
      d.line(gx, gy + fsN * 2.1, gx, py - 9, kg, 'rgba(101,224,188,.5)', 1, [3, 4]);
      g.globalAlpha = a;
    }
    const tk = ez(sb(kv, .25, .55));
    if (tk > .02) {
      const cyc = (t * .3) % 1;
      const f = cyc < .58 ? cyc / .58 * .667 : (cyc < .74 ? .667 : .667 + (cyc - .74) / .26 * .333);
      const tx2 = m0 + (m1 - m0) * f;
      g.globalAlpha = a * tk * .3;
      g.beginPath(); g.arc(tx2, py, 11, 0, TAU); g.fillStyle = C.blue; g.fill();
      d.node(tx2, py, 4.4, C.blue, a * tk, false);
    }
    const kr = ez(sb(kv, .6, .9));
    if (kr > .02) {
      const yy = by + bh - 8;
      d.node(bx + 6, yy - 5, 3.6, C.green, a * kr * (.5 + .5 * Math.sin(t * 2.2)), false);
      g.globalAlpha = a * kr;
      g.font = '600 ' + fsN + 'px "Noto Sans TC",sans-serif'; g.fillStyle = 'rgba(242,239,232,.82)';
      g.fillText(T_USER_TEST, bx + 20, yy);
    }
  } else { // 上線與改善:三列狀態(勾/呼吸/循環,皆為子動畫)+ 底部波形流動(子)
    const rh = Math.max(24, Math.min(62, (bh - 34) / 3));
    LIVE3.forEach((r, i) => {
      // 收在本景 52% 前跑完:尾景 CTA 回來時步驟已演完(先動畫、後按鈕)
      const kr = ez(sb(kv, .06 + i * .1, .3 + i * .1));
      if (kr <= .01) return;
      const ry = by + i * rh, icx = bx + 12, rise = (1 - kr) * 16, icy = ry + rh * .36 + rise;
      if (r[0] === 'tick') d.tick(icx, icy, 9, C.green, a * kr);
      else if (r[0] === 'pulse') {
        g.globalAlpha = a * kr * (.14 + .18 * Math.sin(t * 2.2));
        g.beginPath(); g.arc(icx, icy, 12, 0, TAU); g.fillStyle = C.green; g.fill();
        d.node(icx, icy, 4.2, C.green, a * kr, false);
      } else {
        g.save(); g.globalAlpha = a * kr;
        g.strokeStyle = C.green; g.lineWidth = 1.8; g.lineCap = 'round';
        const rr = 9.5, a0 = t * 1.4;
        g.beginPath(); g.arc(icx, icy, rr, a0, a0 + Math.PI * 1.5); g.stroke();
        g.beginPath(); g.arc(icx + Math.cos(a0 + Math.PI * 1.5) * rr, icy + Math.sin(a0 + Math.PI * 1.5) * rr, 2.3, 0, TAU);
        g.fillStyle = C.green; g.fill(); g.restore();
      }
      g.globalAlpha = a * kr;
      g.font = '700 ' + fsM + 'px "Noto Sans TC",sans-serif'; g.fillStyle = 'rgba(242,239,232,.95)';
      g.fillText(r[1], bx + 34, icy + 6);
      g.globalAlpha = a * kr * .6;
      g.font = '500 ' + fsN + 'px "Noto Sans TC",sans-serif'; g.fillStyle = 'rgba(242,239,232,.92)';
      g.fillText(r[2], bx + 34, icy + fsN + 15);
    });
    const lk = ez(sb(kv, .34, .6));
    if (lk > .02) {
      const ly = by + bh - 16;
      g.save(); g.globalAlpha = a * lk;
      g.strokeStyle = 'rgba(101,224,188,.6)'; g.lineWidth = 1.8; g.lineCap = 'round';
      g.beginPath();
      for (let j = 0; j <= 34; j++) {
        const f = j / 34, px2 = bx + bw * f;
        const wave = Math.sin(f * 6.5 + t * 2.2) * 9 * (.35 + .65 * f);
        if (j === 0) g.moveTo(px2, ly + wave); else g.lineTo(px2, ly + wave);
      }
      g.stroke(); g.restore();
    }
    }
    g.restore(); g.globalAlpha = 1;
  };

  const eIn = ez(sb(kv, .02, .28));
  const card = ez(sb(kv, .005, .1));   // 卡片本體:一進場就成形
  if (cur > 0) {                       // 前一景先讓位:壓暗、上飄離場
    const go = ez(sb(kv, 0, .18));
    if (1 - go > .02) drawScene(cur - 1, 1, (1 - go) * .8, -go * 80, go * 3, (1 - go) * .85);
  }
  if (card > .02) drawScene(cur, kv, eIn, (1 - card) * 42, (1 - card) * -3.2, card);
}

export const painters = {
  solutions: paintSolutions,
  cases: paintCases,
  pricing: paintPricing,
  about: paintAbout,
  demo: paintDemo,
  method: paintMethod
};
