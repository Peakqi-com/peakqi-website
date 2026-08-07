// Allen 工作間的互動層 —— 剪紙動畫式:會動的每一樣東西都是原圖裡那個物件本身。
//
// 第一版是在平背景上「另外畫」動態元件(自己畫的準星、自己畫的葉子、自己畫的眼皮),
// 那是錯的:畫出來的東西和原稿的筆觸、透視、色階都對不上,而且和底下畫死的同一個
// 物件疊在一起會變成兩份。這一版改成用 assets/svg/robot_workshop_strict_source_package
// 拆出來的真實切片。
//
// 素材(產生方式見 assets/allen/README.md):
//   room/stage.webp        底板 = 原圖挖掉「會動的那 12 個」,挖掉的地方用四周真實像素
//                          擴散填補。不會動的十個保留原始像素,不挖 —— 挖了只是自找麻煩。
//   room/parts/<id>.webp   會動的元件,含 alpha,各自貼回自己的 bbox。
//   room/grade/*.webp      天色分級圖(見下面的三層結構)。
//
// 幅度為什麼都很小:底板的填補只在「輪廓往外一圈」是準的,再深就是猜的;而且套件的
// 切片刻意沒收進物件右側的暗面與投影(那部分留在底板上,靜止時剛好補齊)。所以每個
// 元件的位移上限都壓在「露出來不超過約 10 個原圖像素」——換算到實際顯示尺寸
// (1254 縮到 260–400px)是 2–3px,讀得到動作,但不會露出底板。
//
// 節奏和角色一樣 12 格/秒:房間跑滿 60fps 會和 12 格的 Allen 看起來像兩種媒材。
//
// ── 為什麼分三層 ────────────────────────────────────────────────
//   ①  幾何層 aw-room   底板 + 雲 + 會動的元件(白天的顏色)
//   ②  分級層 aw-gr     天色。multiply 壓暗 + screen 提亮,疊在①和 Allen 上面
//   ③  發光層 aw-lit    螢幕、燈條、檯燈的暖光。screen 混合,疊在分級層上面
//
// 分級層要蓋過 Allen,所以它跟房間、角色是同一層的兄弟節點(z-index 4),而且
// .aw-root 必須是 isolate —— mix-blend-mode 只會和「最近一個堆疊脈絡」裡已經畫好的
// 東西混合。少了這一條,天色不是漏出去染到卡片,就是根本混不到角色身上。
//
// 光源(③)在分級之上是刻意的:天色壓暗的是「環境光」,檯燈和螢幕是自己會發光的東西,
// 夜裡它們不該跟著一起暗,反而該變成主角。
//
// 這一層對輔助技術是裝飾性的(aria-hidden);主要互動(點畫面任何地方 Allen 都會揮手)
// 不依賴它。

import { FrameStep } from './puppet-kit.js';
import { PART_BOX, SKY_MASK, GRADE_TIMES, GRADE_OFF } from './allen-room-parts.js';
import { GRADE_BASE, TIMES, pickTime } from './allen-sky.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;
const NS = 'http://www.w3.org/2000/svg';

const BASE = '/assets/allen/room/';
export const CANVAS = 1254;

// 程式想要的時段和產生器實際做出來的對不上,就是資產沒重跑 —— 當場擋下來
for (const t of TIMES) {
  if (!GRADE_TIMES.includes(t)) {
    throw new Error('缺少 ' + t + ' 的分級圖 —— 重跑 tools/gen-allen-room-assets.py');
  }
}

/** 會動的元件:這裡只寫「怎麼動」,貼圖框由 allen-room-parts.js 提供(產生檔)。
 *  pivot 是物理上真正的轉軸:吊掛的工具在掛孔、盆栽在土面、馬克杯在杯底、
 *  檯燈在底座、海報在圖釘。座標都是原圖的 1254×1254。 */
const MOTION = [
  // 洞洞板上吊掛的工具:從掛孔擺盪。四支相位錯開,不然會像整排一起晃。
  { id: 'wrench_left', pivot: [1094, 503], sway: 2.4, per: 3.7, ph: 0.0 },
  { id: 'wrench_right', pivot: [1148, 503], sway: 2.2, per: 4.3, ph: 1.9 },
  { id: 'screwdriver_left', pivot: [1193, 500], sway: 2.0, per: 3.3, ph: 3.4 },
  { id: 'screwdriver_right', pivot: [1233, 499], sway: 2.1, per: 4.9, ph: 5.1 },
  // 盆栽:從土面搖。這是全場最該動的東西 —— 有風的時候人先看植物。
  { id: 'left_plant', pivot: [284, 757], sway: 3.2, per: 5.5, ph: 0.7 },
  { id: 'shelf_plant', pivot: [970, 456], sway: 2.8, per: 4.6, ph: 2.6 },
  // 檯燈:整支是一片剪影,只能繞底座微微晃(它是有重量的金屬,本來就不該亂動)
  // lit 是「亮起來」的範圍(燈罩開口與它打在燈罩內緣的光);
  // off 是「熄掉之後要變灰」的範圍,收得更緊 —— 只有開口那一小塊。原稿是把燈畫成
  // 亮著的,所以關燈不能只是不加光,還要把那塊奶油色抽掉、壓成沒通電的灰。
  { id: 'lamp', pivot: [905, 754], sway: 0.8, per: 7.0, ph: 1.2,
    lit: [938, 616, 76, 52], off: [948, 622, 36, 24] },
  // 馬克杯:繞杯底
  { id: 'mug', pivot: [1012, 768], sway: 1.1, per: 6.2, ph: 4.0 },
  // 海報:四角有圖釘,本來就不會晃,只有被戳到才抖一下
  { id: 'poster', pivot: [912, 74], sway: 0, per: 1, ph: 0 },
  // 按鈕:按下去是位移,不是旋轉
  { id: 'red_button', pivot: [202, 748], sway: 0, per: 1, ph: 0, push: [2.4, 2.0] },
  { id: 'green_button', pivot: [217, 780], sway: 0, per: 1, ph: 0, push: [2.4, 2.0] },
  // 控制台螢幕:不做幾何,只把它自己的像素加亮(見下面的 screen blend)
  { id: 'screen', pivot: [96, 749], sway: 0, per: 1, ph: 0, lit: 'all' },
];
// 把動作和產生出來的貼圖框合起來。少一邊就是資產和程式對不上,直接擋下來。
const PARTS = MOTION.map((m) => {
  const box = PART_BOX[m.id];
  if (!box) throw new Error('allen-room-parts.js 少了 ' + m.id + ' —— 重跑 tools/gen-allen-room-assets.py');
  return { ...m, box };
});

/** 窗外的雲。它們不是套件裡的元件 —— 是產生器自己從天空分出來的(平塗白雲配平滑
 *  漸層的天空最好分,雲後面的天空用只從天空取樣的擴散補)。三朵各自漂,速度不同。
 *
 *  只有「輪廓完整」的雲會動。原稿裡有幾朵是被畫布左緣或前面那座塔切掉一半的,
 *  那些留在底板上不動 —— 靜止的話那條切線只是原稿的構圖,一動就變成一刀切口。
 *  來回的範圍由貼圖框自己算(見下面的 cloudEl),進出視野靠遮罩的柔邊淡出。 */
const CLOUDS = [
  { id: 'cloud_0', sp: 5.2 },
  { id: 'cloud_1', sp: 7.4 },
  { id: 'cloud_2', sp: 3.6 },
];

/** 房間裡「只會亮、不會動」的地方:牆上小螢幕、頂上藍螢幕、地上機台的燈條。
 *  它們不用另外切成零件 —— 直接把底板自己的像素在這幾塊矩形上疊亮就好,
 *  零新增檔案、零額外請求,而且亮的一樣是原稿畫的那面螢幕。 */
const GLOW = [
  { id: 'wall_screen', box: [504, 282, 70, 48], amp: 0.20, per: 5.2, ph: 0.0 },
  { id: 'top_screen', box: [474, 31, 84, 40], amp: 0.17, per: 6.9, ph: 2.1 },
  { id: 'bin_led', box: [1010, 1132, 107, 39], amp: 0.34, per: 3.1, ph: 4.2 },
];

/** 可以戳的地方。多數就是元件本身;window 沒有對應的切片(窗景是畫死在底板上的),
 *  所以戳窗戶做兩件事:讓場上所有植物與吊掛工具一起被吹(用真的東西表達風),
 *  以及把天色推到下一個時段 —— 看窗外本來就是「現在幾點」這件事發生的地方。 */
const SPOTS = [
  { k: 'window', box: [0, 60, 300, 560], look: [-0.85, -0.3] },
  { k: 'console', box: [0, 640, 274, 270], look: [-0.8, 0.2] },
  { k: 'lamp', box: [878, 540, 142, 220], look: [0.5, 0.05] },
  { k: 'mug', box: [958, 672, 116, 98], look: [0.6, 0.12] },
  { k: 'poster', box: [897, 59, 205, 302], look: [0.5, -0.7] },
  { k: 'tools', box: [1060, 480, 194, 190], look: [0.85, -0.1] },
];

/**
 * 掛一層互動房間到 root(必須是定位父層)。
 *
 * opts.raf     共享 rAF 註冊器,(cb)=>off,cb 收秒
 * opts.rand    亂數來源
 * opts.onPoke  (key, look) => void
 * opts.time    開場時段;預設看訪客的時鐘
 * opts.debug   true 會把命中範圍畫出來
 * opts.still   true 只擺出靜止畫面,不註冊每幀回呼(給 reduced-motion 用)
 *
 * 回傳 { gust, poke, setTime, time, lampOn, spots, destroy }。
 */
export function createRoom(root, {
  raf = null, rand = Math.random, onPoke = null, debug = false, still = false, time = null,
} = {}) {
  const uid = 'r' + Math.random().toString(36).slice(2, 7);
  // mix-blend-mode 只和「最近一個堆疊脈絡」裡已經畫好的東西混合。分級層要吃到房間
  // 和 Allen,所以 root 必須自己就是那個脈絡 —— 順便擋住天色漏出去染到卡片背景。
  root.style.isolation = 'isolate';

  const back = document.createElementNS(NS, 'svg');
  back.setAttribute('class', 'aw-room');
  const lit = document.createElementNS(NS, 'svg');
  lit.setAttribute('class', 'aw-lit');
  const hits = document.createElementNS(NS, 'svg');
  hits.setAttribute('class', 'aw-hits');
  for (const s of [back, lit, hits]) {
    s.setAttribute('viewBox', `0 0 ${CANVAS} ${CANVAS}`);
    s.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    s.setAttribute('aria-hidden', 'true');
  }
  // 疊圖順序寫在這裡而不是外面的 CSS:這四層是本檔自己 append 的,順序也只有本檔知道。
  // 幾何 1 → (卡片的暗角 2、Allen 3 在外面) → 分級 4 → 發光 5 → 命中 6。
  back.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1';
  // 發光層整層 screen:裡面的東西就不必各自寫混合模式,而且它疊在天色之上,
  // 夜裡螢幕與檯燈才會是「還亮著的光源」而不是跟著變暗的物件。
  lit.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;'
    + 'mix-blend-mode:screen';
  hits.style.cssText = 'position:absolute;inset:0;z-index:6';

  // 一個約束,改半徑之前先看:柔邊必須在「貼圖框內」而且在「元件自己的 alpha 內」
  // 歸零,否則只是把矩形的硬邊換成貼圖框的硬邊(檯燈的貼圖框右緣 x=1038,而它的
  // alpha 在右下角有一塊為了避開馬克杯挖掉的直角缺口,離燈頭只有 35px)。
  // 目前的橢圓落在 917–1035 × 597–687,兩個界線都沒碰到。
  const soft = (id, b) => {
    const cx = r1(b[0] + b[2] / 2), cy = r1(b[1] + b[3] / 2);
    return `<radialGradient id="sg${id}${uid}">`
      + '<stop offset="0" stop-color="#fff"/>'
      + '<stop offset="52%" stop-color="#fff" stop-opacity=".92"/>'
      + '<stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>'
      // 不要補 x/y/width/height:預設的遮罩區是 -10%..120%(相對 viewport),
      // 剛好蓋滿整張畫布;補上去就會把 GLOW 那三個「用全幅底板當內容」的群切掉。
      + `<mask id="sm${id}${uid}" maskUnits="userSpaceOnUse">`
      + `<ellipse cx="${cx}" cy="${cy}" rx="${r1(b[2] * 0.78)}" ry="${r1(b[3] * 0.86)}"`
      + ` fill="url(#sg${id}${uid})"/></mask>`;
  };
  const img = (href, b, extra = '') =>
    `<image href="${href}" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"${extra}/>`;
  // 形狀由遮罩決定,所以這裡放大一圈的矩形就好
  const rect = (b, fill, mode) =>
    `<rect x="${b[0] - 40}" y="${b[1] - 40}" width="${b[2] + 80}" height="${b[3] + 80}"`
    + ` fill="${fill}" style="mix-blend-mode:${mode}"/>`;
  // 疊圖順序照原圖:底板 → 雲 → 各零件。零件彼此幾乎不重疊,唯一要注意的是檯燈的臂
  // 橫過洞洞板、馬克杯在檯燈前面,所以 PARTS 的順序就是畫的順序。
  back.innerHTML = `
<image href="${BASE}stage.webp" x="0" y="0" width="${CANVAS}" height="${CANVAS}"/>
<defs><mask id="sky${uid}" maskUnits="userSpaceOnUse"><image href="${BASE}sky-mask.webp" x="${SKY_MASK[0]}" y="${SKY_MASK[1]}" width="${SKY_MASK[2]}" height="${SKY_MASK[3]}"/></mask></defs>
<g mask="url(#sky${uid})">${CLOUDS.map((c) => {
    const b = PART_BOX[c.id];
    if (!b) throw new Error('allen-room-parts.js 少了 ' + c.id);
    return `<g data-r="${c.id}">${img(`${BASE}parts/${c.id}.webp`, b)}</g>`;
  }).join('')}</g>
<defs>${PARTS.filter((p) => p.off).map((p) => soft('off' + p.id, p.off)).join('')}</defs>
${PARTS.map((p) => `<g data-r="${p.id}">${img(`${BASE}parts/${p.id}.webp`, p.box)}${
    // 熄掉的燈罩:先把顏色抽掉(saturation 混合 —— 對本來就是灰的牆面是零作用,
    // 所以不會在四周留下光暈),再壓暗一點,那是沒通電的金屬該有的樣子。
    // 兩層都在檯燈自己的群組裡,燈晃的時候會跟著晃。
    p.off ? `<g data-r="dark_${p.id}" mask="url(#smoff${p.id}${uid})" opacity="0">`
      + rect(p.off, '#8A8D93', 'saturation') + rect(p.off, '#C6CAD1', 'multiply')
      + '</g>' : ''}</g>`).join('\n')}

<!-- 分級圖載不到時的退路:只把檯燈照得到的那一圈壓暗。用軟邊放射漸層不用矩形 ——
     矩形會在畫面上留一條看得見的直邊,那就變成憑空多出來的東西了。 -->
<defs><radialGradient id="dimg${uid}">
  <stop offset="0" stop-color="#12233F" stop-opacity=".85"/>
  <stop offset="62%" stop-color="#12233F" stop-opacity=".55"/>
  <stop offset="100%" stop-color="#12233F" stop-opacity="0"/>
</radialGradient></defs>
<ellipse data-r="dim" cx="1000" cy="700" rx="330" ry="300" fill="url(#dimg${uid})" opacity="0"/>`;

  // 發光的範圍要用「軟邊的光暈」不能用「硬邊的矩形」。
  //
  // 第一版是 clipPath 的圓角矩形。白天看不出來 —— 它疊在同樣亮的底板上,邊界剛好
  // 消失;天色一暗,背景變深,那個矩形就整個現形,燈罩上出現一個發亮的方塊。
  // 光本來就沒有邊界,所以改成中心實、外圍漸隱的放射遮罩。被照亮的仍然是原稿畫的
  // 那盞燈自己的像素,只是「照到哪裡」變成連續的。
  const LITP = PARTS.filter((p) => p.lit);
  lit.innerHTML = `
<defs>${LITP.filter((p) => p.lit !== 'all').map((p) => soft(p.id, p.lit)).join('')}${
    GLOW.map((w) => soft(w.id, w.box)).join('')}</defs>
${LITP.map((p) => `<g data-r="l_${p.id}">${
    p.lit === 'all'
      ? img(`${BASE}parts/${p.id}.webp`, p.box, ' data-lit="1" opacity="0"')
      : `<g mask="url(#sm${p.id}${uid})">${img(`${BASE}parts/${p.id}.webp`, p.box,
          ' data-lit="1" opacity="0"')}</g>`}</g>`).join('')}
${GLOW.map((w) => `<g data-r="${w.id}" mask="url(#sm${w.id}${uid})" opacity="0">`
  + `<image href="${BASE}stage.webp" x="0" y="0" width="${CANVAS}" height="${CANVAS}"/></g>`).join('')}

<!-- 檯燈點亮的那一圈暖光。它是光不是物件,所以用軟邊放射漸層;矩形會留一條看得見的直邊。 -->
<defs><radialGradient id="warm${uid}">
  <stop offset="0" stop-color="#FFD9A0" stop-opacity=".8"/>
  <stop offset="58%" stop-color="#FFC46B" stop-opacity=".24"/>
  <stop offset="100%" stop-color="#FFB347" stop-opacity="0"/>
</radialGradient></defs>
<ellipse data-r="warm" cx="975" cy="706" rx="250" ry="215" fill="url(#warm${uid})" opacity="0"/>`;

  hits.innerHTML = `<g data-r="spots"></g>`;

  // ---- 分級層:天色 ----
  // 順序不能顛倒:multiply 全部先套完,screen 才提亮(產生器就是照這個順序解出來的)。
  // 三個關燈圖也是 multiply,而且各時段一張 —— 夜裡關檯燈的落差比白天大得多。
  // 關燈的分級圖只有 GRADE_OFF 裡的時段有(目前只有夜晚)。白天與黃昏關燈時房間
  // 一動也不動 —— 任何放射狀的暗場都會被看成憑空多出來的黑色光暈,收得再小都一樣。
  const LAYERS = [
    ...TIMES.filter((t) => t !== 'day').map((t) => ({ k: t + '-m', t, mode: 'multiply' })),
    ...GRADE_OFF.map((t) => ({ k: t + '-off', t, mode: 'multiply', off: true })),
    ...TIMES.filter((t) => t !== 'day').map((t) => ({ k: t + '-s', t, mode: 'screen' })),
  ];
  const grades = LAYERS.map((L) => {
    const el = document.createElement('img');
    el.alt = '';
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('data-g', L.k);
    // object-fit:cover + center 等同房間那幾張 SVG 的 xMidYMid slice,對位自動成立
    el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;'
      + `object-position:center;pointer-events:none;z-index:4;display:none;mix-blend-mode:${L.mode}`;
    root.appendChild(el);
    return { ...L, el, ready: false, want: false };
  });
  // 沒用到的時段完全不載;用得到的那幾張各自只載一次。
  function need(pred) {
    for (const L of grades) {
      if (!pred(L) || L.want) continue;
      L.want = true;
      const pre = new Image();
      // 先預載再掛上去,才不會有「半張分級圖」閃一下
      pre.onload = () => { L.el.src = pre.src; L.ready = true; paintGrade(); };
      pre.onerror = () => { L.want = false; };      // 載不到就退回沒有分級(白天)
      pre.src = `${GRADE_BASE}${L.k}.webp`;
    }
  }

  root.appendChild(back);
  root.appendChild(lit);
  root.appendChild(hits);

  const q = (n) => back.querySelector(`[data-r="${n}"]`);
  const ql = (n) => lit.querySelector(`[data-r="${n}"]`);
  const g = Object.fromEntries(PARTS.map((p) => [p.id, q(p.id)]));
  // 發光的那一份要跟著本體一起轉,不然檯燈晃的時候燈罩的光會留在原地
  const litG = Object.fromEntries(PARTS.filter((p) => p.lit).map((p) => [p.id, ql('l_' + p.id)]));
  const litEl = Object.fromEntries(PARTS.filter((p) => p.lit)
    .map((p) => [p.id, litG[p.id].querySelector('[data-lit]')]));
  const darkEl = Object.fromEntries(PARTS.filter((p) => p.off).map((p) => [p.id, q('dark_' + p.id)]));
  const dim = q('dim');
  const warm = ql('warm');
  const glowEl = Object.fromEntries(GLOW.map((w) => [w.id, ql(w.id)]));
  // 每朵雲的行程由它自己的貼圖框算:從「整朵在窗戶左外」飄到「整朵出了窗戶右緣」。
  // 寫死一個範圍的話,靠右邊的那朵大半輩子都在畫面外。
  const cloudEl = CLOUDS.map((c) => {
    const b = PART_BOX[c.id];
    const from = -(b[0] + b[2] + 15);
    const to = 300 - b[0];
    return { ...c, el: q(c.id), from, to, x: from + rand() * (to - from) };
  });

  // ---- 命中範圍:只有這幾塊收指標事件 ----
  hits.style.pointerEvents = 'none';
  SPOTS.forEach((s) => {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', s.box[0]); r.setAttribute('y', s.box[1]);
    r.setAttribute('width', s.box[2]); r.setAttribute('height', s.box[3]);
    r.setAttribute('fill', debug ? 'rgba(255,0,255,.25)' : 'transparent');
    if (debug) { r.setAttribute('stroke', '#F0F'); r.setAttribute('stroke-width', '3'); }
    r.setAttribute('pointer-events', 'all');
    r.setAttribute('data-spot', s.k);
    r.style.cursor = 'pointer';
    hits.querySelector('[data-r="spots"]').appendChild(r);
  });

  // ---- 狀態 ----
  const fs = FrameStep(12);
  let t0 = null, T = 0;
  let gustT = -1, lampOn = true, lampT = 1, flapT = -1, screenT = -1;
  // 房間不該只是「全部一起慢慢晃」—— 每隔一陣子挑一件事做大一點,畫面才有起伏。
  let evIn = 3 + rand() * 4, ledT = -1, flickT = -1;
  const press = { red_button: -1, green_button: -1 };
  const kick = {};                       // 每個元件被戳一下的額外擺動
  PARTS.forEach((p) => { kick[p.id] = 0; });

  // 天色:每個時段一個權重,慢慢往目標推。溶接比硬切好看,而且 multiply 疊 multiply
  // 在兩端是精確的(權重 0 就是不套),中間只是過場。
  const okTime = (t) => (TIMES.includes(t) ? t : 'day');
  let now = pickTime(time);
  const tw = Object.fromEntries(TIMES.map((t) => [t, t === now ? 1 : 0]));
  need((L) => L.t === now && !L.off);

  function setTime(t) {
    t = okTime(t);
    if (t === now) return;
    now = t;
    need((L) => L.t === now && (!L.off || !lampOn));
  }

  function gust(power = 1) {
    gustT = 0;
    // 風先吹到窗邊的大盆栽,再傳到房間另一側的東西 —— 給每個元件一點延遲,
    // 一起晃會像整張圖在抖,依序晃才像空氣流過去。
    PARTS.forEach((p) => { if (p.sway) kick[p.id] = Math.max(kick[p.id], power); });
  }
  // 一次只發生一件,幅度比閒置大,結束就回到閒置。
  const EVENTS = [
    () => gust(0.75),                                   // 一陣風掃過:植物與工具一起被吹
    () => { screenT = 0; },                             // 控制台跑一段資料
    () => { ledT = 0; },                                // 機台的燈條連閃
    () => { flickT = 0; },                              // 檯燈閃一下
    () => { ['wrench_left', 'wrench_right', 'screwdriver_left', 'screwdriver_right']
      .forEach((id, i) => { kick[id] = 0.9 - i * 0.12; }); },   // 只有工具排晃
  ];

  const ACT = {
    // 戳窗戶:起風,順便把天色推到下一段。看窗外本來就是「現在幾點」發生的地方。
    window: () => { gust(1); setTime(TIMES[(TIMES.indexOf(now) + 1) % TIMES.length]); },
    lamp: () => {
      lampOn = !lampOn; kick.lamp = 0.8;
      // 三張關燈圖加起來才 16KB,第一次關燈就一起抓 —— 之後換天色就不會卡一下
      if (!lampOn) need((L) => L.off);
    },
    mug: () => { kick.mug = 1.6; },
    poster: () => { flapT = 0; },
    console: () => { screenT = 0; press.red_button = 0; },
    tools: () => { ['wrench_left', 'wrench_right', 'screwdriver_left', 'screwdriver_right']
      .forEach((id, i) => { kick[id] = 1.5 - i * 0.15; }); },
  };

  function poke(k) {
    const s = SPOTS.find((x) => x.k === k);
    if (!s) return;
    ACT[k]();
    if (onPoke) onPoke(k, s.look);
  }
  function onClick(ev) {
    const k = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-spot');
    if (!k) return;
    ev.stopPropagation();                // 戳房間就不要同時觸發「點畫面 Allen 揮手」
    poke(k);
  }
  hits.addEventListener('click', onClick);

  // 把每一層分級圖的濃度寫上去。opacity 0 的層直接 display:none —— 手機上一張全幅
  // 混合圖就是一次合成,不用的層不該還留在圖層樹裡。
  function paintGrade() {
    for (const L of grades) {
      const o = L.ready ? tw[L.t] * (L.off ? 1 - lampT : 1) : 0;
      if (o < 0.004) {
        if (L.el.style.display !== 'none') L.el.style.display = 'none';
      } else {
        if (L.el.style.display === 'none') L.el.style.display = '';
        L.el.style.opacity = r2(o);
      }
    }
    // 退路只在「這個時段本來就該有關燈分級圖、但它載不到」時才出場。
    // 「還在載」不算 —— 那半秒的漸層看起來就是一團憑空出現的黑暈。
    const fb = grades.find((L) => L.off && L.t === now);
    dim.setAttribute('opacity', r2(fb && !fb.want ? (1 - lampT) * 0.26 : 0));
  }

  function teardown() {
    hits.removeEventListener('click', onClick);
    for (const el of [back, lit, hits, ...grades.map((L) => L.el)]) {
      try { el.remove(); } catch (e) { /* 殼層已清 */ }
    }
  }

  // 靜止畫面:什麼 transform 都不寫,合成結果與原圖逐像素相同(白天的話)。
  // 但天色還是要給 —— reduced-motion 的訪客在晚上一樣該看到晚上的房間。
  if (still || !raf) {
    paintGrade();                    // 之後由分級圖的 onload 自己再補一次,不用計時器
    return {
      gust() {}, poke() {}, setTime(t) { setTime(t); paintGrade(); },
      get time() { return now; },
      get lampOn() { return true; },
      get spots() { return SPOTS.map((s) => s.k); },
      destroy: teardown,
    };
  }

  const off = raf((sec) => {
    if (t0 === null) t0 = sec;
    const dt = clamp(sec - t0, 0, 0.05);
    t0 = sec; T += dt;

    if (gustT >= 0) { gustT += dt; if (gustT > 3.2) gustT = -1; }
    if (flapT >= 0) { flapT += dt; if (flapT > 1.1) flapT = -1; }
    if (screenT >= 0) { screenT += dt; if (screenT > 1.4) screenT = -1; }
    if (ledT >= 0) { ledT += dt; if (ledT > 1.6) ledT = -1; }
    if (flickT >= 0) { flickT += dt; if (flickT > 0.9) flickT = -1; }
    evIn -= dt;
    if (evIn <= 0) { EVENTS[(rand() * EVENTS.length) | 0](); evIn = 5 + rand() * 7; }
    for (const k in press) if (press[k] >= 0) { press[k] += dt; if (press[k] > 0.5) press[k] = -1; }
    for (const k in kick) kick[k] *= Math.exp(-dt * 1.15);      // 被吹過之後慢慢平靜下來
    lampT += ((lampOn ? 1 : 0) - lampT) * clamp(dt * 6, 0, 1);
    for (const t of TIMES) tw[t] += ((t === now ? 1 : 0) - tw[t]) * clamp(dt * 1.7, 0, 1);
    // 陣風的時候雲也跑快一點 —— 風是同一陣風
    const windMul = gustT >= 0 ? 1 + 2.0 * Math.sin((gustT / 3.2) * Math.PI) : 1;
    for (const c of cloudEl) {
      c.x += c.sp * windMul * dt;
      if (c.x > c.to) c.x = c.from - rand() * 60;
    }

    // ═══ 只在 12 格/秒的格子邊界重畫 ═══
    if (!fs.step(dt)) return;

    for (const p of PARTS) {
      let tr = '';
      if (p.sway) {
        // 平常是很慢的自然擺動;被風吹過會多一段衰減中的擺動,頻率比平常快。
        const idle = Math.sin(T * (6.283 / p.per) + p.ph);
        const k = kick[p.id];
        const hit = k > 0.004 ? Math.sin(T * (6.283 / (p.per * 0.42)) + p.ph) * k * 1.5 : 0;
        const a = p.sway * (idle + hit);
        if (Math.abs(a) > 0.01) tr = `rotate(${r2(a)},${p.pivot[0]},${p.pivot[1]})`;
      }
      if (p.push && press[p.id] >= 0) {
        // 按鈕:壓下去再彈回來
        const u = press[p.id] / 0.5;
        const d = u < 0.25 ? u / 0.25 : Math.exp(-(u - 0.25) * 9);
        tr = `translate(${r1(p.push[0] * d)},${r1(p.push[1] * d)})`;
      }
      if (p.id === 'poster' && flapT >= 0) {
        const a = Math.sin(flapT * 13) * Math.exp(-flapT * 3.4) * 0.55;
        tr = `rotate(${r2(a)},${p.pivot[0]},${p.pivot[1]})`;
      }
      if (p.id === 'lamp') {
        // 開關的那一下讓燈自己震一下,和它本來的微晃疊在一起
        const c = kick.lamp > 0.004 ? Math.sin(T * 26) * kick.lamp * 0.5 : 0;
        if (c) tr = `rotate(${r2(p.sway * Math.sin(T * (6.283 / p.per) + p.ph) + c)},${p.pivot[0]},${p.pivot[1]})`;
      }
      for (const el of [g[p.id], litG[p.id]]) {
        if (!el) continue;
        if (tr) el.setAttribute('transform', tr);
        else el.removeAttribute('transform');
      }
    }

    // 螢幕:把它自己的像素再疊一層當作「亮起來」。
    // 平常是很慢的呼吸,戳控制台會亮一下再退回去。
    const boost = 0.16 + 0.09 * Math.sin(T * 1.7)
      + (screenT >= 0 ? 0.42 * Math.exp(-screenT * 2.6) * (Math.floor(screenT * 9) % 2 ? 0.55 : 1) : 0);
    if (litEl.screen) litEl.screen.setAttribute('opacity', r2(clamp(boost, 0, 0.6)));

    // 窗外的雲:各自漂,漂出右邊就繞回左邊
    for (const c of cloudEl) {
      c.el.setAttribute('transform', `translate(${r1(c.x)},0)`);
    }

    // 底板自己會亮的三個地方:各自用不同的週期呼吸,機台燈條被點名時連閃
    for (const w of GLOW) {
      let o = w.amp * (0.55 + 0.45 * Math.sin(T * (6.283 / w.per) + w.ph));
      if (w.id === 'bin_led' && ledT >= 0) {
        o = (Math.floor(ledT * 11) % 2 ? 0.06 : 0.62) * Math.exp(-ledT * 1.2);
      }
      glowEl[w.id].setAttribute('opacity', r2(clamp(o, 0, 0.7)));
    }

    // 檯燈:亮著的時候燈罩自己發亮、桌面有一圈暖光,兩者一起呼吸。
    // 被點名時閃兩下 —— 燈管接觸不良的那種閃,是這種老工作間會有的事。
    const breathe = 0.78 + 0.22 * Math.sin(T * 1.35);
    const flick = flickT >= 0 ? (Math.floor(flickT * 14) % 2 ? 0.25 : 1) : 1;
    const lampLit = lampT * breathe * flick;
    if (litEl.lamp) litEl.lamp.setAttribute('opacity', r2(lampLit * 0.42));
    // 桌面那一圈暖光只在夜裡出場。它半徑 250(卡片上約 60px),白天跟著開關進出
    // 就是一團忽明忽暗的光暈 —— 白天房間本來就亮,桌上那圈光原稿早就畫好了。
    warm.setAttribute('opacity', r2(lampLit * 0.62 * tw.night));
    // 關燈的樣子只做在燈罩上(上面那兩層 saturation + multiply)。
    // 這裡以前是 g.lamp.style.opacity = 0.72 + lampT*0.28 —— 那是錯的:整支燈變成
    // 半透明,底板上被挖掉檯燈的那塊修補痕就從燈身透出來,燈看起來糊糊的、四周
    // 還帶一圈暗邊。要暗的是「光」不是「不透明度」。
    if (darkEl.lamp) darkEl.lamp.setAttribute('opacity', r2(1 - lampT));
    paintGrade();
  });

  return {
    gust,
    poke,
    setTime,
    get time() { return now; },
    get lampOn() { return lampOn; },
    get spots() { return SPOTS.map((s) => s.k); },
    /** 給驗收用:目前每個元件的角度 */
    get angles() {
      return Object.fromEntries(PARTS.map((p) => {
        const m = (g[p.id].getAttribute('transform') || '').match(/rotate\((-?[\d.]+)/);
        return [p.id, m ? +m[1] : 0];
      }));
    },
    destroy() { off && off(); teardown(); },
  };
}
