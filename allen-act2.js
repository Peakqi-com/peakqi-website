// Allen 小劇場第二幕:心碎半身機器人 × 修補小燈泡(Marvel/普普風)
// 殼層契約:createAct(stage, api) → { destroy() };共用 api.raf(cb 收秒)、api.rand;
// 不自開 rAF、不用 setTimeout(全走影格時鐘),destroy 只需退訂+清 DOM。
// 劇情迴圈:愛心隨機裂紋碎開(垮肩/眼鏡下滑/嘴角掉/頭頂烏雲)→ 燈泡飛進焦急盤旋
//   → 點燈泡俯衝沿裂縫縫合(針腳一段段長出+火花,縫完開心轉圈)
//   → 全縫完愛心亮起脈動、機器人挺胸大笑、烏雲散開出小太陽 → 6–12 秒後新裂紋再碎。

import { t } from './i18n.js';

const INK = '#090B0E', CREAM = '#F2EFE8', BLUE = '#3E9BFF', ORANGE = '#FF6B2C',
  YELLOW = '#FFD23F', PINK = '#FF3B6B', SHELL = '#1C2430';
const HEART_D = 'M0 -11C-7 -22 -26 -20 -26 -5C-26 8 -11 17 0 26C11 17 26 8 26 -5C26 -20 7 -22 0 -11Z';
const HC = [100, 142];              // 愛心中心(全域座標)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOut = (p) => 1 - Math.pow(1 - p, 3);

// 折線工具:總長 / 沿線取點(回傳 [x, y, 切線角度deg])
function polyLen(pts) {
  let l = 0;
  for (let i = 0; i < pts.length - 1; i++) l += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  return l;
}
function pointAt(pts, s) {
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1];
    const l = Math.hypot(dx, dy);
    if (acc + l >= s && l > 0) {
      const f = (s - acc) / l;
      return [pts[i][0] + dx * f, pts[i][1] + dy * f, Math.atan2(dy, dx) * 180 / Math.PI];
    }
    acc += l;
  }
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  return [b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI];
}

export function createAct(stage, api) {
  const R = api.rand;

  // ---------- 靜態骨架 ----------
  let sunrays = '';
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * i / 4;
    sunrays += `<line x1="${(Math.cos(a) * 10.5).toFixed(1)}" y1="${(Math.sin(a) * 10.5).toFixed(1)}" x2="${(Math.cos(a) * 14.5).toFixed(1)}" y2="${(Math.sin(a) * 14.5).toFixed(1)}"/>`;
  }
  let bangPts = '';
  for (let i = 0; i < 20; i++) {
    const a = Math.PI * 2 * i / 20 - Math.PI / 2;
    const r = i % 2 ? 8 : 13.5;
    bangPts += `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)} `;
  }
  const heartInner =
    `<path d="${HEART_D}" fill="${PINK}"/>` +
    `<path d="M3 21C11 15 19 8 21 -1" stroke="${ORANGE}" stroke-width="5.5" fill="none" stroke-linecap="round" opacity=".72"/>` +
    `<path d="${HEART_D}" fill="url(#a2dots)" opacity=".14"/>` +
    `<ellipse cx="-11" cy="-9" rx="6.2" ry="3.6" transform="rotate(-27 -11 -9)" fill="${CREAM}" opacity=".92"/>` +
    `<circle cx="-3.5" cy="-13.5" r="1.7" fill="${CREAM}" opacity=".92"/>` +
    `<path d="${HEART_D}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;

  const css =
    `.a2-svg text{user-select:none;pointer-events:none}` +
    `.a2-ant{transform-box:fill-box;transform-origin:50% 100%;animation:a2sway 2.4s ease-in-out infinite alternate}` +
    `@keyframes a2sway{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}` +
    `.a2-wingL{transform-box:fill-box;transform-origin:100% 60%;animation:a2flapL .16s ease-in-out infinite alternate}` +
    `.a2-wingR{transform-box:fill-box;transform-origin:0% 60%;animation:a2flapR .16s ease-in-out infinite alternate}` +
    `@keyframes a2flapL{from{transform:rotate(24deg)}to{transform:rotate(-14deg)}}` +
    `@keyframes a2flapR{from{transform:rotate(-24deg)}to{transform:rotate(14deg)}}` +
    `.a2-st{opacity:0;transition:opacity .1s linear}` +
    `.a2-st[data-on="1"]{opacity:1}` +
    `.a2-rain path{animation:a2fall 1.1s linear infinite}` +
    `.a2-rain path:nth-child(2){animation-delay:.35s}` +
    `.a2-rain path:nth-child(3){animation-delay:.7s}` +
    `@keyframes a2fall{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(11px);opacity:0}}` +
    `.a2-sunrays{transform-box:fill-box;transform-origin:50% 50%;animation:a2spin 9s linear infinite}` +
    `@keyframes a2spin{to{transform:rotate(360deg)}}` +
    `.a2-cloudBob{animation:a2bob 2.6s ease-in-out infinite alternate}` +
    `@keyframes a2bob{from{transform:translateY(-1.2px)}to{transform:translateY(1.2px)}}` +
    `.a2-bulb{cursor:pointer}`;

  const svgHtml =
    `<svg class="a2-svg" viewBox="0 0 200 200" role="img" aria-label="${t('第二幕:心碎機器人與修補小燈泡', 'Act 2: heartbroken robot and the little repair bulbs')}" style="display:block;position:absolute;inset:0;width:100%;height:100%">` +
    `<style>${css}</style>` +
    `<defs>` +
    `<pattern id="a2dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1.3" cy="1.3" r=".95" fill="${INK}"/></pattern>` +
    `<pattern id="a2dotsB" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r="1.1" fill="${BLUE}"/></pattern>` +
    `<clipPath id="a2clipL"><path class="a2-clipL" d="M0 0"/></clipPath>` +
    `<clipPath id="a2clipR"><path class="a2-clipR" d="M0 0"/></clipPath>` +
    `<clipPath id="a2clipH"><path d="${HEART_D}"/></clipPath>` +
    `</defs>` +
    // 普普網點底
    `<circle cx="100" cy="110" r="88" fill="url(#a2dotsB)" opacity=".08"/>` +
    // ---- 軀幹(半身)----
    `<g class="a2-torso">` +
    `<rect x="90" y="94" width="20" height="14" rx="3" fill="${SHELL}" stroke="${BLUE}" stroke-width="2.5"/>` +
    `<g class="a2-shL"><rect x="38" y="110" width="14" height="32" rx="7" fill="${SHELL}" stroke="${BLUE}" stroke-width="2.5"/></g>` +
    `<g class="a2-shR"><rect x="148" y="110" width="14" height="32" rx="7" fill="${SHELL}" stroke="${BLUE}" stroke-width="2.5"/></g>` +
    `<rect x="52" y="104" width="96" height="88" rx="16" fill="${SHELL}" stroke="${BLUE}" stroke-width="3"/>` +
    `<path d="M76 104h48" stroke="${BLUE}" stroke-width="2" opacity=".35"/>` +
    `<circle cx="62" cy="183" r="2.2" fill="${BLUE}" opacity=".55"/><circle cx="138" cy="183" r="2.2" fill="${BLUE}" opacity=".55"/>` +
    // ---- 胸口愛心 ----
    `<g class="a2-heart" transform="translate(100 142)">` +
    `<circle class="a2-glowH2" r="40" fill="${YELLOW}" opacity="0"/>` +
    `<circle class="a2-glowH" r="30" fill="${PINK}" opacity="0"/>` +
    `<g class="a2-burst"></g><g class="a2-shine"></g>` +
    `<g class="a2-hL" clip-path="url(#a2clipL)">${heartInner}</g>` +
    `<g class="a2-hR" clip-path="url(#a2clipR)">${heartInner}</g>` +
    `<g clip-path="url(#a2clipH)">` +
    `<path class="a2-crack" d="" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" opacity="0"/>` +
    `<g class="a2-seam"></g>` +
    `</g>` +
    `<g class="a2-sparks"></g>` +
    `</g>` +
    `</g>` +
    // ---- 頭(同站上造型:圓角方頭/藍描邊/白方框眼鏡/耳機弧/天線)----
    `<g class="a2-headG">` +
    `<g class="a2-ant"><circle cx="100" cy="13" r="5.5" fill="${BLUE}"/><rect x="97.3" y="17" width="5.4" height="11" rx="2.7" fill="${BLUE}" opacity=".7"/></g>` +
    `<rect x="57" y="27" width="86" height="72" rx="17" fill="${SHELL}" stroke="${BLUE}" stroke-width="3"/>` +
    `<rect x="43" y="52" width="11" height="26" rx="5.5" fill="${SHELL}" stroke="${BLUE}" stroke-width="2.5"/>` +
    `<rect x="146" y="52" width="11" height="26" rx="5.5" fill="${SHELL}" stroke="${BLUE}" stroke-width="2.5"/>` +
    `<rect x="50" y="48" width="9" height="22" rx="4.5" fill="${BLUE}"/>` +
    `<rect x="141" y="48" width="9" height="22" rx="4.5" fill="${BLUE}"/>` +
    `<path d="M56 47q44-24 88 0" stroke="${BLUE}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` +
    `<g class="a2-eyes"><circle cx="79.5" cy="60" r="4.2" fill="${CREAM}"/><circle cx="120.5" cy="60" r="4.2" fill="${CREAM}"/></g>` +
    `<g class="a2-glasses" stroke="${CREAM}" stroke-width="3.2" fill="none">` +
    `<rect x="66" y="49" width="27" height="22" rx="5.5"/><rect x="107" y="49" width="27" height="22" rx="5.5"/><path d="M93 59.5h14"/>` +
    `</g>` +
    `<path class="a2-mouth" d="M84 84q16 6 32 0" stroke="${CREAM}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `</g>` +
    // ---- 烏雲(雨)/ 小太陽:同一位置輪替 ----
    `<g class="a2-cloud" opacity="0"><g class="a2-cloudBob">` +
    `<g class="a2-rain" stroke="${BLUE}" stroke-width="2" stroke-linecap="round" fill="none">` +
    `<path d="M-8 10l-2 6"/><path d="M0 11l-2 6"/><path d="M8 10l-2 6"/></g>` +
    `<path d="M-18 8A7 7 0 0 1 -10 -4A9.5 9.5 0 0 1 9 -5A7 7 0 0 1 18 8Z" fill="#4E5A68" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<ellipse cx="-6" cy="-2" rx="5" ry="2.2" fill="${CREAM}" opacity=".22"/>` +
    `</g></g>` +
    `<g class="a2-sun" opacity="0">` +
    `<g class="a2-sunrays" stroke="${YELLOW}" stroke-width="2.6" stroke-linecap="round">${sunrays}</g>` +
    `<circle r="7.5" fill="${YELLOW}" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="-2.5" cy="-1.2" r="1.05" fill="${INK}"/><circle cx="2.5" cy="-1.2" r="1.05" fill="${INK}"/>` +
    `<path d="M-2.6 1.8q2.6 2.3 5.2 0" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` +
    `</g>` +
    // ---- 漫畫驚嘆貼紙(碎裂瞬間)----
    `<g class="a2-bang" opacity="0">` +
    `<polygon points="${bangPts}" fill="${YELLOW}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<text y="1" text-anchor="middle" dominant-baseline="central" style="font:900 13px 'Space Grotesk',sans-serif" fill="${INK}">!</text>` +
    `</g>` +
    `<g class="a2-bulbs"></g>` +
    `</svg>`;

  stage.insertAdjacentHTML('afterbegin', svgHtml);   // 切換點 div 保留在後(z-index:9 蓋上)
  const svg = stage.querySelector('.a2-svg');
  const $ = (s) => svg.querySelector(s);
  const heartG = $('.a2-heart'), hL = $('.a2-hL'), hR = $('.a2-hR'),
    clipL = $('.a2-clipL'), clipR = $('.a2-clipR'), crackEl = $('.a2-crack'),
    seamG = $('.a2-seam'), burstG = $('.a2-burst'), shineG = $('.a2-shine'),
    sparksG = $('.a2-sparks'), glowH = $('.a2-glowH'), glowH2 = $('.a2-glowH2'),
    headG = $('.a2-headG'), glassesG = $('.a2-glasses'), eyesG = $('.a2-eyes'),
    mouthEl = $('.a2-mouth'), shLG = $('.a2-shL'), shRG = $('.a2-shR'), torsoG = $('.a2-torso'),
    cloudG = $('.a2-cloud'), sunG = $('.a2-sun'), bangG = $('.a2-bang'), bulbsG = $('.a2-bulbs');

  // 火花池(3 組輪用)
  const sparks = [];
  for (let i = 0; i < 3; i++) {
    sparksG.insertAdjacentHTML('beforeend',
      `<g opacity="0"><path d="M-4.4 0H-2.2M2.2 0H4.4M0 -4.4V-2.2M0 2.2V4.4M-3 -3l1.2 1.2M3 3l-1.2 -1.2" stroke="${YELLOW}" stroke-width="1.6" stroke-linecap="round"/><circle r="1.4" fill="${CREAM}"/></g>`);
    sparks.push({ el: sparksG.lastElementChild, t: -9 });
  }
  let sparkI = 0;

  // ---------- 狀態 ----------
  let mode = 'intro';                 // intro → broken ⇄ healed
  let now = 0, last = -1, started = false, introT0 = 0, breakT0 = 0, healT0 = 0, nextBreakAt = 0;
  let mood = 0.5, moodTarget = 0.5;   // -1 崩潰 ~ +1 開懷
  let sepCur = 0, maxSep = 3.5;       // 兩半分離量
  let crackO = 0, seamO = 1, cloudA = 0, sunA = 0;
  let pts = [], stitches = [], segs = [], revealed = 0, unsewnFrac = 1;
  let orbitC = [100, 147];            // 燈泡盤旋中心(裂縫質心,全域)
  let bulbs = [];
  const stG = (st) => [HC[0] + st.x, HC[1] + st.y];   // 針腳:心臟局部 → 全域
  const setMode = (m) => { mode = m; stage.dataset.a2mode = m; };
  setMode('intro');

  // ---------- 每輪隨機裂紋 + 針腳 + 分段 ----------
  function newCrack() {
    const n = 4 + Math.floor(R() * 4);                    // 折點 4–7
    const topX = -6 + R() * 12, botX = -5 + R() * 10;     // 起訖水平偏移
    const lean = -7 + R() * 14;                           // 整體傾斜
    const y0 = -15.5, y1 = 25.5;
    pts = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      let x = topX + (botX - topX) * f + lean * Math.sin(f * Math.PI);
      let y = y0 + (y1 - y0) * f;
      if (i > 0 && i < n) { x += R() * 13 - 6.5; y += R() * 3.6 - 1.8; }
      pts.push([clamp(x, -16, 16), y]);
    }
    const d = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
    crackEl.setAttribute('d', d);
    clipL.setAttribute('d', d + 'L-46 44L-46 -34Z');
    clipR.setAttribute('d', d + 'L46 44L46 -34Z');
    // 針腳:沿裂縫等距佈點(間距隨機),角度 = 切線 + 90 ± 13°
    const L = polyLen(pts), sp = 4.3 + R() * 0.9;
    stitches = [];
    for (let s = 2.4; s <= L - 1.2; s += sp) {
      const [x, y, ang] = pointAt(pts, s);
      stitches.push({ x, y, ang: ang + 90 + (R() * 26 - 13), el: null });
    }
    seamG.innerHTML = stitches.map((st) =>
      `<g class="a2-st" data-stitch data-on="0" transform="translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) rotate(${st.ang.toFixed(0)})">` +
      `<line x1="-3.8" x2="3.8" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>` +
      `<line x1="-3.4" x2="3.4" stroke="${CREAM}" stroke-width="1.7" stroke-linecap="round"/></g>`).join('');
    const els = seamG.children;
    stitches.forEach((st, i) => { st.el = els[i]; });
    // 分段 2–4(每段至少 2 針)
    let segN = 2 + Math.floor(R() * 3);
    if (stitches.length < segN * 2) segN = Math.max(2, Math.floor(stitches.length / 2));
    const per = stitches.length / segN;
    segs = [];
    for (let k = 0; k < segN; k++) {
      const list = stitches.slice(Math.round(k * per), Math.round((k + 1) * per));
      if (list.length) segs.push({ stitches: list, state: 'open' });
    }
    revealed = 0; unsewnFrac = 1;
    maxSep = 3 + R() * 1.5;
    let cx = 0, cy = 0;
    pts.forEach((p) => { cx += p[0]; cy += p[1]; });
    orbitC = [HC[0] + cx / pts.length, HC[1] + cy / pts.length];
  }

  // ---------- 燈泡 ----------
  function buildBulbHtml() {
    return `<g data-bulb data-state="in" class="a2-bulb">` +
      `<circle class="a2-g2" r="15" fill="${YELLOW}" opacity=".1"/>` +
      `<circle class="a2-g1" r="10.5" fill="${YELLOW}" opacity=".2"/>` +
      `<g class="a2-wingL"><path d="M-6 -2Q-15 -8 -13 0Q-12 4 -6 2Z" fill="${CREAM}" stroke="${INK}" stroke-width="1.6"/></g>` +
      `<g class="a2-wingR"><path d="M6 -2Q15 -8 13 0Q12 4 6 2Z" fill="${CREAM}" stroke="${INK}" stroke-width="1.6"/></g>` +
      `<g transform="translate(0 6.5)"><rect x="-3.4" width="6.8" height="5" rx="1.4" fill="#B9C3CF" stroke="${INK}" stroke-width="1.6"/><path d="M-3.4 1.8h6.8M-3.4 3.4h6.8" stroke="${INK}" stroke-width=".9"/></g>` +
      `<circle r="7" fill="#FFE38A" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="-2.4" cy="-2.8" r="1.5" fill="#FFF" opacity=".85"/>` +
      `<g stroke="#7A4A12" fill="none" stroke-linecap="round">` +
      `<circle cx="-2.3" cy="-.8" r="1" fill="#7A4A12" stroke="none"/><circle cx="2.3" cy="-.8" r="1" fill="#7A4A12" stroke="none"/>` +
      `<path d="M-2.4 1.8q2.4 2.2 4.8 0" stroke-width="1.3"/>` +
      `<path d="M0 -7v-1.6" stroke-width="1.1"/></g>` +
      `<circle class="a2-hit" r="13.5" fill="none" pointer-events="all"/>` +
      `</g>`;
  }
  function spawnBulbs() {
    bulbsG.innerHTML = '';
    bulbs = [];
    const n = 3 + Math.floor(R() * 3);                    // 3–5 顆
    for (let i = 0; i < n; i++) {
      bulbsG.insertAdjacentHTML('beforeend', buildBulbHtml());
      const a = R() * Math.PI * 2;
      const b = {
        el: bulbsG.lastElementChild,
        state: 'in', t0: now + R() * 0.8, inDur: 0.9 + R() * 0.7,
        R: 32 + R() * 9, sq: 0.55 + R() * 0.14,
        sp: (0.55 + R() * 0.55) * (R() < 0.5 ? -1 : 1), ph: R() * Math.PI * 2,
        size: 0.85 + R() * 0.3, stitchDur: 0.12 + R() * 0.05,
        x: orbitC[0] + Math.cos(a) * 150, y: orbitC[1] + Math.sin(a) * 150,
        px: 0, py: 0, fx: 0, fy: 0, ex: 0, ey: 0, si: 0, st0: 0, seg: null,
        rot: 0, tilt: 0, gl: 0, exitInit: false
      };
      b.px = b.x; b.py = b.y; b.fx = b.x; b.fy = b.y;
      b.g1 = b.el.querySelector('.a2-g1'); b.g2 = b.el.querySelector('.a2-g2');
      bulbs.push(b);
    }
  }
  function setBulbState(b, s) { b.state = s; b.el.setAttribute('data-state', s); }

  // ---------- 事件節點 ----------
  function makeBurst(g, warm) {
    let s = '';
    const m = 12 + Math.floor(R() * 5);
    for (let i = 0; i < m; i++) {
      const a = Math.PI * 2 * i / m + R() * 0.25;
      const r0 = 27 + R() * 3, r1 = warm ? 40 + R() * 12 : 38 + R() * 9;
      const col = warm ? (i % 2 ? YELLOW : CREAM) : (i % 2 ? ORANGE : CREAM);
      s += `<line x1="${(Math.cos(a) * r0).toFixed(1)}" y1="${(Math.sin(a) * r0).toFixed(1)}" x2="${(Math.cos(a) * r1).toFixed(1)}" y2="${(Math.sin(a) * r1).toFixed(1)}" stroke="${col}" stroke-width="${(2 + R() * 1.6).toFixed(1)}" stroke-linecap="round"/>`;
    }
    g.innerHTML = s;
  }
  function spark(st) {
    const s = sparks[sparkI++ % sparks.length];
    s.t = now;
    s.el.setAttribute('transform', `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) rotate(${(R() * 360).toFixed(0)})`);
  }
  function revealStitch(st) {
    st.el.setAttribute('data-on', '1');
    revealed++;
    unsewnFrac = 1 - revealed / stitches.length;
    spark(st);
  }
  function doBreak() {
    setMode('broken');
    breakT0 = now; moodTarget = -1;
    newCrack();
    makeBurst(burstG, false);
    shineG.innerHTML = '';
    seamO = 1; seamG.style.opacity = '1';
    spawnBulbs();
  }
  function doHeal() {
    setMode('healed');
    healT0 = now; moodTarget = 1;
    nextBreakAt = now + 6 + R() * 6;                      // 6–12 秒後再碎
    makeBurst(shineG, true);
    let i = 0;
    bulbs.forEach((b) => {
      if (b.state === 'hover' || b.state === 'in' || b.state === 'return') {
        setBulbState(b, 'exit'); b.t0 = now + 0.35 + (i++) * 0.18; b.exitInit = false;
      }
    });
  }
  function segDone(b) {
    b.seg.state = 'done';
    setBulbState(b, 'spin'); b.t0 = now;
    if (segs.every((s) => s.state === 'done')) doHeal();
  }

  // 點燈泡:懸停中的才受理;指派第一個未縫段
  function onDown(e) {
    const g = e.target && e.target.closest ? e.target.closest('[data-bulb]') : null;
    if (!g || mode !== 'broken') return;
    const b = bulbs.find((x) => x.el === g);
    if (!b || b.state !== 'hover') return;
    const seg = segs.find((s) => s.state === 'open');
    if (!seg) return;
    seg.state = 'sewing';
    b.seg = seg; b.fx = b.x; b.fy = b.y;
    setBulbState(b, 'dive'); b.t0 = now;
  }
  svg.addEventListener('pointerdown', onDown);

  newCrack();   // 先建一組讓 clip 有效(intro 期間 sep=0、裂縫隱形 → 看起來完整)

  // ---------- 燈泡影格 ----------
  function bulbFrame(b, dt) {
    switch (b.state) {
      case 'in': {
        const p = clamp((now - b.t0) / b.inDur, 0, 1);
        const e = easeOut(p);
        const tx = orbitC[0] + Math.cos(b.ph) * b.R, ty = orbitC[1] + Math.sin(b.ph) * b.R * b.sq;
        b.x = b.fx + (tx - b.fx) * e; b.y = b.fy + (ty - b.fy) * e;
        if (p >= 1) setBulbState(b, 'hover');
        break;
      }
      case 'hover': {                                     // 焦急盤旋:橢圓軌道 + 高頻抖動
        const a = b.ph + now * b.sp;
        b.x = orbitC[0] + Math.cos(a) * b.R + Math.sin(now * 7 + b.ph) * 1.6;
        b.y = orbitC[1] + Math.sin(a) * b.R * b.sq + Math.cos(now * 9 + b.ph) * 1.8;
        break;
      }
      case 'dive': {                                      // 俯衝到該段第一針
        const p = clamp((now - b.t0) / 0.34, 0, 1), e = p * p;
        const t = stG(b.seg.stitches[0]);
        b.x = b.fx + (t[0] - b.fx) * e; b.y = b.fy + (t[1] - 11 - b.fy) * e;
        if (p >= 1) { setBulbState(b, 'sew'); b.si = 0; b.st0 = now; }
        break;
      }
      case 'sew': {                                       // 針腳一段段長出 + 火花
        const list = b.seg.stitches;
        if (now - b.st0 >= b.stitchDur) {
          revealStitch(list[b.si]); b.si++; b.st0 = now;
          if (b.si >= list.length) { segDone(b); break; }
        }
        const cur = stG(list[Math.min(b.si, list.length - 1)]);
        const k = Math.min(1, dt * 14);
        b.x += (cur[0] - b.x) * k;
        b.y += (cur[1] - 11 + Math.sin(now * 30) * 0.8 - b.y) * k;
        break;
      }
      case 'spin': {                                      // 縫完發亮開心轉兩圈
        const p = clamp((now - b.t0) / 0.9, 0, 1);
        b.rot = 720 * easeOut(p);
        b.y -= dt * 4;
        if (p >= 1) {
          b.rot = 0;
          if (mode === 'healed') { setBulbState(b, 'exit'); b.t0 = now; b.exitInit = false; }
          else { setBulbState(b, 'return'); b.t0 = now; b.fx = b.x; b.fy = b.y; }
        }
        break;
      }
      case 'return': {
        const p = clamp((now - b.t0) / 0.5, 0, 1), e = easeOut(p);
        const a = b.ph + now * b.sp;
        const tx = orbitC[0] + Math.cos(a) * b.R, ty = orbitC[1] + Math.sin(a) * b.R * b.sq;
        b.x = b.fx + (tx - b.fx) * e; b.y = b.fy + (ty - b.fy) * e;
        if (p >= 1) setBulbState(b, 'hover');
        break;
      }
      case 'exit': {                                      // 任務完成:飛出畫面
        if (now < b.t0) { b.y += Math.sin(now * 10) * dt * 2; break; }
        if (!b.exitInit) {
          b.exitInit = true; b.fx = b.x; b.fy = b.y;
          let dx = b.x - 100, dy = b.y - 100;
          const l = Math.hypot(dx, dy) || 1;
          b.ex = b.x + dx / l * 170; b.ey = b.y + dy / l * 170 - 40;
        }
        const p = (now - b.t0) / 0.9;
        if (p >= 1) { b.el.style.display = 'none'; setBulbState(b, 'gone'); break; }
        const e = p * p;
        b.x = b.fx + (b.ex - b.fx) * e; b.y = b.fy + (b.ey - b.fy) * e;
        break;
      }
      default: return;
    }
    // 姿態:速度傾斜 + 光暈
    const vx = (b.x - b.px) / Math.max(dt, 0.001);
    b.px = b.x; b.py = b.y;
    b.tilt += (clamp(vx * 0.12, -16, 16) - b.tilt) * Math.min(1, dt * 8);
    const glT = b.state === 'sew' ? 0.55 + 0.3 * Math.sin(now * 24) : (b.state === 'spin' ? 1 : 0);
    b.gl += (glT - b.gl) * Math.min(1, dt * 10);
    b.g1.setAttribute('opacity', (0.2 + 0.45 * b.gl).toFixed(2));
    b.g2.setAttribute('opacity', (0.1 + 0.28 * b.gl).toFixed(2));
    b.el.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${(b.tilt + b.rot).toFixed(1)}) scale(${b.size})`);
  }

  // ---------- 主影格 ----------
  function frame(t) {
    now = t;
    const dt = last < 0 ? 0.016 : clamp(t - last, 0.001, 0.05);
    last = t;
    if (!started) { started = true; introT0 = t; }
    if (mode === 'intro' && t - introT0 > 1.15) doBreak();
    if (mode === 'healed' && t >= nextBreakAt) doBreak();

    // 心情 → 垮肩 / 眼鏡下滑 / 嘴角 / 挺胸
    mood += (moodTarget - mood) * Math.min(1, dt * 3.2);
    const sad = 1 - mood;                                 // 0 開懷 ~ 2 崩潰
    headG.setAttribute('transform', `translate(0 ${(sad * 1.1).toFixed(2)}) rotate(${(-sad * 1.4).toFixed(2)} 100 96)`);
    glassesG.setAttribute('transform', `translate(0 ${(sad * 2.6).toFixed(2)})`);
    eyesG.setAttribute('transform', `translate(0 ${(sad * 0.9).toFixed(2)})`);
    shLG.setAttribute('transform', `rotate(${(sad * 3).toFixed(2)} 45 112) translate(0 ${(sad * 0.9).toFixed(2)})`);
    shRG.setAttribute('transform', `rotate(${(-sad * 3).toFixed(2)} 155 112) translate(0 ${(sad * 0.9).toFixed(2)})`);
    const laugh = mode === 'healed' ? Math.max(0, Math.sin((now - healT0) * 6)) * 3.5 * Math.exp(-(now - healT0) * 0.25) : 0;
    mouthEl.setAttribute('d', `M84 84q16 ${(11 * mood + laugh).toFixed(1)} 32 0`);
    const sx = 1 + mood * 0.008, sy = 1 + mood * 0.015;
    torsoG.setAttribute('transform', `translate(${(100 - 100 * sx).toFixed(2)} ${(192 - 192 * sy).toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);

    // 烏雲 / 太陽
    cloudA += ((mode === 'broken' ? 1 : 0) - cloudA) * Math.min(1, dt * 3);
    sunA += ((mode === 'healed' ? 1 : 0) - sunA) * Math.min(1, dt * 3);
    cloudG.setAttribute('opacity', cloudA.toFixed(2));
    cloudG.setAttribute('transform', `translate(62 18) scale(${(0.2 + 0.8 * cloudA).toFixed(2)})`);
    sunG.setAttribute('opacity', sunA.toFixed(2));
    sunG.setAttribute('transform', `translate(62 18) scale(${(0.2 + 0.8 * sunA).toFixed(2)})`);

    // 愛心:兩半分離(縫多少合多少)+ 碎裂震動 + 痊癒脈動
    const sepT = mode === 'broken' ? maxSep * unsewnFrac : 0;
    sepCur += (sepT - sepCur) * Math.min(1, dt * 5);
    const bAge = now - breakT0;
    const shake = mode === 'broken' && bAge < 0.6 ? 1.1 * Math.sin(bAge * 46) * Math.exp(-bAge * 3.5) : 0;
    const tr = mode === 'broken' ? 0.22 * Math.sin(now * 31) * unsewnFrac : 0;
    const eff = Math.max(0, sepCur + shake);
    hL.setAttribute('transform', `translate(${(-eff + tr * 0.5).toFixed(2)} ${(eff * 0.32).toFixed(2)}) rotate(${(-eff * 1.5).toFixed(2)} 0 26)`);
    hR.setAttribute('transform', `translate(${(eff - tr * 0.5).toFixed(2)} ${(eff * 0.32).toFixed(2)}) rotate(${(eff * 1.5).toFixed(2)} 0 26)`);
    const hAge = now - healT0;
    let scale = 1;
    if (mode === 'healed') scale = 1 + 0.05 * Math.sin(now * 4.5) + 0.2 * Math.exp(-hAge * 2.2);
    else if (mode === 'intro') scale = 1 + 0.03 * Math.sin(now * 3);
    heartG.setAttribute('transform', `translate(${HC[0]} ${HC[1]}) scale(${scale.toFixed(3)})`);
    const gT = mode === 'healed' ? 0.2 + 0.07 * Math.sin(now * 4.5) + 0.25 * Math.exp(-hAge * 2.2) : 0;
    glowH.setAttribute('opacity', gT.toFixed(2));
    glowH2.setAttribute('opacity', (gT * 0.5).toFixed(2));

    // 裂縫 / 縫線透明度
    crackO += ((mode === 'broken' ? 0.35 + 0.65 * unsewnFrac : 0) - crackO) * Math.min(1, dt * 5);
    crackEl.setAttribute('opacity', crackO.toFixed(2));
    const seamT = mode === 'healed' && hAge > 0.7 ? 0 : 1;
    seamO += (seamT - seamO) * Math.min(1, dt * 3);
    seamG.style.opacity = seamO.toFixed(2);

    // 放射線 / 驚嘆貼紙(碎裂)與痊癒光芒
    if (mode !== 'intro') {
      const bp = clamp(bAge / 0.65, 0, 1);
      burstG.setAttribute('opacity', mode === 'broken' && bp < 1 ? (1 - bp).toFixed(2) : '0');
      if (mode === 'broken' && bp < 1) burstG.setAttribute('transform', `scale(${(0.55 + 0.6 * easeOut(bp)).toFixed(2)})`);
      const gp = clamp(bAge / 0.95, 0, 1);
      if (mode === 'broken' && gp < 1) {
        const s = gp < 0.2 ? gp / 0.2 * 1.15 : 1.15 - 0.15 * ((gp - 0.2) / 0.8);
        bangG.setAttribute('opacity', gp > 0.7 ? ((1 - gp) / 0.3).toFixed(2) : '1');
        bangG.setAttribute('transform', `translate(150 28) rotate(-8) scale(${s.toFixed(2)})`);
      } else bangG.setAttribute('opacity', '0');
      const hp = clamp(hAge / 0.8, 0, 1);
      shineG.setAttribute('opacity', mode === 'healed' && hp < 1 ? (1 - hp).toFixed(2) : '0');
      if (mode === 'healed' && hp < 1) shineG.setAttribute('transform', `scale(${(0.6 + 0.55 * easeOut(hp)).toFixed(2)})`);
    }

    // 火花
    sparks.forEach((s) => s.el.setAttribute('opacity', now - s.t < 0.18 ? '1' : '0'));

    // 燈泡
    bulbs.forEach((b) => bulbFrame(b, dt));
  }
  const offRaf = api.raf(frame);

  return {
    destroy() {
      offRaf();
      svg.removeEventListener('pointerdown', onDown);
      try { svg.remove(); } catch (e) {}
      try { delete stage.dataset.a2mode; } catch (e) {}
      bulbs = []; segs = []; stitches = [];
    }
  };
}
