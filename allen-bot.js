// Allen —— 平塗卡通機器人。造型身分取自 Recraft 生成的參考稿,重畫成可綁骨的結構。
//
// 從參考稿留下的:寬頭配側耳板、大白眼加深瞳孔、天線、分節軀幹(上下兩塊中間露出
// 腰關節)、胸口面板、外八大腳掌。改掉的:配色從紅藍換成品牌橘配藍;四肢從分節
// 機械臂換成一整條麵條(參考稿那組分節是提示詞裡 "metal collar" 被模型讀成
// 「一節一節的環」的副作用,和「柔軟靈活」的要求相反)。
//
// 檔案分兩段,中間那條線是刻意的:
//   ART  —— 只有 SVG 標記與座標。美術再定稿時只換這一段。
//   RIG  —— 只透過 [data-p] 名字與 J 錨點找零件,不認得任何顏色。
//
// 所有 transform 走 SVG 屬性而不是 CSS —— rotate(a,cx,cy) 自帶樞紐,不必依賴
// transform-box:fill-box 在各家瀏覽器的差異。

import { Spring, Spring2, Blinker, Pointer, FrameStep, boil, noodle, parts } from './puppet-kit.js';

// ─────────────────────────────────────────────────────────────
// ART:美術定稿後換這一段
// ─────────────────────────────────────────────────────────────

// 賽璐珞上色:每個色相 4 階「平」色,邊界銳利。不是漸層——漸層會立刻讀成現代扁平
// 插畫,硬邊色塊才讀成手繪動畫的上色。光源固定左上,所有零件的暗面都在同一側,
// 否則層次會變成雜訊。橘配藍的分工:機身橘(品牌色、亮、當主角),四肢與機械件
// 藍(退後一階,但比參考稿的 #0564B4 提亮,才在深色卡片上讀得出來)。
const C = {
  oLight: '#FF9E70', o: '#FF6B2C', oShade: '#C94E19', oDeep: '#7A2E0C',
  bLight: '#5EA8E0', b: '#2E86D4', bShade: '#0564B4', bDeep: '#08325C',
  line: '#1D131A',   // 暖黑描邊,不是純黑
  white: '#FFFFFF',
  screen: '#0B1B2E', // 面板底
};

// 關節錨點。RIG 只從這裡讀座標,不散在程式各處。
// 3.5 頭身:頭高 50、全身 3~184。頭寬 72、軀幹寬 40 —— 頭是身體的 1.8 倍,
// 大到在 96px 的團隊卡上還認得出五官,又不至於變成公仔。
const J = {
  neck: [100, 72],
  antenna: [100, 22],
  eyeL: [85, 43], eyeR: [115, 43],
  torsoPivot: [100, 140],
  shoulderL: [86, 88], shoulderR: [114, 88],
  wristL: [58, 122], wristR: [142, 122],
  hipL: [91, 138], hipR: [109, 138],
  ankleL: [86, 166], ankleR: [114, 166],
  shadowRx: 36,
};

const MOUTH = {
  idle: 'M93,59 Q100,63.5 107,59',
  happy: 'M90,57.5 Q100,67 110,57.5',
};

// 手掌:圓潤三指手套,左側一個拇指凸起。單一路徑,避免兩個圓交疊出現描邊接縫。
const MITTEN = 'M0,-7.5C5,-7.5 8.2,-4 8.2,0C8.2,4.6 5,8.2 0,8.2C-3,8.2 -5.6,6.6 -6.6,4.6'
  + 'C-9.2,4.1 -10.2,1.5 -9.2,-0.6C-8.4,-2.3 -6.6,-2.7 -5.3,-2C-4.6,-5.6 -2.6,-7.5 0,-7.5Z';

// 寬圓頂 + 收窄下巴:最寬處在 y44(x64~136),下巴收到 52 寬。
const HEAD_D = 'M74,66 C68,62 64,54 64,44 C64,29 78,20 100,20 C122,20 136,29 136,44'
  + ' C136,54 132,62 126,66 C116,71 84,71 74,66 Z';

const ART = (uid) => `
<svg viewBox="0 0 200 200" role="img" style="display:block;width:100%;height:100%">
  <defs>
    <clipPath id="hd${uid}"><path d="${HEAD_D}"/></clipPath>
    <clipPath id="tu${uid}"><rect x="80" y="78" width="40" height="30" rx="9"/></clipPath>
    <clipPath id="tl${uid}"><rect x="82" y="112" width="36" height="28" rx="9"/></clipPath>
  </defs>

  <ellipse data-p="shadow" cx="100" cy="178" rx="${J.shadowRx}" ry="6" fill="${C.line}" opacity=".16"/>

  <!-- 四肢是三層同 d 的 stroke:描邊 → 基本色 → 中央亮條。
       亮條是老卡通畫圓管的固定手法,一條就讓平的線變成圓柱。 -->
  <path data-p="leg-l-o" fill="none" stroke="${C.line}" stroke-width="13" stroke-linecap="round"/>
  <path data-p="leg-r-o" fill="none" stroke="${C.line}" stroke-width="13" stroke-linecap="round"/>
  <path data-p="leg-l-f" fill="none" stroke="${C.bShade}" stroke-width="9.4" stroke-linecap="round"/>
  <path data-p="leg-r-f" fill="none" stroke="${C.bShade}" stroke-width="9.4" stroke-linecap="round"/>
  <path data-p="leg-l-h" fill="none" stroke="${C.b}" stroke-width="4.4" stroke-linecap="round"/>
  <path data-p="leg-r-h" fill="none" stroke="${C.b}" stroke-width="4.4" stroke-linecap="round"/>

  <!-- 踝環:軟管插進金屬套環。這是「軟四肢」與「是機器人」唯一能同時成立的接法。 -->
  <g data-p="foot-l">
    <rect x="-6.5" y="-9" width="13" height="7" rx="2.6" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.4"/>
    <ellipse cx="-2" cy="3" rx="12" ry="5.8" fill="${C.bShade}" stroke="${C.line}" stroke-width="3"/>
    <ellipse cx="-3" cy="1.6" rx="9.4" ry="4" fill="${C.b}"/>
  </g>
  <g data-p="foot-r">
    <rect x="-6.5" y="-9" width="13" height="7" rx="2.6" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.4"/>
    <ellipse cx="2" cy="3" rx="12" ry="5.8" fill="${C.bShade}" stroke="${C.line}" stroke-width="3"/>
    <ellipse cx="3" cy="1.6" rx="9.4" ry="4" fill="${C.b}"/>
  </g>

  <!-- 手臂:畫在軀幹之後,肩點藏進軀幹裡,不會露出接縫 -->
  <path data-p="arm-l-o" fill="none" stroke="${C.line}" stroke-width="12" stroke-linecap="round"/>
  <path data-p="arm-r-o" fill="none" stroke="${C.line}" stroke-width="12" stroke-linecap="round"/>
  <path data-p="arm-l-f" fill="none" stroke="${C.bShade}" stroke-width="8.4" stroke-linecap="round"/>
  <path data-p="arm-r-f" fill="none" stroke="${C.bShade}" stroke-width="8.4" stroke-linecap="round"/>
  <path data-p="arm-l-h" fill="none" stroke="${C.b}" stroke-width="3.8" stroke-linecap="round"/>
  <path data-p="arm-r-h" fill="none" stroke="${C.b}" stroke-width="3.8" stroke-linecap="round"/>

  <g data-p="torso">
    <!-- 腰關節:上下軀幹之間刻意留縫露出來。分節軀幹是參考稿最強的機器人訊號之一,
         而且它不佔面積、不影響四肢的柔軟。 -->
    <rect x="90" y="103" width="20" height="14" rx="4" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.6"/>

    <rect x="82" y="112" width="36" height="28" rx="9" fill="${C.o}" stroke="none"/>
    <path d="M107,108 C113,120 113,132 106,143 L126,143 L126,108 Z" fill="${C.oShade}" clip-path="url(#tl${uid})"/>
    <g stroke="${C.oDeep}" stroke-width="2" stroke-linecap="round" opacity=".55">
      <path d="M89,124 L111,124"/><path d="M89,129 L111,129"/><path d="M89,134 L111,134"/>
    </g>
    <rect x="82" y="112" width="36" height="28" rx="9" fill="none" stroke="${C.line}" stroke-width="3"/>

    <rect x="80" y="78" width="40" height="30" rx="9" fill="${C.o}" stroke="none"/>
    <!-- 暗面:硬邊色塊,不是漸層。光源在左上,所以暗面一律在右下。 -->
    <path d="M106,74 C113,86 113,100 105,111 L126,111 L126,74 Z" fill="${C.oShade}" clip-path="url(#tu${uid})"/>
    <path d="M78,90 C79,82 86,78 94,77 C86,80 82,84 81,92 Z" fill="${C.oLight}" clip-path="url(#tu${uid})"/>
    <rect x="80" y="78" width="40" height="30" rx="9" fill="none" stroke="${C.line}" stroke-width="3"/>

    <!-- 胸口面板:白底加一圈指示環。這塊就是首頁 Loading 那個累積 %數的實體版, -->
    <!-- 之後可以直接把進度接到 chest-ring / chest-dot。 -->
    <rect x="84" y="84" width="32" height="17" rx="3.5" fill="${C.screen}" stroke="${C.line}" stroke-width="2.6"/>
    <circle data-p="chest-ring" cx="100" cy="92.5" r="6.5" fill="none" stroke="${C.o}" stroke-width="2.4"/>
    <circle data-p="chest-dot" cx="100" cy="92.5" r="3.2" fill="${C.oLight}"/>
  </g>

  <!-- 頸:橫跨頭與軀幹的縫,轉頭時不會撕開 -->
  <rect x="92" y="64" width="16" height="18" rx="6" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.8"/>

  <g data-p="hand-l">
    <rect x="-5.5" y="-11.5" width="11" height="6" rx="2.2" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.4"/>
    <path d="${MITTEN}" fill="${C.b}" stroke="${C.line}" stroke-width="3"/>
    <circle cx="-1.5" cy="-2.6" r="2.8" fill="${C.bLight}"/>
  </g>
  <g data-p="hand-r">
    <rect x="-5.5" y="-11.5" width="11" height="6" rx="2.2" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.4"/>
    <path d="${MITTEN}" fill="${C.b}" stroke="${C.line}" stroke-width="3"/>
    <circle cx="-1.5" cy="-2.6" r="2.8" fill="${C.bLight}"/>
  </g>

  <g data-p="head">
    <g data-p="antenna">
      <rect x="97.5" y="10" width="5" height="13" rx="2.5" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.4"/>
      <circle cx="100" cy="7.5" r="4.5" fill="${C.o}" stroke="${C.line}" stroke-width="2.4"/>
      <path d="M97.5,6 A3.6 3.6 0 0 1 101,4.2 A4.5 4.5 0 0 0 97.5,6 Z" fill="${C.oLight}"/>
    </g>

    <!-- 側耳板:參考稿最好認的那組零件。畫在頭之前,只露出外半邊。 -->
    <g>
      <rect x="55" y="36" width="13" height="18" rx="3.5" fill="${C.bShade}" stroke="${C.line}" stroke-width="2.6"/>
      <rect x="57.5" y="39.5" width="5" height="11" rx="2" fill="${C.b}"/>
    </g>
    <g>
      <rect x="132" y="36" width="13" height="18" rx="3.5" fill="${C.bShade}" stroke="${C.line}" stroke-width="2.6"/>
      <rect x="137.5" y="39.5" width="5" height="11" rx="2" fill="${C.b}"/>
    </g>

    <path d="${HEAD_D}" fill="${C.o}" stroke="none"/>
    <path d="M118,14 C129,30 130,54 117,74 L148,74 L148,14 Z" fill="${C.oShade}" clip-path="url(#hd${uid})"/>
    <path d="M68,42 C70,29 80,23 94,22 C82,26 75,32 72,44 Z" fill="${C.oLight}" clip-path="url(#hd${uid})"/>
    <path d="${HEAD_D}" fill="none" stroke="${C.line}" stroke-width="3"/>

    <!-- 鏡頭外框:眼白與瞳孔都保留,但裝進金屬框裡 —— 變成「機器的眼睛」。
         外框在眨眼群組之外,眼睛壓扁時外框不動,像眼皮在框內閉起來。 -->
    <ellipse cx="85" cy="43" rx="12.6" ry="13.6" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.4"/>
    <ellipse cx="115" cy="43" rx="12.6" ry="13.6" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.4"/>
    <g data-p="eye-l">
      <ellipse cx="85" cy="43" rx="11" ry="12" fill="${C.white}"/>
      <g data-p="pupil-l">
        <circle cx="85" cy="43" r="5.4" fill="${C.line}"/>
        <circle cx="82.8" cy="40.3" r="2.1" fill="${C.white}"/>
      </g>
    </g>
    <g data-p="eye-r">
      <ellipse cx="115" cy="43" rx="11" ry="12" fill="${C.white}"/>
      <g data-p="pupil-r">
        <circle cx="115" cy="43" r="5.4" fill="${C.line}"/>
        <circle cx="112.8" cy="40.3" r="2.1" fill="${C.white}"/>
      </g>
    </g>

    <!-- 笑眼:填充月牙,中間厚兩端收尖。等粗的 stroke 會很死,月牙才有生命力。 -->
    <path data-p="happy-l" d="M74,46 Q85,32 96,46 Q85,41.5 74,46 Z" fill="${C.line}" opacity="0"/>
    <path data-p="happy-r" d="M104,46 Q115,32 126,46 Q115,41.5 104,46 Z" fill="${C.line}" opacity="0"/>

    <path data-p="mouth" d="${MOUTH.idle}" fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;

// ─────────────────────────────────────────────────────────────
// RIG:只認 data-p 名字與 J 錨點,不認顏色
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
  // clipPath 的 id 必須每個實例唯一 —— 同一頁掛兩隻時,重複 id 會讓第二隻的裁切
  // 指到第一隻,暗面色塊直接消失。
  const uid = 'a' + Math.random().toString(36).slice(2, 8);
  mount.innerHTML = ART(uid);
  const svg = mount.querySelector('svg');
  const p = parts(svg);

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

  // 靜止姿勢:reduced 與「還沒開始跑」共用這一組,兩者看起來一致
  const rest = () => {
    paintLimb('arm-l', J.shoulderL, J.wristL, 0, 0, 5, 'hand-l');
    paintLimb('arm-r', J.shoulderR, J.wristR, 0, 0, 5, 'hand-r');
    paintLimb('leg-l', J.hipL, J.ankleL, 0, 0, 2, 'foot-l');
    paintLimb('leg-r', J.hipR, J.ankleR, 0, 0, 2, 'foot-r');
  };

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
  // 老動畫是一秒 12 格。物理照 rAF 全速跑,只有畫面被關進格子裡 —— 這一項對
  // 「像不像手繪」的影響大於任何美術細節。
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
    const ey = J.eyeL[1];
    const eye = (name, cx) => p[name].setAttribute('transform',
      `translate(${cx},${ey}) scale(1,${r1(Math.max(0.02, 1 - shut * 0.96))}) translate(${-cx},${-ey})`);
    eye('eye-l', J.eyeL[0]); eye('eye-r', J.eyeR[0]);
    p['eye-l'].style.opacity = p['eye-r'].style.opacity = r1(1 - h);
    p['happy-l'].style.opacity = p['happy-r'].style.opacity = r1(h);
    // 月牙跟著笑意長出來,不是硬切換
    const hs = `scale(1,${r1(0.4 + h * 0.6)})`;
    p['happy-l'].setAttribute('transform', `translate(${J.eyeL[0]},${ey}) ${hs} translate(${-J.eyeL[0]},${-ey})`);
    p['happy-r'].setAttribute('transform', `translate(${J.eyeR[0]},${ey}) ${hs} translate(${-J.eyeR[0]},${-ey})`);

    paintLimb('arm-l', J.shoulderL, [wl.x + jx(5), wl.y + jx(6)], wl.vx, wl.vy, 5, 'hand-l');
    paintLimb('arm-r', J.shoulderR, [wr.x + jx(7), wr.y + jx(8)], wr.vx, wr.vy, 5, 'hand-r');
    paintLimb('leg-l', J.hipL, [al.x + jx(9), al.y], al.vx, al.vy, 2, 'foot-l');
    paintLimb('leg-r', J.hipR, [ar.x + jx(10), ar.y], ar.vx, ar.vy, 2, 'foot-r');

    // 胸口指示環:呼吸同步的明滅;笑的時候亮起來
    p['chest-ring'].style.opacity = r1(0.55 + 0.25 * (br * 0.5 + 0.5) + h * 0.2);
    p['chest-dot'].setAttribute('r', r1(3.2 + br * 0.4 + h * 1.2));
    p.shadow.setAttribute('rx', r1(J.shadowRx - br * 0.8));
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
