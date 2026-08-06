// Allen ——「寬圓頂 + 收窄下巴」的平塗卡通機器人。
//
// 造型定案:3.5 頭身、暖米白機身 (#EDE7DC)、暖黑描邊 (#1A1714)、品牌橘只出現在
// 三個地方(胸口指示燈、天線頂球、腕踝環)。四肢是「一整條麵條」——一條三次
// 貝茲,沒有分節也沒有關節,所以可以捲、可以甩、可以打結。
//
// 檔案分兩段,中間那條線是刻意的:
//   ART  —— 只有 SVG 標記。之後美術定稿(AI 生圖 → 向量化)直接換掉這一段。
//   RIG  —— 只透過 [data-p] 名字找零件,不認得任何座標或顏色。
// 換美術時 RIG 一行都不用改,前提是新的 SVG 沿用同一組 data-p 名字。
//
// 所有 transform 走 SVG 屬性而不是 CSS —— rotate(a,cx,cy) 自帶樞紐,
// 不必依賴 transform-box:fill-box 在各家瀏覽器的差異。

import { Spring, Spring2, Blinker, Pointer, FrameStep, boil, noodle, parts } from './puppet-kit.js';

// ─────────────────────────────────────────────────────────────
// ART:美術定稿後換這一段
// ─────────────────────────────────────────────────────────────
// 賽璐珞上色:同一個色相 2–3 個「平」色階,邊界銳利。不是漸層 —— 漸層會立刻
// 讀成現代扁平插畫;硬邊色塊才讀成手繪動畫的上色。光源固定在左上,所有零件的
// 暗面都在同一側,否則層次會變成雜訊。
const C = {
  light: '#F7F3EA',      // 亮面
  body: '#E6DECF',       // 基本色
  shade: '#C9BCA6',      // 暗面
  deep: '#A8987F',       // 深暗(關節環、頸)
  line: '#1F1A15',       // 暖黑描邊(不是純黑)
  accent: '#FF6B2C',     // 品牌橘
  accentDark: '#D14E17', // 橘的暗面
  white: '#FFFFFF',
};

// 關節錨點。RIG 只從這裡讀座標,不散在程式各處。
const J = {
  neck: [100, 74],
  antenna: [100, 25],
  eyeL: [85, 47], eyeR: [115, 47],
  torsoPivot: [100, 130],
  shoulderL: [82, 92], shoulderR: [118, 92],
  wristL: [60, 120], wristR: [140, 120],
  hipL: [91, 127], hipR: [109, 127],
  ankleL: [88, 157], ankleR: [112, 157],
};

const MOUTH = {
  idle: 'M92,62 Q100,67 108,62',
  happy: 'M89,60 Q100,70.5 111,60',
};

// 手掌:圓潤三指手套,左側一個拇指凸起。單一路徑,避免兩個圓交疊出現描邊接縫。
const MITTEN = 'M0,-7.5C5,-7.5 8.2,-4 8.2,0C8.2,4.6 5,8.2 0,8.2C-3,8.2 -5.6,6.6 -6.6,4.6'
  + 'C-9.2,4.1 -10.2,1.5 -9.2,-0.6C-8.4,-2.3 -6.6,-2.7 -5.3,-2C-4.6,-5.6 -2.6,-7.5 0,-7.5Z';

const HEAD_D = 'M78,70 C70,66 68,57 68,46 C68,32 82,24 100,24 C118,24 132,32 132,46'
  + ' C132,57 130,66 122,70 C113,75.5 87,75.5 78,70 Z';

const ART = (uid) => `
<svg viewBox="0 0 200 200" role="img" style="display:block;width:100%;height:100%">
  <defs>
    <clipPath id="hd${uid}"><path d="${HEAD_D}"/></clipPath>
    <clipPath id="ts${uid}"><rect x="76" y="79" width="48" height="51" rx="15"/></clipPath>
  </defs>

  <ellipse data-p="shadow" cx="100" cy="166" rx="33" ry="6" fill="${C.line}" opacity=".16"/>

  <!-- 四肢是三層同 d 的 stroke:描邊 → 基本色 → 中央亮條。
       亮條是老卡通畫圓管的固定手法,一條就讓平的線變成圓柱。 -->
  <path data-p="leg-l-o" fill="none" stroke="${C.line}" stroke-width="13.5" stroke-linecap="round"/>
  <path data-p="leg-r-o" fill="none" stroke="${C.line}" stroke-width="13.5" stroke-linecap="round"/>
  <path data-p="leg-l-f" fill="none" stroke="${C.shade}" stroke-width="9.5" stroke-linecap="round"/>
  <path data-p="leg-r-f" fill="none" stroke="${C.shade}" stroke-width="9.5" stroke-linecap="round"/>
  <path data-p="leg-l-h" fill="none" stroke="${C.body}" stroke-width="4.6" stroke-linecap="round"/>
  <path data-p="leg-r-h" fill="none" stroke="${C.body}" stroke-width="4.6" stroke-linecap="round"/>
  <!-- 踝環:軟管插進金屬套環。這是「軟四肢」與「是機器人」唯一能同時成立的
       接法——沒有它,麵條四肢會把角色整個推向絨毛玩偶。 -->
  <g data-p="foot-l">
    <rect x="-6" y="-8" width="12" height="6.5" rx="2.4" fill="${C.deep}" stroke="${C.line}" stroke-width="2.4"/>
    <ellipse cx="1" cy="3" rx="10" ry="5.6" fill="${C.shade}" stroke="${C.line}" stroke-width="3"/>
    <ellipse cx="0" cy="1.8" rx="8" ry="4" fill="${C.body}"/>
  </g>
  <g data-p="foot-r">
    <rect x="-6" y="-8" width="12" height="6.5" rx="2.4" fill="${C.deep}" stroke="${C.line}" stroke-width="2.4"/>
    <ellipse cx="-1" cy="3" rx="10" ry="5.6" fill="${C.shade}" stroke="${C.line}" stroke-width="3"/>
    <ellipse cx="0" cy="1.8" rx="8" ry="4" fill="${C.body}"/>
  </g>

  <!-- 手臂:畫在軀幹之後,肩點藏進軀幹裡,不會露出接縫 -->
  <path data-p="arm-l-o" fill="none" stroke="${C.line}" stroke-width="12.5" stroke-linecap="round"/>
  <path data-p="arm-r-o" fill="none" stroke="${C.line}" stroke-width="12.5" stroke-linecap="round"/>
  <path data-p="arm-l-f" fill="none" stroke="${C.shade}" stroke-width="8.5" stroke-linecap="round"/>
  <path data-p="arm-r-f" fill="none" stroke="${C.shade}" stroke-width="8.5" stroke-linecap="round"/>
  <path data-p="arm-l-h" fill="none" stroke="${C.body}" stroke-width="4" stroke-linecap="round"/>
  <path data-p="arm-r-h" fill="none" stroke="${C.body}" stroke-width="4" stroke-linecap="round"/>

  <!-- 頸:橫跨頭與軀幹的縫,轉頭時不會撕開 -->
  <rect x="91" y="66" width="18" height="18" rx="7" fill="${C.deep}" stroke="${C.line}" stroke-width="3"/>

  <g data-p="torso">
    <rect x="76" y="79" width="48" height="51" rx="15" fill="${C.body}" stroke="${C.line}" stroke-width="3"/>
    <!-- 暗面:硬邊色塊,不是漸層。光源在左上,所以暗面一律在右下。 -->
    <path d="M109,74 C116,94 116,114 107,135 L134,135 L134,74 Z" fill="${C.shade}" clip-path="url(#ts${uid})"/>
    <!-- 面板接縫:機殼是拼起來的。我先前把 panel lines 寫進負面提示詞是錯的,
         這是機器人少數幾個不佔面積又有效的訊號。 -->
    <path d="M76,116 L124,116" stroke="${C.line}" stroke-width="2" opacity=".45" clip-path="url(#ts${uid})"/>
    <rect x="76" y="79" width="48" height="51" rx="15" fill="none" stroke="${C.line}" stroke-width="3"/>
    <circle data-p="chest-ring" cx="100" cy="102" r="9.5" fill="none" stroke="${C.accent}" stroke-width="3.4"/>
    <circle data-p="chest-dot" cx="100" cy="102" r="3.2" fill="${C.accent}"/>
  </g>

  <g data-p="hand-l">
    <rect x="-5.5" y="-11.5" width="11" height="6" rx="2.2" fill="${C.deep}" stroke="${C.line}" stroke-width="2.4"/>
    <path d="${MITTEN}" fill="${C.body}" stroke="${C.line}" stroke-width="3"/>
    <circle cx="-1.5" cy="-2.6" r="2.8" fill="${C.light}"/>
  </g>
  <g data-p="hand-r">
    <rect x="-5.5" y="-11.5" width="11" height="6" rx="2.2" fill="${C.deep}" stroke="${C.line}" stroke-width="2.4"/>
    <path d="${MITTEN}" fill="${C.body}" stroke="${C.line}" stroke-width="3"/>
    <circle cx="-1.5" cy="-2.6" r="2.8" fill="${C.light}"/>
  </g>

  <g data-p="head">
    <g data-p="antenna">
      <rect x="97.5" y="12" width="5" height="14" rx="2.5" fill="${C.deep}" stroke="${C.line}" stroke-width="2.4"/>
      <circle cx="100" cy="9" r="5" fill="${C.accent}" stroke="${C.line}" stroke-width="2.4"/>
      <path d="M97,7.5 A4 4 0 0 1 101,5.5 A5 5 0 0 0 97,7.5 Z" fill="${C.light}" opacity=".8"/>
    </g>
    <!-- 側頭圓盤(伺服器蓋/喇叭):畫在頭之前,只露出外半邊。這是最便宜的
         「這是一台機器」訊號,而且參考圖那隻沒有,順便再拉開一次剪影。 -->
    <g><circle cx="69" cy="52" r="7.5" fill="${C.deep}" stroke="${C.line}" stroke-width="2.6"/>
       <circle cx="69" cy="52" r="3" fill="${C.shade}"/></g>
    <g><circle cx="131" cy="52" r="7.5" fill="${C.deep}" stroke="${C.line}" stroke-width="2.6"/>
       <circle cx="131" cy="52" r="3" fill="${C.shade}"/></g>
    <path d="${HEAD_D}" fill="${C.body}" stroke="none"/>
    <path d="M116,16 C126,34 127,58 115,80 L146,80 L146,16 Z" fill="${C.shade}" clip-path="url(#hd${uid})"/>
    <path d="M72,44 C74,32 84,26 97,25 C86,29 79,34 76,46 Z" fill="${C.light}" clip-path="url(#hd${uid})"/>
    <path d="${HEAD_D}" fill="none" stroke="${C.line}" stroke-width="3"/>

    <!-- 鏡頭外框:眼白與瞳孔都保留,但裝進金屬框裡 —— 變成「機器的眼睛」。
         外框在眨眼群組之外,眼睛壓扁時外框不動,像眼皮在框內閉起來。 -->
    <ellipse cx="85" cy="47" rx="12.4" ry="13.9" fill="${C.deep}" stroke="${C.line}" stroke-width="2.4"/>
    <ellipse cx="115" cy="47" rx="12.4" ry="13.9" fill="${C.deep}" stroke="${C.line}" stroke-width="2.4"/>
    <g data-p="eye-l">
      <ellipse cx="85" cy="47" rx="10.8" ry="12.2" fill="${C.white}"/>
      <g data-p="pupil-l">
        <circle cx="85" cy="47" r="5.2" fill="${C.line}"/>
        <circle cx="82.9" cy="44.5" r="2" fill="${C.white}"/>
      </g>
    </g>
    <g data-p="eye-r">
      <ellipse cx="115" cy="47" rx="10.8" ry="12.2" fill="${C.white}"/>
      <g data-p="pupil-r">
        <circle cx="115" cy="47" r="5.2" fill="${C.line}"/>
        <circle cx="112.9" cy="44.5" r="2" fill="${C.white}"/>
      </g>
    </g>

    <!-- 笑眼:填充月牙,中間厚兩端收尖。等粗的 stroke 會很死,月牙才有生命力。 -->
    <path data-p="happy-l" d="M74,50 Q85,36 96,50 Q85,45.5 74,50 Z" fill="${C.line}" opacity="0"/>
    <path data-p="happy-r" d="M104,50 Q115,36 126,50 Q115,45.5 104,50 Z" fill="${C.line}" opacity="0"/>

    <path data-p="mouth" d="${MOUTH.idle}" fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;

// ─────────────────────────────────────────────────────────────
// RIG:只認 data-p 名字,不認座標與顏色
// ─────────────────────────────────────────────────────────────

const r1 = (n) => Math.round(n * 10) / 10;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** 掛一隻 Allen 到 mount 元素裡。
 *
 *  opts.raf     (cb) => off。呼叫端提供的每幀回呼註冊器(共用 rAF)。
 *               不傳就只畫靜止姿勢,不動。
 *  opts.reduced true 時完全不註冊每幀回呼,停在靜止姿勢。
 *
 *  回傳 { el, setMood, wave, destroy }。 */
export function createAllenBot(mount, { raf = null, reduced = false } = {}) {
  // clipPath 的 id 必須每個實例唯一 —— 同一頁掛兩隻時,重複 id 會讓第二隻
  // 的裁切指到第一隻,暗面色塊直接消失。
  const uid = 'a' + Math.random().toString(36).slice(2, 8);
  mount.innerHTML = ART(uid);
  const svg = mount.querySelector('svg');
  const p = parts(svg);

  // 靜止姿勢:reduced 與「還沒開始跑」共用這一組,兩者看起來一致
  const rest = () => {
    paintLimb('arm-l', J.shoulderL, J.wristL, 0, 0, 5, 'hand-l');
    paintLimb('arm-r', J.shoulderR, J.wristR, 0, 0, 5, 'hand-r');
    paintLimb('leg-l', J.hipL, J.ankleL, 0, 0, 2, 'foot-l');
    paintLimb('leg-r', J.hipR, J.ankleR, 0, 0, 2, 'foot-r');
  };

  function paintLimb(name, [ax, ay], [bx, by], vx, vy, sag, endName) {
    const n = noodle(ax, ay, bx, by, vx, vy, { sag });
    // 描邊 / 基本色 / 中央亮條共用同一條路徑,只有 stroke-width 不同
    p[name + '-o'].setAttribute('d', n.d);
    p[name + '-f'].setAttribute('d', n.d);
    p[name + '-h'].setAttribute('d', n.d);
    if (endName && p[endName]) {
      p[endName].setAttribute('transform', `translate(${r1(bx)},${r1(by)}) rotate(${r1(n.angle - 90)})`);
    }
  }

  if (reduced || !raf) { rest(); return { el: svg, setMood() {}, wave() {}, destroy() {} }; }

  // ---- 狀態 ----
  const wl = Spring2(J.wristL[0], J.wristL[1], { k: 55, d: 9 });
  const wr = Spring2(J.wristR[0], J.wristR[1], { k: 55, d: 9 });
  const al = Spring2(J.ankleL[0], J.ankleL[1], { k: 150, d: 20 });   // 腳要撐體重,調硬
  const ar = Spring2(J.ankleR[0], J.ankleR[1], { k: 150, d: 20 });
  const headX = Spring(0, { k: 90, d: 15 });
  const headY = Spring(0, { k: 90, d: 15 });
  const headR = Spring(0, { k: 90, d: 15 });
  const antR = Spring(0, { k: 130, d: 11 });   // 落後於頭部旋轉,差值就是甩動
  const pupX = Spring(0, { k: 140, d: 17 });
  const pupY = Spring(0, { k: 140, d: 17 });
  const happy = Spring(0, { k: 200, d: 24 });  // 0 = 平常眼,1 = 笑眼

  const blink = Blinker();
  const ptr = Pointer(svg);
  // 老動畫是一秒 12 格。物理照 rAF 全速跑,只有畫面被關進格子裡 —— 這一項
  // 對「像不像手繪」的影響大於任何美術細節。
  const fs = FrameStep(12);
  let mood = 'idle', waveT = -1, t = 0, last = 0, shut = 0;

  const enter = () => setMood('happy');
  const leave = () => setMood('idle');
  const tap = () => { setMood('happy'); waveT = 0; };
  mount.addEventListener('pointerenter', enter);
  mount.addEventListener('pointerleave', leave);
  mount.addEventListener('click', tap);

  function setMood(m) {
    if (m === mood) return;
    mood = m;
    happy.to(m === 'happy' ? 1 : 0);
    p.mouth.setAttribute('d', m === 'happy' ? MOUTH.happy : MOUTH.idle);
    if (m === 'happy') blink.blink();
  }

  const off = raf((now) => {
    const dt = last ? clamp(now - last, 0, 1 / 30) : 1 / 60;
    last = now; t += dt;

    // ═══ 物理:每個 rAF 都跑。彈簧要吃得到真實 dt,降幀只能降畫面不能降物理,
    //     否則 12fps 的大 dt 會讓彈簧震盪。 ═══
    ptr.step(dt);

    const br = Math.sin(t * 1.5);                      // 呼吸
    happy.step(dt);
    const h = clamp(happy.value, 0, 1);
    shut = Math.max(blink.step(dt), h);

    headX.to(ptr.x * 3.6); headY.to(ptr.y * 2.2 - br * 1.2); headR.to(ptr.x * 5);
    headX.step(dt); headY.step(dt); headR.step(dt);
    antR.to(headR.value); antR.step(dt);               // 永遠慢一步,差值就是甩動
    pupX.to(ptr.x * 3.4); pupY.to(ptr.y * 2.6);
    pupX.step(dt); pupY.step(dt);

    // 揮手:點一下,右手抬起來擺三下再放回去
    let wrTarget = [J.wristR[0], J.wristR[1]];
    if (waveT >= 0) {
      waveT += dt;
      if (waveT > 1.7) waveT = -1;
      else {
        const up = Math.min(1, waveT / 0.22);
        const s = Math.sin(waveT * 17) * 9 * (waveT > 1.2 ? (1.7 - waveT) / 0.5 : 1);
        wrTarget = [J.wristR[0] + 6 + s * up, J.wristR[1] - 46 * up];
      }
    }

    // 麵條四肢:閒置時各自漂移,相位錯開才不會像在做體操
    const sway = (ph, amp) => Math.sin(t * 0.9 + ph) * amp;
    wl.to(J.wristL[0] + sway(0, 2.4) - ptr.x * 3, J.wristL[1] + sway(1.7, 2) - h * 5);
    wr.to(wrTarget[0] + (waveT < 0 ? sway(2.9, 2.4) - ptr.x * 3 : 0),
          wrTarget[1] + (waveT < 0 ? sway(4.4, 2) - h * 5 : 0));
    al.to(J.ankleL[0] + sway(1.1, 0.8), J.ankleL[1]);
    ar.to(J.ankleR[0] + sway(3.6, 0.8), J.ankleR[1]);
    wl.step(dt); wr.step(dt); al.step(dt); ar.step(dt);

    // ═══ 畫面:只在 12 格/秒的格子邊界更新。 ═══
    if (!fs.step(dt)) return;
    const F = fs.frame;
    // 線條沸騰:每一格給每個零件一個固定的次像素偏移,模擬「這一格是重畫的」。
    // 種子用格數不用時間,所以同一格永遠抖同一個量,是沸騰不是雜訊。
    const jx = (seed) => boil(F, seed, 0.55);

    p.torso.setAttribute('transform',
      `translate(${r1(jx(1))},${r1(jx(2))}) `
      + `translate(${J.torsoPivot[0]},${J.torsoPivot[1]}) `
      + `scale(${r1(1 - br * 0.009)},${r1(1 + br * 0.014)}) `
      + `translate(${-J.torsoPivot[0]},${-J.torsoPivot[1]})`);

    p.head.setAttribute('transform',
      `translate(${r1(headX.value + jx(3))},${r1(headY.value + jx(4))}) `
      + `rotate(${r1(headR.value)},${J.neck[0]},${J.neck[1]})`);

    p.antenna.setAttribute('transform',
      `rotate(${r1(clamp((headR.value - antR.value) * 2.6, -18, 18))},${J.antenna[0]},${J.antenna[1]})`);

    const pt = `translate(${r1(pupX.value)},${r1(pupY.value)})`;
    p['pupil-l'].setAttribute('transform', pt);
    p['pupil-r'].setAttribute('transform', pt);

    // 眨眼與笑都壓扁平常眼,取比較閉的那個
    const eye = (name, cx) => p[name].setAttribute('transform',
      `translate(${cx},47) scale(1,${r1(Math.max(0.02, 1 - shut * 0.96))}) translate(${-cx},-47)`);
    eye('eye-l', J.eyeL[0]); eye('eye-r', J.eyeR[0]);
    p['eye-l'].style.opacity = p['eye-r'].style.opacity = r1(1 - h);
    p['happy-l'].style.opacity = p['happy-r'].style.opacity = r1(h);
    // 月牙跟著笑意長出來,不是硬切換
    const hs = `scale(1,${r1(0.4 + h * 0.6)})`;
    p['happy-l'].setAttribute('transform', `translate(85,47) ${hs} translate(-85,-47)`);
    p['happy-r'].setAttribute('transform', `translate(115,47) ${hs} translate(-115,-47)`);

    paintLimb('arm-l', J.shoulderL, [wl.x + jx(5), wl.y + jx(6)], wl.vx, wl.vy, 5, 'hand-l');
    paintLimb('arm-r', J.shoulderR, [wr.x + jx(7), wr.y + jx(8)], wr.vx, wr.vy, 5, 'hand-r');
    paintLimb('leg-l', J.hipL, [al.x + jx(9), al.y], al.vx, al.vy, 2, 'foot-l');
    paintLimb('leg-r', J.hipR, [ar.x + jx(10), ar.y], ar.vx, ar.vy, 2, 'foot-r');

    // 胸口指示燈:呼吸同步的明滅;笑的時候亮起來
    p['chest-ring'].style.opacity = r1(0.55 + 0.25 * (br * 0.5 + 0.5) + h * 0.2);
    p['chest-dot'].setAttribute('r', r1(3.2 + br * 0.5 + h * 1.2));
    p.shadow.setAttribute('rx', r1(33 - br * 0.8));
  });

  rest();

  return {
    el: svg,
    setMood,
    wave() { waveT = 0; },
    destroy() {
      off && off();
      ptr.destroy();
      mount.removeEventListener('pointerenter', enter);
      mount.removeEventListener('pointerleave', leave);
      mount.removeEventListener('click', tap);
    },
  };
}
