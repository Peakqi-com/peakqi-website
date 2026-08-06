// Allen —— 機器人角色。美術是 Recraft 生成的向量原稿(allen-art.js),這一份只負責讓它動。
//
// 原稿附了一張分解圖:整隻拆成九塊剛體(頭 / 頸 / 軀幹 / 雙臂 / 雙腿 / 雙腳),另外附了
// 五個姿勢(站 / 揮手 / 走路 / 歡呼 / 坐)並直接給了每一塊的旋轉角與樞紐。那些角度不是
// 這裡憑感覺調的,是照著分解圖抄下來的 —— POSE 裡的數字全部來自那張圖。
//
// 原稿那張分解圖是用 <use> + 九個矩形 clipPath 疊出來的,好處是不動原檔,壞處是旋轉時
// 矩形會把圖形攔腰切斷(那張圖的「坐」姿勢腿根就裂開了)。這裡改成把 194 條路徑逐條歸位
// 到九個部位,轉的是完整形狀,關節不會出現直線切口;只有那條跨部位的主墨線剪影仍然
// 需要裁切,而它躺在所有色塊底下,裁切邊看不見。
//
// 檔案分兩段,中間那條線是刻意的:
//   ART  —— allen-art.js。美術再定稿時只換那一個檔。
//   RIG  —— 這裡。只透過 [data-p] 名字與 J 錨點找零件,不認得任何顏色。
//
// 所有 transform 走 SVG 屬性而不是 CSS —— rotate(a,cx,cy) 自帶樞紐,不必依賴
// transform-box:fill-box 在各家瀏覽器的差異。

import { Spring, Blinker, Pointer, FrameStep, boil, parts } from './puppet-kit.js';
import { allenArt, J, MOUTH } from './allen-art.js';

// ─────────────────────────────────────────────────────────────
// 姿勢:數字直接取自原稿分解圖的五張姿勢
// ─────────────────────────────────────────────────────────────

/** aL/aR 肩、gL/gR 髖(度);lift 全身位移;fL/fR 腳掌額外位移;
 *  ff 是腳掌跟隨大腿旋轉的比例 —— 坐姿在原稿裡腳掌是純位移不跟著轉,所以是 0。
 *  gnd 是「腳還踩在地上嗎」:1 = 影子跟著腳走,0 = 離地,影子留在原地改用縮小表示。
 *
 *  注意:坐姿是原稿分解圖那一張的原角度(髖 ±72°)。正面視角沒有側面圖可用,那張
 *  本身就比較像劈腿而不是坐下 —— 這裡照抄不修,因為修了就不是原稿的姿勢了。
 *  預設演出排程沒有用它。 */
export const POSE = {
  stand: { aL: 0, aR: 0, gL: 0, gR: 0, lift: 0, fL: [0, 0], fR: [0, 0], ff: 1, gnd: 1 },
  wave: { aL: 0, aR: -125, gL: 0, gR: 0, lift: 0, fL: [0, 0], fR: [0, 0], ff: 1, gnd: 1 },
  walk: { aL: 8, aR: -12, gL: 14, gR: -6, lift: 0, fL: [0, 0], fR: [0, 0], ff: 1, gnd: 1 },
  cheer: { aL: 125, aR: -125, gL: 4, gR: -4, lift: -68, fL: [0, 0], fR: [0, 0], ff: 1, gnd: 0 },
  sit: { aL: 0, aR: 0, gL: 72, gR: -72, lift: 350, fL: [-543, -432], fR: [543, -432], ff: 0, gnd: 1 },
};

// ─────────────────────────────────────────────────────────────
// 表情
// ─────────────────────────────────────────────────────────────

/** arch=笑起來眼睛瞇成弧、lid=眼皮額外下壓、pup=瞳孔縮放、look=鎖定視線(非 null
 *  時蓋掉游標追蹤)。原稿的臉是平塗的,能動的只有眼白 / 瞳孔 / 嘴三樣,所以七種表情
 *  全部由這四個維度組出來。 */
const EXPR = {
  idle: { mouth: 'rest', arch: 0, lid: 0, pup: 1, look: null },
  happy: { mouth: 'open', arch: 1, lid: 0, pup: 1, look: null },
  laugh: { mouth: 'laugh', arch: 1, lid: 0, pup: 1, look: null },
  surprise: { mouth: 'o', arch: 0, lid: 0, pup: 0.45, look: [0, -0.2] },
  think: { mouth: 'flat', arch: 0, lid: 0, pup: 1, look: [0.65, -0.7] },
  sleepy: { mouth: 'small', arch: 0, lid: 0.55, pup: 1, look: [0, 0.35] },
  worry: { mouth: 'worry', arch: 0, lid: 0.2, pup: 1, look: [0, 0.3] },
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
 *  opts.interactive false 可關掉 hover/click(讓外部自己控制)。
 *  opts.palette 'original'(原稿紅藍,預設)或 'brand'(站上的橘藍)。
 *  opts.shadow  地面投影,預設開。
 *  opts.pose    起始姿勢,預設 'stand'。
 *
 *  回傳 { el, setExpr, setPose, wave, expr, pose, destroy }。 */
export function createAllenBot(mount, {
  raf = null, reduced = false, idleBeats = true, interactive = true,
  palette = 'original', shadow = true, pose = 'stand',
} = {}) {
  // clipPath 的 id 必須每個實例唯一 —— 同一頁掛兩隻時,重複 id 會讓第二隻的裁切
  // 指到第一隻,墨線剪影直接錯位。
  const uid = 'a' + Math.random().toString(36).slice(2, 8);
  mount.innerHTML = allenArt(uid, { palette, shadow });
  const svg = mount.querySelector('svg');
  const p = parts(svg);

  // 主墨線剪影被切成五份分放在各部位底下,設 transform 時要一起設,否則墨線會脫隊。
  const T = (name, t) => {
    const el = p[name];
    if (el) el.setAttribute('transform', t);
    const ink = p['ink-' + name];
    if (ink) ink.setAttribute('transform', t);
  };
  /** 某個部位轉太多角度時把它那份墨線剪影淡出(見 arm-l/arm-r 的用法) */
  const inkFade = (name, ang) => {
    const ink = p['ink-' + name];
    if (ink) ink.style.opacity = r1(clamp((55 - Math.abs(ang)) / 15, 0, 1));
  };

  /** 換嘴形。原稿那張嘴(rest)是填充的,換表情才切到描邊或張嘴那三片。 */
  function paintMouth(key) {
    const m = MOUTH[key] || MOUTH.rest;
    p['m-rest'].style.opacity = m.rest ? 1 : 0;
    p['m-line'].style.opacity = m.line ? 1 : 0;
    p['m-open'].style.opacity = m.open ? 1 : 0;
    p['m-teeth'].style.opacity = m.teeth ? 1 : 0;
    p['m-tongue'].style.opacity = m.tongue ? 1 : 0;
    if (m.line) p['m-line'].setAttribute('d', m.line);
    if (m.open) p['m-open'].setAttribute('d', m.open);
    if (m.teeth) p['m-teeth'].setAttribute('d', m.teeth);
    if (m.tongue) p['m-tongue'].setAttribute('d', m.tongue);
  }

  /** 靜止姿勢。reduced 與「還沒開始跑」共用這一組,兩者看起來一致 —— 而且這一組
   *  完全不寫任何 transform,畫出來與原稿逐像素相同。 */
  const rest = () => paintMouth('rest');

  if (reduced || !raf) {
    rest();
    return { el: svg, setExpr() {}, setPose() {}, wave() {}, get expr() { return 'idle'; }, get pose() { return pose; }, destroy() {} };
  }

  // ---- 狀態 ----
  // 姿勢是一組彈簧,不是切換 —— 從站到揮手之間要有過程,不然像換貼圖
  const SP = { k: 46, d: 12 };
  if (!POSE[pose]) pose = 'stand';         // pose 是公開選項,給錯名字不該讓整隻炸掉
  const P0 = POSE[pose];
  const aL = Spring(P0.aL, SP), aR = Spring(P0.aR, SP);
  const gL = Spring(P0.gL, SP), gR = Spring(P0.gR, SP);
  const lift = Spring(P0.lift, { k: 60, d: 15 });
  const fLx = Spring(P0.fL[0], SP), fLy = Spring(P0.fL[1], SP);
  const fRx = Spring(P0.fR[0], SP), fRy = Spring(P0.fR[1], SP);
  const foll = Spring(P0.ff, SP);
  const gnd = Spring(P0.gnd, SP);

  const headX = Spring(0, { k: 90, d: 15 });
  const headY = Spring(0, { k: 90, d: 15 });
  const headR = Spring(0, { k: 90, d: 15 });
  const antR = Spring(0, { k: 130, d: 11 });   // 落後於頭部旋轉,差值就是甩動
  const pupX = Spring(0, { k: 140, d: 17 });
  const pupY = Spring(0, { k: 140, d: 17 });
  // 臉:每個維度一條彈簧,表情之間才是「過渡」不是「切換」
  const fArch = Spring(0, { k: 200, d: 24 });
  const fLid = Spring(0, { k: 170, d: 22 });
  const fPup = Spring(1, { k: 210, d: 25 });

  const blink = Blinker();
  const ptr = Pointer(svg);
  // 老動畫是一秒 12 格。物理照 rAF 全速跑,只有畫面被關進格子裡 —— 這一項對
  // 「像不像手繪」的影響大於任何美術細節。
  const fs = FrameStep(12);
  let expr = 'idle', hover = false, waveT = -1;
  let t = 0, last = 0, shut = 0, popT = 99, beatT = 7 + Math.random() * 7, beatBack = -1;

  /** 吃 POSE 的鍵,或直接吃一組關節角(給走路循環這種要逐幀驅動的用)。
   *  兩種都只是「設定彈簧目標」,所以無論誰來設,中間都會有過程。 */
  function setPose(nameOrJoints) {
    if (!nameOrJoints) return;
    const named = typeof nameOrJoints === 'string';
    const q = named ? POSE[nameOrJoints] : { ...POSE.stand, ...nameOrJoints };
    if (!q) return;
    pose = named ? nameOrJoints : 'custom';
    aL.to(q.aL); aR.to(q.aR); gL.to(q.gL); gR.to(q.gR); lift.to(q.lift);
    fLx.to(q.fL[0]); fLy.to(q.fL[1]); fRx.to(q.fR[0]); fRy.to(q.fR[1]);
    foll.to(q.ff); gnd.to(q.gnd);
  }

  function setExpr(name) {
    const e = EXPR[name];
    if (!e || name === expr) return;
    expr = name;
    fArch.to(e.arch); fLid.to(e.lid); fPup.to(e.pup);
    paintMouth(e.mouth);
    popT = 0;                       // 換嘴形彈一下,不然像換貼圖
    if (e.arch) blink.blink();
  }

  const enter = () => { hover = true; setExpr('happy'); };
  const leave = () => { hover = false; setExpr('idle'); };
  const tap = () => { setExpr('laugh'); waveT = 0; beatBack = -1; };
  if (interactive) {
    mount.addEventListener('pointerenter', enter);
    mount.addEventListener('pointerleave', leave);
    mount.addEventListener('click', tap);
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

    // 揮手:點一下,右手抬到分解圖那個角度,擺三下再放回去。
    // 收尾只還原右手 —— 用 setPose('stand') 會把十條彈簧全部歸零,在別的姿勢中途
    // 被點一下就等於把那個姿勢取消掉。
    if (waveT >= 0) {
      waveT += dt;
      if (waveT > 1.9) {
        waveT = -1;
        aR.to((POSE[pose] || POSE.stand).aR);
        if (!hover) setExpr('idle');
      } else {
        const fade = waveT > 1.4 ? (1.9 - waveT) / 0.5 : 1;
        aR.to(POSE.wave.aR * Math.min(1, waveT / 0.25) * fade + Math.sin(waveT * 15) * 13 * fade);
      }
    }

    const br = Math.sin(t * 1.5);                      // 呼吸
    fArch.step(dt); fLid.step(dt); fPup.step(dt);
    const arch = clamp(fArch.value, 0, 1);
    shut = Math.max(blink.step(dt), arch * 0.62, clamp(fLid.value, 0, 1));

    // 表情鎖定視線時蓋掉游標追蹤 —— 思考就要看向別處,不能還盯著滑鼠
    const lock = EXPR[expr].look;
    const gx = lock ? lock[0] : ptr.x;
    const gy = lock ? lock[1] : ptr.y;

    headX.to(gx * 32); headY.to(gy * 20 - br * 10); headR.to(gx * 4.5);
    headX.step(dt); headY.step(dt); headR.step(dt);
    antR.to(headR.value); antR.step(dt);               // 永遠慢一步,差值就是甩動
    pupX.to(gx * 30); pupY.to(gy * 24 + arch * 10);
    pupX.step(dt); pupY.step(dt);

    aL.step(dt); aR.step(dt); gL.step(dt); gR.step(dt); lift.step(dt);
    fLx.step(dt); fLy.step(dt); fRx.step(dt); fRy.step(dt); foll.step(dt); gnd.step(dt);

    // ═══ 畫面:只在 12 格/秒的格子邊界更新。 ═══
    if (!fs.step(dt)) return;
    const F = fs.frame;
    // 線條沸騰:每一格給每個零件一個固定的次像素偏移,模擬「這一格是重畫的」。
    // 種子用格數不用時間,所以同一格永遠抖同一個量,是沸騰不是雜訊。
    const jx = (seed) => boil(F, seed, 4);

    // 全身:呼吸的上下浮動 + 姿勢的整體位移 + 站著時很慢的重心左右移
    const swayX = Math.sin(t * 0.62) * 6;
    T('body', `translate(${r1(swayX + jx(0))},${r1(lift.value - br * 5 + jx(1))})`);

    // 軀幹吸氣時橫向收、縱向長,胸口因此上抬 —— 上面的零件要跟著抬,不然頸子會脫節
    const sy = 1 + br * 0.011, sx = 1 - br * 0.007;
    T('torso', `translate(${J.torso[0]},${J.torso[1]}) scale(${r1(sx)},${r1(sy)}) `
      + `translate(${-J.torso[0]},${-J.torso[1]})`);
    const riseHead = r1((J.neck[1] - J.torso[1]) * (sy - 1));
    const riseArm = r1((J.shoulderL[1] - J.torso[1]) * (sy - 1));

    T('neck', `translate(${r1(headX.value * 0.3 + jx(2))},${r1(riseHead + jx(3))})`);
    T('head', `translate(${r1(headX.value + jx(4))},${r1(headY.value + riseHead + jx(5))}) `
      + `rotate(${r1(headR.value)},${J.neck[0]},${J.neck[1]})`);
    T('antenna', `rotate(${r1(clamp((headR.value - antR.value) * 3.2, -20, 20))},${J.antenna[0]},${J.antenna[1]})`);

    T('arm-l', `translate(${r1(jx(6))},${r1(riseArm + jx(7))}) `
      + `rotate(${r1(aL.value)},${J.shoulderL[0]},${J.shoulderL[1]})`);
    T('arm-r', `translate(${r1(jx(8))},${r1(riseArm + jx(9))}) `
      + `rotate(${r1(aR.value)},${J.shoulderR[0]},${J.shoulderR[1]})`);
    // 手臂那兩份墨線剪影的裁切框連軀幹側邊一起帶著,轉過四十幾度就會從肩膀甩出
    // 一根黑刺(揮手 -125°、歡呼 ±125° 都會踩到)。抬高就把它收掉 —— 手臂自己的
    // 路徑本來就帶外框,少了這一份看不出差別,留著才難看。
    inkFade('arm-l', aL.value); inkFade('arm-r', aR.value);

    const ff = clamp(foll.value, 0, 1);
    const legT = (leg, foot, ang, hip, ankle, fx, fy, seed) => {
      T(leg, `translate(${r1(jx(seed))},0) rotate(${r1(ang)},${hip[0]},${hip[1]})`);
      // 腳掌先繞自己的踝點轉回一點(鞋底才不會翹),再整個跟著大腿繞髖轉。
      // 順序不能顛倒:SVG 的 transform 串列是右邊先套用,所以「繞踝點」必須寫在
      // 「繞髖」的右邊,而且樞紐要用旋轉前的踝點 —— 寫成旋轉後的踝點就會把腳掌
      // 甩離小腿(站姿看不出來,走路差 ~7px,坐姿過渡時差到 40px)。
      const fa = ang * ff;
      T(foot, `translate(${r1(fx + jx(seed + 1))},${r1(fy)}) `
        + `rotate(${r1(fa)},${hip[0]},${hip[1]}) `
        + `rotate(${r1(-fa * 0.82)},${ankle[0]},${ankle[1]})`);
    };
    legT('leg-l', 'foot-l', gL.value, J.hipL, J.ankleL, fLx.value, fLy.value, 10);
    legT('leg-r', 'foot-r', gR.value, J.hipR, J.ankleR, fRx.value, fRy.value, 12);

    // 眨眼、笑瞇眼、睏眼都壓扁眼白,取最閉的那個。瞳孔在眼白群組裡面,一起壓。
    const lidS = r1(Math.max(0.05, 1 - shut * 0.95));
    const eye = (name, c) => p[name].setAttribute('transform',
      `translate(${c[0]},${c[1]}) scale(1,${lidS}) translate(${-c[0]},${-c[1]})`);
    eye('eye-l', J.eyeL); eye('eye-r', J.eyeR);

    // 驚訝:瞳孔縮小。眼白不動、只有瞳孔變小,那個「嚇一跳」才讀得出來。
    const ps = r1(clamp(fPup.value, 0.25, 1));
    const pup = (name, c) => p[name].setAttribute('transform',
      `translate(${r1(pupX.value)},${r1(pupY.value)}) `
      + `translate(${c[0]},${c[1]}) scale(${ps}) translate(${-c[0]},${-c[1]})`);
    pup('pupil-l', J.pupilL); pup('pupil-r', J.pupilR);

    // 換嘴形時彈一下(200ms 的指數衰減),不然像換貼圖
    const pop = popT < 0.3 ? 1 + 0.2 * Math.exp(-popT * 14) : 1;
    p.mouth.setAttribute('transform',
      `translate(${J.mouth[0]},${J.mouth[1]}) scale(${r1(pop)}) translate(${-J.mouth[0]},${-J.mouth[1]})`);

    // 投影跟著「腳踩在哪」,不是跟著身體 —— 坐姿把身體往下移 350、腳掌卻往上收 432,
    // 只看 lift 的話影子會掉到腳底下四百多單位遠,整個脫離角色。
    // gnd=0(歡呼那種離地)時影子不跟著上升,改用縮小表示離地。
    const contact = lift.value + (fLy.value + fRy.value) / 2;
    const on = clamp(gnd.value, 0, 1);
    const h = clamp(1 + Math.min(0, contact * (1 - on)) / 900, 0.45, 1.1);
    p.shadow.setAttribute('rx', r1(J.shadowRx * h - br * 8));
    p.shadow.setAttribute('cx', r1(J.shadow[0] + swayX));
    p.shadow.setAttribute('cy', r1(J.shadow[1] + contact * on));
  });

  rest();

  return {
    el: svg,
    setExpr,
    setPose,
    /** 給驗收與外部事件用 */
    get expr() { return expr; },
    get pose() { return pose; },
    wave() { waveT = 0; },
    destroy() {
      off && off();
      ptr.destroy();
      if (interactive) {
        mount.removeEventListener('pointerenter', enter);
        mount.removeEventListener('pointerleave', leave);
        mount.removeEventListener('click', tap);
      }
    },
  };
}
