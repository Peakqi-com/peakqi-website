// /blog 觀點頁開場:滿版天文觀測台。整段是自走的時間軸動畫,不吃捲動(捲動驅動留給品牌頁)。
//
// 圖層(由後往前):
//   1 靜態天幕   夜空漸層 + 銀河帶            → 離屏預繪,每幀一次 blit
//   2 星雲       程序化 value-noise + fbm     → 離屏預繪兩張低解析雜訊,每幀只位移/呼吸
//   3 大氣輝光   地平線上的輝光帶,色相隨時間慢慢在暖橘與青綠之間走
//   4/5/7 星場   遠 / 中 / 近三層。天球「不」整體轉動 —— 每顆星有自己的呼吸、自己的游移軌跡、
//                自己的色溫與星芒長度,少數星偶爾爆閃。畫面是活的,但看不出整片往同一個方向走。
//   6 行星       環系行星 + 兩顆衛星沿橢圓軌道公轉(軌道線可見)
//   8 演出       三段各 15 秒的自走演出(流星雨 / 獵戶座 / 峰),之間留安靜間隔;互動一來就退場
//   9 流星       偶發,含頭部光暈與拖尾(演出進行中讓位,不搶戲)
//  10 觀測紀錄   已完成的星座留下淡淡殘影,最多疊 5 組,右側有編號讀數
//  11 當前星座   點擊連成的線 + 每顆星的觀測環
//  12 完成儀式   光暈擴散雙環 + 座標讀數 + 編號標記
//  13 靜態地面   雙層山稜 + 觀測站圓頂剪影   → 離屏預繪(只有底部一條帶),蓋住地平線下的星
//  14 觀測者     三腳架 / 赤道儀 / 主鏡 + 尋星鏡 / 目鏡,鏡筒轉向最新觀測目標(或當下的演出)
//  15 目鏡視野圈 指標靠近時出現的放大圈:圈內是更密的暗星 + 刻度環 + 十字絲 + 赤經赤緯讀數
//
// 互動:點畫面任一處 → 就近的星星被「觀測」到,依序連成星座;附近沒有星星就當場發現一顆。
//       連滿 STAR_GOAL 顆完成一次觀測,標記編號後歸檔進觀測紀錄。
//       桌機游標會帶著目鏡視野圈跑並輕微視差;手機輕點後視野圈停留兩秒。
//       演出期間互動完全不被鎖住 —— 點下去就讓演出淡出,舞台立刻還給使用者。
// 動畫全部掛在 motion-kit 的共用 rAF 上(整頁只有一個迴圈);離開視窗時自動停止繪製。
// prefers-reduced-motion:不跑演出、不做任何持續動態(連游移與閃爍都關掉),
//                        只有互動後重畫一次,點擊功能完整保留。
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
// 星等色溫:多數偏白,少數藍白與橙黃 —— 純白星場看起來像雜訊,有色溫才像天空。
// 存成數值三元組:每顆星在自己的兩個端點之間慢慢來回,色溫才會「各自」變化。
const SPECTRA = [
  [242, 239, 232], [242, 239, 232], [242, 239, 232],
  [198, 214, 245], [255, 223, 182], [214, 228, 255]
];
const FAR_A = [0.055, 0.1, 0.155, 0.225, 0.31];   // 遠層星星的透明度分桶(批次填色用)

// 每顆星的個別游移:半幅(px)與週期(ms),依層而異 —— 近層走得多一點,遠層幾乎只是呼吸。
// 幅度刻意壓在個位數:這是「星星自己在動」,不是鏡頭在推。
const DRIFT = [[0.4, 1.5], [0.8, 2.6], [1.3, 4.2]];
const DPER = [[16000, 52000], [12000, 40000], [9000, 31000]];
const FLARE_W = 0.035;                     // 爆閃佔自己週期的比例(週期 17–52 秒 → 亮 0.6–1.8 秒)

// ── 演出 ──────────────────────────────────────────────────
const SHOW_MS = 15000;                     // 每段演出長度
const SHOW_FADE = 760;                     // 被互動打斷時的退場時間
const SHOW_GAP = [22000, 34000];           // 兩段之間的安靜間隔
const SHOW_IDLE = 6500;                    // 最後一次互動之後要安靜多久才開演
const SHOW_FIRST = 9000;                   // 進場後先讓使用者自己看一段時間

// 獵戶座:比例取自真實星圖。用等比方框塞進當下的可用天區,所以任何寬高下都是同一個形狀。
// [id, x, y, 亮度, 色]
const ORION = [
  ['bet', 0.20, 0.140, 1.00, [255, 176, 122]],   // 參宿四 Betelgeuse:橙紅超巨星
  ['bel', 0.74, 0.200, 0.72, [206, 222, 255]],   // 參宿五 Bellatrix
  ['alt', 0.34, 0.500, 0.82, [226, 234, 255]],   // 腰帶 Alnitak
  ['aln', 0.47, 0.520, 0.88, [232, 238, 255]],   // 腰帶 Alnilam
  ['min', 0.60, 0.545, 0.80, [222, 232, 255]],   // 腰帶 Mintaka
  ['sai', 0.26, 0.900, 0.68, [216, 228, 255]],   // 參宿六 Saiph
  ['rig', 0.80, 0.860, 1.00, [206, 224, 255]],   // 參宿七 Rigel:藍白
  ['mei', 0.46, 0.015, 0.40, [228, 232, 244]],   // 頭 Meissa
  ['sw1', 0.445, 0.665, 0.30, [255, 206, 208]],  // 劍(獵戶座大星雲就掛在這)
  ['sw2', 0.435, 0.760, 0.26, [255, 198, 202]]
];
const ORION_ORDER = ['alt', 'aln', 'min', 'bet', 'rig', 'bel', 'sai', 'mei', 'sw1', 'sw2'];
const ORION_LINK = [
  ['alt', 'aln'], ['aln', 'min'],            // 腰帶三星先連 —— 全天最好認的一段
  ['bet', 'alt'], ['bel', 'min'],
  ['alt', 'sai'], ['min', 'rig'],
  ['bet', 'bel'],
  ['aln', 'sw1'], ['sw1', 'sw2'],
  ['mei', 'bet'], ['mei', 'bel']
];
// 彩蛋的稜線:一條有肩有峰的山形(index 3 是主峰)。PeakQi 的「峰」。
const PEAK_PATH = [[0.02, 1.00], [0.22, 0.58], [0.34, 0.72], [0.52, 0.06], [0.70, 0.60], [0.82, 0.48], [0.98, 1.00]];
const PEAK_TOP = 3;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (k, a, b) => clamp01((k - a) / (b - a));
const ez = (t) => t * t * (3 - 2 * t);

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
    log: root.getAttribute('data-log') || '',
    orion: root.getAttribute('data-orion') || '',
    peak: root.getAttribute('data-peak') || '',
    conds: (root.getAttribute('data-conds') || '').split('|')
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
  let doneAt = 0, doneTag = '', doneAtXY = null, nextShot = 3200, visible = true;
  let bgSky = null, bgGround = null, groundH = 0, neb = [], nebSrc = null;
  let dirty = true;                                 // reduced 模式下只有髒了才重畫
  let T = 0;                                        // 當前幀時間:所有「各自動起來」的唯一時基

  // 演出狀態。全部集中在這裡,收場時一次清乾淨,不會有殘留。
  let show = null, showNext = 0, showSeq = 0, lastInput = 0;
  let rain = [], rainCfg = null, orion = null, peak = null;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const p2 = (n) => (n < 10 ? '0' : '') + n;

  // ── 程序化雜訊:value noise + fbm,預繪成一張小圖,放大後就是柔邊星雲 ──
  function noiseCanvas(w, h, rgb, seedN, scale, oct, cut) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const b = c.getContext('2d');
    const im = b.createImageData(w, h);
    const d = im.data;
    const hashAt = (x, y) => {
      let n = (x * 374761393 + y * 668265263 + seedN * 1274126177) | 0;
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

    // 極點只剩下「赤經赤緯讀數」在用:星星不再繞它轉,但座標系統還是要有個原點才算得出來
    pole = { x: W * 0.74, y: H * 1.55 };
    lens.r = small ? 58 : mobile ? 68 : 96;

    // 望遠鏡站位:桌機靠右(文案佔左下),手機偏右下(文案在上方)
    scope.x = mobile ? W * 0.68 : W * 0.795;
    scope.y = H - groundY(scope.x) + (mobile ? 4 : 6);
    scope.s = mobile ? Math.min(1.28, Math.max(0.78, H / 560)) : Math.min(1.95, Math.max(1.1, H / 500));
    scope.pivot = 30 * scope.s;                      // 雲台高度:鏡筒繞這個點轉,對準角度也從這裡算

    if (!layers.length) seed();
    // 星位以「畫面比例」儲存,resize 之後 posX/posY 直接算得出新座標,不需要重新投影。
    // 正在演的那段和畫面尺寸綁在一起,重算版面等於重排舞台 —— 直接收掉比較乾淨。
    if (show) endShow(performance.now());
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

  // 三層的視差位移量(px)
  // 指標視差已移除:它會讓三層星場整批往同一方向平移(實測滑鼠橫移一次,92 顆星
  //   位移約 20px、方向一致度 R = 1.000)—— 那正是使用者說的「整塊移動」。
  //   深度感改由每顆星自己的振幅/頻率/相位、以及分層的亮度與星芒差異來表現。
  //   目鏡視野圈仍然跟著指標走,所以「畫面會回應你」這件事沒有消失。
  // 位置的唯一來源:版面基準 + 這顆星自己的游移 + 指標視差。
  // 觀測環、星座線、目鏡圈裡的放大星、演出取的星全部走這兩支 —— 少走一支就會錯開十幾 px。
  // 沒有任何全域轉角:每顆星的 dfx/dfy/dpx/dpy 都是獨立亂數,合起來不構成任何一致方向的位移。
  const posX = (s) => s.nx * W + s.dax * Math.sin(T * s.dfx + s.dpx);
  const posY = (s) => s.ny * H + s.day * Math.sin(T * s.dfy + s.dpy);
  const starPos = (s) => ({ x: posX(s), y: posY(s) });

  // 星星的垂直分佈要跟著遮罩走:桌機的遮罩只吃左下角,星場往上堆才會落在開闊處;
  // 手機的遮罩由上而下吃到 68%,再往上堆就等於把星星藏在黑布後面,所以整片下移。
  function mkStar(loMag, hiMag, tier) {
    const t = tier | 0;
    const amp = DRIFT[t], per = DPER[t];
    const ci = (Math.random() * SPECTRA.length) | 0;
    const cj = (ci + 1 + ((Math.random() * (SPECTRA.length - 1)) | 0)) % SPECTRA.length;
    const s = {
      nx: Math.random(),
      ny: mobile
        ? 0.2 + Math.pow(Math.random(), 0.9) * 0.64
        : Math.pow(Math.random(), 1.32) * 0.86,
      mag: loMag + Math.pow(Math.random(), 1.8) * (hiMag - loMag),
      lr: t,
      // 明暗分兩個獨立諧波:慢的是呼吸,快的是大氣閃爍,相位與頻率都各自亂數
      tw: rnd(0, TAU), tws: rnd(0.5, 1.9),
      tw2: rnd(0, TAU), tws2: rnd(2.6, 6.4), tw2a: rnd(0.04, 0.2),
      // 星芒長度自己伸縮的週期
      spf: TAU / rnd(6500, 21000), spp: rnd(0, TAU),
      // 個別游移:x/y 各自的幅度、頻率與相位 → 每顆星走自己的橢圓,方向彼此無關
      dax: reduced ? 0 : rnd(amp[0], amp[1]),
      day: reduced ? 0 : rnd(amp[0], amp[1]),
      dfx: TAU / rnd(per[0], per[1]), dfy: TAU / rnd(per[0], per[1]),
      dpx: rnd(0, TAU), dpy: rnd(0, TAU),
      // 色溫:在自己的兩個端點之間慢慢來回(26–74 秒一趟)
      c1: SPECTRA[ci], c2: SPECTRA[cj], cf: TAU / rnd(26000, 74000), cp: rnd(0, TAU),
      fp: 0, fo: 0,
      lit: 0, want: false
    };
    // 爆閃:只有少數星有 —— 全部都閃就變成雜訊,偶爾一顆才會讓人回頭看
    if (!reduced && t > 0 && Math.random() < (t === 2 ? 0.34 : 0.12)) {
      s.fp = rnd(17000, 52000);
      s.fo = rnd(0, s.fp);
    }
    return s;
  }

  function seed() {
    const q = small ? 0.5 : mobile ? 0.62 : 1;       // 手機降粒子數
    const mk = (n, lo, hi, tier) => {
      const L = { stars: [], tier, buk: [[], [], [], [], []] };
      for (let i = 0; i < n; i++) L.stars.push(mkStar(lo, hi, tier));
      return L;
    };
    layers = [
      mk(Math.round(210 * q), 0, 0.34, 0),            // 遠:密、暗
      mk(Math.round(92 * q), 0.16, 0.82, 1),          // 中:主要可觀測的星
      mk(Math.round(22 * q), 0.62, 1, 2)              // 近:亮星,有繞射星芒
    ];
    deep = [];
    const dn = Math.round(360 * q);                   // 只在目鏡圈裡看得到的暗星
    for (let i = 0; i < dn; i++) deep.push(mkStar(0, 0.42, 1));

    planet = {
      nx: rnd(0.26, 0.6), ny: mobile ? rnd(0.42, 0.58) : rnd(0.16, 0.34),
      rad: mobile ? 8.5 : 13, tilt: rnd(-0.5, -0.24), lr: 1,
      // 行星也有自己極慢的游移,不然它會是畫面裡唯一釘死的東西
      dax: reduced ? 0 : 0.9, day: reduced ? 0 : 0.7,
      dfx: TAU / 47000, dfy: TAU / 61000, dpx: rnd(0, TAU), dpy: rnd(0, TAU),
      moons: [
        { d: mobile ? 22 : 34, sp: 0.00021, ph: rnd(0, TAU), r: mobile ? 1.7 : 2.3, sq: 0.34 },
        { d: mobile ? 34 : 52, sp: -0.000128, ph: rnd(0, TAU), r: mobile ? 1.3 : 1.8, sq: 0.5 }
      ]
    };
  }

  // 爆閃:用「自己的週期取餘數」算,不留狀態 —— 演出被打斷、頁面切走再回來都不會卡在半亮
  function flareOf(s) {
    if (!s.fp || reduced) return 0;
    const u = ((T + s.fo) % s.fp) / s.fp;
    if (u > FLARE_W) return 0;
    const k = u / FLARE_W;
    return k < 0.16 ? k / 0.16 : Math.pow(1 - (k - 0.16) / 0.84, 2.2);
  }

  // 明暗:慢呼吸 × 快閃爍,再加上爆閃
  function twinkleOf(s) {
    if (reduced) return 1;
    return (0.72 + 0.28 * Math.sin(T * 0.0016 * s.tws + s.tw))
      * (1 + s.tw2a * Math.sin(T * 0.0016 * s.tws2 + s.tw2))
      + flareOf(s) * 1.6;
  }

  // 色溫:每顆星在自己的兩個端點之間走,最多走 62% —— 再多就變成閃色燈。
  // 一趟要 26–74 秒,所以沒必要每幀重算:每 120ms 更新一次,肉眼完全分不出來,
  // 但省掉每幀上百次字串組裝(以及它帶來的 GC 壓力)。
  function starCol(s) {
    if (s._cs !== undefined && (reduced || T - s._ct < 120)) return s._cs;
    const a = s.c1, b = s.c2;
    const k = reduced ? 0 : (0.5 + 0.5 * Math.sin(T * s.cf + s.cp)) * 0.62;
    s._ct = T;
    s._cs = ((a[0] + (b[0] - a[0]) * k) | 0) + ',' + ((a[1] + (b[1] - a[1]) * k) | 0) + ',' + ((a[2] + (b[2] - a[2]) * k) | 0);
    return s._cs;
  }

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
    for (let i = 0; i < (mobile ? 90 : 190); i++) {   // 銀河裡的細塵埃:預繪,不參與任何動態
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
      { c: nebSrc[0], a: 0.68, bs: 0.000063, ph: 0, dx: -0.06, dy: -0.02 },      // 約 100 秒一次濃淡
      { c: nebSrc[1], a: 0.42, bs: 0.000047, ph: 2.1, dx: 0.1, dy: -0.08 }       // 約 134 秒,相位錯開
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
  function drawAirglow() {
    const t = reduced ? 0.35 : (Math.sin(T * 0.000037) * 0.5 + 0.5);
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

  // 星雲位置是釘死的:以前它每分鐘會橫移七、八十 px,那正是「整片天空在往同一個方向走」的來源之一。
  // 現在只留兩層各自的濃淡呼吸(週期不同、相位不同)—— 位移為零,但雲氣的厚薄還是一直在變。
  function drawNebula() {
    const t = reduced ? 0 : T;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < neb.length; i++) {
      const n = neb[i];
      g.globalAlpha = n.a * (reduced ? 0.9 : (0.78 + 0.22 * Math.sin(t * n.bs + n.ph)));
      g.drawImage(n.c, -W * 0.22 + n.dx * W, -H * 0.22 + n.dy * H, W * 1.44, H * 1.44);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  // ── 星場 ────────────────────────────────────────────────
  function drawFar(L) {
    const buk = L.buk;
    for (let b = 0; b < 5; b++) buk[b].length = 0;
    for (let i = 0; i < L.stars.length; i++) {
      const s = L.stars[i];
      const x = posX(s), y = posY(s);
      if (y > H - groundY(x) + 2 || y < -4 || x < -4 || x > W + 4) continue;
      const tw = twinkleOf(s);
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

  function drawStar(s, x, y, tier) {
    const fl = flareOf(s);
    const tw = Math.min(2.6, twinkleOf(s));
    const col = starCol(s);
    const rad = (tier === 2 ? 1.15 : 0.6) + s.mag * (tier === 2 ? 1.5 : 1.35) + fl * 1.2;
    if (s.lit > 0) {                                 // 被觀測到的星:橘色光暈
      const R = 15 + s.lit * 14;
      const gl = g.createRadialGradient(x, y, 0, x, y, R);
      gl.addColorStop(0, `rgba(${ORANGE},${0.46 * s.lit})`);
      gl.addColorStop(1, `rgba(${ORANGE},0)`);
      g.fillStyle = gl;
      g.beginPath();
      g.arc(x, y, R, 0, TAU);
      g.fill();
    } else if (tier === 2 || s.mag > 0.72 || fl > 0.02) {   // 亮星的柔光暈(爆閃時暗星也會短暫長出來)
      const R = (4 + s.mag * (tier === 2 ? 13 : 7)) * (1 + fl * 1.3);
      const gl = g.createRadialGradient(x, y, 0, x, y, R);
      gl.addColorStop(0, `rgba(${col},${Math.min(0.95, (0.16 + s.mag * 0.2) * tw)})`);
      gl.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gl;
      g.beginPath();
      g.arc(x, y, R, 0, TAU);
      g.fill();
    }
    if (tier === 2 || fl > 0.06) {                   // 繞射十字星芒:長度隨自己的週期伸縮,爆閃時再抽長
      const sk = reduced ? 0.9 : 0.78 + 0.22 * Math.sin(T * s.spf + s.spp);
      const len = Math.min(74, (7 + s.mag * 26) * (tier === 2 ? tw * sk : 0.6 + fl * 1.4));
      const a1 = Math.min(0.9, (0.1 + s.mag * 0.26) * (tier === 2 ? tw : fl * 1.6));
      g.strokeStyle = `rgba(${col},${a1.toFixed(3)})`;
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(x - len, y); g.lineTo(x + len, y);
      g.moveTo(x, y - len * 0.82); g.lineTo(x, y + len * 0.82);
      g.stroke();
      if (s.mag > 0.86 || fl > 0.4) {                // 最亮的幾顆再加一組 45° 短芒
        const d = len * 0.34;
        g.strokeStyle = `rgba(${col},${(a1 * 0.5).toFixed(3)})`;
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
      : `rgba(${col},${Math.min(1, (0.3 + s.mag * 0.66) * tw).toFixed(3)})`;
    g.fill();
  }

  function drawLayer(L) {
    for (let i = 0; i < L.stars.length; i++) {
      const s = L.stars[i];
      const x = posX(s), y = posY(s);
      if (y > H - groundY(x) + 4 || y < -30 || x < -30 || x > W + 30) continue;
      drawStar(s, x, y, L.tier);
    }
  }

  // ── 行星:環系 + 兩顆衛星沿橢圓軌道公轉 ──────────────────
  function drawPlanet() {
    if (!planet) return;
    const p = starPos(planet);
    if (p.y > H - groundY(p.x) + 40 || p.x < -60 || p.x > W + 60) return;
    paintPlanet(p.x, p.y, planet.rad);
  }

  function paintPlanet(x, y, R) {
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
    const mAng = (m) => m.ph + (reduced ? 0 : T * m.sp);
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

  // ── 三段演出 ────────────────────────────────────────────
  // 共同規則:每段都有「起—中—收」,收完把自己的狀態清空;
  //           全段乘上 show.a,被互動打斷時 show.a 在 SHOW_FADE 內歸零 → 一定乾淨退場。

  function startShow(i, now) {
    show = { i, t0: now, out: 0, a: 1 };
    rain = []; orion = null; peak = null; rainCfg = null;
    if (i === 0) startRain(now);
    else if (i === 1) startOrion();
    else startPeak();
    nextShot = now + SHOW_MS + rnd(2500, 6000);      // 演出期間環境流星讓位
  }

  function endShow(now) {
    show = null;
    rain = []; rainCfg = null; orion = null; peak = null;
    showNext = now + rnd(SHOW_GAP[0], SHOW_GAP[1]);
  }

  // 演出 1 ── 流星雨。節奏:留白 → 先導一顆 → 慢慢密起來 → 退潮 → 最後一顆長軌跡收尾。
  function startRain(now) {
    rainCfg = {
      rx: mobile ? W * 0.66 : W * 0.72,
      ry: mobile ? H * 0.30 : H * 0.11,
      acc: 0, last: now, cap: mobile ? 5 : 9, peak: mobile ? 1.7 : 2.7,
      herald: false, finale: false
    };
  }

  function spawnMeteor(now, kind) {
    if (!rainCfg || rain.length >= rainCfg.cap) return;
    const big = kind !== 'rain';
    const a = rnd(0.34, 1.06) * Math.PI;             // 從輻射點往下、往左散開
    const off = kind === 'herald' ? rnd(40, 90) : rnd(24, 150);
    rain.push({
      x: rainCfg.rx + Math.cos(a) * off,
      y: rainCfg.ry + Math.sin(a) * off,
      a, t0: now,
      life: kind === 'finale' ? 3000 : kind === 'herald' ? 2300 : rnd(1300, 2200),
      run: kind === 'finale' ? 520 : kind === 'herald' ? 420 : rnd(190, 400),
      len: big ? rnd(150, 230) : rnd(78, 168),
      w: big ? 1.9 : rnd(0.7, 1.35),
      warm: kind === 'finale' || Math.random() < 0.22,
      peakA: kind === 'finale' ? 0.9 : big ? 0.82 : rnd(0.42, 0.86)
    });
  }

  function paintMeteor(m, now, A) {
    const k = (now - m.t0) / m.life;
    if (k < 0 || k > 1) return;
    const dx = Math.cos(m.a), dy = Math.sin(m.a);
    const hx = m.x + dx * m.run * ez(k), hy = m.y + dy * m.run * ez(k);
    if (hy > H - groundY(hx) + 10) return;
    const a = Math.sin(Math.PI * k) * m.peakA * A;
    if (a < 0.004) return;
    const len = m.len * (0.45 + 0.55 * Math.sin(Math.PI * k));
    const lg = g.createLinearGradient(hx, hy, hx - dx * len, hy - dy * len);
    lg.addColorStop(0, `rgba(${CREAM},${a.toFixed(3)})`);
    lg.addColorStop(0.34, `rgba(${m.warm ? ORANGE : CREAM},${(a * 0.4).toFixed(3)})`);
    lg.addColorStop(1, `rgba(${CREAM},0)`);
    g.strokeStyle = lg;
    g.lineWidth = m.w;
    g.beginPath();
    g.moveTo(hx, hy);
    g.lineTo(hx - dx * len, hy - dy * len);
    g.stroke();
    const hr = 2.6 + m.w * 2.4;
    const hg = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
    hg.addColorStop(0, `rgba(${CREAM},${a.toFixed(3)})`);
    hg.addColorStop(1, `rgba(${CREAM},0)`);
    g.fillStyle = hg;
    g.beginPath();
    g.arc(hx, hy, hr, 0, TAU);
    g.fill();
  }

  function showRain(k, now, A) {
    const c = rainCfg;
    if (!c) return;
    const dt = Math.min(120, Math.max(0, now - c.last));
    c.last = now;
    // 節奏包絡:0.14 之前完全留白,0.48 到頂,0.82 收乾淨
    const env = Math.sin(Math.PI * clamp01((k - 0.14) / 0.68));
    if (!c.herald && k > 0.045) { c.herald = true; spawnMeteor(now, 'herald'); }
    if (k > 0.14 && k < 0.82) {
      c.acc += dt * 0.001 * c.peak * env;
      while (c.acc >= 1) { c.acc -= 1; spawnMeteor(now, 'rain'); }
    }
    if (!c.finale && k > 0.845) { c.finale = true; spawnMeteor(now, 'finale'); }

    // 輻射點:一圈很淡的暈,只是暗示「它們都是從這裡來的」
    const ha = (0.05 + env * 0.07) * A * (1 - seg(k, 0.86, 1));
    if (ha > 0.004) {
      const R = mobile ? 74 : 122;
      const gl = g.createRadialGradient(c.rx, c.ry, 0, c.rx, c.ry, R);
      gl.addColorStop(0, `rgba(${CREAM},${ha.toFixed(3)})`);
      gl.addColorStop(0.55, `rgba(${STEEL},${(ha * 0.4).toFixed(3)})`);
      gl.addColorStop(1, `rgba(${CREAM},0)`);
      g.fillStyle = gl;
      g.beginPath();
      g.arc(c.rx, c.ry, R, 0, TAU);
      g.fill();
    }
    rain = rain.filter((m) => now - m.t0 < m.life);
    for (let i = 0; i < rain.length; i++) paintMeteor(rain[i], now, A);
  }

  // 演出 2 ── 獵戶座。腰帶三星先亮 → 四角與頭 → 連線一筆一筆畫 → 大星雲與名字 → 留白 → 收。
  function startOrion() {
    const skyTop = mobile ? H * 0.54 : H * 0.06;
    const skyBot = H - groundY(W * 0.5) - 14;
    const avail = Math.max(90, skyBot - skyTop);
    const hh = Math.min(avail * (mobile ? 0.9 : 0.62), mobile ? 320 : 400);
    const ww = hh / 1.32;
    const cx = mobile ? W * 0.5 : W * 0.6;
    const cy = mobile ? (skyTop + skyBot) / 2 : skyTop + avail * 0.42;
    const x0 = Math.min(Math.max(cx - ww / 2, 10), Math.max(10, W - ww - 10));
    const y0 = Math.min(Math.max(cy - hh / 2, skyTop), Math.max(skyTop, skyBot - hh));
    const map = {};
    ORION.forEach((o) => { map[o[0]] = { x: x0 + o[1] * ww, y: y0 + o[2] * hh, m: o[3], c: o[4] }; });
    orion = { map, x0, y0, w: ww, h: hh, sc: Math.max(0.5, hh / 360) };
  }

  // 演出用的「圖形星」:和一般星場分開畫,收場時整組消失,不會在星場留下任何殘留
  function figureStar(x, y, r, c, a, spike) {
    const col = c[0] + ',' + c[1] + ',' + c[2];
    const R = r * 4.6;
    const gl = g.createRadialGradient(x, y, 0, x, y, R);
    gl.addColorStop(0, `rgba(${col},${(0.42 * a).toFixed(3)})`);
    gl.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gl;
    g.beginPath();
    g.arc(x, y, R, 0, TAU);
    g.fill();
    if (spike > 0.6) {
      const len = r * 5.2;
      g.strokeStyle = `rgba(${col},${(0.3 * a).toFixed(3)})`;
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(x - len, y); g.lineTo(x + len, y);
      g.moveTo(x, y - len * 0.8); g.lineTo(x, y + len * 0.8);
      g.stroke();
    }
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fillStyle = `rgba(${col},${Math.min(1, 0.95 * a).toFixed(3)})`;
    g.fill();
  }

  function showOrion(k, now, A) {
    const o = orion;
    if (!o) return;
    const fadeAll = 1 - seg(k, 0.90, 1);             // 星最後才收
    const lineFade = 1 - seg(k, 0.865, 0.945);       // 線先收
    const breathe = 1 + 0.06 * Math.sin(now * 0.0011);

    // 連線:11 段依序畫出來(腰帶最先),每段自己走 dash 進度
    g.lineWidth = 1.1;
    for (let i = 0; i < ORION_LINK.length; i++) {
      const t0 = 0.38 + i * 0.019;
      const p = ez(seg(k, t0, t0 + 0.05));
      if (p < 0.004) continue;
      const a = o.map[ORION_LINK[i][0]], b = o.map[ORION_LINK[i][1]];
      g.strokeStyle = `rgba(${STEEL},${(0.34 * p * lineFade * fadeAll * A).toFixed(3)})`;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p);
      g.stroke();
    }

    // 大星雲(M42):掛在劍上的一團暖色柔光,慢慢浮出來
    const na = seg(k, 0.60, 0.73) * (1 - seg(k, 0.88, 0.98)) * A;
    if (na > 0.004) {
      const s1 = o.map.sw1;
      const R = o.h * 0.13;
      const gl = g.createRadialGradient(s1.x, s1.y, 0, s1.x, s1.y, R);
      gl.addColorStop(0, `rgba(255,186,176,${(0.3 * na).toFixed(3)})`);
      gl.addColorStop(0.45, `rgba(198,150,190,${(0.14 * na).toFixed(3)})`);
      gl.addColorStop(1, 'rgba(198,150,190,0)');
      g.fillStyle = gl;
      g.beginPath();
      g.arc(s1.x, s1.y, R, 0, TAU);
      g.fill();
    }

    // 星:腰帶三顆先亮,再四角、頭與劍
    for (let i = 0; i < ORION_ORDER.length; i++) {
      const id = ORION_ORDER[i];
      const t0 = 0.028 + i * 0.032;
      const ap = ez(seg(k, t0, t0 + 0.045)) * fadeAll * A;
      if (ap < 0.004) continue;
      const s = o.map[id];
      figureStar(s.x, s.y, (1.5 + s.m * 2.6) * o.sc * breathe, s.c, ap, s.m);
    }

    // 名字:認出形狀之後才給答案,不搶在前面
    if (TXT.orion) {
      const ta = seg(k, 0.63, 0.71) * (1 - seg(k, 0.88, 0.96)) * A * 0.62;
      if (ta > 0.006) {
        g.font = `600 ${small ? 10 : 11.5}px "Space Grotesk","Noto Sans TC",sans-serif`;
        g.textAlign = 'center';
        const tw = g.measureText(TXT.orion).width;
        const tx = Math.min(Math.max(o.x0 + o.w / 2, tw / 2 + 12), W - tw / 2 - 12);
        const below = o.y0 + o.h + 24 < H - groundY(tx) - 6;
        g.fillStyle = `rgba(${CREAM},${ta.toFixed(3)})`;
        g.fillText(TXT.orion, tx, below ? o.y0 + o.h + 24 : Math.max(16, o.y0 - 14));
        g.textAlign = 'left';
      }
    }
  }

  // 演出 3 ── 彩蛋「峰」。一盞燈從地平線升起,沿著稜線爬到頂,
  //           山形整條亮起,頂點的光化成一顆星併回天空,稜線再由下往上沉掉。
  function startPeak() {
    const ww = Math.min(mobile ? W * 0.8 : W * 0.44, mobile ? 300 : 470);
    const hh = ww * 0.52;
    const cx = mobile ? W * 0.5 : W * 0.56;
    const base = H - groundY(cx) - (mobile ? 18 : 26);
    const x0 = Math.min(Math.max(cx - ww / 2, 8), Math.max(8, W - ww - 8));
    const y0 = Math.max(6, base - hh);
    const pts = PEAK_PATH.map((p) => ({ x: x0 + p[0] * ww, y: y0 + p[1] * hh }));
    const segLen = [];
    let total = 0, toTop = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      segLen.push(d);
      total += d;
      if (i < PEAK_TOP) toTop += d;
    }
    peak = { pts, segLen, total, uTop: total > 0 ? toTop / total : 1, x0, y0, w: ww, h: hh, near: [], dest: null };

    // 沿途會被輕輕點亮的星:離稜線最近的幾顆,各自記下自己在路徑上的位置
    const cand = [];
    for (let li = 1; li < layers.length; li++) {
      const arr = layers[li].stars;
      for (let i = 0; i < arr.length; i++) {
        const s = arr[i];
        const x = posX(s), y = posY(s);
        let bd = 1e9, bu = 0, acc = 0;
        for (let j = 0; j < pts.length - 1; j++) {
          const d = Math.hypot(x - pts[j].x, y - pts[j].y);
          if (d < bd) { bd = d; bu = total > 0 ? acc / total : 0; }
          acc += segLen[j];
        }
        if (bd < 46) cand.push({ s, u: bu, d: bd });
      }
    }
    cand.sort((a, b) => a.d - b.d);
    peak.near = cand.slice(0, 7);

    // 終點:挑一顆現在真的在天上的近層亮星,光飛過去就像「併回星空」
    const free = layers[2].stars.filter((s) => {
      const q = starPos(s);
      return q.x > 30 && q.x < W - 30 && q.y > 24 && q.y < H - groundY(q.x) - 60
        && Math.hypot(q.x - pts[PEAK_TOP].x, q.y - pts[PEAK_TOP].y) > Math.min(W, H) * 0.22;
    });
    peak.dest = free.length ? free[(Math.random() * free.length) | 0] : null;
  }

  // 沿稜線走到 u(0..1,弧長參數)的座標
  function alongPeak(u) {
    const p = peak;
    let d = clamp01(u) * p.total;
    for (let i = 0; i < p.segLen.length; i++) {
      if (d <= p.segLen[i] || i === p.segLen.length - 1) {
        const t = p.segLen[i] > 0 ? Math.min(1, d / p.segLen[i]) : 1;
        const a = p.pts[i], b = p.pts[i + 1];
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      d -= p.segLen[i];
    }
    return p.pts[p.pts.length - 1];
  }

  // 從 uA 描到 uB 的稜線
  function strokePeak(uA, uB) {
    const p = peak;
    const A = alongPeak(uA), B = alongPeak(uB);
    g.beginPath();
    g.moveTo(A.x, A.y);
    let acc = 0;
    for (let i = 0; i < p.segLen.length; i++) {
      acc += p.segLen[i];
      const un = p.total > 0 ? acc / p.total : 1;
      if (un > uA && un < uB) g.lineTo(p.pts[i + 1].x, p.pts[i + 1].y);
    }
    g.lineTo(B.x, B.y);
    g.stroke();
  }

  function showPeak(k, now, A) {
    const p = peak;
    if (!p) return;
    const top = p.pts[PEAK_TOP];
    const ridgeFade = 1 - seg(k, 0.74, 0.90);
    // 1) 起:一盞燈從地平線下方浮起來,慢慢升到稜線起點
    const rise = ez(seg(k, 0, 0.16));
    const climb = ez(seg(k, 0.16, 0.46));
    const uLight = p.uTop * climb;
    const lp = rise < 1
      ? { x: p.pts[0].x, y: p.pts[0].y + 34 * (1 - rise) }
      : alongPeak(uLight);

    // 2) 中:走過的稜線亮起來;過了頂點,右半邊像回音一樣自己描出來
    const echo = ez(seg(k, 0.46, 0.6));
    g.lineWidth = 1.3;
    g.strokeStyle = `rgba(${ORANGE},${(0.54 * rise * ridgeFade * A).toFixed(3)})`;
    if (uLight > 0.002) strokePeak(0, uLight);
    if (echo > 0.002) {
      // 右半邊和左半邊同一個重量,不然山形會一邊實一邊虛
      g.strokeStyle = `rgba(${ORANGE},${(0.54 * echo * ridgeFade * A).toFixed(3)})`;
      strokePeak(p.uTop, p.uTop + (1 - p.uTop) * echo);
    }
    // 整條線再壓一層極淡的寬底,讓山形站得住,不會只是一條細線
    if (climb > 0.02) {
      g.lineWidth = 3.4;
      g.strokeStyle = `rgba(${ORANGE},${(0.09 * climb * ridgeFade * A).toFixed(3)})`;
      strokePeak(0, uLight);
      if (echo > 0.002) strokePeak(p.uTop, p.uTop + (1 - p.uTop) * echo);
      g.lineWidth = 1.3;
    }

    // 沿途被點亮的星:光走過才亮,亮完就一起隨稜線淡掉
    for (let i = 0; i < p.near.length; i++) {
      const n = p.near[i];
      const na = clamp01((uLight - n.u) / 0.06) * ridgeFade * A;
      if (na < 0.01) continue;
      const q = starPos(n.s);
      const R = 9 + na * 7;
      const gl = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, R);
      gl.addColorStop(0, `rgba(${CREAM},${(0.3 * na).toFixed(3)})`);
      gl.addColorStop(1, `rgba(${CREAM},0)`);
      g.fillStyle = gl;
      g.beginPath();
      g.arc(q.x, q.y, R, 0, TAU);
      g.fill();
    }

    // 3) 頂:一圈很輕的光暈擴散(只有一次,不是煙火)
    const flash = seg(k, 0.455, 0.6);
    if (flash > 0.002 && flash < 1) {
      const e = ez(flash);
      g.beginPath();
      g.arc(top.x, top.y, 8 + e * (mobile ? 70 : 108), 0, TAU);
      g.strokeStyle = `rgba(${ORANGE},${(0.34 * (1 - flash) * A).toFixed(3)})`;
      g.lineWidth = 1.4 * (1 - flash) + 0.3;
      g.stroke();
    }

    // 4) 收:頂點的光化成一顆星,飄向天上某顆真的星,再融進去
    const merge = ez(seg(k, 0.6, 0.8));
    const glowA = (rise * (1 - seg(k, 0.86, 1))) * A;
    let gx = lp.x, gy = lp.y;
    if (merge > 0 && p.dest) {
      const q = starPos(p.dest);
      gx = top.x + (q.x - top.x) * merge;
      gy = top.y + (q.y - top.y) * merge;
    } else if (climb >= 1) { gx = top.x; gy = top.y; }
    if (glowA > 0.006) {
      const twk = 1 + 0.35 * Math.sin(now * 0.006) * seg(k, 0.8, 0.88);
      const R = (mobile ? 15 : 21) * (1 - merge * 0.4) * twk;
      const gl = g.createRadialGradient(gx, gy, 0, gx, gy, R);
      gl.addColorStop(0, `rgba(255,196,150,${(0.8 * glowA).toFixed(3)})`);
      gl.addColorStop(0.35, `rgba(${ORANGE},${(0.3 * glowA).toFixed(3)})`);
      gl.addColorStop(1, `rgba(${ORANGE},0)`);
      g.fillStyle = gl;
      g.beginPath();
      g.arc(gx, gy, R, 0, TAU);
      g.fill();
      g.beginPath();
      g.arc(gx, gy, (mobile ? 1.5 : 2) * twk, 0, TAU);
      g.fillStyle = `rgba(${CREAM},${Math.min(1, 0.95 * glowA).toFixed(3)})`;
      g.fill();
    }

    // 5) 署名:小、淡、只停一下下
    if (TXT.peak) {
      const ta = seg(k, 0.5, 0.58) * (1 - seg(k, 0.72, 0.82)) * A * 0.38;
      if (ta > 0.006) {
        g.font = `600 ${small ? 9.5 : 11}px "Space Grotesk","Noto Sans TC",sans-serif`;
        g.textAlign = 'center';
        const tw = g.measureText(TXT.peak).width;
        const tx = Math.min(Math.max(top.x, tw / 2 + 12), W - tw / 2 - 12);
        g.fillStyle = `rgba(${CREAM},${ta.toFixed(3)})`;
        g.fillText(TXT.peak, tx, Math.max(16, top.y - 18));
        g.textAlign = 'left';
      }
    }
  }

  const SHOWS = [showRain, showOrion, showPeak];

  // 演出進行中,鏡筒也跟著看過去 —— 望遠鏡對著空無一物的天空會顯得兩件事沒關係
  function showAim() {
    if (!show) return null;
    if (show.i === 0 && rainCfg) return { x: rainCfg.rx, y: rainCfg.ry };
    if (show.i === 1 && orion) return orion.map.aln;
    if (show.i === 2 && peak) return peak.pts[PEAK_TOP];
    return null;
  }

  function runShow(now) {
    // 排程:使用者安靜、沒有觀測進行中,才輪到演出
    if (!show && now > showNext && now - lastInput > SHOW_IDLE && !picks.length && !doneAt) {
      startShow(showSeq++ % SHOWS.length, now);
    }
    if (!show) return;
    const el = now - show.t0;
    if (show.out) show.a = Math.max(0, 1 - (now - show.out) / SHOW_FADE);
    if (show.a <= 0 || el >= SHOW_MS) { endShow(now); return; }
    SHOWS[show.i](clamp01(el / SHOW_MS), now, show.a);
  }

  // ── 望遠鏡與觀測者 ──────────────────────────────────────
  function drawAstronomer() {
    const s = scope.s;
    const bob = reduced ? 0 : Math.sin(T / 1400) * 1.2;
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
    let a = Math.atan2(dy, dx);
    a = ((a % TAU) + TAU) % TAU;
    const hh = a / TAU * 24;
    const hr = Math.floor(hh), mi = Math.floor((hh - hr) * 60);
    const rmax = Math.hypot(Math.max(pole.x, W - pole.x), pole.y) || 1;
    const dec = 90 - Math.min(1, Math.hypot(dx, dy) / rmax) * 118;
    const sg = dec < 0 ? '-' : '+';
    const ad = Math.abs(dec), dd = Math.floor(ad), dm = Math.floor((ad - dd) * 60);
    return ['RA ' + p2(hr) + 'h ' + p2(mi) + 'm', 'DEC ' + sg + p2(dd) + '° ' + p2(dm) + "'"];
  }

  function drawLens() {
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
        const x = posX(s), y = posY(s);
        if (Math.abs(x - lx) > reach || Math.abs(y - ly) > reach) continue;
        if (y > H - groundY(x) + 4) continue;
        const mx = lx + (x - lx) * M, my = ly + (y - ly) * M;
        if (tier === 0) {
          g.fillStyle = `rgba(${starCol(s)},${(0.24 + s.mag * 0.6).toFixed(3)})`;
          g.beginPath();
          g.arc(mx, my, 0.5 + s.mag * 1.5, 0, TAU);
          g.fill();
        } else {
          drawStar(s, mx, my, tier === 2 ? 2 : 1);
        }
      }
    };
    push(deep, 0);
    push(layers[1].stars, 1);
    push(layers[2].stars, 2);
    if (planet) {                                    // 行星也要跟著放大,否則游標蓋上去它會憑空消失
      const pp = starPos(planet);
      if (Math.abs(pp.x - lx) < reach + planet.rad * 2.2 && Math.abs(pp.y - ly) < reach + planet.rad * 2.2) {
        paintPlanet(lx + (pp.x - lx) * M, ly + (pp.y - ly) * M, planet.rad * 1.9);
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

  // ── 天象 ────────────────────────────────────────────────
  // 使用者回饋:「每次用互動都一樣,只是排列位置不同」。所以差異必須做到
  // 「今晚的天空長什麼樣」這個等級,而且要讓人看得出來換了 —— 因此有名字標籤。
  // 進站隨機抽一種;每完成一次觀測就換下一種(互動要有看得見的後果)。
  // 大氣類是持續的;天體類是週期性掠過,切換後 2.5~5 秒內先來一次,不用等。
  const CONDS = [
    { id: 'aurora', front: true }, { id: 'shimmer', front: true },
    { id: 'galaxy', front: false }, { id: 'clouds', front: true },
    { id: 'moon', front: false }, { id: 'station', front: true },
    { id: 'saucer', front: true }, { id: 'comet', front: true }
  ];
  let condI = (Math.random() * CONDS.length) | 0;
  let condT0 = 0, condIn = 0, passT0 = -1, passGap = 0;
  let shimCv = null, shimIm = null, condErr = null;

  function setCond(i, now) {
    condI = ((i | 0) % CONDS.length + CONDS.length) % CONDS.length;
    condT0 = now; condIn = 0;
    passT0 = now + rnd(2500, 5000);                  // 天體類:切換後很快先來一次
    passGap = rnd(17000, 26000);
    const el = root.querySelector('[data-sky-cond]');
    if (el) el.textContent = (TXT.conds[condI] || '');
    dirty = true;
  }

  // 天體掠過的進度:0 → 1 走完一趟,不在趟中就回傳 -1
  function passK(now, dur) {
    if (passT0 < 0) return -1;
    const k = (now - passT0) / dur;
    if (k < 0) return -1;
    if (k > 1) { passT0 = now + passGap; return -1; }
    return k;
  }

  // 極光:三道光簾,上下緣各自起伏。用 lighter 疊加,所以星星仍然透得出來。
  function condAurora(now, a) {
    const n = mobile ? 2 : 3;
    g.globalCompositeOperation = 'lighter';
    for (let c = 0; c < n; c++) {
      const baseY = H * (0.13 + c * 0.09);
      const hgt = H * (0.30 + c * 0.05);
      const sp = 0.000105 + c * 0.000035;
      const amp = H * (0.045 + c * 0.018);
      const step = mobile ? 18 : 12;
      g.beginPath();
      g.moveTo(0, baseY);
      for (let x = 0; x <= W; x += step) {
        g.lineTo(x, baseY + Math.sin(x * 0.0042 + now * sp + c * 1.7) * amp
          + Math.sin(x * 0.0113 - now * sp * 1.6) * amp * 0.38);
      }
      for (let x = W; x >= 0; x -= step) {
        g.lineTo(x, baseY + hgt + Math.sin(x * 0.0036 + now * sp * 0.75 + c) * amp * 0.65);
      }
      g.closePath();
      const hue = c === 0 ? '104,222,176' : c === 1 ? '84,192,214' : '146,126,232';
      const lg = g.createLinearGradient(0, baseY - amp, 0, baseY + hgt);
      lg.addColorStop(0, 'rgba(' + hue + ',0)');
      lg.addColorStop(0.3, 'rgba(' + hue + ',' + (0.16 * a).toFixed(3) + ')');
      lg.addColorStop(1, 'rgba(' + hue + ',0)');
      g.fillStyle = lg;
      g.fill();
    }
    // 直立光束:極光的辨識特徵,少量就夠
    const rays = mobile ? 8 : 16;
    for (let i = 0; i < rays; i++) {
      const x = ((i + 0.5) / rays + Math.sin(now * 0.00007 + i) * 0.01) * W;
      const y0 = H * 0.12, y1 = H * (0.4 + 0.14 * Math.sin(i * 2.1 + now * 0.00013));
      const al = (0.05 + 0.05 * Math.sin(now * 0.00042 + i * 1.9)) * a;
      if (al <= 0.004) continue;
      const lg = g.createLinearGradient(0, y0, 0, y1);
      lg.addColorStop(0, 'rgba(150,240,205,0)');
      lg.addColorStop(0.4, 'rgba(150,240,205,' + al.toFixed(3) + ')');
      lg.addColorStop(1, 'rgba(150,240,205,0)');
      g.fillStyle = lg;
      g.fillRect(x - 1.1, y0, 2.2, y1 - y0);
    }
    g.globalCompositeOperation = 'source-over';
  }

  // 波光粼粼:低解析焦散圖每幀重算再放大 blit(112x64 只要幾千次運算)
  function condShimmer(now, a) {
    const w = 112, h = 64;
    if (!shimCv) { shimCv = document.createElement('canvas'); shimCv.width = w; shimCv.height = h; }
    const sg = shimCv.getContext('2d');
    if (!shimIm) shimIm = sg.createImageData(w, h);
    const d = shimIm.data;
    const tt = now * 0.00040;
    for (let y = 0; y < h; y++) {
      const v = y / h * 5.2;
      for (let x = 0; x < w; x++) {
        const u = x / w * 9.4;
        let s = Math.sin(u + tt) + Math.sin(v * 1.31 - tt * 0.83) + Math.sin((u + v) * 0.79 + tt * 0.47);
        s = Math.abs(s) / 3;
        const k = (1 - s); const k7 = k * k * k * k * k * k * k;
        const i = (y * w + x) * 4;
        d[i] = 186; d[i + 1] = 212; d[i + 2] = 255;
        d[i + 3] = (k7 * 190 * a) | 0;
      }
    }
    sg.putImageData(shimIm, 0, 0);
    g.globalCompositeOperation = 'lighter';
    g.drawImage(shimCv, 0, 0, W, H * 0.82);
    g.globalCompositeOperation = 'source-over';
  }

  // 流動銀河:星帶「內部」在流,星星本身不動 —— 和使用者不要的整塊平移是兩回事
  function condGalaxy(now, a) {
    if (!nebSrc || !nebSrc.length) return;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.translate(W * 0.5, H * 0.38);
    g.rotate(-0.42);
    const bw = W * 1.7, bh = H * 0.34;
    for (let i = 0; i < nebSrc.length; i++) {
      const off = (now * (0.0075 + i * 0.0042)) % bw;
      g.globalAlpha = (0.78 - i * 0.24) * a;
      g.drawImage(nebSrc[i], -bw * 1.5 + off, -bh / 2, bw, bh);
      g.drawImage(nebSrc[i], -bw * 0.5 + off, -bh / 2, bw, bh);
    }
    // 核心亮帶:沒有這條的話只是一片霧,看不出是銀河
    const cg = g.createLinearGradient(0, -bh * 0.5, 0, bh * 0.5);
    cg.addColorStop(0, 'rgba(150,170,214,0)');
    cg.addColorStop(0.5, 'rgba(178,196,238,' + (0.2 * a).toFixed(3) + ')');
    cg.addColorStop(1, 'rgba(150,170,214,0)');
    g.globalAlpha = 1;
    g.fillStyle = cg;
    g.fillRect(-bw, -bh * 0.5, bw * 2, bh);
    g.restore();
    g.globalCompositeOperation = 'source-over';
  }

  // 雲隙:暗雲飄過遮住星星,縫隙裡星星特別亮。這一種是唯一會「遮」的天象。
  function condClouds(now, a) {
    if (!nebSrc || !nebSrc.length) return;
    g.save();
    g.globalAlpha = 0.5 * a;
    const bw = W * 1.9, bh = H * 0.62;
    for (let i = 0; i < 2; i++) {
      const src = nebSrc[i % nebSrc.length];
      const off = (now * (0.011 + i * 0.007)) % bw;
      const y = H * (0.02 + i * 0.16);
      g.globalAlpha = (0.46 - i * 0.14) * a;
      // 用畫布本身的底色當雲:壓暗而不是加亮
      g.globalCompositeOperation = 'source-over';
      g.filter = 'none';
      g.drawImage(src, -bw + off, y, bw, bh);
      g.drawImage(src, off, y, bw, bh);
    }
    g.globalAlpha = 1;
    g.restore();
  }

  // 月出:弦月從地平線升起,整片天空的光調跟著變
  function condMoon(now, a) {
    const k = clamp01((now - condT0) / 26000);
    const ez2 = k * k * (3 - 2 * k);
    const cx = W * 0.24, cy = H - groundY(cx) - ez2 * H * 0.52;
    const r = Math.min(W, H) * (mobile ? 0.052 : 0.045);
    g.globalCompositeOperation = 'lighter';
    const halo = g.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 9);
    halo.addColorStop(0, 'rgba(236,232,214,' + (0.3 * a * ez2).toFixed(3) + ')');
    halo.addColorStop(1, 'rgba(236,232,214,0)');
    g.fillStyle = halo;
    g.fillRect(cx - r * 9, cy - r * 9, r * 18, r * 18);
    g.globalCompositeOperation = 'source-over';
    g.beginPath(); g.arc(cx, cy, r, 0, TAU);
    g.fillStyle = 'rgba(238,234,218,' + (0.94 * a).toFixed(3) + ')'; g.fill();
    // 用背景色的圓切出弦月
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(cx - r * 0.66, cy - r * 0.26, r * 0.92, 0, TAU); g.fill();
    g.restore();
  }

  // 環形太空站:甜甜圈狀,緩慢自轉,帶航行燈
  function condStation(now, a) {
    const k = passK(now, 26000);
    if (k < 0) return;
    const x = -80 + (W + 160) * k;
    const y = H * (0.2 + 0.06 * Math.sin(k * 3.1));
    const s = mobile ? 1.0 : 1.55;
    const spin = now * 0.00028;
    const fade = Math.sin(Math.PI * clamp01(k * 1.05)) * a;
    g.save(); g.translate(x, y); g.rotate(-0.34);
    g.globalAlpha = fade;
    // 環:用橢圓做出斜視角,自轉靠環上的節點位置表現
    g.beginPath(); g.ellipse(0, 0, 26 * s, 9.5 * s, 0, 0, TAU);
    g.strokeStyle = 'rgba(198,210,232,.85)'; g.lineWidth = 3.4 * s; g.stroke();
    g.beginPath(); g.ellipse(0, 0, 26 * s, 9.5 * s, 0, 0, TAU);
    g.strokeStyle = 'rgba(120,136,164,.9)'; g.lineWidth = 1.2 * s; g.stroke();
    // 中央軸與輻條
    g.beginPath(); g.moveTo(-26 * s, 0); g.lineTo(26 * s, 0);
    g.strokeStyle = 'rgba(160,174,198,.6)'; g.lineWidth = 1.6 * s; g.stroke();
    g.beginPath(); g.arc(0, 0, 5.4 * s, 0, TAU);
    g.fillStyle = 'rgba(214,224,242,.95)'; g.fill();
    // 航行燈:沿環跑,自轉感就是它給的
    for (let i = 0; i < 6; i++) {
      const th = spin + i * (TAU / 6);
      const lx = Math.cos(th) * 26 * s, ly = Math.sin(th) * 9.5 * s;
      const on = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * 0.004 + i));
      g.beginPath(); g.arc(lx, ly, 1.9 * s, 0, TAU);
      g.fillStyle = i % 3 === 0 ? 'rgba(255,107,44,' + on.toFixed(2) + ')' : 'rgba(150,220,255,' + on.toFixed(2) + ')';
      g.fill();
    }
    g.globalAlpha = 1; g.restore();
  }

  // 飛碟掠過:小碟身 + 底部探照燈掃一下
  function condSaucer(now, a) {
    const k = passK(now, 15000);
    if (k < 0) return;
    const ez2 = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const x = W + 60 - (W + 120) * ez2;                        // 由右往左
    const y = H * (0.24 + 0.05 * Math.sin(k * 6.1)) + Math.sin(now * 0.003) * 2;
    const s = mobile ? 0.7 : 1;
    const fade = Math.sin(Math.PI * clamp01(k * 1.06)) * a;
    g.save(); g.translate(x, y); g.globalAlpha = fade;
    // 探照燈:只在中段掃一下
    const beam = Math.max(0, Math.sin((k - 0.3) / 0.4 * Math.PI));
    if (beam > 0.01) {
      const bl = g.createLinearGradient(0, 0, 0, 150 * s);
      bl.addColorStop(0, 'rgba(150,235,255,' + (0.2 * beam).toFixed(3) + ')');
      bl.addColorStop(1, 'rgba(150,235,255,0)');
      g.beginPath(); g.moveTo(-4 * s, 4 * s); g.lineTo(-26 * s, 150 * s);
      g.lineTo(26 * s, 150 * s); g.lineTo(4 * s, 4 * s); g.closePath();
      g.fillStyle = bl; g.fill();
    }
    g.beginPath(); g.ellipse(0, 0, 19 * s, 5.4 * s, 0, 0, TAU);
    g.fillStyle = 'rgba(206,218,238,.92)'; g.fill();
    g.beginPath(); g.ellipse(0, -3.4 * s, 8.6 * s, 5.2 * s, 0, Math.PI, TAU);
    g.fillStyle = 'rgba(150,235,255,.8)'; g.fill();
    for (let i = -2; i <= 2; i++) {
      const on = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(now * 0.006 + i));
      g.beginPath(); g.arc(i * 7 * s, 2.4 * s, 1.5 * s, 0, TAU);
      g.fillStyle = 'rgba(255,107,44,' + on.toFixed(2) + ')'; g.fill();
    }
    g.globalAlpha = 1; g.restore();
  }

  // 彗星:慢速劃過,長離子尾
  function condComet(now, a) {
    const k = passK(now, 21000);
    if (k < 0) return;
    const x = -60 + (W + 120) * k;
    const y = H * 0.1 + (H * 0.3) * k * k;
    const fade = Math.sin(Math.PI * clamp01(k * 1.04)) * a;
    const ang = Math.atan2(H * 0.6 * k / (W + 120) * 2, 1);
    const len = (mobile ? 130 : 220) * (0.6 + 0.4 * Math.sin(Math.PI * k));
    g.save(); g.globalAlpha = fade;
    const tg = g.createLinearGradient(x, y, x - Math.cos(ang) * len, y - Math.sin(ang) * len);
    tg.addColorStop(0, 'rgba(180,225,255,.5)');
    tg.addColorStop(0.5, 'rgba(150,190,255,.14)');
    tg.addColorStop(1, 'rgba(150,190,255,0)');
    g.strokeStyle = tg; g.lineWidth = 3.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y);
    g.lineTo(x - Math.cos(ang) * len, y - Math.sin(ang) * len); g.stroke();
    const hg = g.createRadialGradient(x, y, 0, x, y, 16);
    hg.addColorStop(0, 'rgba(232,244,255,.9)');
    hg.addColorStop(1, 'rgba(232,244,255,0)');
    g.fillStyle = hg; g.beginPath(); g.arc(x, y, 16, 0, TAU); g.fill();
    g.globalAlpha = 1; g.restore();
  }

  const COND_FN = {
    aurora: condAurora, shimmer: condShimmer, galaxy: condGalaxy, clouds: condClouds,
    moon: condMoon, station: condStation, saucer: condSaucer, comet: condComet
  };

  function drawCond(now, front) {
    if (reduced) return;
    const c = CONDS[condI];
    if (!c || !!c.front !== !!front) return;
    condIn = Math.min(1, condIn + 0.012);            // 換天象時淡入,不要硬切
    const fn = COND_FN[c.id];
    if (fn) { try { fn(now, condIn); } catch (e) { condErr = c.id + ": " + (e && (e.message || e)); } }
  }

  function frame(now) {
    if (!visible || !W || !bgSky) return;
    T = now;
    // reduced:不做持續動態。只有互動或完成序列進行中才重畫一次。
    if (reduced && !dirty && !doneAt) return;
    dirty = false;

    if (!reduced) {

    }

    g.drawImage(bgSky, 0, 0, W, H);
    drawNebula();
    drawAirglow();
    drawCond(now, false);
    drawFar(layers[0]);
    drawLayer(layers[1]);
    drawPlanet();
    drawLayer(layers[2]);
    drawCond(now, true);

    if (!reduced) runShow(now);

    // 環境流星:偶發,頭部有光暈,拖尾隨生命週期伸縮。演出進行中不排新的,免得兩件事互相干擾。
    if (!reduced) {
      if (!show && now > nextShot) {
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

    // 鏡筒轉向:有演出就看演出,否則 idle 時緩慢掃過天空
    if (!picks.length && !reduced) {
      const t = showAim();
      scope.aim = t
        ? Math.atan2(t.y - (scope.y - 34 * scope.s), t.x - scope.x)
        : -1.3 + Math.sin(now / 5200) * 0.44;
    }
    scope.ang += (scope.aim - scope.ang) * (reduced ? 1 : 0.055);
    drawAstronomer();

    // 目鏡視野圈
    const want = hoverable ? lens.want : (now < lens.hold ? 1 : 0);
    lens.on += (want - lens.on) * (reduced ? 1 : 0.14);
    if (reduced) lens.on = want;
    lens.x += (lens.tx - lens.x) * (reduced ? 1 : 0.22);
    lens.y += (lens.ty - lens.y) * (reduced ? 1 : 0.22);
    drawLens();

    // 完成後歸檔,重新開始一輪
    if (doneAt && now - doneAt > RESET_MS) {
      logs.push({
        pts: picks.map((s) => ({
          nx: s.nx, ny: s.ny, lr: s.lr,
          dax: s.dax, day: s.day, dfx: s.dfx, dfy: s.dfy, dpx: s.dpx, dpy: s.dpy
        }))
      });
      if (logs.length > LOG_MAX) logs.shift();
      picks.forEach((s) => { s.want = false; s.lit = 0; });
      picks = [];
      doneAt = 0;
      doneAtXY = null;
      scope.aim = -1.3;
      setCond(condI + 1 + ((Math.random() * (CONDS.length - 1)) | 0), now);   // 換一種天象:互動要有看得見的後果
      dirty = true;
    }
  }

  // ── 互動 ────────────────────────────────────────────────
  function observe(cx, cy) {
    if (doneAt) return;                              // 完成動畫播放中,先不接受新的點
    const nowT = performance.now();
    // 互動永遠優先:正在演的那段開始退場(不是硬切),而且點擊本身照常生效
    lastInput = nowT;
    if (show && !show.out) show.out = nowT;
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
      best = mkStar(0.78, 0.86, 1);
      best.nx = cx / W;
      best.ny = cy / H;
      // 相位對齊「被發現的當下」:讓這顆星的游移從 0 開始,不會一出生就跳開幾 px
      best.dpx = -T * best.dfx;
      best.dpy = -T * best.dfy;
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
  // 指標移動只帶動目鏡圈與視差,不算「打斷演出」的互動 ——
  // 游標剛好停在 hero 上就永遠等不到演出,那等於沒做。
  const onMove = (e) => {
    if (!hoverable) return;
    const p = local(e);
    lens.tx = p.x; lens.ty = p.y;
    if (!lens.on) { lens.x = p.x; lens.y = p.y; }
    lens.want = 1;

    dirty = true;
  };
  const onLeave = () => { lens.want = 0; dirty = true; };
  // 鍵盤操作:Enter / Space 隨機觀測一顆,鍵盤使用者也玩得到
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    e.preventDefault();
    // 只挑「現在真的在天上」的星:落到地平線下的不能選
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

  // 離開視窗就不畫(捲到下面看文章時不該還在燒效能)。
  // 回來的時候把下一段演出往後推 —— 一捲回來就開演會像在等你,不像在自己運轉。
  ctx.io(root, (es) => {
    visible = es[0].isIntersecting;
    if (visible) {
      dirty = true;
      showNext = Math.max(showNext, performance.now() + 4000);
    } else if (show) {
      endShow(performance.now());
    }
  }, { rootMargin: '80px' });

  layout();
  setCond(condI, performance.now());        // 進站隨機抽一種天象
  showNext = performance.now() + SHOW_FIRST;
  ctx.onFrame(frame);
  frame(performance.now());

  const hint = root.querySelector('[data-sky-hint]');
  if (hint && TXT.hint) hint.textContent = TXT.hint;

  // 驗收掛勾(與站上其他 hero 同一套慣例):讀取星位、指定播放某一段、停掉排程。
  // 只給 .peakops-audit 的探針用,不改變任何繪製結果。
  window.__pqSky = {
    mode: reduced ? 'reduced' : 'on',
    pos: () => layers[1].stars.map((s) => [+posX(s).toFixed(3), +posY(s).toFixed(3)]),
    state: () => ({
      show: show ? { i: show.i, k: +clamp01((T - show.t0) / SHOW_MS).toFixed(3), a: +show.a.toFixed(3), out: !!show.out } : null,
      rain: rain.length, shots: shots.length, picks: picks.length, logs: logs.length,
      nextIn: Math.round(showNext - T)
    }),
    play: (i) => { if (reduced) return false; startShow(((i | 0) % SHOWS.length + SHOWS.length) % SHOWS.length, performance.now()); return true; },
    hush: () => { if (show) endShow(performance.now()); showNext = Infinity; return true; },
    cond: () => CONDS[condI].id,
    setCond: (i) => { setCond(i, performance.now()); return CONDS[condI].id; },
    conds: () => CONDS.map((c) => c.id),
    condErr: () => condErr
  };

  return () => {
    if (window.__pqSky) delete window.__pqSky;
    ctx.destroy();
  };
}
