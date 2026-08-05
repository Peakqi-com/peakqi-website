// allen-act1.js — Allen 小劇場第一幕:機器啄木鳥 × 大頭貼機器人(Marvel/普普風)
// 契約:createAct(stage, api) → { destroy() };動畫一律走 api.raf(共享 rAF,t 為秒),零計時器。
// 迴圈:2–4 隻機器啄木鳥(鉚釘、彈簧脖、鑽頭嘴)隨機從邊緣飛進,停在天線/耳機弧/眼鏡框/耳罩上啄,
//       頭殼冒火花 + TOK! 普普爆點,機器人越來越煩(壓眉、抿嘴、翻白眼、冒汗、冒蒸氣、怒氣線)。
//       點鳥 → 受驚「!?」沿弧線飛出畫面(帶速度線),機器人視線全程追蹤;
//       全趕走 → 鬆口氣(白手套擦汗 + 呼氣雲),隨機 4–10 秒後再度來襲(「又來了」)。
const NS = 'http://www.w3.org/2000/svg';

export function createAct(stage, api) {
  const R = api.rand;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = (u) => u * u * (3 - 2 * u);

  // ---------- 靜態舞台:普普放射線 + 半調網點 + 機器人大頭貼(頭佔 ~75%) ----------
  const rayCols = [['#FFD23F', .14], ['#FF6B2C', .11], ['#FF3B6B', .10]];
  let rays = '';
  for (let i = 0; i < 7; i++) {
    const a0 = (i * 360 / 7 - 90 + R() * 10) * Math.PI / 180, a1 = a0 + 13 * Math.PI / 180;
    const c = rayCols[i % 3];
    rays += `<polygon points="200,205 ${(200 + 330 * Math.cos(a0)).toFixed(1)},${(205 + 330 * Math.sin(a0)).toFixed(1)} ${(200 + 330 * Math.cos(a1)).toFixed(1)},${(205 + 330 * Math.sin(a1)).toFixed(1)}" fill="${c[0]}" opacity="${c[1]}"/>`;
  }
  const star = (n, r1, r2, off) => Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? r2 : r1, a = (off || 0) + i * Math.PI / n;
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

  stage.insertAdjacentHTML('afterbegin', `
<style id="a1-style">
@keyframes a1-spin{to{transform:rotate(360deg)}}
@keyframes a1-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
#a1-rays{transform-origin:200px 205px;animation:a1-spin 90s linear infinite}
#a1-bob{animation:a1-breathe 4.6s ease-in-out infinite}
#a1-svg [data-bird]{cursor:pointer}
#a1-svg text{font-family:'Space Grotesk','Noto Sans TC',sans-serif;font-weight:900}
</style>
<svg id="a1-svg" viewBox="0 0 400 400" role="img" aria-label="第一幕:機器啄木鳥騷擾 Allen 的機器人,點鳥幫他解圍" style="display:block;width:100%;height:100%;position:absolute;inset:0">
  <defs>
    <pattern id="a1-dotA" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.6" fill="#FF3B6B"/></pattern>
    <pattern id="a1-dotB" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.2" fill="#3E9BFF"/></pattern>
  </defs>
  <g id="a1-rays">${rays}</g>
  <circle cx="200" cy="218" r="176" fill="#FFD23F" opacity=".07"/>
  <circle cx="34" cy="34" r="140" fill="url(#a1-dotA)" opacity=".34"/>
  <circle cx="374" cy="380" r="140" fill="url(#a1-dotB)" opacity=".3"/>
  <g id="a1-bob"><g id="a1-head">
    <rect x="193" y="84" width="14" height="28" rx="7" fill="#3E9BFF" opacity=".8"/>
    <circle cx="200" cy="72" r="14" fill="#3E9BFF"/>
    <circle cx="195" cy="67" r="4.5" fill="#F2EFE8" opacity=".75"/>
    <rect x="50" y="104" width="300" height="280" rx="64" fill="#1C2430" stroke="#3E9BFF" stroke-width="9"/>
    <rect x="20" y="204" width="34" height="90" rx="16" fill="#1C2430" stroke="#3E9BFF" stroke-width="7"/>
    <rect x="346" y="204" width="34" height="90" rx="16" fill="#1C2430" stroke="#3E9BFF" stroke-width="7"/>
    <rect x="42" y="190" width="26" height="78" rx="13" fill="#3E9BFF"/>
    <rect x="332" y="190" width="26" height="78" rx="13" fill="#3E9BFF"/>
    <path d="M55 194Q200 76 345 194" fill="none" stroke="#3E9BFF" stroke-width="14" stroke-linecap="round"/>
    <circle cx="84" cy="332" r="6" fill="#141A22" stroke="#3E9BFF" stroke-width="3"/><path d="M80.5 332h7" stroke="#3E9BFF" stroke-width="2.5"/>
    <circle cx="316" cy="332" r="6" fill="#141A22" stroke="#3E9BFF" stroke-width="3"/><path d="M312.5 332h7" stroke="#3E9BFF" stroke-width="2.5"/>
    <path id="a1-browL" d="M96 202Q132 192 168 202" fill="none" stroke="#F2EFE8" stroke-width="9" stroke-linecap="round"/>
    <path id="a1-browR" d="M304 202Q268 192 232 202" fill="none" stroke="#F2EFE8" stroke-width="9" stroke-linecap="round"/>
    <rect x="88" y="218" width="88" height="66" rx="13" fill="#10151C" stroke="#F2EFE8" stroke-width="10"/>
    <rect x="224" y="218" width="88" height="66" rx="13" fill="#10151C" stroke="#F2EFE8" stroke-width="10"/>
    <path d="M176 250h48" stroke="#F2EFE8" stroke-width="10" stroke-linecap="round"/>
    <g id="a1-pupils"><ellipse id="a1-pupL" cx="132" cy="252" rx="13" ry="13" fill="#F2EFE8"/><ellipse id="a1-pupR" cx="268" cy="252" rx="13" ry="13" fill="#F2EFE8"/></g>
    <path id="a1-mouth" d="M158 324q42 28 84 0" fill="none" stroke="#F2EFE8" stroke-width="10" stroke-linecap="round"/>
    <g id="a1-sweat" opacity="0"><path d="M0 0C5 8 9 12 9 17A9 9 0 1 1 -9 17C-9 12 -5 8 0 0Z" fill="#3E9BFF"/></g>
    <g id="a1-annoy" opacity="0" stroke="#FF3B6B" stroke-width="6" stroke-linecap="round" fill="none">
      <path d="M330 96l-10 -16"/><path d="M346 90l2 -19"/><path d="M361 98l13 -14"/><path d="M369 114l18 -5"/>
    </g>
  </g></g>
  <g id="a1-birds"></g>
  <g id="a1-fx"></g>
</svg>`);

  const svg = stage.querySelector('#a1-svg');
  const styleEl = stage.querySelector('#a1-style');
  const headG = svg.querySelector('#a1-head');
  const browL = svg.querySelector('#a1-browL'), browR = svg.querySelector('#a1-browR');
  const mouth = svg.querySelector('#a1-mouth');
  const pupils = svg.querySelector('#a1-pupils');
  const pupL = svg.querySelector('#a1-pupL'), pupR = svg.querySelector('#a1-pupR');
  const sweat = svg.querySelector('#a1-sweat');
  const annoy = svg.querySelector('#a1-annoy');
  const birdsLayer = svg.querySelector('#a1-birds');
  const fxLayer = svg.querySelector('#a1-fx');

  // 停點:天線頂 / 耳機弧左右 / 眼鏡框左右上緣 / 左右耳罩(f:啄的朝向,0=隨機;smax:防出框的尺寸上限)
  const SLOTS = [
    { x: 200, y: 58, f: 0, smax: 0.92 },
    { x: 113, y: 148, f: -1, smax: 1.15 },
    { x: 287, y: 148, f: 1, smax: 1.15 },
    { x: 118, y: 212, f: -1, smax: 1.1 },
    { x: 282, y: 212, f: 1, smax: 1.1 },
    { x: 37, y: 190, f: -1, smax: 1.0 },
    { x: 363, y: 190, f: 1, smax: 1.0 }
  ];

  // ---------- 狀態 ----------
  const birds = [];       // 活鳥
  let pending = [];       // 本回合尚未進場的鳥 {slot, at}
  const fx = [];          // 火花/速度線/蒸氣等短命特效 {el, life, fn, t0}
  let lastT = null, dt = 0;
  let nextRoundAt = null, roundNum = 0, roundBumped = true;
  let mood = 0;           // 0 微笑 → 1 抓狂
  let shakeAmp = 0, nextSteam = 0;
  let gazeFlee = null, gazePeck = null;   // 視線目標 {x,y,until}
  let eyeX = 0, eyeY = 0;
  let blinkT = -9, nextBlink = 0, moodAttr = -1;

  const bez = (a, c, b2, u) => ({
    x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b2.x,
    y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b2.y,
    dx: 2 * (1 - u) * (c.x - a.x) + 2 * u * (b2.x - c.x),
    dy: 2 * (1 - u) * (c.y - a.y) + 2 * u * (b2.y - c.y)
  });
  const gazeOK = (g2, t) => !!g2 && t < g2.until;

  // ---------- 特效 ----------
  function addFx(el, life, fn) {
    if (fx.length > 30) return;
    fxLayer.appendChild(el);
    fx.push({ el, life, fn, t0: lastT === null ? 0 : lastT });
    fn(el, 0);
  }
  function spark(x, y) {   // 啄擊火花:四芒星 + 放射短線
    const g = document.createElementNS(NS, 'g');
    const c = R() < 0.5 ? '#FFD23F' : '#FF6B2C';
    g.innerHTML = '<polygon points="' + star(4, 9, 3.2, R() * 3) + '" fill="' + c + '"/>' +
      '<path d="M-12 -7l-6 -4M12 -7l6 -4M0 -14l0 -6" stroke="#F2EFE8" stroke-width="2.5" stroke-linecap="round"/>';
    addFx(g, 0.32, (el, u) => {
      el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (u * 50).toFixed(1) + ') scale(' + (0.45 + u * 1.05).toFixed(2) + ')');
      el.setAttribute('opacity', String(1 - u * u));
    });
  }
  function tok(x, y) {     // 普普爆點 TOK!
    const g = document.createElementNS(NS, 'g');
    const w = R() < 0.5 ? 'TOK!' : 'TIK!';
    const rot = ((R() * 2 - 1) * 16).toFixed(1);
    const cx = clamp(x, 36, 364), cy = clamp(y, 32, 368);
    g.innerHTML = '<polygon points="' + star(8, 24, 15, 0.3) + '" fill="#FFD23F" stroke="#090B0E" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<text y="5" text-anchor="middle" font-size="13" fill="#090B0E">' + w + '</text>';
    addFx(g, 0.6, (el, u) => {
      const s = u < 0.25 ? 0.5 + (u / 0.25) * 0.62 : 1.12 - 0.1 * ((u - 0.25) / 0.75);
      el.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') rotate(' + rot + ') scale(' + s.toFixed(2) + ')');
      el.setAttribute('opacity', String(u > 0.7 ? (1 - u) / 0.3 : 1));
    });
  }
  function startle(x, y) { // 受驚「!?」(也用在「又來了」)
    const g = document.createElementNS(NS, 'g');
    g.innerHTML = '<text text-anchor="middle" font-size="30" fill="#FFD23F" stroke="#090B0E" stroke-width="5" style="paint-order:stroke">!?</text>';
    const cx = clamp(x, 30, 370);
    addFx(g, 0.55, (el, u) => {
      el.setAttribute('transform', 'translate(' + cx.toFixed(1) + ' ' + clamp(y - u * 22, 26, 380).toFixed(1) + ') scale(' + (0.6 + ease(Math.min(u * 3, 1)) * 0.5).toFixed(2) + ')');
      el.setAttribute('opacity', String(u > 0.6 ? (1 - u) / 0.4 : 1));
    });
  }
  function speedLine(x, y, dx, dy) {  // 逃離速度線
    const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const len = 12 + R() * 10, off = (R() - 0.5) * 16;
    const ln = document.createElementNS(NS, 'line');
    ln.setAttribute('x1', (x - ux * 8 + uy * off).toFixed(1)); ln.setAttribute('y1', (y - uy * 8 - ux * off).toFixed(1));
    ln.setAttribute('x2', (x - ux * (8 + len) + uy * off).toFixed(1)); ln.setAttribute('y2', (y - uy * (8 + len) - ux * off).toFixed(1));
    ln.setAttribute('stroke', '#F2EFE8'); ln.setAttribute('stroke-width', '2.5'); ln.setAttribute('stroke-linecap', 'round');
    addFx(ln, 0.28, (el, u) => el.setAttribute('opacity', String(0.55 * (1 - u))));
  }
  function steam() {       // 頭頂蒸氣
    const g = document.createElementNS(NS, 'g');
    g.innerHTML = '<ellipse rx="8" ry="5.5" fill="#F2EFE8"/><ellipse cx="-7" cy="3" rx="5" ry="3.6" fill="#F2EFE8"/>';
    const x0 = 140 + R() * 120, drift = (R() - 0.5) * 26;
    addFx(g, 1.2, (el, u) => {
      el.setAttribute('transform', 'translate(' + (x0 + drift * u + Math.sin(u * 9) * 4).toFixed(1) + ' ' + (102 - 58 * u).toFixed(1) + ') scale(' + (0.8 + u).toFixed(2) + ')');
      el.setAttribute('opacity', String(0.5 * (1 - u)));
    });
  }
  function phew() {        // 鬆口氣的呼氣雲
    const g = document.createElementNS(NS, 'g');
    g.innerHTML = '<ellipse rx="13" ry="8" fill="#F2EFE8"/><ellipse cx="14" cy="3" rx="7" ry="5" fill="#F2EFE8"/>';
    addFx(g, 1.1, (el, u) => {
      el.setAttribute('transform', 'translate(' + (236 + 46 * u).toFixed(1) + ' ' + (326 - 14 * u).toFixed(1) + ') scale(' + (0.7 + 0.7 * u).toFixed(2) + ')');
      el.setAttribute('opacity', String(0.5 * (1 - u)));
    });
  }
  function fleck(x, y) {   // 擦汗時飛出的汗珠
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', (2.5 + R() * 2).toFixed(1)); c.setAttribute('fill', '#3E9BFF');
    const vx = (R() - 0.5) * 90, vy = -40 - R() * 50;
    addFx(c, 0.55, (el, u) => {
      el.setAttribute('cx', (x + vx * u).toFixed(1)); el.setAttribute('cy', (y + vy * u + 120 * u * u).toFixed(1));
      el.setAttribute('opacity', String(1 - u));
    });
  }
  function glove() {       // 米奇手套擦汗:進場 → 額頭來回一遍半 → 退場
    const g = document.createElementNS(NS, 'g');
    g.innerHTML =
      '<circle cx="-9" cy="-10" r="6.5" fill="#F2EFE8" stroke="#090B0E" stroke-width="3.5"/>' +
      '<circle cx="0" cy="-13" r="6.5" fill="#F2EFE8" stroke="#090B0E" stroke-width="3.5"/>' +
      '<circle cx="9" cy="-10" r="6.5" fill="#F2EFE8" stroke="#090B0E" stroke-width="3.5"/>' +
      '<circle cx="0" cy="0" r="13" fill="#F2EFE8" stroke="#090B0E" stroke-width="3.5"/>' +
      '<rect x="-10" y="8" width="20" height="12" rx="5" fill="#FF6B2C" stroke="#090B0E" stroke-width="3"/>';
    let lastFleck = 0;
    addFx(g, 1.9, (el, u) => {
      let x, y, r;
      if (u < 0.22) { const v = ease(u / 0.22); x = lerp(330, 268, v); y = lerp(430, 150, v); r = -12; }
      else if (u < 0.78) {
        const v = (u - 0.22) / 0.56;
        x = 210 + 58 * Math.cos(v * Math.PI * 3);
        y = 148 + 5 * Math.sin(v * Math.PI * 6);
        r = Math.cos(v * Math.PI * 3) * 14;
        if (lastT - lastFleck > 0.16) { lastFleck = lastT; fleck(x + (R() - 0.5) * 30, 140); }
      } else { const v = ease((u - 0.78) / 0.22); x = lerp(152, -80, v); y = lerp(148, 430, v); r = -20; }
      el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + r.toFixed(1) + ') scale(1.5)');
    });
  }

  // ---------- 鳥 ----------
  function mkBird() {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('data-bird', '1');
    g.setAttribute('data-state', 'in');
    const acc = ['#FF6B2C', '#FFD23F', '#FF3B6B'][Math.floor(R() * 3)];
    const crest = acc === '#FF3B6B' ? '#FFD23F' : '#FF3B6B';
    g.innerHTML =
      '<circle cx="-12" cy="-26" r="27" fill="#000" opacity="0" pointer-events="all"/>' +   // 透明命中區(≥32px)
      '<path d="M-6 0l2 -9M6 0l-2 -9" stroke="#090B0E" stroke-width="3" stroke-linecap="round"/>' +
      '<polygon points="15,-16 32,-8 18,-26" fill="' + acc + '" stroke="#090B0E" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<ellipse cx="2" cy="-18" rx="17" ry="13" fill="#F2EFE8" stroke="#090B0E" stroke-width="3.5"/>' +
      '<circle cx="-3" cy="-13" r="1.7" fill="#090B0E"/><circle cx="7" cy="-19" r="1.7" fill="#090B0E"/><circle cx="0" cy="-23" r="1.7" fill="#090B0E"/>' +
      '<g class="a1-wing"><path d="M6 -20q17 1 13 14q-15 5 -19 -6z" fill="' + acc + '" stroke="#090B0E" stroke-width="3" stroke-linejoin="round"/></g>' +
      '<g class="a1-hd">' +
        '<polyline points="-10,-25 -15,-28 -11,-32 -17,-35 -13,-38" fill="none" stroke="#090B0E" stroke-width="3.5"/>' +
        '<polygon points="-21,-49 -18,-59 -13,-48" fill="' + crest + '" stroke="#090B0E" stroke-width="2"/>' +
        '<circle cx="-19" cy="-41" r="8.5" fill="#F2EFE8" stroke="#090B0E" stroke-width="3"/>' +
        '<circle cx="-22.5" cy="-43" r="2" fill="#090B0E"/>' +
        '<polygon points="-27,-45 -45,-40 -27,-36" fill="#FFD23F" stroke="#090B0E" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M-33 -43.2l1.2 5.4M-38 -42l1 3.6" stroke="#090B0E" stroke-width="1.5"/>' +
      '</g>';
    birdsLayer.appendChild(g);
    return g;
  }
  function spawnBird(slot, t) {
    const edgeR = R();
    const from = edgeR < 0.35 ? { x: -70, y: 30 + R() * 220 }
      : edgeR < 0.7 ? { x: 470, y: 30 + R() * 220 }
        : { x: 40 + R() * 320, y: -70 };
    const to = { x: slot.x, y: slot.y };
    const g = mkBird();
    const b = {
      g, wing: g.querySelector('.a1-wing'), hd: g.querySelector('.a1-hd'),
      slot, s: Math.min(0.88 + R() * 0.3, slot.smax),
      flip: to.x > from.x ? -1 : 1, landFlip: slot.f || (R() < 0.5 ? 1 : -1),
      rot: 0, x: from.x, y: from.y, state: 'in', t0: t, from, to,
      ctrl: { x: (from.x + to.x) / 2 + (R() - 0.5) * 80, y: Math.min(from.y, to.y) - 60 - R() * 90 },
      dur: 0.9 + R() * 0.6, ph: R() * 7,
      rhythm: { p: 0.3 + R() * 0.32, n: 2 + Math.floor(R() * 2), rest: 0.35 + R() * 0.9 },
      peckT0: 0, fired: -1, pecks: 0, land: 0, lastLine: 0
    };
    g.setAttribute('transform', 'translate(' + from.x + ' ' + from.y + ') scale(' + (b.flip * b.s).toFixed(3) + ' ' + b.s.toFixed(3) + ')');
    birds.push(b);
  }
  function flightPose(b, p) {   // 飛行時朝向速度方向
    const ang = Math.atan2(p.dy, p.dx) * 180 / Math.PI;
    b.flip = p.dx > 0 ? -1 : 1;
    let r = b.flip === 1 ? ang - 180 : -ang;
    r = ((r + 540) % 360) - 180;
    b.rot = clamp(r, -38, 38) * 0.7;
  }
  function impact(b, t) {       // 一次啄擊命中:火花、震頭、加怒、視線瞄過去
    const th = b.rot * Math.PI / 180, lx = -50, ly = -38;
    const wx = b.x + b.flip * b.s * (lx * Math.cos(th) - ly * Math.sin(th));
    const wy = b.y + b.s * (lx * Math.sin(th) + ly * Math.cos(th));
    spark(wx, wy);
    shakeAmp = Math.min(3, shakeAmp + 1.6);
    mood = Math.min(1, mood + 0.012);
    gazePeck = { x: wx, y: wy, until: t + 0.9 };
    b.pecks++;
    if (b.pecks % (4 + Math.floor(R() * 4)) === 2) tok(wx, wy - 22);
  }
  function startFlee(b, t) {
    b.state = 'flee';
    b.g.setAttribute('data-state', 'flee');
    b.t0 = t;
    b.from = { x: b.x, y: b.y };
    const r3 = R();
    b.to = r3 < 0.42 ? { x: b.x < 200 ? -85 : 485, y: b.y - 50 - R() * 130 }
      : r3 < 0.72 ? { x: b.x < 200 ? 485 : -85, y: 30 + R() * 170 }
        : { x: clamp(b.x + (R() * 2 - 1) * 200, -60, 460), y: -85 };
    b.ctrl = { x: (b.x + b.to.x) / 2 + (R() - 0.5) * 60, y: Math.min(b.y, b.to.y) - 80 - R() * 80 };
    b.dur = 0.7 + R() * 0.3;
    b.lastLine = t;
    startle(b.x, b.y - 60 * b.s);
    gazeFlee = { x: b.x, y: b.y, until: t + b.dur + 0.5 };
  }
  function removeBird(b, t) {
    try { b.g.remove(); } catch (e) { /* 已被清 */ }
    const i = birds.indexOf(b);
    if (i >= 0) birds.splice(i, 1);
    if (!birds.length && !pending.length) {   // 全趕走:安靜 4–10 秒後再來
      nextRoundAt = t + 4 + R() * 6;
      if (mood > 0.4) { glove(); phew(); }
    }
  }
  function startRound(t) {
    roundNum++;
    roundBumped = roundNum === 1;   // 第 2 回合起,首隻落地觸發「又來了」
    const n = 2 + Math.floor(R() * 3);
    const order = SLOTS.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(R() * (i + 1)); const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }
    pending = order.slice(0, n).map((slot, i) => ({ slot, at: t + i * (0.25 + R() * 0.8) }));
  }

  // ---------- 主迴圈 ----------
  function frame(t) {
    if (lastT === null) { lastT = t; nextRoundAt = t + 0.5; }
    dt = clamp(t - lastT, 0, 0.05);
    lastT = t;

    if (!birds.length && !pending.length && t >= nextRoundAt) startRound(t);
    for (let i = pending.length - 1; i >= 0; i--) {
      if (t >= pending[i].at) { spawnBird(pending[i].slot, t); pending.splice(i, 1); }
    }

    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i];
      let sx = 1, sy = 1;
      if (b.state === 'in') {
        const u = (t - b.t0) / b.dur;
        if (u >= 1) {   // 落地:轉向停點朝向 + squash 彈跳,開始啄
          b.state = 'peck'; b.g.setAttribute('data-state', 'peck');
          b.x = b.to.x; b.y = b.to.y; b.flip = b.landFlip; b.rot = 0;
          b.land = t; b.peckT0 = t + 0.1 + R() * 0.25;
          if (!roundBumped) { roundBumped = true; mood = Math.max(mood, 0.42); startle(200, 92); }
        } else {
          const p = bez(b.from, b.ctrl, b.to, ease(u));
          b.x = p.x; b.y = p.y; flightPose(b, p);
          b.wing.setAttribute('transform', 'rotate(' + (Math.sin(t * 26 + b.ph) * 38).toFixed(1) + ' 6 -20)');
          b.hd.setAttribute('transform', '');
        }
      }
      if (b.state === 'peck') {
        const e2 = t - b.land;
        const q = Math.exp(-5 * e2) * Math.sin(14 * e2) * 0.22;
        sx = 1 + q; sy = 1 - q;
        let pulse = 0;
        const ph = t - b.peckT0;
        b.rot = Math.sin(t * 3 + b.ph) * 3;
        if (ph > 0) {   // tok-tok 節奏:n 連啄 + 歇口氣,節奏每隻都不同
          const rh = b.rhythm, cyc = rh.p * rh.n + rh.rest, pp = ph % cyc;
          if (pp < rh.p * rh.n) {
            const idx = Math.floor(pp / rh.p), u2 = pp / rh.p - idx;
            pulse = Math.pow(Math.sin(Math.PI * u2), 3);
            b.rot -= 26 * pulse;
            const key = Math.floor(ph / cyc) * 10 + idx;
            if (u2 > 0.45 && b.fired !== key) { b.fired = key; impact(b, t); }
          }
        }
        b.wing.setAttribute('transform', 'rotate(' + (pulse * 8).toFixed(1) + ' 6 -20)');
        b.hd.setAttribute('transform', 'translate(' + (-5 * pulse).toFixed(1) + ' ' + (2 * pulse).toFixed(1) + ')');
      }
      if (b.state === 'flee') {
        const u = (t - b.t0) / b.dur;
        if (u >= 1) { removeBird(b, t); continue; }
        const p = bez(b.from, b.ctrl, b.to, u * u);   // 加速逃離
        b.x = p.x; b.y = p.y; flightPose(b, p);
        const pop = 1 + 0.35 * Math.exp(-7 * (t - b.t0));
        sx = pop; sy = pop;
        b.wing.setAttribute('transform', 'rotate(' + (Math.sin(t * 42 + b.ph) * 46).toFixed(1) + ' 6 -20)');
        b.hd.setAttribute('transform', '');
        gazeFlee = { x: b.x, y: b.y, until: t + 0.5 };   // 機器人眼睛跟著逃走的鳥
        if (t - b.lastLine > 0.07 && u > 0.08) { b.lastLine = t; speedLine(b.x, b.y - 24 * b.s, p.dx, p.dy); }
      }
      b.g.setAttribute('transform', 'translate(' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + ') scale(' + (b.flip * b.s * sx).toFixed(3) + ' ' + (b.s * sy).toFixed(3) + ') rotate(' + b.rot.toFixed(1) + ')');
    }

    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i], u = (t - f.t0) / f.life;
      if (u >= 1) { try { f.el.remove(); } catch (e) { /* noop */ } fx.splice(i, 1); }
      else f.fn(f.el, u);
    }

    // 心情:被啄越久越煩;沒鳥就快速回復微笑
    const npeck = birds.reduce((n2, b) => n2 + (b.state === 'peck' ? 1 : 0), 0);
    if (npeck) mood = Math.min(1, mood + dt * (0.06 + 0.045 * npeck));
    else mood = Math.max(0, mood - dt * 0.4);
    const m = mood;
    browL.setAttribute('d', 'M96 ' + (202 - 5 * m).toFixed(1) + 'Q132 ' + (192 + 6 * m).toFixed(1) + ' 168 ' + (202 + 16 * m).toFixed(1));
    browR.setAttribute('d', 'M304 ' + (202 - 5 * m).toFixed(1) + 'Q268 ' + (192 + 6 * m).toFixed(1) + ' 232 ' + (202 + 16 * m).toFixed(1));
    mouth.setAttribute('d', 'M158 ' + (324 + 8 * m).toFixed(1) + 'q42 ' + (28 - 56 * m).toFixed(1) + ' 84 0');
    const swOp = clamp((m - 0.5) * 2.5, 0, 1);   // 汗滴沿太陽穴滑落
    if (swOp > 0) {
      const cyc = (t * 22) % 30;
      sweat.setAttribute('opacity', (swOp * (1 - cyc / 34)).toFixed(2));
      sweat.setAttribute('transform', 'translate(326 ' + (158 + cyc).toFixed(1) + ')');
    } else sweat.setAttribute('opacity', '0');
    annoy.setAttribute('opacity', m > 0.7 ? ((0.35 + 0.35 * Math.sin(t * 7)) * clamp((m - 0.7) / 0.3, 0, 1)).toFixed(2) : '0');
    if (m > 0.62 && t > nextSteam) { nextSteam = t + 0.35 + R() * 0.35; steam(); }
    shakeAmp *= Math.exp(-dt * 7);
    const sa = shakeAmp + (m > 0.9 ? 0.5 : 0);
    headG.setAttribute('transform', 'translate(' + (Math.sin(t * 71) * sa).toFixed(2) + ' ' + (Math.cos(t * 57) * sa * 0.6).toFixed(2) + ')');

    // 視線:逃鳥 > 啄擊點 > 抓狂翻白眼 > 悠閒亂看
    let des;
    if (gazeOK(gazeFlee, t)) des = { x: clamp((gazeFlee.x - 200) * 0.085, -15, 15), y: clamp((gazeFlee.y - 250) * 0.085, -11, 12) };
    else if (m > 0.86) des = { x: 0, y: -11 + Math.sin(t * 2.2) * 2 };
    else if (gazeOK(gazePeck, t)) des = { x: clamp((gazePeck.x - 200) * 0.085, -15, 15), y: clamp((gazePeck.y - 250) * 0.085, -11, 12) };
    else des = { x: Math.sin(t * 0.5) * 7, y: Math.sin(t * 0.33) * 4 };
    eyeX += (des.x - eyeX) * Math.min(1, dt * 9);
    eyeY += (des.y - eyeY) * Math.min(1, dt * 9);
    pupils.setAttribute('transform', 'translate(' + eyeX.toFixed(2) + ' ' + eyeY.toFixed(2) + ')');
    if (t > nextBlink) { blinkT = t; nextBlink = t + 2.2 + R() * 3.4; }
    const be2 = t - blinkT;
    const ry = be2 < 0.14 ? 13 * (1 - 0.88 * Math.sin(be2 / 0.14 * Math.PI)) : 13;
    pupL.setAttribute('ry', ry.toFixed(1)); pupR.setAttribute('ry', ry.toFixed(1));
    if (Math.abs(m - moodAttr) > 0.02) { moodAttr = m; svg.setAttribute('data-mood', m.toFixed(2)); }
  }

  // ---------- 互動與收尾 ----------
  function onPointer(e) {
    const el = e.target;
    const g = el && el.closest ? el.closest('[data-bird]') : null;
    if (!g) return;
    const b = birds.find((x) => x.g === g);
    if (!b || b.state === 'flee') return;
    startFlee(b, lastT === null ? 0 : lastT);
  }
  svg.addEventListener('pointerdown', onPointer);
  const offRaf = api.raf(frame);

  return {
    destroy() {
      offRaf();
      svg.removeEventListener('pointerdown', onPointer);
      try { svg.remove(); } catch (e) { /* 殼層已清 */ }
      try { styleEl.remove(); } catch (e) { /* 殼層已清 */ }
    }
  };
}
