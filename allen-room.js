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
//
// 幅度為什麼都很小:底板的填補只在「輪廓往外一圈」是準的,再深就是猜的;而且套件的
// 切片刻意沒收進物件右側的暗面與投影(那部分留在底板上,靜止時剛好補齊)。所以每個
// 元件的位移上限都壓在「露出來不超過約 10 個原圖像素」——換算到實際顯示尺寸
// (1254 縮到 260–400px)是 2–3px,讀得到動作,但不會露出底板。
//
// 節奏和角色一樣 12 格/秒:房間跑滿 60fps 會和 12 格的 Allen 看起來像兩種媒材。
//
// 這一層對輔助技術是裝飾性的(aria-hidden);主要互動(點畫面任何地方 Allen 都會揮手)
// 不依賴它。

import { FrameStep } from './puppet-kit.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;
const NS = 'http://www.w3.org/2000/svg';

const BASE = '/assets/allen/room/';
export const CANVAS = 1254;

/** 會動的元件。bbox 來自套件的 manifest(原圖座標),pivot 是物理上真正的轉軸:
 *  吊掛的工具轉軸在掛孔、盆栽在土面、馬克杯在杯底、檯燈在底座、海報在圖釘。 */
const PARTS = [
  // 洞洞板上吊掛的工具:從掛孔擺盪。四支相位錯開,不然會像整排一起晃。
  { id: 'wrench_left', bbox: [1067, 493, 1122, 660], pivot: [1094, 503], sway: 1.5, per: 3.7, ph: 0.0 },
  { id: 'wrench_right', bbox: [1122, 493, 1174, 659], pivot: [1148, 503], sway: 1.4, per: 4.3, ph: 1.9 },
  { id: 'screwdriver_left', bbox: [1171, 490, 1215, 660], pivot: [1193, 500], sway: 1.2, per: 3.3, ph: 3.4 },
  { id: 'screwdriver_right', bbox: [1212, 489, 1254, 660], pivot: [1233, 499], sway: 1.3, per: 4.9, ph: 5.1 },
  // 盆栽:從土面搖。這是全場最該動的東西 —— 有風的時候人先看植物。
  { id: 'left_plant', bbox: [199, 560, 369, 761], pivot: [284, 757], sway: 1.9, per: 5.5, ph: 0.7 },
  { id: 'shelf_plant', bbox: [929, 371, 1011, 458], pivot: [970, 456], sway: 1.7, per: 4.6, ph: 2.6 },
  // 檯燈:整支是一片剪影,只能繞底座微微晃(它是有重量的金屬,本來就不該亂動)
  { id: 'lamp', bbox: [878, 540, 1020, 760], pivot: [905, 754], sway: 0.5, per: 7.0, ph: 1.2 },
  // 馬克杯:繞杯底
  { id: 'mug', bbox: [958, 672, 1074, 770], pivot: [1012, 768], sway: 0.7, per: 6.2, ph: 4.0 },
  // 海報:四角有圖釘,本來就不會晃,只有被戳到才抖一下
  { id: 'poster', bbox: [897, 59, 1102, 361], pivot: [912, 74], sway: 0, per: 1, ph: 0 },
  // 按鈕:按下去是位移,不是旋轉
  { id: 'red_button', bbox: [184, 730, 220, 767], pivot: [202, 748], sway: 0, per: 1, ph: 0, push: [2.4, 2.0] },
  { id: 'green_button', bbox: [198, 760, 236, 801], pivot: [217, 780], sway: 0, per: 1, ph: 0, push: [2.4, 2.0] },
  // 控制台螢幕:不做幾何,只把它自己的像素加亮(見下面的 screen blend)
  { id: 'screen', bbox: [0, 690, 193, 808], pivot: [96, 749], sway: 0, per: 1, ph: 0, lit: true },
];
const BY = Object.fromEntries(PARTS.map((p) => [p.id, p]));

/** 可以戳的地方。多數就是元件本身;window 沒有對應的切片(窗景是畫死在底板上的),
 *  所以「起風」不是去動窗戶,而是讓場上所有植物與吊掛工具一起被吹 —— 用真的東西表達風。 */
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
 * opts.debug   true 會把命中範圍畫出來
 * opts.static  true 只擺出靜止畫面,不註冊每幀回呼(給 reduced-motion 用)
 *
 * 回傳 { gust, poke, lampOn, spots, ready, destroy }。
 */
export function createRoom(root, {
  raf = null, rand = Math.random, onPoke = null, debug = false, still = false,
} = {}) {
  const uid = 'r' + Math.random().toString(36).slice(2, 7);
  const back = document.createElementNS(NS, 'svg');
  back.setAttribute('class', 'aw-room');
  const hits = document.createElementNS(NS, 'svg');
  hits.setAttribute('class', 'aw-hits');
  for (const s of [back, hits]) {
    s.setAttribute('viewBox', `0 0 ${CANVAS} ${CANVAS}`);
    s.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    s.setAttribute('aria-hidden', 'true');
  }

  const img = (href, b, extra = '') =>
    `<image href="${href}" x="${b[0]}" y="${b[1]}" width="${b[2] - b[0]}" height="${b[3] - b[1]}"${extra}/>`;

  // 疊圖順序照原圖:底板 → 各零件。零件彼此幾乎不重疊,唯一要注意的是檯燈的臂
  // 橫過洞洞板、馬克杯在檯燈前面,所以 PARTS 的順序就是畫的順序。
  back.innerHTML = `
<image href="${BASE}stage.webp" x="0" y="0" width="${CANVAS}" height="${CANVAS}"/>
${PARTS.map((p) => `<g data-r="${p.id}">${img(`${BASE}parts/${p.id}.webp`, p.bbox)}${
    p.lit
      // 「亮」不是另外畫光,是把這個物件自己的像素再疊一次(screen 混合)。
      // 沒有任何新形狀被發明出來,亮的就是原稿畫的那面螢幕。
      ? img(`${BASE}parts/${p.id}.webp`, p.bbox, ' data-lit="1" style="mix-blend-mode:screen" opacity="0"')
      : ''}</g>`).join('\n')}
<!-- 檯燈關掉時,燈照得到的那一圈涼下來。用軟邊的放射漸層,不用矩形 ——
     矩形會在畫面上留一條看得見的直邊,那就變成憑空多出來的東西了。 -->
<defs><radialGradient id="dimg${uid}">
  <stop offset="0" stop-color="#12233F" stop-offset="0" stop-opacity=".85"/>
  <stop offset="62%" stop-color="#12233F" stop-opacity=".55"/>
  <stop offset="100%" stop-color="#12233F" stop-opacity="0"/>
</radialGradient></defs>
<ellipse data-r="dim" cx="1000" cy="700" rx="330" ry="300" fill="url(#dimg${uid})" opacity="0"/>`;

  hits.innerHTML = `<g data-r="spots"></g>`;

  root.appendChild(back);
  root.appendChild(hits);

  const q = (n) => back.querySelector(`[data-r="${n}"]`);
  const g = Object.fromEntries(PARTS.map((p) => [p.id, q(p.id)]));
  const litEl = Object.fromEntries(PARTS.filter((p) => p.lit)
    .map((p) => [p.id, q(p.id).querySelector('[data-lit]')]));
  const dim = q('dim');

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
  const press = { red_button: -1, green_button: -1 };
  const kick = {};                       // 每個元件被戳一下的額外擺動
  PARTS.forEach((p) => { kick[p.id] = 0; });

  function gust(power = 1) {
    gustT = 0;
    // 風先吹到窗邊的大盆栽,再傳到房間另一側的東西 —— 給每個元件一點延遲,
    // 一起晃會像整張圖在抖,依序晃才像空氣流過去。
    PARTS.forEach((p) => { if (p.sway) kick[p.id] = Math.max(kick[p.id], power); });
  }
  const ACT = {
    window: () => gust(1),
    lamp: () => { lampOn = !lampOn; kick.lamp = 0.8; },
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

  // 靜止畫面:什麼 transform 都不寫,合成結果與原圖逐像素相同
  if (still || !raf) {
    return {
      gust() {}, poke() {}, get lampOn() { return true; },
      get spots() { return SPOTS.map((s) => s.k); },
      destroy() {
        hits.removeEventListener('click', onClick);
        try { back.remove(); } catch (e) { /* 殼層已清 */ }
        try { hits.remove(); } catch (e) { /* 殼層已清 */ }
      },
    };
  }

  const off = raf((now) => {
    if (t0 === null) t0 = now;
    const dt = clamp(now - t0, 0, 0.05);
    t0 = now; T += dt;

    if (gustT >= 0) { gustT += dt; if (gustT > 3.2) gustT = -1; }
    if (flapT >= 0) { flapT += dt; if (flapT > 1.1) flapT = -1; }
    if (screenT >= 0) { screenT += dt; if (screenT > 1.4) screenT = -1; }
    for (const k in press) if (press[k] >= 0) { press[k] += dt; if (press[k] > 0.5) press[k] = -1; }
    for (const k in kick) kick[k] *= Math.exp(-dt * 1.15);      // 被吹過之後慢慢平靜下來
    lampT += ((lampOn ? 1 : 0) - lampT) * clamp(dt * 6, 0, 1);

    // ═══ 只在 12 格/秒的格子邊界重畫 ═══
    if (!fs.step(dt)) return;

    for (const p of PARTS) {
      let tr = '';
      if (p.sway) {
        // 平常是很慢的自然擺動;被風吹過會多一段衰減中的擺動,頻率比平常快。
        const idle = Math.sin(T * (6.283 / p.per) + p.ph);
        const k = kick[p.id];
        const hit = k > 0.004 ? Math.sin(T * (6.283 / (p.per * 0.42)) + p.ph) * k * 2.6 : 0;
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
      const el = g[p.id];
      if (tr) el.setAttribute('transform', tr);
      else el.removeAttribute('transform');
    }

    // 螢幕:把它自己的像素再疊一層(screen 混合)當作「亮起來」。
    // 平常是很慢的呼吸,戳控制台會亮一下再退回去。
    const boost = 0.16 + 0.09 * Math.sin(T * 1.7)
      + (screenT >= 0 ? 0.42 * Math.exp(-screenT * 2.6) * (Math.floor(screenT * 9) % 2 ? 0.55 : 1) : 0);
    if (litEl.screen) litEl.screen.setAttribute('opacity', r2(clamp(boost, 0, 0.6)));

    // 檯燈:關掉時工作檯那側涼一階
    dim.setAttribute('opacity', r2((1 - lampT) * 0.26));
    g.lamp.style.opacity = r2(0.72 + lampT * 0.28);
  });

  return {
    gust,
    poke,
    get lampOn() { return lampOn; },
    get spots() { return SPOTS.map((s) => s.k); },
    /** 給驗收用:目前每個元件的角度 */
    get angles() {
      return Object.fromEntries(PARTS.map((p) => {
        const m = (g[p.id].getAttribute('transform') || '').match(/rotate\((-?[\d.]+)/);
        return [p.id, m ? +m[1] : 0];
      }));
    },
    destroy() {
      off && off();
      hits.removeEventListener('click', onClick);
      try { back.remove(); } catch (e) { /* 殼層已清 */ }
      try { hits.remove(); } catch (e) { /* 殼層已清 */ }
    },
  };
}
