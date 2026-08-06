// /blog 觀點頁開場:滿版天文觀測台。整段是自走的時間軸動畫,不吃捲動(捲動驅動留給品牌頁)。
//
// 圖層(由後往前):
//   1 靜態天幕   夜空漸層 + 銀河帶            → 離屏預繪,每幀一次 blit
//   2 星雲       程序化 value-noise + fbm     → 離屏預繪兩張低解析雜訊,每幀只位移/呼吸
//   3 大氣輝光   地平線上的輝光帶,色相隨時間慢慢在暖橘與青綠之間走
//   4/5/7 星場   遠 / 中 / 近三層,各自繞天極以不同轉速旋轉,近層有繞射十字星芒
//   6 行星       環系行星 + 兩顆衛星沿橢圓軌道公轉(軌道線可見)
//   8 流星       偶發,含頭部光暈與拖尾
//   9 觀測紀錄   已完成的星座留下淡淡殘影,最多疊 5 組,右側有編號讀數
//  10 當前星座   點擊連成的線 + 每顆星的觀測環
//  11 完成儀式   光暈擴散雙環 + 座標讀數 + 編號標記
//  12 靜態地面   雙層山稜 + 觀測站圓頂剪影   → 離屏預繪(只有底部一條帶),蓋住地平線下的星
//  13 觀測者     三腳架 / 赤道儀 / 主鏡 + 尋星鏡 / 目鏡,鏡筒轉向最新觀測目標
//  14 目鏡視野圈 指標靠近時出現的放大圈:圈內是更密的暗星 + 刻度環 + 十字絲 + 赤經赤緯讀數
//
// 互動:點畫面任一處 → 就近的星星被「觀測」到,依序連成星座;附近沒有星星就當場發現一顆。
//       連滿 STAR_GOAL 顆完成一次觀測,標記編號後歸檔進觀測紀錄。
//       桌機游標會帶著目鏡視野圈跑並輕微視差;手機輕點後視野圈停留兩秒。
// 動畫全部掛在 motion-kit 的共用 rAF 上(整頁只有一個迴圈);離開視窗時自動停止繪製。
// prefers-reduced-motion:不做任何持續動態,只有互動後重畫一次,點擊功能完整保留。
// 文案不寫死在這裡,由 Blog.dc.html 用 data-* 傳進來 —— 這支模組中英共用。
import { createMotionContext } from './motion-kit.js';

const STAR_GOAL = 6;                       // 連幾顆算完成一次觀測
const PICK_RADIUS = 68;                    // 點擊吸附半徑(px)
const RESET_MS = 3200;                     // 完成後停留多久再歸檔重來
const LOG_MAX = 5;                         // 觀測紀錄最多疊幾組殘影(上限=效能上限)
const TAU = Math.PI * 2;

const CREAM = '242,239,232';
const ORANGE = '255,107,44';
const STEEL = '152,170,208';
// 星等色溫:多數偏白,少數藍白與橙黃 —— 純白星場看起來像雜訊,有色溫才像天空
const SPECTRA = [CREAM, CREAM, CREAM, '198,214,245', '255,223,182', '214,228,255'];
const FAR_A = [0.055, 0.1, 0.155, 0.225, 0.31];   // 遠層星星的透明度分桶(批次填色用)

export function mountBlogHero() {
  const root = document.querySelector('[data-blog-sky]');
  if (!root) return () => {};
  const cv = root.querySelector('canvas');
  if (!cv) return () => {};
  const g = cv.getContext('2d', { alpha: false });
  if (!g) return () => {};

  const ctx = createMotionContext('blog-sky');
  const reduced = ctx.reduced;
  const TXT = {
    hint: root.getAttribute('data-hint') || '',
    done: root.getAttribute('data-done') || '',
    stars: root.getAttribute('data-stars') || '',
    log: root.getAttribute('data-log') || ''
  };
  const live = root.querySelector('[data-sky-live]');
  const hoverable = !!(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches);

  let W = 0, H = 0, DPR = 1, mobile = false, small = false;
  let layers = [], deep = [];
  let picks = [], logs = [], ripples = [], shots = [], bursts = [];
  let pole = { x: 0, y: 0 };
  let scope = { x: 0, y: 0, s: 1, pivot: 0, ang: -1.1, aim: -1.1 };
  let planet = null;
  let lens = { x: 0, y: 0, tx: 0, ty: 0, on: 0, want: 0, hold: 0, r: 90 };
  let par = { x: 0, y: 0, tx: 0, ty: 0 };
  let doneAt = 0, doneTag = '', doneAtXY = null, nextShot = 3200, visible = true;
  let bgSky = null, bgGround = null, groundH = 0, neb = [], nebSrc = null;
  let dirty = true;                                 // reduced 模式下只有髒了才重畫

  const rnd = (a, b) => a + Math.random() * (b - a);
  const p2 = (n) => (n < 10 ? '0' : '') + n;

  // ── 程序化雜訊:value noise + fbm,預繪成一張小圖,放大後就是柔邊星雲 ──
  function noiseCanvas(w, h, rgb, seed, scale, oct, cut) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const b = c.getContext('2d');
    const im = b.createImageData(w, h);
    const d = im.data;
    const hashAt = (x, y) => {
      let n = (x * 374761393 + y * 668265263 + seed * 1274126177) | 0;
      n = (n ^ (n >> 13)) * 1274126177;
      return ((n ^ (n >> 16)) >>> 0) / 4294967295;
    };
    const sm = (t) => t * t * (3 - 2 * t);
    const val = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = sm(x - xi), yf = sm(y - yi);
      const a = hashAt(xi, yi), b1 = hashAt(xi + 1, yi);
      const c1 = hashAt(xi, yi + 1), d1 = hashAt(xi + 1, yi + 1);
      const t = a + (b1 - a) * xf;
      return t + ((c1 + (d1 - c1) * xf) - t) * yf;
    };
    const parts = rgb.split(',');
    const rr = +parts[0], gg2 = +parts[1], bb = +parts[2];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = 0, amp = 1, f = scale, sum = 0;
        for (let o = 0; o < oct; o++) { v += val(x / w * f, y / h * f) * amp; sum += amp; amp *= 0.5; f *= 2.07; }
        v /= sum;
        v = Math.max(0, (v - cut) / (1 - cut));
        v *= v;                                     // 收窄:避免整片糊成一層灰
        const i = (y * w + x) * 4;
        d[i] = rr; d[i + 1] = gg2; d[i + 2] = bb; d[i + 3] = (v * 255) | 0;
      }
    }
    b.putImageData(im, 0, 0);
    return c;
  }

  // ── 版面 ────────────────────────────────────────────────
  function layout() {
    const r = root.getBoundingClientRect();
    W = Math.max(300, Math.round(r.width));
    H = Math.max(240, Math.round(r.height));
    DPR = Math.min(2, window.devicePixelRatio || 1);   // 上限 2:再高只是燒 GPU,肉眼看不出來
    mobile = W < 720;
    small = W < 400 || H < 560;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    g.setTransform(DPR, 0, 0, DPR, 0, 0);

    // 天球極點放在畫面外的右下:星星繞它轉,離極點越遠走得越多 —— 和真實星空一致
    pole = { x: W * 0.74, y: H * 1.55 };
    lens.r = small ? 58 : mobile ? 68 : 96;

    // 望遠鏡站位:桌機靠右(文案佔左下),手機偏右下(文案在上方)
    scope.x = mobile ? W * 0.68 : W * 0.795;
    scope.y = H - groundY(scope.x) + (mobile ? 4 : 6);
    scope.s = mobile ? Math.min(1.28, Math.max(0.78, H / 560)) : Math.min(1.95, Math.max(1.1, H / 500));
    scope.pivot = 30 * scope.s;                      // 雲台高度:鏡筒繞這個點轉,對準角度也從這裡算

    if (!layers.length) seed();
    else { layers.forEach((L) => L.stars.forEach(project)); deep.forEach(project); if (planet) project(planet); }
    build();
    dirty = true;
  }

  // 地平線起伏(回傳距畫面底部的高度)。滿版後高度會拉到 800px 以上,
  // 純比例的地面會變成一大塊黑,所以上限鎖住。
  const groundY = (x) => {
    const gb = Math.min(H * 0.145, 118);
    const k = x / Math.max(1, W);
    return gb + Math.sin(k * 3.1 + 0.6) * gb * 0.2 + Math.sin(k * 7.3) * gb * 0.09;
  };

  // 以「畫面比例」存位置,resize 後重算極座標 —— 星座不會因為轉向而錯位。
  // born 是這顆星被建立時的天球轉角:點擊當場發現的星要落在「當下」的畫面位置,
  // 少了這一項,resize 之後它會跳到別的地方。
  function project(s) {
    const x = s.nx * W, y = s.ny * H;
    const dx = x - pole.x, dy = y - pole.y;
    s.r = Math.hypot(dx, dy);
    s.a0 = Math.atan2(dy, dx) - (s.born || 0);
  }

  // 星星的垂直分佈要跟著遮罩走:桌機的遮罩只吃左下角,星場往上堆才會落在開闊處;
  // 手機的遮罩由上而下吃到 68%,再往上堆就等於把星星藏在黑布後面,所以整片下移。
  function mkStar(loMag, hiMag) {
    const s = {
      nx: Math.random(),
      ny: mobile
        ? 0.2 + Math.pow(Math.random(), 0.9) * 0.64
        : Math.pow(Math.random(), 1.32) * 0.86,
      mag: loMag + Math.pow(Math.random(), 1.8) * (hiMag - loMag),
      tw: rnd(0, TAU), tws: rnd(0.55, 1.9),
      col: SPECTRA[(Math.random() * SPECTRA.length) | 0],
      lit: 0, want: false
    };
    project(s);
    return s;
  }

  function seed() {
    const q = small ? 0.5 : mobile ? 0.62 : 1;       // 手機降粒子數
    const mk = (n, lo, hi, rate, tier) => {
      const L = { stars: [], rate, tier, spin: 0, buk: [[], [], [], [], []] };
      for (let i = 0; i < n; i++) { const s = mkStar(lo, hi); s.lr = tier; L.stars.push(s); }
      return L;
    };
    layers = [
      mk(Math.round(210 * q), 0, 0.34, 0.42, 0),      // 遠:密、暗、轉最慢
      mk(Math.round(92 * q), 0.16, 0.82, 1, 1),       // 中:主要可觀測的星
      mk(Math.round(22 * q), 0.62, 1, 1.62, 2)        // 近:亮星,有繞射星芒
    ];
    deep = [];
    const dn = Math.round(360 * q);                   // 只在目鏡圈裡看得到的暗星
    for (let i = 0; i < dn; i++) { const s = mkStar(0, 0.42); s.lr = 1; deep.push(s); }

    planet = {
      nx: rnd(0.26, 0.6), ny: mobile ? rnd(0.42, 0.58) : rnd(0.16, 0.34),
      rad: mobile ? 8.5 : 13, tilt: rnd(-0.5, -0.24), lr: 1,
      moons: [
        { d: mobile ? 22 : 34, sp: 0.00021, ph: rnd(0, TAU), r: mobile ? 1.7 : 2.3, sq: 0.34 },
        { d: mobile ? 34 : 52, sp: -0.000128, ph: rnd(0, TAU), r: mobile ? 1.3 : 1.8, sq: 0.5 }
      ]
    };
    project(planet);
  }

  // 三層的視差位移量(px)。所有「算位置」的地方都走這支,
  // 否則觀測環、星座線、目鏡圈裡的星會跟畫面上看到的星差開十幾 px。
  const PARK = [4, 9, 16];
  const starPos = (s) => {
    const li = s.lr | 0;
    const a = s.a0 + layers[li].spin;
    const k = PARK[li];
    return { x: pole.x + s.r * Math.cos(a) + par.x * k, y: pole.y + s.r * Math.sin(a) + par.y * k };
  };

  // ── 靜態層預繪:天幕(漸層+銀河)與地面(雙層山稜+觀測站) ──
  function build() {
    // 天幕
    bgSky = document.createElement('canvas');
    bgSky.width = Math.round(W * DPR);
    bgSky.height = Math.round(H * DPR);
    const b = bgSky.getContext('2d');
    b.setTransform(DPR, 0, 0, DPR, 0, 0);
    const sky = b.createLinearGradient(0, 0, W * 0.25, H);
    sky.addColorStop(0, '#05070C');
    sky.addColorStop(0.42, '#090C14');
    sky.addColorStop(0.78, '#0C1019');
    sky.addColorStop(1, '#12141C');
    b.fillStyle = sky;
    b.fillRect(0, 0, W, H);
    // 銀河:一道斜過去的微亮帶,加一層細顆粒讓它不是死板的漸層
    b.save();
    b.translate(W * 0.52, H * 0.3);
    b.rotate(-0.46);
    const mw = b.createLinearGradient(0, -H * 0.24, 0, H * 0.24);
    mw.addColorStop(0, `rgba(${STEEL},0)`);
    mw.addColorStop(0.46, `rgba(${STEEL},.075)`);
    mw.addColorStop(0.56, `rgba(${STEEL},.055)`);
    mw.addColorStop(1, `rgba(${STEEL},0)`);
    b.fillStyle = mw;
    b.fillRect(-W, -H * 0.24, W * 2, H * 0.48);
    b.fillStyle = `rgba(${CREAM},.5)`;
    for (let i = 0; i < (mobile ? 90 : 190); i++) {   // 銀河裡的細塵埃:預繪,不參與轉動
      const gx = rnd(-W, W), gy = rnd(-H * 0.17, H * 0.17);
      b.globalAlpha = rnd(0.05, 0.3) * (1 - Math.abs(gy) / (H * 0.17));
      b.fillRect(gx | 0, gy | 0, 1, 1);
    }
    b.globalAlpha = 1;
    b.restore();

    // 星雲:兩張低解析雜訊,每幀各一次放大 blit(位移+呼吸=流動感)。
    // 雜訊圖不吃畫布尺寸,算一次就好 —— resize 每次重跑要多花十幾毫秒,而且結果完全一樣。
    if (!nebSrc) {
      const nw = 132, nh = 84;
      nebSrc = [
        noiseCanvas(nw, nh, '84,104,156', 7, 2.4, 4, 0.34),
        noiseCanvas(nw, nh, '176,96,54', 23, 3.2, 4, 0.46)
      ];
    }
    neb = [
      { c: nebSrc[0], a: 0.68, sp: 0.0000185, bs: 0.00021, dx: -0.06, dy: -0.02 },
      { c: nebSrc[1], a: 0.42, sp: -0.0000132, bs: 0.00016, dx: 0.1, dy: -0.08 }
    ];
    if (mobile) neb.length = 1;                      // 手機只留一層:少一次滿版合成

    // 地面:只畫最底下那條帶,不做整張滿版 —— 每幀 blit 的面積少八成
    groundH = Math.ceil(Math.min(H * 0.145, 118) * 1.5) + 8;
    bgGround = document.createElement('canvas');
    bgGround.width = Math.round(W * DPR);
    bgGround.height = Math.round(groundH * DPR);
    const t = bgGround.getContext('2d');
    t.setTransform(DPR, 0, 0, DPR, 0, 0);
    const off = H - groundH;                         // bgGround 內的 y = 畫面 y - off
    const ridge = (fn, fill) => {
      t.beginPath();
      t.moveTo(0, groundH);
      for (let x = 0; x <= W; x += 5) t.lineTo(x, fn(x) - off);
      t.lineTo(W, groundH);
      t.closePath();
      t.fillStyle = fill;
      t.fill();
    };
    // 遠稜線(略高、略亮)與近稜線 —— 兩層才有縱深,單一剪影看起來像色塊
    const far = (x) => H - groundY(x) - Math.min(30, H * 0.036) - Math.sin(x / W * 5.2 + 1.4) * Math.min(15, H * 0.018);
    ridge(far, '#0C111C');
    t.beginPath();                                   // 遠稜線的鑲邊:沒有這條,兩層山會糊成同一塊
    for (let x = 0; x <= W; x += 5) { const y = far(x) - off; (x ? t.lineTo(x, y) : t.moveTo(x, y)); }
    t.strokeStyle = `rgba(${STEEL},.16)`;
    t.lineWidth = 1;
    t.stroke();
    // 遠稜線上的小型觀測站圓頂:主題道具,靜態預繪。放在畫面中段 ——
    // 貼左邊會被文案遮罩整個吃掉,等於白畫。
    const dcx = W * (mobile ? 0.34 : 0.44);
    const dx = dcx, dy = far(dcx) - off;
    const ds = Math.max(9, Math.min(16, H * 0.019));
    t.fillStyle = '#05080E';
    t.beginPath();
    t.moveTo(dx - ds * 1.25, dy + 3);
    t.lineTo(dx - ds * 1.25, dy - ds * 0.5);
    t.arc(dx, dy - ds * 0.5, ds * 1.25, Math.PI, 0);
    t.lineTo(dx + ds * 1.25, dy + 3);
    t.closePath();
    t.fill();
    t.strokeStyle = `rgba(${ORANGE},.42)`;           // 圓頂的觀測狹縫
    t.lineWidth = 1.8;
    t.beginPath();
    t.moveTo(dx + ds * 0.24, dy - ds * 1.68);
    t.lineTo(dx + ds * 0.62, dy - ds * 0.3);
    t.stroke();
    ridge((x) => H - groundY(x), '#04060A');
    t.beginPath();                                   // 地平線上緣的微光
    for (let x = 0; x <= W; x += 5) {
      const y = H - groundY(x) - off;
      (x ? t.lineTo(x, y) : t.moveTo(x, y));
    }
    t.strokeStyle = `rgba(${ORANGE},.2)`;
    t.lineWidth = 1;
    t.stroke();
  }

  // ── 大氣輝光:地平線上的一層帶,色相在暖橘與青綠之間慢慢走 ──
  function drawAirglow(now) {
    const t = reduced ? 0.35 : (Math.sin(now * 0.000037) * 0.5 + 0.5);
    const band = Math.min(H * 0.42, 300);
    const top = H - groundY(W * 0.5) - band;
    const gr = g.createLinearGradient(0, top, 0, H - groundY(W * 0.5) + 8);
    const warm = [255, 118, 52], cool = [92, 186, 150];
    const mix = (i) => Math.round(cool[i] + (warm[i] - cool[i]) * t);
    const c = mix(0) + ',' + mix(1) + ',' + mix(2);
    gr.addColorStop(0, `rgba(${c},0)`);
    gr.addColorStop(0.62, `rgba(${c},${(0.035 + t * 0.03).toFixed(3)})`);
    gr.addColorStop(1, `rgba(${c},${(0.1 + t * 0.06).toFixed(3)})`);
    g.fillStyle = gr;
    g.fillRect(0, top, W, band + 10);
  }

  function drawNebula(now) {
    const t = reduced ? 0 : now;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < neb.length; i++) {
      const n = neb[i], ph = t * n.sp;
      const ox = Math.sin(ph) * W * 0.05 + n.dx * W;
      const oy = Math.cos(ph * 0.73) * H * 0.04 + n.dy * H;
      g.globalAlpha = n.a * (reduced ? 0.9 : (0.8 + 0.2 * Math.sin(t * n.bs + i * 2)));
      g.drawImage(n.c, -W * 0.22 + ox, -H * 0.22 + oy, W * 1.44, H * 1.44);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  // ── 星場 ────────────────────────────────────────────────
  function drawFar(L, now) {
    const buk = L.buk;
    for (let b = 0; b < 5; b++) buk[b].length = 0;
    const ox = par.x * PARK[0], oy = par.y * PARK[0];
    for (let i = 0; i < L.stars.length; i++) {
      const s = L.stars[i];
      const a = s.a0 + L.spin;
      const x = pole.x + s.r * Math.cos(a) + ox;
      const y = pole.y + s.r * Math.sin(a) + oy;
      if (y > H - groundY(x) + 2 || y < -4 || x < -4 || x > W + 4) continue;
      const tw = reduced ? 1 : 0.74 + 0.26 * Math.sin(now * 0.0016 * s.tws + s.tw);
      const al = (0.14 + s.mag * 0.72) * tw;
      const bi = al < 0.14 ? 0 : al < 0.24 ? 1 : al < 0.34 ? 2 : al < 0.46 ? 3 : 4;
      buk[bi].push(x | 0, y | 0);
    }
    for (let b = 0; b < 5; b++) {
      const arr = buk[b];
      if (!arr.length) continue;
      g.fillStyle = `rgba(${CREAM},${FAR_A[b]})`;
      for (let i = 0; i < arr.length; i += 2) g.fillRect(arr[i], arr[i + 1], 1, 1);
    }
  }

  function drawStar(s, x, y, now, tier) {
    const tw = reduced ? 1 : 0.72 + 0.28 * Math.sin(now * 0.0016 * s.tws + s.tw);
    const rad = (tier === 2 ? 1.15 : 0.6) + s.mag * (tier === 2 ? 1.5 : 1.35);
    if (s.lit > 0) {                                 // 被觀測到的星:橘色光暈
      const R = 15 + s.lit * 14;
      const gl = g.createRadialGradient(x, y, 0, x, y, R);
      gl.addColorStop(0, `rgba(${ORANGE},${0.46 * s.lit})`);
      gl.addColorStop(1, `rgba(${ORANGE},0)`);
      g.fillStyle = gl;
      g.beginPath();
      g.arc(x, y, R, 0, TAU);
      g.fill();
    } else if (tier === 2 || s.mag > 0.72) {         // 亮星的柔光暈
      const R = 4 + s.mag * (tier === 2 ? 13 : 7);
      const gl = g.createRadialGradient(x, y, 0, x, y, R);
      gl.addColorStop(0, `rgba(${s.col},${(0.16 + s.mag * 0.2) * tw})`);
      gl.addColorStop(1, `rgba(${s.col},0)`);
      g.fillStyle = gl;
      g.beginPath();
      g.arc(x, y, R, 0, TAU);
      g.fill();
    }
    if (tier === 2) {                                // 繞射十字星芒:星等越亮芒越長
      const len = (7 + s.mag * 26) * tw;
      const a1 = 0.1 + s.mag * 0.26;
      g.strokeStyle = `rgba(${s.col},${(a1 * tw).toFixed(3)})`;
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(x - len, y); g.lineTo(x + len, y);
      g.moveTo(x, y - len * 0.82); g.lineTo(x, y + len * 0.82);
      g.stroke();
      if (s.mag > 0.86) {                            // 最亮的幾顆再加一組 45° 短芒
        const d = len * 0.34;
        g.strokeStyle = `rgba(${s.col},${(a1 * 0.5 * tw).toFixed(3)})`;
        g.beginPath();
        g.moveTo(x - d, y - d); g.lineTo(x + d, y + d);
        g.moveTo(x + d, y - d); g.lineTo(x - d, y + d);
        g.stroke();
      }
    }
    g.beginPath();
    g.arc(x, y, rad * (s.lit ? 1.45 : 1), 0, TAU);
    g.fillStyle = s.lit
      ? `rgba(${ORANGE},${0.72 + 0.28 * s.lit})`
      : `rgba(${s.col},${((0.3 + s.mag * 0.66) * tw).toFixed(3)})`;
    g.fill();
  }

  function drawLayer(L, now) {
    const ox = par.x * PARK[L.tier], oy = par.y * PARK[L.tier];
    for (let i = 0; i < L.stars.length; i++) {
      const s = L.stars[i];
      const a = s.a0 + L.spin;
      const x = pole.x + s.r * Math.cos(a) + ox;
      const y = pole.y + s.r * Math.sin(a) + oy;
      if (y > H - groundY(x) + 4 || y < -30 || x < -30 || x > W + 30) continue;
      drawStar(s, x, y, now, L.tier);
    }
  }

  // ── 行星:環系 + 兩顆衛星沿橢圓軌道公轉 ──────────────────
  function drawPlanet(now) {
    if (!planet) return;
    const p = starPos(planet);
    if (p.y > H - groundY(p.x) + 40 || p.x < -60 || p.x > W + 60) return;
    paintPlanet(p.x, p.y, planet.rad, now);
  }

  function paintPlanet(x, y, R, now) {
    const sc = R / planet.rad;
    g.save();
    g.translate(x, y);
    g.rotate(planet.tilt);

    // 衛星軌道線
    planet.moons.forEach((m) => {
      g.beginPath();
      g.ellipse(0, 0, m.d * sc, m.d * m.sq * sc, 0, 0, TAU);
      g.strokeStyle = `rgba(${STEEL},.13)`;
      g.lineWidth = 0.7;
      g.stroke();
    });
    const mAng = (m) => m.ph + (reduced ? 0 : now * m.sp);
    const back = [], front = [];
    planet.moons.forEach((m) => {
      const a = mAng(m);
      (Math.sin(a) < 0 ? back : front).push({ m, a });
    });
    const moon = (o) => {
      const mx = Math.cos(o.a) * o.m.d * sc, my = Math.sin(o.a) * o.m.d * o.m.sq * sc;
      g.beginPath();
      g.arc(mx, my, o.m.r * sc, 0, TAU);
      g.fillStyle = `rgba(${CREAM},.72)`;
      g.fill();
    };
    back.forEach(moon);

    // 行星環:後半
    g.save();
    g.scale(1, 0.3);
    g.beginPath();
    g.arc(0, 0, R * 2.05, Math.PI, TAU);
    g.strokeStyle = `rgba(${CREAM},.2)`;
    g.lineWidth = R * 0.6;
    g.stroke();
    g.restore();

    // 星球本體:被恆星光照亮的一側偏暖,背光側沉入夜色
    const bg2 = g.createRadialGradient(-R * 0.4, -R * 0.4, R * 0.1, 0, 0, R);
    bg2.addColorStop(0, 'rgba(226,214,196,.95)');
    bg2.addColorStop(0.5, 'rgba(168,158,146,.8)');
    bg2.addColorStop(1, 'rgba(30,34,44,.9)');
    g.beginPath();
    g.arc(0, 0, R, 0, TAU);
    g.fillStyle = bg2;
    g.fill();

    // 行星環:前半
    g.save();
    g.scale(1, 0.3);
    g.beginPath();
    g.arc(0, 0, R * 2.05, 0, Math.PI);
    g.strokeStyle = `rgba(${CREAM},.3)`;
    g.lineWidth = R * 0.6;
    g.stroke();
    g.restore();
    front.forEach(moon);
    g.restore();
  }

  // ── 望遠鏡與觀測者 ──────────────────────────────────────
  function drawAstronomer(now) {
    const s = scope.s;
    const bob = reduced ? 0 : Math.sin(now / 1400) * 1.2;
    const x = scope.x, y = scope.y + bob;

    g.save();
    g.translate(x, y);
    g.strokeStyle = '#04060A';
    g.fillStyle = '#04060A';
    g.lineCap = 'round';

    // 三腳架 + 腳架撐盤
    g.lineWidth = 3.4 * s;
    [-1, 0, 1].forEach((k) => {
      g.beginPath();
      g.moveTo(0, -30 * s);
      g.lineTo(k * 16 * s, 0);
      g.stroke();
    });
    g.lineWidth = 2 * s;
    g.beginPath();
    g.moveTo(-9 * s, -12 * s);
    g.lineTo(9 * s, -12 * s);
    g.stroke();

    // 赤道儀頭
    g.beginPath();
    g.moveTo(-6 * s, -30 * s);
    g.lineTo(6 * s, -30 * s);
    g.lineTo(4.5 * s, -37 * s);
    g.lineTo(-4.5 * s, -37 * s);
    g.closePath();
    g.fill();

    // 鏡筒:繞雲台旋轉
    g.save();
    g.translate(0, -34 * s);
    g.rotate(scope.ang);
    g.beginPath();                                   // 前粗後細的筒身
    g.moveTo(-15 * s, -4.8 * s);
    g.lineTo(34 * s, -7.6 * s);
    g.lineTo(34 * s, 7.6 * s);
    g.lineTo(-15 * s, 4.8 * s);
    g.closePath();
    g.fill();
    g.fillRect(34 * s, -8.6 * s, 8 * s, 17.2 * s);   // 遮光罩
    g.fillRect(-22 * s, -3.2 * s, 9 * s, 6.4 * s);   // 目鏡
    g.fillRect(-4 * s, -11 * s, 5 * s, 4 * s);       // 調焦座
    g.beginPath();                                   // 尋星鏡
    g.moveTo(6 * s, -9 * s);
    g.lineTo(26 * s, -11 * s);
    g.lineTo(26 * s, -7.4 * s);
    g.lineTo(6 * s, -6 * s);
    g.closePath();
    g.fill();
    // 物鏡口的橘色鏡面反光 —— 全站主色,讓剪影不是純黑
    g.beginPath();
    g.ellipse(41.4 * s, 0, 1.8 * s, 8 * s, 0, 0, TAU);
    g.fillStyle = `rgba(${ORANGE},.74)`;
    g.fill();
    g.fillStyle = '#04060A';
    g.restore();

    // 觀測者:側身、單手扶著目鏡
    g.beginPath();
    g.ellipse(-27 * s, -32 * s, 6.4 * s, 7 * s, 0, 0, TAU);   // 頭
    g.fill();
    g.beginPath();                                   // 身體
    g.moveTo(-34 * s, -24 * s);
    g.quadraticCurveTo(-27 * s, -21 * s, -23 * s, 0);
    g.lineTo(-37 * s, 0);
    g.quadraticCurveTo(-39 * s, -15 * s, -34 * s, -24 * s);
    g.closePath();
    g.fill();
    g.lineWidth = 3.2 * s;                           // 手臂
    g.beginPath();
    g.moveTo(-31 * s, -22 * s);
    g.quadraticCurveTo(-25 * s, -28 * s, -20 * s, -31 * s);
    g.stroke();

    // 頭頂朝天的一道極淡輪廓光
    g.beginPath();
    g.arc(-27 * s, -32 * s, 6.4 * s, Math.PI * 1.05, Math.PI * 1.85);
    g.strokeStyle = `rgba(${CREAM},.34)`;
    g.lineWidth = 1.1;
    g.stroke();
    g.restore();
  }

  // ── 目鏡視野圈:圈內是放大後的天區 + 只有這裡看得到的暗星 + 刻度與座標 ──
  function coordText(x, y) {
    const dx = x - pole.x, dy = y - pole.y;
    let a = Math.atan2(dy, dx) + layers[1].spin;
    a = ((a % TAU) + TAU) % TAU;
    const hh = a / TAU * 24;
    const hr = Math.floor(hh), mi = Math.floor((hh - hr) * 60);
    const rmax = Math.hypot(Math.max(pole.x, W - pole.x), pole.y) || 1;
    const dec = 90 - Math.min(1, Math.hypot(dx, dy) / rmax) * 118;
    const sg = dec < 0 ? '-' : '+';
    const ad = Math.abs(dec), dd = Math.floor(ad), dm = Math.floor((ad - dd) * 60);
    return ['RA ' + p2(hr) + 'h ' + p2(mi) + 'm', 'DEC ' + sg + p2(dd) + '° ' + p2(dm) + "'"];
  }

  function drawLens(now) {
    if (lens.on < 0.02) return;
    const R = lens.r * (0.72 + 0.28 * lens.on);
    const lx = lens.x, ly = lens.y;
    const M = 2.4;                                   // 放大倍率
    const A = lens.on;

    g.save();
    g.beginPath();
    g.arc(lx, ly, R, 0, TAU);
    g.clip();
    g.globalAlpha = A;
    g.fillStyle = 'rgba(4,7,13,.62)';                // 圈內壓暗,暗星才浮得出來
    g.fillRect(lx - R, ly - R, R * 2, R * 2);

    // 圈內的暗星(只有這裡看得到)+ 放大後的中近層星
    const reach = R / M + 6;
    const push = (arr, tier) => {
      for (let i = 0; i < arr.length; i++) {
        const s = arr[i];
        const p = starPos(s);
        const x = p.x, y = p.y;
        if (Math.abs(x - lx) > reach || Math.abs(y - ly) > reach) continue;
        if (y > H - groundY(x) + 4) continue;
        const mx = lx + (x - lx) * M, my = ly + (y - ly) * M;
        if (tier === 0) {
          g.fillStyle = `rgba(${s.col},${(0.24 + s.mag * 0.6).toFixed(3)})`;
          g.beginPath();
          g.arc(mx, my, 0.5 + s.mag * 1.5, 0, TAU);
          g.fill();
        } else {
          drawStar(s, mx, my, now, tier === 2 ? 2 : 1);
        }
      }
    };
    push(deep, 0);
    push(layers[1].stars, 1);
    push(layers[2].stars, 2);
    if (planet) {                                    // 行星也要跟著放大,否則游標蓋上去它會憑空消失
      const pp = starPos(planet);
      if (Math.abs(pp.x - lx) < reach + planet.rad * 2.2 && Math.abs(pp.y - ly) < reach + planet.rad * 2.2) {
        paintPlanet(lx + (pp.x - lx) * M, ly + (pp.y - ly) * M, planet.rad * 1.9, now);
      }
    }

    // 刻度環 + 十字絲
    g.strokeStyle = `rgba(${ORANGE},.4)`;
    g.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU;
      const long = i % 6 === 0;
      const r1 = R - (long ? 13 : 6), r2 = R - 1;
      g.beginPath();
      g.moveTo(lx + Math.cos(a) * r1, ly + Math.sin(a) * r1);
      g.lineTo(lx + Math.cos(a) * r2, ly + Math.sin(a) * r2);
      g.stroke();
    }
    g.strokeStyle = `rgba(${CREAM},.26)`;
    const gap = 7;
    g.beginPath();
    g.moveTo(lx - R + 12, ly); g.lineTo(lx - gap, ly);
    g.moveTo(lx + gap, ly); g.lineTo(lx + R - 12, ly);
    g.moveTo(lx, ly - R + 12); g.lineTo(lx, ly - gap);
    g.moveTo(lx, ly + gap); g.lineTo(lx, ly + R - 12);
    g.stroke();
    g.beginPath();
    g.arc(lx, ly, R * 0.34, 0, TAU);
    g.strokeStyle = `rgba(${CREAM},.14)`;
    g.stroke();
    g.restore();

    // 鏡框
    g.globalAlpha = A;
    g.beginPath();
    g.arc(lx, ly, R, 0, TAU);
    g.strokeStyle = `rgba(${ORANGE},.62)`;
    g.lineWidth = 1.4;
    g.stroke();
    g.beginPath();
    g.arc(lx, ly, R + 4, 0, TAU);
    g.strokeStyle = `rgba(${CREAM},.12)`;
    g.lineWidth = 1;
    g.stroke();

    // 座標讀數:貼在圈下方,越界時翻到上方
    const cds = coordText(lx, ly);
    g.font = `500 ${small ? 9.5 : 10.5}px "Space Grotesk",monospace`;
    g.textAlign = 'center';
    const below = ly + R + 16 < H - 6;
    const ty = below ? ly + R + 15 : ly - R - 18;
    const tx = Math.min(Math.max(lx, 54), W - 54);
    g.fillStyle = `rgba(${ORANGE},${(0.82 * A).toFixed(3)})`;
    g.fillText(cds[0], tx, ty);
    g.fillStyle = `rgba(${CREAM},${(0.5 * A).toFixed(3)})`;
    g.fillText(cds[1], tx, ty + 13);
    g.textAlign = 'left';
    g.globalAlpha = 1;
  }

  // ── 觀測紀錄:已完成的星座殘影 + 右側編號讀數 ──────────
  function drawLogs() {
    for (let i = 0; i < logs.length; i++) {
      const lg = logs[i];
      const age = (logs.length - i) / (LOG_MAX + 1);   // 越舊越淡,最舊的那組幾乎只剩一層底紋
      const a = 0.2 - age * 0.13;
      if (a <= 0.005) continue;
      g.strokeStyle = `rgba(${ORANGE},${a.toFixed(3)})`;
      g.lineWidth = 0.9;
      g.beginPath();
      for (let j = 0; j < lg.pts.length; j++) {
        const p = starPos(lg.pts[j]);
        (j ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
      }
      g.stroke();
      g.fillStyle = `rgba(${ORANGE},${(a * 1.5).toFixed(3)})`;
      for (let j = 0; j < lg.pts.length; j++) {
        const p = starPos(lg.pts[j]);
        g.beginPath();
        g.arc(p.x, p.y, 1.5, 0, TAU);
        g.fill();
      }
    }
    if (!logs.length || !TXT.log) return;
    // 讀數位置:桌機貼右上(那一區是空的天空),手機壓到文案下方的右側
    const rx = W - (small ? 14 : 20);
    const ry = mobile ? Math.min(H * 0.52, H - groundY(W) - 90) : 30;
    g.textAlign = 'right';
    g.font = `600 ${small ? 9 : 10}px "Space Grotesk",monospace`;
    g.fillStyle = `rgba(${CREAM},.34)`;
    g.fillText(TXT.log.toUpperCase(), rx, ry);
    g.font = `700 ${small ? 15 : 18}px "Space Grotesk",monospace`;
    g.fillStyle = `rgba(${ORANGE},.66)`;
    g.fillText(p2(logs.length), rx, ry + (small ? 17 : 20));
    g.textAlign = 'left';
  }

  // ── 主繪製 ──────────────────────────────────────────────
  function frame(now) {
    if (!visible || !W || !bgSky) return;
    // reduced:不做持續動態。只有互動或完成序列進行中才重畫一次。
    if (reduced && !dirty && !doneAt) return;
    dirty = false;

    if (!reduced) {
      const base = 0.0000165;                        // 天球轉動:中層約 6 分鐘一圈
      for (let i = 0; i < layers.length; i++) layers[i].spin += base * layers[i].rate;
      par.x += (par.tx - par.x) * 0.06;
      par.y += (par.ty - par.y) * 0.06;
    }

    g.drawImage(bgSky, 0, 0, W, H);
    drawNebula(now);
    drawAirglow(now);
    drawFar(layers[0], now);
    drawLayer(layers[1], now);
    drawPlanet(now);
    drawLayer(layers[2], now);

    // 流星:偶發,頭部有光暈,拖尾隨生命週期伸縮
    if (!reduced) {
      if (now > nextShot) {
        nextShot = now + rnd(4200, 10500);
        shots.push({ x: rnd(W * 0.06, W * 0.96), y: rnd(H * 0.03, H * 0.5), a: rnd(2.25, 2.9), t0: now, life: rnd(700, 1050), big: Math.random() < 0.28 });
      }
      shots = shots.filter((sh) => now - sh.t0 < sh.life);
      for (let i = 0; i < shots.length; i++) {
        const sh = shots[i];
        const k = (now - sh.t0) / sh.life;
        const len = (sh.big ? 150 : 90) + (sh.big ? 210 : 130) * Math.sin(Math.PI * k);
        const dx = Math.cos(sh.a), dy = Math.sin(sh.a);
        const hx = sh.x + dx * (sh.big ? 430 : 300) * k, hy = sh.y + dy * (sh.big ? 430 : 300) * k;
        const a = Math.sin(Math.PI * k) * (sh.big ? 0.92 : 0.75);
        const lg = g.createLinearGradient(hx, hy, hx - dx * len, hy - dy * len);
        lg.addColorStop(0, `rgba(${CREAM},${a})`);
        lg.addColorStop(0.35, `rgba(${sh.big ? ORANGE : CREAM},${a * 0.4})`);
        lg.addColorStop(1, `rgba(${CREAM},0)`);
        g.strokeStyle = lg;
        g.lineWidth = sh.big ? 2.1 : 1.5;
        g.beginPath();
        g.moveTo(hx, hy);
        g.lineTo(hx - dx * len, hy - dy * len);
        g.stroke();
        const hr = sh.big ? 7 : 4;
        const hg = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
        hg.addColorStop(0, `rgba(${CREAM},${a})`);
        hg.addColorStop(1, `rgba(${CREAM},0)`);
        g.fillStyle = hg;
        g.beginPath();
        g.arc(hx, hy, hr, 0, TAU);
        g.fill();
      }
    }

    drawLogs();

    // 目前這一輪的星座
    if (picks.length) {
      const fade = doneAt && !reduced ? Math.max(0, 1 - Math.max(0, now - doneAt - RESET_MS * 0.55) / (RESET_MS * 0.45)) : 1;
      g.strokeStyle = `rgba(${ORANGE},${(0.58 * fade).toFixed(3)})`;
      g.lineWidth = 1.3;
      g.beginPath();
      for (let i = 0; i < picks.length; i++) {
        const p = starPos(picks[i]);
        (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
      }
      g.stroke();
      for (let i = 0; i < picks.length; i++) {       // 每顆已觀測星星外圈的細環
        const p = starPos(picks[i]);
        g.beginPath();
        g.arc(p.x, p.y, 7.5, 0, TAU);
        g.strokeStyle = `rgba(${ORANGE},${(0.44 * fade).toFixed(3)})`;
        g.lineWidth = 1;
        g.stroke();
      }
      // 鏡筒到最新目標的視線
      const lastP = starPos(picks[picks.length - 1]);
      g.save();
      g.setLineDash([2, 6]);
      g.strokeStyle = `rgba(${ORANGE},${(0.15 * fade).toFixed(3)})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(scope.x + Math.cos(scope.ang) * 42 * scope.s, scope.y - 34 * scope.s + Math.sin(scope.ang) * 42 * scope.s);
      g.lineTo(lastP.x, lastP.y);
      g.stroke();
      g.restore();

      if (doneAt) {                                  // 完成標記:編號 + 顆數
        g.font = `700 ${small ? 10.5 : 12}px "Space Grotesk","Noto Sans TC",sans-serif`;
        g.textAlign = 'left';
        const label = doneTag + '  ' + STAR_GOAL + ' ' + TXT.stars;
        const lw = g.measureText(label).width;
        const lx = Math.min(Math.max(12, lastP.x + 16), W - lw - 12);
        // 標籤永遠留在畫面內;手機再多一條下限 —— 上半部整片是文案遮罩,
        // 標記畫在那裡等於畫在黑布後面,使用者只看得到半個字。
        const lyMin = mobile ? Math.min(H * 0.52, H - groundY(W * 0.5) - 70) : 30;
        const ly = Math.min(Math.max(lyMin, lastP.y - 14), H - 26);
        g.fillStyle = `rgba(${ORANGE},${fade.toFixed(3)})`;
        g.fillText(label, lx, ly);
        if (TXT.done) {
          g.font = `500 ${small ? 9 : 10}px "Space Grotesk","Noto Sans TC",sans-serif`;
          g.fillStyle = `rgba(${CREAM},${(0.52 * fade).toFixed(3)})`;
          g.fillText(TXT.done, lx, ly + (small ? 12 : 14));
        }
        g.fillStyle = `rgba(${ORANGE},${(0.5 * fade).toFixed(3)})`;
        g.fillRect(lx, ly - (small ? 15 : 18), Math.max(lw, 40), 1);
      }
    }

    // 完成儀式:雙環擴散 + 中心閃光
    bursts = bursts.filter((b) => now - b.t0 < 1500);
    for (let i = 0; i < bursts.length; i++) {
      const b = bursts[i];
      const k = (now - b.t0) / 1500;
      const e = 1 - Math.pow(1 - k, 3);
      const fg = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, 26 + e * 60);
      fg.addColorStop(0, `rgba(${ORANGE},${(0.32 * (1 - k)).toFixed(3)})`);
      fg.addColorStop(1, `rgba(${ORANGE},0)`);
      g.fillStyle = fg;
      g.beginPath();
      g.arc(b.x, b.y, 26 + e * 60, 0, TAU);
      g.fill();
      [1, 0.62].forEach((m, j) => {
        const kk = Math.max(0, e - j * 0.16);
        g.beginPath();
        g.arc(b.x, b.y, 10 + kk * 150 * m, 0, TAU);
        g.strokeStyle = `rgba(${ORANGE},${((1 - k) * 0.44 * m).toFixed(3)})`;
        g.lineWidth = 1.6 * (1 - k) + 0.3;
        g.stroke();
      });
    }

    // 點擊漣漪
    if (!reduced) {
      ripples = ripples.filter((r) => now - r.t0 < 680);
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        const k = (now - r.t0) / 680;
        g.beginPath();
        g.arc(r.x, r.y, 8 + k * 48, 0, TAU);
        g.strokeStyle = `rgba(${ORANGE},${((1 - k) * 0.5).toFixed(3)})`;
        g.lineWidth = 1.4 * (1 - k) + 0.3;
        g.stroke();
      }
    }

    // 已觀測星星的點亮進度
    for (let i = 0; i < picks.length; i++) {
      const s = picks[i];
      if (s.lit < 1) s.lit = Math.min(1, s.lit + (reduced ? 1 : 0.055));
    }

    g.drawImage(bgGround, 0, H - groundH, W, groundH);

    // 鏡筒轉向:idle 時緩慢掃過天空
    if (!picks.length && !reduced) scope.aim = -1.3 + Math.sin(now / 5200) * 0.44;
    scope.ang += (scope.aim - scope.ang) * (reduced ? 1 : 0.055);
    drawAstronomer(now);

    // 目鏡視野圈
    const want = hoverable ? lens.want : (now < lens.hold ? 1 : 0);
    lens.on += (want - lens.on) * (reduced ? 1 : 0.14);
    if (reduced) lens.on = want;
    lens.x += (lens.tx - lens.x) * (reduced ? 1 : 0.22);
    lens.y += (lens.ty - lens.y) * (reduced ? 1 : 0.22);
    drawLens(now);

    // 完成後歸檔,重新開始一輪
    if (doneAt && now - doneAt > RESET_MS) {
      logs.push({ pts: picks.map((s) => ({ r: s.r, a0: s.a0, lr: s.lr })) });
      if (logs.length > LOG_MAX) logs.shift();
      picks.forEach((s) => { s.want = false; s.lit = 0; });
      picks = [];
      doneAt = 0;
      doneAtXY = null;
      scope.aim = -1.3;
      dirty = true;
    }
  }

  // ── 互動 ────────────────────────────────────────────────
  function observe(cx, cy) {
    if (doneAt) return;                              // 完成動畫播放中,先不接受新的點
    const nowT = performance.now();
    ripples.push({ x: cx, y: cy, t0: nowT });
    dirty = true;

    let best = null, bestD = PICK_RADIUS;
    for (let li = 1; li < layers.length; li++) {     // 只在中/近層找:遠層是背景質地,不該被點到
      const arr = layers[li].stars;
      for (let i = 0; i < arr.length; i++) {
        const s = arr[i];
        if (s.want) continue;
        const p = starPos(s);
        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d < bestD) { bestD = d; best = s; }
      }
    }
    // 附近沒有星星就當場發現一顆 —— 點下去一定有反應,不會有「按了沒事」的空拍
    if (!best) {
      if (cy > H - groundY(cx) - 10) return;         // 但不在地面上生星星
      best = {
        nx: (cx - par.x * PARK[1]) / W, ny: (cy - par.y * PARK[1]) / H,
        mag: 0.82, tw: 0, tws: 1, born: layers[1].spin,
        col: SPECTRA[(Math.random() * SPECTRA.length) | 0], lit: 0, lr: 1
      };
      project(best);
      layers[1].stars.push(best);
    }
    best.want = true;
    picks.push(best);

    const p = starPos(best);
    scope.aim = Math.atan2(p.y - (scope.y - 34 * scope.s), p.x - scope.x);
    // 觸控:輕點之後讓目鏡圈停兩秒。但「連滿最後一顆」那次不開 ——
    // 完成標記正好畫在同一區,兩塊讀數疊在一起誰也看不清。
    if (!hoverable && picks.length < STAR_GOAL) { lens.tx = p.x; lens.ty = p.y; lens.hold = nowT + 2000; }

    if (picks.length >= STAR_GOAL) {
      doneAt = nowT;
      // 編號由這次連到的星星決定,每次不一樣,但不是憑空假造的資料
      const n = picks.reduce((a, s, i) => a + Math.round(Math.abs(s.nx) * 97) * (i + 1), 0) % 9000 + 1000;
      doneTag = 'PQ-' + n;
      let sx = 0, sy = 0;
      picks.forEach((s) => { const q = starPos(s); sx += q.x; sy += q.y; });
      doneAtXY = { x: sx / picks.length, y: sy / picks.length };
      lens.hold = 0;                                 // 完成的瞬間收掉目鏡圈,舞台讓給完成標記
      if (!reduced) bursts.push({ x: doneAtXY.x, y: doneAtXY.y, t0: nowT });
      if (live && TXT.done) live.textContent = TXT.done + ' ' + doneTag;
    }
  }

  // 手機在 hero 上往下滑會先觸發 pointerdown。用「按下與放開的位移」判斷是點擊還是捲動,
  // 否則每次捲過開場都會莫名點亮一顆星。
  let down = null;
  const local = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const onDown = (e) => { down = { x: e.clientX, y: e.clientY, t: e.timeStamp }; };
  const onUp = (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const held = e.timeStamp - down.t;
    down = null;
    if (moved > 12 || held > 600) return;            // 滑動或長按 → 不算觀測
    const p = local(e);
    observe(p.x, p.y);
  };
  const onCancel = () => { down = null; };
  const onMove = (e) => {
    if (!hoverable) return;
    const p = local(e);
    lens.tx = p.x; lens.ty = p.y;
    if (!lens.on) { lens.x = p.x; lens.y = p.y; }
    lens.want = 1;
    par.tx = (p.x / W - 0.5) * 2;
    par.ty = (p.y / H - 0.5) * 2;
    dirty = true;
  };
  const onLeave = () => { lens.want = 0; par.tx = 0; par.ty = 0; dirty = true; };
  // 鍵盤操作:Enter / Space 隨機觀測一顆,鍵盤使用者也玩得到
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    e.preventDefault();
    // 只挑「現在真的在天上」的星:用 ny 判斷會在天球轉過之後選到已經沉到地平線下的星
    const free = layers[1].stars.filter((s) => {
      if (s.want) return false;
      const q = starPos(s);
      return q.x > 8 && q.x < W - 8 && q.y > 12 && q.y < H - groundY(q.x) - 24;
    });
    if (!free.length) return;
    const s = free[(Math.random() * free.length) | 0];
    const p = starPos(s);
    lens.tx = p.x; lens.ty = p.y; lens.hold = performance.now() + 2000;
    if (hoverable) { lens.want = 1; setTimeout(() => { lens.want = 0; dirty = true; }, 1800); }
    observe(p.x, p.y);
  };
  const onBlur = () => { if (hoverable) { lens.want = 0; dirty = true; } };

  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onCancel);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerleave', onLeave);
  cv.addEventListener('keydown', onKey);
  cv.addEventListener('blur', onBlur);
  ctx.add(() => {
    cv.removeEventListener('pointerdown', onDown);
    cv.removeEventListener('pointerup', onUp);
    cv.removeEventListener('pointercancel', onCancel);
    cv.removeEventListener('pointermove', onMove);
    cv.removeEventListener('pointerleave', onLeave);
    cv.removeEventListener('keydown', onKey);
    cv.removeEventListener('blur', onBlur);
  });

  // resize:用 ResizeObserver 盯容器,手機網址列收合造成的高度變化也接得到
  let rt = 0;
  const relayout = () => { clearTimeout(rt); rt = setTimeout(layout, 140); };
  const ro = ('ResizeObserver' in window) ? new ResizeObserver(relayout) : null;
  if (ro) ro.observe(root); else window.addEventListener('resize', relayout);
  ctx.add(() => { clearTimeout(rt); if (ro) ro.disconnect(); else window.removeEventListener('resize', relayout); });

  // 離開視窗就不畫(捲到下面看文章時不該還在燒效能)
  ctx.io(root, (es) => { visible = es[0].isIntersecting; if (visible) dirty = true; }, { rootMargin: '80px' });

  layout();
  ctx.onFrame(frame);
  frame(performance.now());

  const hint = root.querySelector('[data-sky-hint]');
  if (hint && TXT.hint) hint.textContent = TXT.hint;

  return () => ctx.destroy();
}
