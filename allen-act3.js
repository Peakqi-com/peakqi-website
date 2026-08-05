// Allen 第三幕:全身音樂機器人(Marvel/普普風)
// 三顆音樂晶片 → 三種合成音樂 × 三種舞步 × 三個腦內想像場景:
//   平靜(60bpm pad+鐘聲)→ 草原躺平蹺腳,眼鏡反光天空
//   DISCO(120bpm kick/hihat/八度 bass)→ 鏡球降下、光楔掃射、指天指地
//   華爾滋(3/4 拍 90bpm oom-pah-pah)→ 舞廳吊燈塵光、自轉圓舞+殘影
// 鐵則:預設完全無聲,只有使用者手勢(pointerdown/鍵盤 click)才 api.audio.ensure();
//        全部 oscillator/noise 合成、總音量 master gain 0.13;共享 rAF;destroy 全清。
export function createAct(stage, api) {
  const rnd = api.rand;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const normDeg = (d) => ((d % 360) + 540) % 360 - 180;

  // ---------- 普普風放射星芒(開場漫畫音效框) ----------
  const star = (n, r1, r2) => {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1, a = Math.PI * i / n - Math.PI / 2;
      d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1);
    }
    return d + 'Z';
  };

  // ---------- 舞台 DOM(SVG 場景 + 晶片按鈕;不動右下三顆切換點) ----------
  const root = document.createElement('div');
  root.className = 'a3-root';
  root.innerHTML = `
<style>
.a3-root{position:absolute;inset:0}
.a3-root svg{display:block;width:100%;height:100%}
.a3-sc{transition:opacity .55s ease}
.a3-ghost{transition:opacity .35s ease}
.a3-ui{position:absolute;left:8px;bottom:8px;right:74px;display:flex;flex-wrap:wrap-reverse;gap:5px;z-index:5}
.a3-chip{appearance:none;-webkit-appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:3px;min-height:36px;min-width:36px;padding:0 7px;border-radius:9px;border:2px solid var(--c,#F2EFE8);background:rgba(9,11,14,.62);color:#F2EFE8;font:700 10px/1 'Space Grotesk','Noto Sans TC',sans-serif;letter-spacing:.03em;cursor:pointer;transition:transform .15s ease,background .2s,color .2s,box-shadow .2s;touch-action:manipulation}
.a3-chip:active{transform:scale(.93)}
.a3-chip.on{background:var(--c);color:#090B0E;transform:translateY(-2px);box-shadow:0 3px 0 rgba(9,11,14,.5)}
</style>
<svg viewBox="0 0 200 200" role="img" aria-label="Allen 的音樂機器人:點晶片播不同音樂,機器人跳不同舞">
<defs>
  <pattern id="a3ht" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.15" fill="#090B0E"/></pattern>
  <pattern id="a3htb" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.3" fill="#3E9BFF"/></pattern>
  <radialGradient id="a3glow"><stop offset="0" stop-color="#FFD23F" stop-opacity=".55"/><stop offset="1" stop-color="#FFD23F" stop-opacity="0"/></radialGradient>
  <clipPath id="a3lens"><rect x="-18" y="-9" width="15" height="12" rx="3"/><rect x="3" y="-9" width="15" height="12" rx="3"/></clipPath>
</defs>

<g class="a3-sc a3-sc-stage">
  <circle cx="100" cy="98" r="64" fill="#3E9BFF" opacity=".05"/>
  <circle cx="100" cy="98" r="64" fill="none" stroke="#3E9BFF" stroke-width="1.5" opacity=".1"/>
  <g class="a3-idlerays" opacity=".08"></g>
  <ellipse cx="100" cy="159" rx="44" ry="7" fill="#10151C" stroke="#3E9BFF" stroke-opacity=".3" stroke-width="2"/>
</g>

<g class="a3-sc a3-sc-meadow" style="opacity:0">
  <rect width="200" height="200" fill="#F2EFE8"/>
  <g class="a3-rays"></g>
  <circle class="a3-sun" cx="146" cy="50" r="20" fill="#FFD23F" stroke="#FF6B2C" stroke-width="3.5"/>
  <rect y="118" width="200" height="82" fill="#65E0BC"/>
  <rect y="150" width="200" height="50" fill="#4ECBA5"/>
  <rect y="118" width="200" height="82" fill="url(#a3ht)" opacity=".07"/>
  <g class="a3-flower"><line x1="30" y1="146" x2="30" y2="136" stroke="#090B0E" stroke-width="1.8"/><circle cx="30" cy="133" r="3.4" fill="#FF3B6B" stroke="#090B0E" stroke-width="1.6"/></g>
  <g class="a3-flower"><line x1="174" y1="140" x2="174" y2="131" stroke="#090B0E" stroke-width="1.8"/><circle cx="174" cy="128" r="2.8" fill="#FF6B2C" stroke="#090B0E" stroke-width="1.6"/></g>
  <g class="a3-clouds"></g>
</g>

<g class="a3-sc a3-sc-disco" style="opacity:0">
  <rect width="200" height="200" fill="#0A0C12"/>
  <rect width="200" height="110" fill="url(#a3htb)" opacity=".1"/>
  <rect y="148" width="200" height="52" fill="#12161D"/>
  <g class="a3-tiles"></g>
  <g class="a3-ballrig">
    <line x1="0" y1="-70" x2="0" y2="-13" stroke="#8FA6BF" stroke-width="1.6"/>
    <circle r="13" fill="#202833" stroke="#F2EFE8" stroke-width="2"/>
    <path d="M-13 0h26M-11.3 -6.5h22.6M-11.3 6.5h22.6" stroke="#8FA6BF" stroke-width="1.1"/>
    <path d="M0 -13v26M-6.5 -11.3q-2.6 11.3 0 22.6M6.5 -11.3q2.6 11.3 0 22.6" stroke="#8FA6BF" stroke-width="1.1" fill="none"/>
    <g class="a3-beams" opacity=".13">
      <path d="M0 0L-5 96L5 96Z" fill="#F2EFE8"/><path d="M0 0L-5 96L5 96Z" fill="#F2EFE8" transform="rotate(120)"/><path d="M0 0L-5 96L5 96Z" fill="#F2EFE8" transform="rotate(-120)"/>
    </g>
    <g class="a3-glints"><rect x="-2" y="-11" width="4" height="3" fill="#F2EFE8"/><rect x="6" y="2" width="4" height="3" fill="#F2EFE8" opacity=".8"/><rect x="-9" y="4" width="4" height="3" fill="#F2EFE8" opacity=".7"/></g>
    <g class="a3-sparks">
      <path class="a3-spark" d="M0 -3L1 0L0 3L-1 0Z M-3 0L0 -1L3 0L0 1Z" fill="#F2EFE8" transform="translate(-19,-8)"/>
      <path class="a3-spark" d="M0 -3L1 0L0 3L-1 0Z M-3 0L0 -1L3 0L0 1Z" fill="#FFD23F" transform="translate(20,-4)"/>
      <path class="a3-spark" d="M0 -3L1 0L0 3L-1 0Z M-3 0L0 -1L3 0L0 1Z" fill="#FF3B6B" transform="translate(14,14)"/>
    </g>
  </g>
</g>

<g class="a3-sc a3-sc-ball" style="opacity:0">
  <rect width="200" height="200" fill="#140D12"/>
  <path d="M22 122V56q8-18 16 0v66" fill="none" stroke="#FFD23F" stroke-width="2" opacity=".16"/>
  <path d="M92 122V50q8-18 16 0v72" fill="none" stroke="#FFD23F" stroke-width="2" opacity=".16"/>
  <path d="M162 122V56q8-18 16 0v66" fill="none" stroke="#FFD23F" stroke-width="2" opacity=".16"/>
  <rect y="150" width="200" height="50" fill="#1D1218"/>
  <g class="a3-chan" transform="translate(58,18)">
    <line x1="0" y1="-20" x2="0" y2="0" stroke="#FFD23F" stroke-width="2"/>
    <path d="M-14 4Q0 16 14 4" fill="none" stroke="#FFD23F" stroke-width="2.4"/>
    <rect x="-15.5" y="0" width="3" height="6" fill="#F2EFE8"/><rect x="-1.5" y="6" width="3" height="6" fill="#F2EFE8"/><rect x="12.5" y="0" width="3" height="6" fill="#F2EFE8"/>
    <ellipse class="a3-flame" cx="-14" cy="-3" rx="2" ry="3.2" fill="#FFD23F"/><ellipse class="a3-flame" cx="0" cy="3" rx="2" ry="3.2" fill="#FFD23F"/><ellipse class="a3-flame" cx="14" cy="-3" rx="2" ry="3.2" fill="#FFD23F"/>
    <circle class="a3-halo" r="26" fill="url(#a3glow)"/>
  </g>
  <g class="a3-chan" transform="translate(142,18)">
    <line x1="0" y1="-20" x2="0" y2="0" stroke="#FFD23F" stroke-width="2"/>
    <path d="M-14 4Q0 16 14 4" fill="none" stroke="#FFD23F" stroke-width="2.4"/>
    <rect x="-15.5" y="0" width="3" height="6" fill="#F2EFE8"/><rect x="-1.5" y="6" width="3" height="6" fill="#F2EFE8"/><rect x="12.5" y="0" width="3" height="6" fill="#F2EFE8"/>
    <ellipse class="a3-flame" cx="-14" cy="-3" rx="2" ry="3.2" fill="#FFD23F"/><ellipse class="a3-flame" cx="0" cy="3" rx="2" ry="3.2" fill="#FFD23F"/><ellipse class="a3-flame" cx="14" cy="-3" rx="2" ry="3.2" fill="#FFD23F"/>
    <circle class="a3-halo" r="26" fill="url(#a3glow)"/>
  </g>
  <ellipse cx="58" cy="156" rx="30" ry="6" fill="url(#a3glow)" opacity=".35"/>
  <ellipse cx="142" cy="156" rx="30" ry="6" fill="url(#a3glow)" opacity=".35"/>
</g>

<ellipse class="a3-shadow" cx="100" cy="158.5" rx="24" ry="4" fill="#090B0E" opacity=".32"/>
<g class="a3-ghosts"><use href="#a3rb" class="a3-ghost" opacity="0"/><use href="#a3rb" class="a3-ghost" opacity="0"/><use href="#a3rb" class="a3-ghost" opacity="0"/></g>

<g class="a3-rot" transform="translate(100,125)">
  <g id="a3rb">
    <g class="a3-legL"><rect x="-12" y="2" width="8" height="24" rx="4" fill="#1C2430" stroke="#3E9BFF" stroke-width="2.5"/><rect x="-15" y="25" width="14" height="8" rx="4" fill="#090B0E" stroke="#3E9BFF" stroke-width="2.5"/></g>
    <g class="a3-legR"><rect x="4" y="2" width="8" height="24" rx="4" fill="#1C2430" stroke="#3E9BFF" stroke-width="2.5"/><rect x="1" y="25" width="14" height="8" rx="4" fill="#090B0E" stroke="#3E9BFF" stroke-width="2.5"/></g>
    <path class="a3-skirt" d="M-16 -4Q0 2 16 -4L22 20Q14 28 7 26Q0 31 -7 26Q-14 28 -22 20Z" fill="#FF3B6B" stroke="#090B0E" stroke-width="2" opacity="0"/>
    <g class="a3-tor">
      <rect x="-19" y="-36" width="38" height="40" rx="10" fill="#1C2430" stroke="#3E9BFF" stroke-width="3"/>
      <rect x="-12" y="-27" width="24" height="18" rx="4" fill="#10151C" stroke="#3E9BFF" stroke-width="2"/>
      <rect class="a3-eq" x="-9" y="-14" width="4" height="3" fill="#65E0BC"/>
      <rect class="a3-eq" x="-2" y="-14" width="4" height="3" fill="#FFD23F"/>
      <rect class="a3-eq" x="5" y="-14" width="4" height="3" fill="#FF3B6B"/>
      <g class="a3-armL"><rect x="-25" y="-32" width="7" height="27" rx="3.5" fill="#1C2430" stroke="#3E9BFF" stroke-width="2.5"/><circle cx="-21.5" cy="-2" r="5" fill="#F2EFE8" stroke="#3E9BFF" stroke-width="2.5"/></g>
      <g class="a3-armR"><rect x="18" y="-32" width="7" height="27" rx="3.5" fill="#1C2430" stroke="#3E9BFF" stroke-width="2.5"/><circle cx="21.5" cy="-2" r="5" fill="#F2EFE8" stroke="#3E9BFF" stroke-width="2.5"/></g>
      <rect x="-5" y="-42" width="10" height="9" rx="3" fill="#1C2430" stroke="#3E9BFF" stroke-width="2.5"/>
      <g class="a3-hd" transform="translate(0,-53)">
        <circle cx="0" cy="-32" r="3.2" fill="#3E9BFF"/><rect x="-1.6" y="-30" width="3.2" height="8" rx="1.6" fill="#3E9BFF" opacity=".75"/>
        <rect x="-26" y="-23" width="52" height="46" rx="11" fill="#1C2430" stroke="#3E9BFF" stroke-width="3"/>
        <rect x="-35" y="-6" width="6" height="15" rx="3" fill="#1C2430" stroke="#3E9BFF" stroke-width="2.5"/>
        <rect x="29" y="-6" width="6" height="15" rx="3" fill="#1C2430" stroke="#3E9BFF" stroke-width="2.5"/>
        <rect x="-31" y="-9" width="5" height="13" rx="2.5" fill="#3E9BFF"/>
        <rect x="26" y="-9" width="5" height="13" rx="2.5" fill="#3E9BFF"/>
        <path d="M-27 -10Q0 -25 27 -10" stroke="#3E9BFF" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <rect x="-18" y="-9" width="15" height="12" rx="3" fill="none" stroke="#F2EFE8" stroke-width="2.5"/>
        <rect x="3" y="-9" width="15" height="12" rx="3" fill="none" stroke="#F2EFE8" stroke-width="2.5"/>
        <path d="M-3 -3h6" stroke="#F2EFE8" stroke-width="2.5"/>
        <g class="a3-glare" clip-path="url(#a3lens)" opacity="0">
          <rect x="-19" y="-10" width="38" height="14" fill="#3E9BFF" opacity=".5"/>
          <circle class="a3-glcloud" cx="0" cy="-5" r="3.2" fill="#F2EFE8" opacity=".9"/>
          <rect class="a3-glbar" x="-3" y="-16" width="4" height="26" fill="#F2EFE8" opacity=".55" transform="rotate(22)"/>
        </g>
        <g class="a3-eyes"><circle cx="-10.5" cy="-3" r="2.6" fill="#F2EFE8"/><circle cx="10.5" cy="-3" r="2.6" fill="#F2EFE8"/></g>
        <path class="a3-mouth" d="M-9 11Q0 18 9 11" stroke="#F2EFE8" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  </g>
</g>

<g class="a3-sc a3-scf-meadow" style="opacity:0"><g class="a3-blades"></g></g>
<g class="a3-sc a3-scf-disco" style="opacity:0"><g class="a3-wedges" opacity=".24"></g><g class="a3-wedges2" opacity=".16"></g></g>
<g class="a3-sc a3-scf-ball" style="opacity:0"><g class="a3-dust"></g></g>
<g class="a3-notes"></g>
<g class="a3-burst" style="opacity:0"><path class="a3-bstar" d="${star(12, 25, 16)}" stroke="#090B0E" stroke-width="2"/><text class="a3-btxt" text-anchor="middle" dominant-baseline="middle" font-family="'Space Grotesk','Noto Sans TC',sans-serif" font-weight="900" font-size="10"></text></g>
</svg>
<div class="a3-ui" role="group" aria-label="音樂晶片">
  <button type="button" class="a3-chip" data-song="calm" style="--c:#65E0BC">〜 平靜</button>
  <button type="button" class="a3-chip" data-song="disco" style="--c:#FF3B6B">✦ DISCO</button>
  <button type="button" class="a3-chip" data-song="waltz" style="--c:#FFD23F">♪ 華爾滋</button>
  <button type="button" class="a3-chip" data-song="stop" style="--c:#F2EFE8" aria-label="停止音樂">⏹</button>
</div>`;
  stage.insertAdjacentElement('afterbegin', root);

  const svg = root.querySelector('svg');
  const q = (s) => svg.querySelector(s);
  const qa = (s) => Array.prototype.slice.call(svg.querySelectorAll(s));
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    parent.appendChild(el);
    return el;
  };

  // 程序化補件:待機放射線、草原光芒、雲、草葉、舞池地磚、光楔、塵光、音符池
  const idleRays = q('.a3-idlerays');
  for (let i = 0; i < 12; i++) mk('line', { x1: 0, y1: -70, x2: 0, y2: -84, stroke: '#3E9BFF', 'stroke-width': 2.5, transform: `translate(100,98) rotate(${i * 30})` }, idleRays);
  const raysG = q('.a3-rays');
  for (let i = 0; i < 11; i++) mk('line', { x1: 0, y1: -26, x2: 0, y2: -38, stroke: '#FFD23F', 'stroke-width': 3.5, 'stroke-linecap': 'round', transform: `rotate(${i * 32.7})` }, raysG);
  const cloudsG = q('.a3-clouds'), clouds = [];
  for (let i = 0; i < 3; i++) {
    const g = mk('g', {}, cloudsG);
    mk('ellipse', { cx: 0, cy: 0, rx: 14, ry: 6, fill: '#FFFFFF', stroke: '#090B0E', 'stroke-width': 2 }, g);
    mk('ellipse', { cx: 9, cy: -4, rx: 9, ry: 5, fill: '#FFFFFF', stroke: '#090B0E', 'stroke-width': 2 }, g);
    clouds.push({ el: g, x0: 0, y: 30, s: 1, sp: 4 });
  }
  const bladesG = q('.a3-blades'), blades = [];
  for (let i = 0; i < 9; i++) {
    const x = 8 + i * 23 + rnd() * 10, flip = i % 2 ? 1 : -1;
    const p = mk('path', { d: `M0 0Q${2 * flip} -9 ${6 * flip} -15`, stroke: '#2FA98C', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, bladesG);
    blades.push({ el: p, x, y: 168 + rnd() * 14, ph: rnd() * TAU });
  }
  const tilesG = q('.a3-tiles'), TILE_C = ['#FF3B6B', '#3E9BFF', '#FFD23F', '#65E0BC'], tiles = [];
  for (let i = 0; i < 8; i++) tiles.push(mk('rect', { x: 3 + i * 24.5, y: 150, width: 22, height: 12, rx: 2, fill: TILE_C[i % 4], opacity: .25 }, tilesG));
  const wedgeG = q('.a3-wedges'), wedgeG2 = q('.a3-wedges2'), WED_C = ['#FF3B6B', '#3E9BFF', '#FFD23F', '#65E0BC'];
  for (let i = 0; i < 4; i++) mk('path', { d: 'M0 0L-15 128L15 128Z', fill: WED_C[i], transform: `rotate(${i * 90})` }, wedgeG);
  for (let i = 0; i < 2; i++) mk('path', { d: 'M0 0L-10 128L10 128Z', fill: WED_C[(i * 2 + 1) % 4], transform: `rotate(${i * 180 + 45})` }, wedgeG2);
  const dustG = q('.a3-dust'), dust = [];
  for (let i = 0; i < 9; i++) {
    const c = mk('circle', { r: .8 + rnd() * 1, fill: '#FFD23F', opacity: 0 }, dustG);
    dust.push({ el: c, x0: 0, off: 0, sp: 8 });
  }
  const notesG = q('.a3-notes'), NOTE_G = ['♪', '♫', '♬', '♩'], notes = [];
  for (let i = 0; i < 7; i++) {
    const tx = mk('text', { 'font-family': "'Space Grotesk','Noto Sans TC',sans-serif", 'font-weight': 900, 'font-size': 10, opacity: 0 }, notesG);
    notes.push({ el: tx, born: -9, x0: 0, y0: 0, seed: rnd() * TAU });
  }

  // 主要動件參照
  const rotG = q('.a3-rot'), torG = q('.a3-tor'), hdG = q('.a3-hd'),
    armL = q('.a3-armL'), armR = q('.a3-armR'), legL = q('.a3-legL'), legR = q('.a3-legR'),
    skirt = q('.a3-skirt'), glare = q('.a3-glare'), glBar = q('.a3-glbar'), glCloud = q('.a3-glcloud'),
    eyes = q('.a3-eyes'), mouth = q('.a3-mouth'), eqBars = qa('.a3-eq'),
    shadow = q('.a3-shadow'), ghosts = qa('.a3-ghost'),
    ballRig = q('.a3-ballrig'), glints = q('.a3-glints'), beams = q('.a3-beams'), sparks = qa('.a3-spark'),
    flames = qa('.a3-flame'), halos = qa('.a3-halo'),
    burst = q('.a3-burst'), bStar = q('.a3-bstar'), bTxt = q('.a3-btxt'),
    scenes = {
      stage: [q('.a3-sc-stage')],
      meadow: [q('.a3-sc-meadow'), q('.a3-scf-meadow')],
      disco: [q('.a3-sc-disco'), q('.a3-scf-disco')],
      ball: [q('.a3-sc-ball'), q('.a3-scf-ball')]
    };
  bStar.setAttribute('d', star(12, 25, 16)); // 模板字串內以防未展開,這裡再設一次

  // ---------- WebAudio 合成(全 oscillator/noise;手勢後才啟動) ----------
  let ac = null, master = null, songGain = null, noiseBuf = null;
  let schedTimer = 0, killTimer = 0, nextT = 0, beatIdx = 0, songMode = null, spb = .5;
  const live = new Set(), padOscs = [];

  const CALM_CH = [[110, 164.81, 220], [87.31, 130.81, 174.61], [130.81, 196, 261.63], [98, 146.83, 196]]; // Am F C G
  const PENT = [523.25, 587.33, 659.25, 783.99, 880];
  const DISCO_ROOT = [55, 55, 73.42, 82.41];                                        // A A D E
  const W_ROOT = [87.31, 73.42, 98, 65.41];                                          // F Dm Gm C
  const W_CH = [[174.61, 220, 261.63], [146.83, 174.61, 220], [196, 233.08, 293.66], [164.81, 196, 233.08]];
  const W_MEL = [440, 0, 523.25, 440, 349.23, 440, 392, 0, 466.16, 392, 329.63, 392]; // 4 小節 3/4 旋律

  function tone(type, f0, at, dur, peak, o) {
    o = o || {};
    try {
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, at);
      if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, at + (o.slide || dur));
      g.gain.setValueAtTime(.0001, at);
      g.gain.exponentialRampToValueAtTime(Math.max(.001, peak), at + (o.a || .012));
      g.gain.exponentialRampToValueAtTime(.0001, at + dur);
      let head = osc, flt = null;
      if (o.lp) { flt = ac.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = o.lp; osc.connect(flt); head = flt; }
      head.connect(g); g.connect(songGain);
      osc.start(at); osc.stop(at + dur + .08);
      live.add(osc); live.add(g);
      osc.onended = () => { try { osc.disconnect(); if (flt) flt.disconnect(); g.disconnect(); } catch (e) {} live.delete(osc); live.delete(g); };
    } catch (e) {}
  }
  function noise(at, dur, peak, freq, kind) {
    try {
      const s = ac.createBufferSource(); s.buffer = noiseBuf;
      const f = ac.createBiquadFilter(); f.type = kind || 'highpass'; f.frequency.value = freq; f.Q.value = kind === 'bandpass' ? 1.1 : .8;
      const g = ac.createGain();
      g.gain.setValueAtTime(.0001, at);
      g.gain.exponentialRampToValueAtTime(Math.max(.001, peak), at + .006);
      g.gain.exponentialRampToValueAtTime(.0001, at + dur);
      s.connect(f); f.connect(g); g.connect(songGain);
      s.start(at, rnd() * .4); s.stop(at + dur + .05);
      live.add(s); live.add(g);
      s.onended = () => { try { s.disconnect(); f.disconnect(); g.disconnect(); } catch (e) {} live.delete(s); live.delete(g); };
    } catch (e) {}
  }
  function buildPad() {
    try {
      const flt = ac.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 700;
      const pg = ac.createGain(); pg.gain.setValueAtTime(.0001, ac.currentTime);
      pg.gain.setTargetAtTime(.09, ac.currentTime, .8);
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.type = 'sine'; lfo.frequency.value = .08; lg.gain.value = .03;
      lfo.connect(lg); lg.connect(pg.gain); lfo.start();
      flt.connect(pg); pg.connect(songGain);
      CALM_CH[0].forEach((f, i) => {
        const osc = ac.createOscillator();
        osc.type = i === 2 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        osc.connect(flt); osc.start();
        live.add(osc); padOscs.push(osc);
      });
      live.add(flt); live.add(pg); live.add(lfo); live.add(lg);
    } catch (e) {}
  }
  function schedBeat(m, b, t) {
    if (m === 'calm') {
      if (b % 8 === 0) {
        const ch = CALM_CH[(b / 8 | 0) % 4];
        padOscs.forEach((o, i) => { try { o.frequency.setTargetAtTime(ch[i], t, .5); } catch (e) {} });
      }
      if (b % 2 === 1 && rnd() < .6) {
        const f = PENT[(rnd() * PENT.length) | 0], at = t + rnd() * .45;
        tone('sine', f, at, 1.8, .1, { a: .006 });
        if (rnd() < .35) tone('sine', f * 1.5, at + .4, 1.4, .05, { a: .006 });
      }
    } else if (m === 'disco') {
      const bar = (b >> 2) % 4, root = DISCO_ROOT[bar];
      tone('sine', 150, t, .13, .9, { f1: 42, slide: .09 });                       // kick
      noise(t, .03, .1, 7000);                                                     // 拍上小 hat
      noise(t + spb / 2, .045, .26, 6000);                                         // 反拍 hihat
      if (b % 2 === 1) noise(t, .09, .28, 1500, 'bandpass');                       // snare/clap
      if (b % 8 === 7) noise(t + spb / 2, .2, .18, 5000);                          // 樂句尾 open hat
      tone('square', root, t, .17, .3, { lp: 420 });                               // 八度跳動 bass
      tone('square', root * 2, t + spb / 2, .15, .26, { lp: 480 });
    } else if (m === 'waltz') {
      const bar = (b / 3 | 0) % 4, beat = b % 3;
      if (beat === 0) tone('triangle', W_ROOT[bar], t, .5, .5, { a: .01 });         // oom
      else W_CH[bar].forEach((f) => tone('triangle', f, t, .22, .11, { a: .01 })); // pah-pah
      const mel = W_MEL[b % 12];
      if (mel) tone('triangle', mel, t, .58, .16, { a: .02 });
    }
  }
  function schedTick() {
    try {
      if (!ac || !songGain) return;
      if (ac.state !== 'running') { nextT = ac.currentTime + .1; return; }
      const horizon = ac.currentTime + .3;
      let guard = 0;
      while (nextT < horizon && guard++ < 32) { schedBeat(songMode, beatIdx, nextT); beatIdx++; nextT += spb; }
    } catch (e) {}
  }
  function killAll() {
    if (schedTimer) { clearInterval(schedTimer); schedTimer = 0; }
    if (killTimer) { clearTimeout(killTimer); killTimer = 0; }
    live.forEach((n) => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
    live.clear(); padOscs.length = 0;
    if (songGain) { try { songGain.disconnect(); } catch (e) {} songGain = null; }
    songMode = null;
  }
  function stopMusic() {
    if (schedTimer) { clearInterval(schedTimer); schedTimer = 0; }
    if (!ac || !songGain) { killAll(); return; }
    try {
      const now = ac.currentTime;
      songGain.gain.cancelScheduledValues(now);
      songGain.gain.setValueAtTime(Math.max(.0001, songGain.gain.value || 1), now);
      songGain.gain.linearRampToValueAtTime(.0001, now + .08);
    } catch (e) {}
    killTimer = setTimeout(killAll, 160);
  }
  function startMusic(m) {
    try {
      const c = api.audio.ensure();                    // 只在手勢 handler 內被呼叫
      stage.dataset.a3audio = c ? c.state : 'null';
      if (!c) return;
      ac = c;
      killAll();
      if (!master) { master = ac.createGain(); master.gain.value = .13; master.connect(ac.destination); }
      if (!noiseBuf) {
        const len = (ac.sampleRate * 1.2) | 0, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = rnd() * 2 - 1;
        noiseBuf = buf;
      }
      songGain = ac.createGain();
      songGain.gain.setValueAtTime(.0001, ac.currentTime);
      songGain.gain.linearRampToValueAtTime(1, ac.currentTime + .25);
      songGain.connect(master);
      songMode = m; beatIdx = 0;
      spb = m === 'calm' ? 1 : m === 'disco' ? .5 : 2 / 3;
      nextT = ac.currentTime + .06;
      if (m === 'calm') buildPad();
      schedTimer = setInterval(schedTick, 80);
      schedTick();
    } catch (e) {}
  }

  // ---------- 姿勢系統(每模式一組目標姿勢,切換時 0.9~1.3 秒過場混合) ----------
  const P0 = () => ({ x: 100, y: 125, r: 0, sx: 1, sy: 1, tor: 0, head: 0, aL: 4, aR: -4, lL: 0, lR: 0, sk: 0, gl: 0, br: 1, sh: 1 });
  let mode = 'idle', t0 = 0, switchT = 0, sceneT = 0, lastT = 0;
  let fromPose = P0(), lastPose = P0();
  let dv = 0, dmir = false, wDir = 1, wTh0 = 0;      // 每次開舞的隨機起手式
  const blinkSeed = rnd() * 5;

  function targetPose(t) {
    const p = P0();
    if (mode === 'idle' || mode === 'stop') {
      p.r = 2 * Math.sin(t * .7);
      p.tor = 1.5 * Math.sin(t * .8);
      p.head = 3 * Math.sin(t * .6 + 1);
      p.aL = 4 + 3 * Math.sin(t * 1.1);
      p.aR = -4 - 3 * Math.sin(t * 1.1 + 1);
      p.y = 125 + Math.sin(t * 1.4) * .8;
    } else if (mode === 'calm') {
      const bt = t - t0;
      p.x = 100; p.y = 140; p.r = -84 + 1.5 * Math.sin(bt * .5);
      p.aL = 165 + 3 * Math.sin(bt * .9);
      p.aR = -165 - 3 * Math.sin(bt * .9 + .7);
      p.lL = -6 + 2 * Math.sin(bt * .8);
      p.lR = -36 + 6 * Math.sin(bt * 1.7);            // 蹺腳晃腳
      p.head = -7 + 2 * Math.sin(bt * TAU / 4);
      p.br = 1 + .035 * Math.sin(bt * TAU / 4);       // 胸口呼吸(4 秒=60bpm 的 4 拍)
      p.gl = 1; p.sh = 0;
    } else if (mode === 'disco') {
      const ph = (t - t0) * 2, b = Math.floor(ph), s = ph - b;
      const pump = Math.abs(Math.sin(Math.PI * ph));
      const block = ((b >> 2) + dv) % 2;
      const spring = easeOut(Math.min(1, s * 3.2));
      if (block === 0) {                               // 指天指地
        const up = (b % 2 === 0) !== dmir;
        const a = lerp(up ? -30 : -166, up ? -166 : -30, spring);
        if (!dmir) { p.aR = a; p.aL = 22 + 5 * Math.sin(t * 7); }
        else { p.aL = -a; p.aR = -22 - 5 * Math.sin(t * 7); }
      } else {                                         // 洗車手雙臂波浪
        p.aR = -95 - 52 * Math.sin(Math.PI * ph);
        p.aL = 95 + 52 * Math.sin(Math.PI * ph);
      }
      p.tor = 8 * Math.sin(Math.PI * ph);              // 扭胯
      p.head = -9 * Math.sin(Math.PI * ph + .6);
      p.x = 100 + 9 * Math.sin(Math.PI * ph / 2);      // 踏步
      p.y = 123 - 5 * pump;
      p.sy = 1 + .05 * pump; p.sx = 1 - .03 * pump;
      p.r = 3 * Math.sin(Math.PI * ph / 2);
      p.lL = 13 * Math.max(0, Math.sin(Math.PI * ph));
      p.lR = -13 * Math.max(0, -Math.sin(Math.PI * ph));
    } else if (mode === 'waltz') {
      const ph = (t - t0) * 1.5, meas = ph / 3;
      const th = wDir * meas * Math.PI / 2 + wTh0;      // 4 小節繞場一圈
      const yaw = wDir * meas * Math.PI;                // 2 小節自轉一圈
      p.x = 100 + 27 * Math.cos(th);
      p.y = 119 + 8 * Math.sin(th) - 1.8 * Math.cos(TAU * (ph % 3) / 3);
      const sc = 1 + ((p.y - 119) / 8) * .09;
      let fx = Math.cos(yaw);
      if (Math.abs(fx) < .08) fx = fx < 0 ? -.08 : .08;
      p.sx = sc * fx; p.sy = sc;
      p.r = wDir * 6 + 4 * Math.sin(yaw);
      p.aL = 100 + 6 * Math.sin(ph * 2);
      p.aR = -148 - 6 * Math.sin(ph * 2 + 1);
      p.head = 5 * Math.sin(yaw);
      p.lL = 3; p.lR = -3;
      p.sk = 1; p.sh = (14 + 14 * Math.abs(fx)) / 24 * sc;
    }
    return p;
  }

  function applyPose(p, t) {
    const tf = `translate(${p.x.toFixed(2)},${p.y.toFixed(2)}) rotate(${p.r.toFixed(2)}) scale(${p.sx.toFixed(3)},${p.sy.toFixed(3)})`;
    rotG.setAttribute('transform', tf);
    torG.setAttribute('transform', `rotate(${p.tor.toFixed(2)}) scale(1,${p.br.toFixed(3)})`);
    hdG.setAttribute('transform', `translate(0,-53) rotate(${p.head.toFixed(2)} 0 18)`);
    armL.setAttribute('transform', `rotate(${p.aL.toFixed(2)} -21.5 -28)`);
    armR.setAttribute('transform', `rotate(${p.aR.toFixed(2)} 21.5 -28)`);
    legL.setAttribute('transform', `rotate(${p.lL.toFixed(2)} -8 3)`);
    legR.setAttribute('transform', `rotate(${p.lR.toFixed(2)} 8 3)`);
    skirt.setAttribute('opacity', p.sk.toFixed(2));
    glare.setAttribute('opacity', p.gl.toFixed(2));
    shadow.setAttribute('cx', p.x.toFixed(1));
    shadow.setAttribute('rx', (24 * Math.max(.15, p.sh)).toFixed(1));
    shadow.setAttribute('opacity', (.32 * clamp(p.sh, 0, 1)).toFixed(2));
    // 眨眼
    const bt = (t + blinkSeed) % 3.7, k = bt < .13 ? .12 : 1;
    eyes.setAttribute('transform', `translate(0,${(-3 * (1 - k)).toFixed(2)}) scale(1,${k})`);
    return tf;
  }

  // ---------- 場景切換與各場景動態 ----------
  function setScene(name) {
    for (const k in scenes) {
      const on = k === name ? 1 : 0;
      scenes[k].forEach((el) => { el.style.opacity = on; });
    }
    sceneT = lastT;
  }
  function randomizeScene(m) {
    if (m === 'calm') clouds.forEach((c) => { c.x0 = rnd() * 220; c.y = 18 + rnd() * 52; c.s = .65 + rnd() * .7; c.sp = 2.5 + rnd() * 5; });
    if (m === 'waltz') dust.forEach((d) => { d.x0 = 10 + rnd() * 180; d.off = rnd() * 150; d.sp = 5 + rnd() * 9; });
    if (m === 'disco') { dv = rnd() < .5 ? 0 : 1; dmir = rnd() < .5; }
    if (m === 'waltz') { wDir = rnd() < .5 ? 1 : -1; wTh0 = rnd() * TAU; }
  }

  // 漫畫音效框
  let burstT = -9;
  const BURSTS = {
    calm: { txt: '呼～', fill: '#65E0BC', tc: '#090B0E', x: 50, y: 40 },
    disco: { txt: 'GROOVE!', fill: '#FF3B6B', tc: '#F2EFE8', x: 50, y: 36 },
    waltz: { txt: '1·2·3♪', fill: '#FFD23F', tc: '#090B0E', x: 52, y: 36 }
  };
  function fireBurst(m) {
    const b = BURSTS[m];
    if (!b) return;
    bStar.setAttribute('fill', b.fill);
    bTxt.setAttribute('fill', b.tc);
    bTxt.textContent = b.txt;
    burst.setAttribute('transform', `translate(${b.x},${b.y})`);
    burstT = lastT;
  }

  const MOUTHS = { idle: 'M-9 11Q0 18 9 11', calm: 'M-6 11Q0 15 6 11', disco: 'M-8 9Q0 21 8 9', waltz: 'M-7 10Q0 16 7 10' };
  function setMode(m) {
    fromPose = Object.assign({}, lastPose, { r: normDeg(lastPose.r) });
    switchT = lastT; t0 = lastT;
    mode = m;
    mouth.setAttribute('d', MOUTHS[m] || MOUTHS.idle);
    stage.dataset.a3 = m;
  }

  // ---------- 晶片按鈕 ----------
  const chips = Array.prototype.slice.call(root.querySelectorAll('.a3-chip'));
  function paintChips(on) {
    chips.forEach((c) => c.classList.toggle('on', c.dataset.song === on));
  }
  function handleChip(m) {
    if (m === 'stop' || m === mode) {   // 再點同一顆 = 停止
      stopMusic();
      setMode('idle');
      setScene('stage');
      paintChips(null);
      return;
    }
    randomizeScene(m);
    setMode(m);
    setScene(m === 'calm' ? 'meadow' : m === 'disco' ? 'disco' : 'ball');
    startMusic(m);                       // 手勢 handler 內:允許 ensure()
    fireBurst(m);
    paintChips(m);
  }
  const onDown = (ev) => {
    const b = ev.currentTarget;
    ev.stopPropagation();
    handleChip(b.dataset.song);
  };
  const onClick = (ev) => {              // 鍵盤啟動(detail===0);滑鼠已被 pointerdown 處理
    if (ev.detail !== 0) return;
    ev.stopPropagation();
    handleChip(ev.currentTarget.dataset.song);
  };
  chips.forEach((c) => { c.addEventListener('pointerdown', onDown); c.addEventListener('click', onClick); });

  // ---------- 共享 rAF 主迴圈 ----------
  let lastNote = 0, lastGhost = 0;
  const ghostHist = [];
  const offRaf = api.raf((t) => {
    lastT = t;
    // 姿勢混合
    const dur = mode === 'calm' ? 1.3 : .9;
    const k = easeIO(clamp((t - switchT) / dur, 0, 1));
    const tp = targetPose(t), p = {};
    for (const key in tp) p[key] = lerp(fromPose[key] !== undefined ? fromPose[key] : tp[key], tp[key], k);
    const tfStr = applyPose(p, t);
    lastPose = p;

    // 華爾滋殘影(裙擺式拖尾)
    if (mode === 'waltz' && k > .6) {
      if (t - lastGhost > .1) { ghostHist.unshift(tfStr); if (ghostHist.length > 3) ghostHist.length = 3; lastGhost = t; }
      ghosts.forEach((g, i) => {
        if (ghostHist[i]) { g.setAttribute('transform', ghostHist[i]); g.setAttribute('opacity', (.26 - i * .09).toFixed(2)); }
      });
    } else {
      ghostHist.length = 0;
      ghosts.forEach((g) => g.setAttribute('opacity', 0));
    }

    // 胸口等化器
    for (let i = 0; i < 3; i++) {
      let h = 2;
      if (mode === 'disco') {
        const ph = (t - t0) * 2, s = ph - Math.floor(ph);
        h = 2 + 11 * clamp(Math.exp(-3.5 * s) * (.55 + .45 * Math.sin(t * (9 + 3 * i) + i * 2)), 0, 1);
      } else if (mode === 'calm') {
        h = 2 + 4 * (.5 + .5 * Math.sin((t - t0) * TAU / 4 + i * .8));
      } else if (mode === 'waltz') {
        const ph = (t - t0) * 1.5, beat = Math.floor(ph) % 3, s = ph - Math.floor(ph);
        h = 2 + 9 * Math.exp(-4 * s) * (i === beat ? 1 : .4);
      } else {
        h = 2 + 1.5 * (.5 + .5 * Math.sin(t * 2 + i));
      }
      eqBars[i].setAttribute('y', (-11 - h).toFixed(2));
      eqBars[i].setAttribute('height', h.toFixed(2));
    }

    // 場景動態 —— 草原
    idleRays.setAttribute('transform', `rotate(${(t * 2).toFixed(1)} 100 98)`);
    raysG.setAttribute('transform', `translate(146,50) rotate(${(t * 8).toFixed(1)})`);
    clouds.forEach((c) => {
      const x = ((c.x0 + t * c.sp) % 250) - 30;
      c.el.setAttribute('transform', `translate(${x.toFixed(1)},${c.y.toFixed(1)}) scale(${c.s})`);
    });
    blades.forEach((b) => {
      b.el.setAttribute('transform', `translate(${b.x},${b.y}) rotate(${(6 * Math.sin(t * 1.3 + b.ph)).toFixed(1)})`);
    });
    // 迪斯可:鏡球降下、亮格旋轉、光楔掃射、地磚跟拍
    const drop = easeOut(clamp((t - sceneT) / .9, 0, 1));
    ballRig.setAttribute('transform', `translate(100,${(34 - 60 * (1 - drop)).toFixed(1)})`);
    glints.setAttribute('transform', `rotate(${(t * 90 % 360).toFixed(0)})`);
    beams.setAttribute('transform', `rotate(${(t * 24 % 360).toFixed(1)})`);
    sparks.forEach((s, i) => s.setAttribute('opacity', Math.sin(t * 13 + i * 2.4) > .35 ? .9 : .15));
    wedgeG.setAttribute('transform', `translate(100,34) rotate(${(t * 40 % 360).toFixed(1)})`);
    wedgeG2.setAttribute('transform', `translate(100,34) rotate(${(-t * 26 % 360).toFixed(1)})`);
    if (mode === 'disco') {
      const bi = Math.floor((t - t0) * 2) % 4;
      tiles.forEach((tl, i) => tl.setAttribute('opacity', (i % 4 === bi) ? .92 : .25));
    }
    // 舞廳:燭光閃爍、光暈呼吸、塵光上飄
    flames.forEach((f, i) => f.setAttribute('opacity', .65 + .35 * Math.sin(t * 9 + i * 2.1)));
    halos.forEach((h2, i) => h2.setAttribute('opacity', .75 + .25 * Math.sin(t * .9 + i)));
    dust.forEach((d, i) => {
      const prog = ((t * d.sp + d.off) % 150) / 150;
      d.el.setAttribute('cx', (d.x0 + 6 * Math.sin(t * .7 + i)).toFixed(1));
      d.el.setAttribute('cy', (168 - prog * 150).toFixed(1));
      d.el.setAttribute('opacity', (Math.sin(prog * Math.PI) * .6).toFixed(2));
    });
    // 眼鏡天空反光(躺草地時)
    if (p.gl > .02) {
      glBar.setAttribute('transform', `translate(${(((t * 5) % 44) - 22).toFixed(1)},0) rotate(22)`);
      glCloud.setAttribute('cx', ((((t * 3) % 40) - 20)).toFixed(1));
    }
    // 音符飄升
    if (mode !== 'idle' && mode !== 'stop' && t - lastNote > (mode === 'disco' ? .32 : .55)) {
      const n = notes.find((x) => t - x.born > 2.2);
      if (n) {
        const rad = p.r * Math.PI / 180;
        n.born = t;
        n.x0 = p.x + 70 * Math.sin(rad) * (p.sx < 0 ? -1 : 1) + (rnd() - .5) * 26;
        n.y0 = p.y - 70 * Math.cos(rad) * Math.abs(p.sy) + (rnd() - .5) * 8;
        n.el.textContent = NOTE_G[(rnd() * NOTE_G.length) | 0];
        n.el.setAttribute('font-size', (8 + rnd() * 5).toFixed(1));
        n.el.setAttribute('fill', mode === 'calm' ? '#2FA98C' : mode === 'waltz' ? '#FFD23F' : TILE_C[(rnd() * 4) | 0]);
      }
      lastNote = t;
    }
    notes.forEach((n) => {
      const age = t - n.born;
      if (age < 0 || age > 2.2) { n.el.setAttribute('opacity', 0); return; }
      const kk = age / 2.2;
      n.el.setAttribute('x', clamp(n.x0 + 5 * Math.sin(t * 2 + n.seed), 4, 190).toFixed(1));
      n.el.setAttribute('y', Math.max(8, n.y0 - 34 * kk).toFixed(1));
      n.el.setAttribute('opacity', (kk < .15 ? kk / .15 : 1 - (kk - .15) / .85).toFixed(2));
    });
    // 漫畫音效框 pop
    const bk = t - burstT;
    if (bk >= 0 && bk < 1.5) {
      const s = bk < .16 ? (bk / .16) * 1.18 : 1.18 - .18 * Math.min(1, (bk - .16) / .22);
      const b = BURSTS[mode] || BURSTS.disco;
      burst.setAttribute('transform', `translate(${b.x},${b.y}) scale(${s.toFixed(3)}) rotate(${(-6 + 3 * Math.sin(t * 9)).toFixed(1)})`);
      burst.style.opacity = bk > 1.1 ? Math.max(0, 1 - (bk - 1.1) / .4).toFixed(2) : 1;
    } else {
      burst.style.opacity = 0;
    }
  });

  stage.dataset.a3 = 'idle';

  return {
    destroy() {
      offRaf();
      killAll();
      if (master) { try { master.disconnect(); } catch (e) {} master = null; }
      chips.forEach((c) => { c.removeEventListener('pointerdown', onDown); c.removeEventListener('click', onClick); });
      try { root.remove(); } catch (e) {}
      delete stage.dataset.a3;
      delete stage.dataset.a3audio;
    }
  };
}
