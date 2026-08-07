// Allen 工作間的互動層。
//
// 背景那個檔雖然副檔名是 .svg,裡面其實是一張 1254×1254 的 PNG(SVG 只是外殼),
// 房間裡的東西沒辦法直接抓出來轉。這裡的做法是:在背景上疊一層 viewBox 對齊到
// 1254×1254 的向量層,把「會動的東西」照原圖的位置重畫一次 —— 雲、螢幕、燈光、
// 蒸氣、指示燈都是這裡畫的,底下那張圖只負責不動的部分。座標全部量自背景圖,
// 換背景就要重量 P 那一組。
//
// 背景是 object-fit:cover,這一層就用 preserveAspectRatio="xMidYMid slice"(SVG 的
// 同義詞),兩者裁切方式一致,卡片不是正方形時也不會錯位。
//
// 分成兩層:視覺層在 Allen 後面(他站在房間裡,不是站在特效上),命中層在最上面
// 且只有那幾塊矩形收得到指標事件 —— 不然角色那個 div 會把窗戶的點擊吃掉。
//
// 節奏和角色一樣是 12 格/秒。房間如果跑滿 60fps,會和 12 格的 Allen 看起來像兩種
// 媒材貼在一起 —— 老卡通是整個畫面一起降幀的。
//
// 這一層對輔助技術是裝飾性的(aria-hidden):它是彩蛋。主要互動(點畫面任何地方
// Allen 都會揮手)不依賴這裡。

import { FrameStep } from './puppet-kit.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r1 = (n) => Math.round(n * 10) / 10;
const NS = 'http://www.w3.org/2000/svg';

// 原圖座標(1254×1254)
const P = {
  sky: { cx: -5, cy: 368, rx: 282, ry: 297 },   // 圓窗開口,圓心被畫面左緣切掉
  screen: { x: 8, y: 655, w: 162, h: 145 },     // 左邊控制台的深色螢幕
  cross: { x: 55, y: 745, r: 26 },              // 螢幕上的準星
  bars: { x: 92, y: 800, w: 74 },               // 螢幕上的長條圖(y 是基線)
  panel: { x: 500, y: 275, w: 75, h: 45 },      // 牆上那面小螢幕
  lamp: { x: 975, y: 648 },                     // 檯燈燈頭
  mug: { x: 1016, y: 674 },                     // 馬克杯杯口
  led: { x: 1010, y: 1130, w: 95, h: 26 },      // 右下機台的指示燈條
  poster: { l: [975, 185], r: [1015, 185], rr: 17 },  // 海報上機器人的兩隻眼睛
  plant: { x: 285, y: 655 },                    // 櫃上那盆植物
};

// 可以戳的東西。box 是命中範圍(原圖座標),look 是 Allen 要看過去的方向
// (相對舞台中心的 -1~1,和 puppet-kit 的 Pointer 同一套座標)。
const SPOTS = [
  { k: 'window', box: [0, 60, 300, 620], look: [-0.85, -0.25] },
  { k: 'console', box: [0, 640, 272, 270], look: [-0.8, 0.2] },
  { k: 'lamp', box: [855, 600, 165, 165], look: [0.55, 0.05] },
  { k: 'mug', box: [960, 665, 130, 100], look: [0.6, 0.1] },
  { k: 'poster', box: [910, 65, 182, 282], look: [0.5, -0.7] },
  { k: 'machine', box: [960, 1000, 294, 254], look: [0.75, 0.6] },
];

/** 會飄的那幾朵畫成細長的捲雲,不畫成積雲。
 *
 *  原因:原圖那幾朵大積雲是畫死在背景裡的,不會動。如果我再疊幾朵一模一樣的積雲上去
 *  飄,畫面就變成「一半的雲在動、一半不動」,一眼看得出來是外掛的。捲雲又薄又快,
 *  和底下慢吞吞的積雲同時存在是自然的,反而把「有風」講得更清楚。
 *
 *  形狀用 seed 決定,同一朵每次都長一樣;疊橢圓而不是走貝茲,是因為同色橢圓交疊
 *  不會留下內部接縫,也不會像貝茲那樣在收尾處長出毛邊。 */
function wisp(seed) {
  const R = (n) => {
    const s = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  let m = '', x = 0;
  const n = 3 + Math.floor(R(0) * 3);
  for (let i = 0; i < n; i++) {
    const rx = 26 + R(i * 3 + 1) * 30, ry = 6 + R(i * 3 + 2) * 5;
    m += `<ellipse cx="${r1(x)}" cy="${r1((R(i * 3 + 3) - 0.5) * 9)}" rx="${r1(rx)}" ry="${r1(ry)}"/>`;
    x += rx * 1.02;
  }
  return m;
}

/**
 * 掛一層互動房間到 root(必須是背景圖的定位父層)。
 *
 * opts.raf    共享 rAF 註冊器,(cb)=>off,cb 收秒
 * opts.rand   亂數來源
 * opts.onPoke (key, look) => void,使用者戳了房間裡某樣東西時呼叫
 * opts.debug  true 會把命中範圍畫出來
 *
 * 回傳 { gust, poke, lampOn, destroy }。
 */
export function createRoom(root, { raf, rand = Math.random, onPoke = null, debug = false } = {}) {
  const uid = 'r' + Math.random().toString(36).slice(2, 7);

  const back = document.createElementNS(NS, 'svg');
  back.setAttribute('class', 'aw-room');
  const hits = document.createElementNS(NS, 'svg');
  hits.setAttribute('class', 'aw-hits');
  for (const s of [back, hits]) {
    s.setAttribute('viewBox', '0 0 1254 1254');
    s.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    s.setAttribute('aria-hidden', 'true');
  }

  back.innerHTML = `
<defs>
  <clipPath id="sky${uid}"><ellipse cx="${P.sky.cx}" cy="${P.sky.cy}" rx="${P.sky.rx}" ry="${P.sky.ry}"/></clipPath>
  <clipPath id="scr${uid}"><rect x="${P.screen.x}" y="${P.screen.y}" width="${P.screen.w}" height="${P.screen.h}" rx="10"/></clipPath>
  <radialGradient id="warm${uid}">
    <stop offset="0" stop-color="#FFD9A0" stop-opacity=".85"/>
    <stop offset="55%" stop-color="#FFC46B" stop-opacity=".26"/>
    <stop offset="100%" stop-color="#FFB347" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="beam${uid}">
    <stop offset="0" stop-color="#EAF6FF" stop-opacity=".45"/>
    <stop offset="100%" stop-color="#EAF6FF" stop-opacity="0"/>
  </radialGradient>
</defs>

<!-- 窗外:捲雲會飄 -->
<g clip-path="url(#sky${uid})"><g data-r="clouds" fill="#FFFFFF" opacity=".62"></g></g>

<!-- 窗口灑到地上的那攤光 -->
<ellipse cx="230" cy="985" rx="330" ry="175" fill="url(#beam${uid})"/>

<!-- 控制台螢幕:準星會轉、長條圖會跳、有一條掃描線 -->
<g clip-path="url(#scr${uid})">
  <g data-r="cross" fill="none" stroke="#7FE3FF" stroke-width="3" opacity=".9">
    <circle cx="${P.cross.x}" cy="${P.cross.y}" r="${P.cross.r}"/>
    <path d="M${P.cross.x - P.cross.r - 9},${P.cross.y} h${P.cross.r * 2 + 18}
             M${P.cross.x},${P.cross.y - P.cross.r - 9} v${P.cross.r * 2 + 18}"/>
  </g>
  <g data-r="bars" fill="#8FE7FF"></g>
  <rect data-r="scan" x="${P.screen.x}" y="${P.screen.y}" width="${P.screen.w}" height="16"
        fill="#BFF2FF" opacity=".16"/>
</g>

<!-- 牆上那面小螢幕:一條慢慢走的進度 -->
<rect data-r="panel" x="${P.panel.x}" y="${P.panel.y + P.panel.h - 9}" width="10" height="6" rx="3"
      fill="#EAF9FF" opacity=".9"/>

<!-- 檯燈的暖光。可以關,關掉工作檯那一側會暗一階(避開角色站的位置) -->
<circle data-r="glow" cx="${P.lamp.x}" cy="${P.lamp.y + 55}" r="150" fill="url(#warm${uid})"/>
<rect data-r="dim" x="880" y="560" width="374" height="694" fill="#0B1A33" opacity="0"/>

<!-- 右下機台的指示燈 -->
<rect data-r="led" x="${P.led.x}" y="${P.led.y}" width="${P.led.w}" height="${P.led.h}" rx="13"
      fill="#9BE9FF" opacity=".55"/>

<!-- 海報上那隻機器人也會眨眼 -->
<g data-r="blink" fill="#2E6FC4" opacity="0">
  <circle cx="${P.poster.l[0]}" cy="${P.poster.l[1]}" r="${P.poster.rr}"/>
  <circle cx="${P.poster.r[0]}" cy="${P.poster.r[1]}" r="${P.poster.rr}"/>
</g>`;

  hits.innerHTML = `
<g data-r="motes" fill="#FFFFFF" opacity=".5"></g>
<g data-r="steam" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".5"></g>
<g data-r="leaves" fill="#4E9C3F"></g>
<g data-r="spots"></g>`;

  root.appendChild(back);
  root.appendChild(hits);

  const q = (n) => (back.querySelector(`[data-r="${n}"]`) || hits.querySelector(`[data-r="${n}"]`));
  const el = {
    clouds: q('clouds'), cross: q('cross'), bars: q('bars'), scan: q('scan'), panel: q('panel'),
    glow: q('glow'), dim: q('dim'), led: q('led'), blink: q('blink'),
    motes: q('motes'), steam: q('steam'), leaves: q('leaves'), spots: q('spots'),
  };

  // ---- 建立會動的零件 ----
  // 只放三條,而且都待在天空上半段 —— 下半段是城市天際線,捲雲壓在樓頂上會很假
  const clouds = [0, 1, 2].map((i) => {
    const c = { x: -260 + i * 210 + rand() * 70, y: 126 + i * 62 + rand() * 22,
      sp: 7 + rand() * 5, s: 0.75 + rand() * 0.5 };
    c.el = document.createElementNS(NS, 'g');
    c.el.innerHTML = wisp(i * 7 + 3);
    el.clouds.appendChild(c.el);
    return c;
  });
  const motes = Array.from({ length: 7 }, () => {
    const m = { x: 60 + rand() * 300, y: 320 + rand() * 520, ph: rand() * 6.28, sp: 5 + rand() * 6 };
    m.el = document.createElementNS(NS, 'circle');
    m.el.setAttribute('r', '3.2');
    el.motes.appendChild(m.el);
    return m;
  });
  const barEls = [0, 1, 2, 3].map((i) => {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', P.bars.x + i * (P.bars.w / 4));
    r.setAttribute('width', P.bars.w / 4 - 5);
    el.bars.appendChild(r);
    return r;
  });
  const steamEls = [0, 1, 2].map(() => {
    const p = document.createElementNS(NS, 'path');
    el.steam.appendChild(p);
    return p;
  });

  // ---- 命中範圍:只有這幾塊收得到指標事件 ----
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
    el.spots.appendChild(r);
  });

  // ---- 狀態 ----
  const fs = FrameStep(12);
  let t0 = null, T = 0;
  let gustT = -1, lampOn = true, lampT = 1, puffT = -1, spikeT = -1, buzzT = -1, winkT = -1;
  const leaves = [];

  function gust() {
    gustT = 0;
    for (let i = 0; i < 7; i++) {
      leaves.push({
        x: P.plant.x - 30 + rand() * 60, y: P.plant.y - 40 + rand() * 60,
        vx: 120 + rand() * 190, vy: -40 + rand() * 70, rot: rand() * 360,
        sp: (rand() - 0.5) * 420, life: 0, max: 2.2 + rand() * 1.1, el: null,
      });
    }
  }
  const ACT = {
    window: gust,
    lamp: () => { lampOn = !lampOn; },
    mug: () => { puffT = 0; },
    console: () => { spikeT = 0; },
    machine: () => { buzzT = 0; },
    poster: () => { winkT = 0; },
  };
  function poke(k) {
    const spot = SPOTS.find((s) => s.k === k);
    if (!spot) return;
    ACT[k]();
    if (onPoke) onPoke(k, spot.look);
  }

  function onClick(ev) {
    const k = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-spot');
    if (!k) return;
    ev.stopPropagation();          // 戳房間就不要同時觸發「點畫面 Allen 揮手」
    poke(k);
  }
  hits.addEventListener('click', onClick);

  // ---- 每幀 ----
  const off = raf((now) => {
    if (t0 === null) t0 = now;
    const dt = clamp(now - t0, 0, 0.05);
    t0 = now; T += dt;

    if (gustT >= 0) { gustT += dt; if (gustT > 2.6) gustT = -1; }
    if (puffT >= 0) { puffT += dt; if (puffT > 2.2) puffT = -1; }
    if (spikeT >= 0) { spikeT += dt; if (spikeT > 1.6) spikeT = -1; }
    if (buzzT >= 0) { buzzT += dt; if (buzzT > 1.1) buzzT = -1; }
    if (winkT >= 0) { winkT += dt; if (winkT > 0.5) winkT = -1; }
    lampT += ((lampOn ? 1 : 0) - lampT) * clamp(dt * 6, 0, 1);

    // 風:陣風時雲跑快三倍
    const wind = gustT >= 0 ? 1 + 2.2 * Math.sin((gustT / 2.6) * Math.PI) : 1;
    clouds.forEach((c) => {
      c.x += c.sp * wind * dt;
      if (c.x > 340) c.x = -260 - rand() * 120;
    });
    motes.forEach((m) => {
      m.x += m.sp * 0.35 * wind * dt;
      m.y -= m.sp * 0.5 * dt;
      if (m.y < 280 || m.x > 400) { m.x = 40 + rand() * 260; m.y = 760 + rand() * 160; }
    });
    for (let i = leaves.length - 1; i >= 0; i--) {
      const lf = leaves[i];
      lf.life += dt;
      lf.x += lf.vx * dt; lf.y += lf.vy * dt; lf.vy += 110 * dt; lf.rot += lf.sp * dt;
      if (lf.life > lf.max || lf.x > 1330) {
        if (lf.el) lf.el.remove();
        leaves.splice(i, 1);
      } else if (!lf.el) {
        lf.el = document.createElementNS(NS, 'path');
        lf.el.setAttribute('d', 'M0,0 C11,-13 30,-13 38,0 C30,13 11,13 0,0 Z');
        el.leaves.appendChild(lf.el);
      }
    }

    // ═══ 只在 12 格/秒的格子邊界重畫 ═══
    if (!fs.step(dt)) return;

    clouds.forEach((c) => c.el.setAttribute('transform',
      `translate(${r1(c.x)},${r1(c.y)}) scale(${r1(c.s)})`));
    motes.forEach((m) => {
      m.el.setAttribute('cx', r1(m.x + Math.sin(T * 0.8 + m.ph) * 9));
      m.el.setAttribute('cy', r1(m.y));
    });
    leaves.forEach((lf) => lf.el && lf.el.setAttribute('transform',
      `translate(${r1(lf.x)},${r1(lf.y)}) rotate(${r1(lf.rot)})`));

    // 控制台螢幕
    const boost = spikeT >= 0 ? 1 + 1.5 * (1 - spikeT / 1.6) : 1;
    el.cross.setAttribute('transform',
      `rotate(${r1((T * 22 * boost) % 360)},${P.cross.x},${P.cross.y})`);
    barEls.forEach((b, i) => {
      const v = (0.35 + 0.32 * (Math.sin(T * (1.5 + i * 0.55) + i * 1.9) * 0.5 + 0.5)) * boost;
      const h = clamp(v, 0.08, 1) * 68;
      b.setAttribute('y', r1(P.bars.y - h));
      b.setAttribute('height', r1(h));
    });
    el.scan.setAttribute('y', r1(P.screen.y + ((T * 110 * boost) % (P.screen.h + 16)) - 16));

    // 牆上小螢幕的進度條
    el.panel.setAttribute('width', r1(10 + ((T * 12) % (P.panel.w - 10))));

    // 檯燈
    el.glow.setAttribute('opacity', r1(lampT * (0.82 + 0.18 * Math.sin(T * 2.4))));
    el.dim.setAttribute('opacity', r1((1 - lampT) * 0.2));

    // 蒸氣:平常一縷,戳一下噴一大股
    const puff = puffT >= 0 ? 1 + 1.9 * (1 - puffT / 2.2) : 1;
    steamEls.forEach((p, i) => {
      const rise = (((T * 0.85 + i * 0.62) % 1) * 86 + 12) * puff;
      const w = 16 * puff, x = P.mug.x - 16 + i * 16, y = P.mug.y - rise;
      p.setAttribute('d', `M${r1(x)},${r1(y + rise * 0.55)} `
        + `C${r1(x - w)},${r1(y + rise * 0.3)} ${r1(x + w)},${r1(y + rise * 0.12)} ${r1(x)},${r1(y)}`);
      p.setAttribute('opacity', r1(clamp(0.5 - rise / 190, 0, 0.5) * puff));
    });

    // 指示燈:平常慢慢呼吸,戳一下狂閃
    el.led.setAttribute('opacity', buzzT >= 0
      ? (Math.floor(buzzT * 18) % 2 ? 1 : 0.15)
      : r1(0.42 + 0.3 * (Math.sin(T * 1.9) * 0.5 + 0.5)));
    el.led.setAttribute('x', r1(P.led.x + (buzzT >= 0 ? (rand() - 0.5) * 5 : 0)));

    // 海報那隻:自己偶爾眨,戳了也眨
    el.blink.setAttribute('opacity', (winkT >= 0 && winkT < 0.22) || (T % 9) < 0.16 ? 1 : 0);
  });

  return {
    gust,
    poke,
    /** 給驗收用 */
    get lampOn() { return lampOn; },
    get spots() { return SPOTS.map((s) => s.k); },
    destroy() {
      off && off();
      hits.removeEventListener('click', onClick);
      try { back.remove(); } catch (e) { /* 殼層已清 */ }
      try { hits.remove(); } catch (e) { /* 殼層已清 */ }
    },
  };
}
