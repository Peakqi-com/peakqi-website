// Allen —— 平塗卡通機器人。造型身分取自 Recraft 生成的參考稿,重畫成可綁骨的結構。
//
// 從參考稿留下的:寬頭配側耳板、大白眼加深瞳孔、天線、分節軀幹(上下兩塊中間露出
// 腰關節)、胸口面板、外八大腳掌。改掉的:配色從紅藍換成品牌橘配藍;四肢從分節
// 機械臂換成一整條麵條(參考稿那組分節是提示詞裡 "metal collar" 被模型讀成
// 「一節一節的環」的副作用,和「柔軟靈活」的要求相反)。
//
// 表情取自第二張參考稿的九宮格。九格裡有三格重複,實際是六種:微笑 / 開口笑 /
// 大笑 / 驚訝 / 思考 / 半瞇,再加一個皺眉。不是複製它的路徑——那張的頭是方的,
// 這裡是寬圓頂,幾何對不上——而是照它每一格的「構造邏輯」在 Allen 身上重畫:
//   微笑   白眼球 + 瞳孔置中 + 上揚弧線嘴
//   開口笑 眼窩收成 ∩ 弧 + 張嘴
//   大笑   ∩ 弧 + 張嘴露白牙與舌
//   驚訝   眼睛不變但瞳孔縮到四成 + 直立橢圓嘴
//   思考   瞳孔偏右上 + 一字嘴
//   半瞇   上眼皮壓下一半 + 小嘴
//   皺眉   眉毛外側壓低 + 下彎嘴
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

// 賽璐珞上色:同一色相 4 階「平」色,邊界銳利。不是漸層——漸層會立刻讀成現代扁平
// 插畫,硬邊色塊才讀成手繪動畫的上色。光源固定左上,所有零件的暗面都在同一側。
const C = {
  oLight: '#FF9E70', o: '#FF6B2C', oShade: '#C94E19', oDeep: '#7A2E0C',
  bLight: '#5EA8E0', b: '#2E86D4', bShade: '#0564B4', bDeep: '#08325C',
  line: '#1D131A',
  white: '#FFFFFF',
  screen: '#0B1B2E',
};

// 關節錨點。RIG 只從這裡讀座標,不散在程式各處。
// 頭高 56、全身 3~186。頭寬 72 對軀幹寬 40 = 1.8 倍 —— 大到在 96px 的團隊卡上
// 還認得出五官,又不至於變成公仔。下巴刻意留長:眼睛佔掉頭的上半,張嘴的表情
// 需要下半有位置,不然嘴會撞到鏡頭外框。
const J = {
  neck: [100, 78],
  antenna: [100, 23],
  eyeL: [85, 41], eyeR: [115, 41],
  torsoPivot: [100, 142],
  shoulderL: [86, 90], shoulderR: [114, 90],
  wristL: [58, 124], wristR: [142, 124],
  hipL: [91, 140], hipR: [109, 140],
  ankleL: [86, 168], ankleR: [114, 168],
  shadowRx: 36,
};

// 嘴形。閉嘴走 m-line(線條),張嘴走 m-open + m-teeth + m-tongue(填充)。
// 兩套不能共用一條路徑 —— 線條嘴要 stroke-linecap 的圓頭,張嘴要實心的口腔。
const MOUTH = {
  smile: { line: 'M92.5,61 Q100,66 107.5,61' },
  flat: { line: 'M93,63 L107,63' },
  worry: { line: 'M92.5,65 Q100,60 107.5,65' },
  small: { line: 'M96.5,63 L103.5,63' },
  open: { open: 'M89,57.5 Q100,55 111,57.5 Q110,71 100,71 Q90,71 89,57.5 Z' },
  laugh: {
    open: 'M88,56.5 Q100,54 112,56.5 Q111,72 100,72 Q89,72 88,56.5 Z',
    teeth: 'M89.6,57.6 Q100,55.4 110.4,57.6 L109.8,61 Q100,59.2 90.2,61 Z',
    tongue: 'M94,66.5 Q100,63.2 106,66.5 Q104.8,71.6 100,71.6 Q95.2,71.6 94,66.5 Z',
  },
  o: { open: 'M100,56.5 C104,56.5 106.2,59.6 106.2,63.3 C106.2,67.2 104,70 100,70'
    + ' C96,70 93.8,67.2 93.8,63.3 C93.8,59.6 96,56.5 100,56.5 Z' },
};

// 手掌:圓潤三指手套,左側一個拇指凸起。單一路徑,避免兩個圓交疊出現描邊接縫。
const MITTEN = 'M0,-7.5C5,-7.5 8.2,-4 8.2,0C8.2,4.6 5,8.2 0,8.2C-3,8.2 -5.6,6.6 -6.6,4.6'
  + 'C-9.2,4.1 -10.2,1.5 -9.2,-0.6C-8.4,-2.3 -6.6,-2.7 -5.3,-2C-4.6,-5.6 -2.6,-7.5 0,-7.5Z';

// 寬圓頂 + 收窄下巴:最寬處在 y45(x64~136),下巴收到 52 寬。
const HEAD_D = 'M74,71 C68,67 64,58 64,45 C64,29 78,20 100,20 C122,20 136,29 136,45'
  + ' C136,58 132,67 126,71 C116,77 84,77 74,71 Z';

const ART = (uid) => `
<svg viewBox="0 0 200 200" role="img" style="display:block;width:100%;height:100%">
  <defs>
    <clipPath id="hd${uid}"><path d="${HEAD_D}"/></clipPath>
    <clipPath id="tu${uid}"><rect x="80" y="80" width="40" height="30" rx="9"/></clipPath>
    <clipPath id="tl${uid}"><rect x="82" y="114" width="36" height="28" rx="9"/></clipPath>
  </defs>

  <ellipse data-p="shadow" cx="100" cy="180" rx="${J.shadowRx}" ry="6" fill="${C.line}" opacity=".16"/>

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

  <path data-p="arm-l-o" fill="none" stroke="${C.line}" stroke-width="12" stroke-linecap="round"/>
  <path data-p="arm-r-o" fill="none" stroke="${C.line}" stroke-width="12" stroke-linecap="round"/>
  <path data-p="arm-l-f" fill="none" stroke="${C.bShade}" stroke-width="8.4" stroke-linecap="round"/>
  <path data-p="arm-r-f" fill="none" stroke="${C.bShade}" stroke-width="8.4" stroke-linecap="round"/>
  <path data-p="arm-l-h" fill="none" stroke="${C.b}" stroke-width="3.8" stroke-linecap="round"/>
  <path data-p="arm-r-h" fill="none" stroke="${C.b}" stroke-width="3.8" stroke-linecap="round"/>

  <g data-p="torso">
    <!-- 腰關節:上下軀幹之間刻意留縫露出來。分節軀幹是參考稿最強的機器人訊號之一,
         而且不佔面積、不影響四肢的柔軟。 -->
    <rect x="90" y="105" width="20" height="14" rx="4" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.6"/>

    <rect x="82" y="114" width="36" height="28" rx="9" fill="${C.o}" stroke="none"/>
    <path d="M107,110 C113,122 113,134 106,145 L126,145 L126,110 Z" fill="${C.oShade}" clip-path="url(#tl${uid})"/>
    <g stroke="${C.oDeep}" stroke-width="2" stroke-linecap="round" opacity=".55">
      <path d="M89,126 L111,126"/><path d="M89,131 L111,131"/><path d="M89,136 L111,136"/>
    </g>
    <rect x="82" y="114" width="36" height="28" rx="9" fill="none" stroke="${C.line}" stroke-width="3"/>

    <rect x="80" y="80" width="40" height="30" rx="9" fill="${C.o}" stroke="none"/>
    <path d="M106,76 C113,88 113,102 105,113 L126,113 L126,76 Z" fill="${C.oShade}" clip-path="url(#tu${uid})"/>
    <path d="M78,92 C79,84 86,80 94,79 C86,82 82,86 81,94 Z" fill="${C.oLight}" clip-path="url(#tu${uid})"/>
    <rect x="80" y="80" width="40" height="30" rx="9" fill="none" stroke="${C.line}" stroke-width="3"/>

    <!-- 胸口面板:首頁 Loading 的累積 %數之後可以直接接到 chest-ring / chest-dot -->
    <rect x="84" y="86" width="32" height="17" rx="3.5" fill="${C.screen}" stroke="${C.line}" stroke-width="2.6"/>
    <circle data-p="chest-ring" cx="100" cy="94.5" r="6.5" fill="none" stroke="${C.o}" stroke-width="2.4"/>
    <circle data-p="chest-dot" cx="100" cy="94.5" r="3.2" fill="${C.oLight}"/>
  </g>

  <!-- 頸:橫跨頭與軀幹的縫,轉頭時不會撕開 -->
  <rect x="92" y="70" width="16" height="18" rx="6" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.8"/>

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
      <rect x="97.5" y="10" width="5" height="14" rx="2.5" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.4"/>
      <circle cx="100" cy="7.5" r="4.5" fill="${C.o}" stroke="${C.line}" stroke-width="2.4"/>
      <path d="M97.5,6 A3.6 3.6 0 0 1 101,4.2 A4.5 4.5 0 0 0 97.5,6 Z" fill="${C.oLight}"/>
    </g>

    <!-- 側耳板:參考稿最好認的那組零件。畫在頭之前,只露出外半邊。 -->
    <g>
      <rect x="55" y="38" width="13" height="18" rx="3.5" fill="${C.bShade}" stroke="${C.line}" stroke-width="2.6"/>
      <rect x="57.5" y="41.5" width="5" height="11" rx="2" fill="${C.b}"/>
    </g>
    <g>
      <rect x="132" y="38" width="13" height="18" rx="3.5" fill="${C.bShade}" stroke="${C.line}" stroke-width="2.6"/>
      <rect x="137.5" y="41.5" width="5" height="11" rx="2" fill="${C.b}"/>
    </g>

    <path d="${HEAD_D}" fill="${C.o}" stroke="none"/>
    <path d="M118,14 C129,30 130,56 117,79 L148,79 L148,14 Z" fill="${C.oShade}" clip-path="url(#hd${uid})"/>
    <path d="M68,42 C70,29 80,23 94,22 C82,26 75,32 72,44 Z" fill="${C.oLight}" clip-path="url(#hd${uid})"/>
    <path d="${HEAD_D}" fill="none" stroke="${C.line}" stroke-width="3"/>

    <!-- 鏡頭外框:眼白與瞳孔都保留,但裝進金屬框裡 —— 變成「機器的眼睛」。
         外框在眨眼群組之外,眼睛壓扁時外框不動,像眼皮在框內閉起來。 -->
    <ellipse cx="85" cy="41" rx="12.6" ry="13.6" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.4"/>
    <ellipse cx="115" cy="41" rx="12.6" ry="13.6" fill="${C.bDeep}" stroke="${C.line}" stroke-width="2.4"/>
    <g data-p="eye-l">
      <ellipse cx="85" cy="41" rx="11" ry="12" fill="${C.white}"/>
      <g data-p="pupil-l">
        <circle data-p="iris-l" cx="85" cy="41" r="5.4" fill="${C.line}"/>
        <circle cx="82.8" cy="38.3" r="2.1" fill="${C.white}"/>
      </g>
    </g>
    <g data-p="eye-r">
      <ellipse cx="115" cy="41" rx="11" ry="12" fill="${C.white}"/>
      <g data-p="pupil-r">
        <circle data-p="iris-r" cx="115" cy="41" r="5.4" fill="${C.line}"/>
        <circle cx="112.8" cy="38.3" r="2.1" fill="${C.white}"/>
      </g>
    </g>

    <!-- 笑眼:填充月牙,中間厚兩端收尖。等粗的 stroke 會很死,月牙才有生命力。
         月牙是白的不是黑的 —— 眼白收掉之後露出來的是深藍鏡頭框,深色月牙疊在
         深色框上會變成一團黑,^ ^ 的形狀整個看不見。 -->
    <path data-p="happy-l" d="M73.5,44.5 Q85,28.5 96.5,44.5 Q85,38.5 73.5,44.5 Z" fill="${C.white}" opacity="0"/>
    <path data-p="happy-r" d="M103.5,44.5 Q115,28.5 126.5,44.5 Q115,38.5 103.5,44.5 Z" fill="${C.white}" opacity="0"/>

    <!-- 眉:外側壓低 = 為難。參考稿的皺眉格就是在眼睛外上角切一塊楔形。 -->
    <path data-p="brow-l" d="M72,29 Q81,25 94,23.5 L94,27.5 Q81,29 72,33 Z" fill="${C.line}" opacity="0"/>
    <path data-p="brow-r" d="M128,29 Q119,25 106,23.5 L106,27.5 Q119,29 128,33 Z" fill="${C.line}" opacity="0"/>

    <g data-p="mouth">
      <path data-p="m-open" d="${MOUTH.open.open}" fill="${C.line}" opacity="0"/>
      <path data-p="m-teeth" d="${MOUTH.laugh.teeth}" fill="${C.white}" opacity="0"/>
      <path data-p="m-tongue" d="${MOUTH.laugh.tongue}" fill="${C.oShade}" opacity="0"/>
      <path data-p="m-line" d="${MOUTH.smile.line}" fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;

// ─────────────────────────────────────────────────────────────
// RIG:只認 data-p 名字與 J 錨點,不認顏色
// ─────────────────────────────────────────────────────────────

/** 表情表。arch=∩ 笑眼、lid=眼皮額外下壓、brow=眉毛、pup=瞳孔縮放、
 *  look=鎖定視線(非 null 時蓋掉游標追蹤)。 */
const EXPR = {
  idle: { mouth: 'smile', arch: 0, lid: 0, brow: 0, pup: 1, look: null },
  happy: { mouth: 'open', arch: 1, lid: 0, brow: 0, pup: 1, look: null },
  laugh: { mouth: 'laugh', arch: 1, lid: 0, brow: 0, pup: 1, look: null },
  surprise: { mouth: 'o', arch: 0, lid: 0, brow: 0, pup: 0.42, look: [0, -0.15] },
  think: { mouth: 'flat', arch: 0, lid: 0, brow: 0, pup: 1, look: [0.6, -0.7] },
  sleepy: { mouth: 'small', arch: 0, lid: 0.5, brow: 0, pup: 1, look: [0, 0.35] },
  worry: { mouth: 'worry', arch: 0, lid: 0.18, brow: 1, pup: 1, look: [0, 0.3] },
};
// 閒置時偶爾自己演一下,角色才不會像只有 hover 才活著
const IDLE_BEATS = ['think', 'sleepy', 'surprise', 'worry'];

const r1 = (n) => Math.round(n * 10) / 10;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** 掛一隻 Allen 到 mount 元素裡。
 *
 *  opts.raf     (cb) => off。呼叫端提供的每幀回呼註冊器(共用 rAF)。
 *               不傳就只畫靜止姿勢,不動。
 *  opts.reduced true 時完全不註冊每幀回呼,停在靜止姿勢。
 *  opts.idleBeats false 可關掉閒置時的自動表情。
 *
 *  回傳 { el, setExpr, wave, destroy }。setExpr 吃 EXPR 的鍵。 */
export function createAllenBot(mount, { raf = null, reduced = false, idleBeats = true } = {}) {
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

  /** 換嘴形。閉嘴只換線條的 d,張嘴切到填充那三片。 */
  function paintMouth(key) {
    const m = MOUTH[key] || MOUTH.smile;
    const isOpen = !!m.open;
    p['m-line'].style.opacity = isOpen ? 0 : 1;
    p['m-open'].style.opacity = isOpen ? 1 : 0;
    p['m-teeth'].style.opacity = m.teeth ? 1 : 0;
    p['m-tongue'].style.opacity = m.tongue ? 1 : 0;
    if (m.line) p['m-line'].setAttribute('d', m.line);
    if (m.open) p['m-open'].setAttribute('d', m.open);
    if (m.teeth) p['m-teeth'].setAttribute('d', m.teeth);
    if (m.tongue) p['m-tongue'].setAttribute('d', m.tongue);
  }

  // 靜止姿勢:reduced 與「還沒開始跑」共用這一組,兩者看起來一致
  const rest = () => {
    paintLimb('arm-l', J.shoulderL, J.wristL, 0, 0, 5, 'hand-l');
    paintLimb('arm-r', J.shoulderR, J.wristR, 0, 0, 5, 'hand-r');
    paintLimb('leg-l', J.hipL, J.ankleL, 0, 0, 2, 'foot-l');
    paintLimb('leg-r', J.hipR, J.ankleR, 0, 0, 2, 'foot-r');
    paintMouth('smile');
  };

  if (reduced || !raf) { rest(); return { el: svg, setExpr() {}, wave() {}, destroy() {} }; }

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
  // 臉:每個維度一條彈簧,表情之間才是「過渡」不是「切換」
  const fArch = Spring(0, { k: 200, d: 24 });
  const fLid = Spring(0, { k: 170, d: 22 });
  const fBrow = Spring(0, { k: 190, d: 23 });
  const fPup = Spring(1, { k: 210, d: 25 });

  const blink = Blinker();
  const ptr = Pointer(svg);
  // 老動畫是一秒 12 格。物理照 rAF 全速跑,只有畫面被關進格子裡 —— 這一項對
  // 「像不像手繪」的影響大於任何美術細節。
  const fs = FrameStep(12);
  let expr = 'idle', hover = false, waveT = -1;
  let t = 0, last = 0, shut = 0, popT = 99, beatT = 7 + Math.random() * 7, beatBack = -1;

  const enter = () => { hover = true; setExpr('happy'); };
  const leave = () => { hover = false; setExpr('idle'); };
  const tap = () => { setExpr('laugh'); waveT = 0; beatBack = -1; };
  mount.addEventListener('pointerenter', enter);
  mount.addEventListener('pointerleave', leave);
  mount.addEventListener('click', tap);

  function setExpr(name) {
    const e = EXPR[name];
    if (!e || name === expr) return;
    expr = name;
    fArch.to(e.arch); fLid.to(e.lid); fBrow.to(e.brow); fPup.to(e.pup);
    paintMouth(e.mouth);
    popT = 0;                       // 換嘴形彈一下,不然像換貼圖
    if (e.arch) blink.blink();
  }

  const off = raf((now) => {
    const dt = last ? clamp(now - last, 0, 1 / 30) : 1 / 60;
    last = now; t += dt; popT += dt;

    // ═══ 物理:每個 rAF 都跑。彈簧要吃得到真實 dt,降幀只能降畫面不能降物理,
    //     否則 12fps 的大 dt 會讓彈簧震盪。 ═══
    ptr.step(dt);

    // 閒置演出:沒有 hover、沒在揮手時,每隔一陣子自己換一個表情再回來
    if (idleBeats && !hover && waveT < 0) {
      if (beatBack > 0) {
        beatBack -= dt;
        if (beatBack <= 0) { setExpr('idle'); beatT = 7 + Math.random() * 7; }
      } else {
        beatT -= dt;
        if (beatT <= 0) {
          setExpr(IDLE_BEATS[(Math.random() * IDLE_BEATS.length) | 0]);
          beatBack = 1.6 + Math.random() * 1.4;
        }
      }
    }

    const br = Math.sin(t * 1.5);                      // 呼吸
    fArch.step(dt); fLid.step(dt); fBrow.step(dt); fPup.step(dt);
    const arch = clamp(fArch.value, 0, 1);
    shut = Math.max(blink.step(dt), arch, clamp(fLid.value, 0, 1));

    // 表情鎖定視線時蓋掉游標追蹤 —— 思考就要看向別處,不能還盯著滑鼠
    const lock = EXPR[expr].look;
    const gx = lock ? lock[0] : ptr.x;
    const gy = lock ? lock[1] : ptr.y;

    headX.to(gx * 3.6); headY.to(gy * 2.2 - br * 1.2); headR.to(gx * 5);
    headX.step(dt); headY.step(dt); headR.step(dt);
    antR.to(headR.value); antR.step(dt);               // 永遠慢一步,差值就是甩動
    pupX.to(gx * 3.4); pupY.to(gy * 2.6);
    pupX.step(dt); pupY.step(dt);

    // 揮手:點一下,右手抬起來擺三下再放回去
    let wrTarget = [J.wristR[0], J.wristR[1]];
    if (waveT >= 0) {
      waveT += dt;
      if (waveT > 1.7) { waveT = -1; if (!hover) setExpr('idle'); }
      else {
        const up = Math.min(1, waveT / 0.22);
        const s = Math.sin(waveT * 17) * 9 * (waveT > 1.2 ? (1.7 - waveT) / 0.5 : 1);
        wrTarget = [J.wristR[0] + 6 + s * up, J.wristR[1] - 46 * up];
      }
    }

    // 麵條四肢:閒置時各自漂移,相位錯開才不會像在做體操
    const sway = (ph, amp) => Math.sin(t * 0.9 + ph) * amp;
    wl.to(J.wristL[0] + sway(0, 2.4) - gx * 3, J.wristL[1] + sway(1.7, 2) - arch * 5);
    wr.to(wrTarget[0] + (waveT < 0 ? sway(2.9, 2.4) - gx * 3 : 0),
          wrTarget[1] + (waveT < 0 ? sway(4.4, 2) - arch * 5 : 0));
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
    // 驚訝:瞳孔縮小。眼白不動、只有瞳孔變小,那個「嚇一跳」才讀得出來。
    const pr = r1(5.4 * clamp(fPup.value, 0.2, 1));
    p['iris-l'].setAttribute('r', pr);
    p['iris-r'].setAttribute('r', pr);

    // 眨眼、笑眼、睏眼都壓扁平常眼,取最閉的那個
    const ey = J.eyeL[1];
    const eye = (name, cx) => p[name].setAttribute('transform',
      `translate(${cx},${ey}) scale(1,${r1(Math.max(0.02, 1 - shut * 0.96))}) translate(${-cx},${-ey})`);
    eye('eye-l', J.eyeL[0]); eye('eye-r', J.eyeR[0]);
    p['eye-l'].style.opacity = p['eye-r'].style.opacity = r1(1 - arch);
    p['happy-l'].style.opacity = p['happy-r'].style.opacity = r1(arch);
    // 月牙跟著笑意長出來,不是硬切換
    const hs = `scale(1,${r1(0.4 + arch * 0.6)})`;
    p['happy-l'].setAttribute('transform', `translate(${J.eyeL[0]},${ey}) ${hs} translate(${-J.eyeL[0]},${-ey})`);
    p['happy-r'].setAttribute('transform', `translate(${J.eyeR[0]},${ey}) ${hs} translate(${-J.eyeR[0]},${-ey})`);

    // 眉毛:淡入的同時往下壓,才像「眉頭皺起來」而不是「浮出一條線」
    const bw = clamp(fBrow.value, 0, 1);
    p['brow-l'].style.opacity = p['brow-r'].style.opacity = r1(bw);
    p['brow-l'].setAttribute('transform', `translate(0,${r1(-3 + bw * 3)})`);
    p['brow-r'].setAttribute('transform', `translate(0,${r1(-3 + bw * 3)})`);

    // 換嘴形時彈一下(200ms 的指數衰減),不然像換貼圖
    const pop = popT < 0.3 ? 1 + 0.22 * Math.exp(-popT * 14) : 1;
    p.mouth.setAttribute('transform',
      `translate(100,63) scale(${r1(pop)}) translate(-100,-63)`);

    paintLimb('arm-l', J.shoulderL, [wl.x + jx(5), wl.y + jx(6)], wl.vx, wl.vy, 5, 'hand-l');
    paintLimb('arm-r', J.shoulderR, [wr.x + jx(7), wr.y + jx(8)], wr.vx, wr.vy, 5, 'hand-r');
    paintLimb('leg-l', J.hipL, [al.x + jx(9), al.y], al.vx, al.vy, 2, 'foot-l');
    paintLimb('leg-r', J.hipR, [ar.x + jx(10), ar.y], ar.vx, ar.vy, 2, 'foot-r');

    // 胸口指示環:呼吸同步的明滅;笑的時候亮起來
    p['chest-ring'].style.opacity = r1(0.55 + 0.25 * (br * 0.5 + 0.5) + arch * 0.2);
    p['chest-dot'].setAttribute('r', r1(3.2 + br * 0.4 + arch * 1.2));
    p.shadow.setAttribute('rx', r1(J.shadowRx - br * 0.8));
  });

  rest();

  return {
    el: svg,
    setExpr,
    /** 給驗收與外部事件用:目前表情 */
    get expr() { return expr; },
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
