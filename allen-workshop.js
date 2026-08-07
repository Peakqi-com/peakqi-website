// Allen 小劇場・第一幕:Allen 本人在自己的工作間
//
// 這一幕沒有劇情,只有角色 —— 用的是原稿那隻機器人(allen-art.js)與原稿附的背景
// (機器人已被去掉的工作間)。人和景本來就是同一張圖裡的,所以擺回去就對得上。
//
// 契約與其他幕相同:createAct(stage, api) → { destroy() };動畫走 api.raf(共享 rAF,
// t 為秒),零計時器。角色本身的呼吸 / 眨眼 / 追視線 / 表情都在 allen-bot.js 裡,
// 這一幕只負責:背景、站位、以及每隔一陣子挑一段原稿姿勢來演。
import { createAllenBot, POSE } from './allen-bot.js';
import { createRoom } from './allen-room.js';
import { t } from './i18n.js';

const BG = '/assets/allen/workshop.webp';

export function createAct(stage, api) {
  const R = api.rand;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  const root = document.createElement('div');
  root.className = 'aw-root';
  root.innerHTML = `
<style>
.aw-root{position:absolute;inset:0;overflow:hidden;background:#DCE4EE}
.aw-root>*{position:absolute;inset:0}
.aw-bg{width:100%;height:100%;object-fit:cover;object-position:50% 62%;z-index:0}
/* 疊圖順序用 z-index 不用 DOM 順序 —— 房間那兩層是 createRoom 自己 append 的,
   用 z-index 就不必去搬節點。
   背景 0 → 房間會動的部分 1 → 暗角 2 → Allen 3 → 命中層 4 → 提示 5。
   Allen 站在房間裡,所以燈光雲霧在他後面;命中層在他前面,不然角色那個 div 會把
   窗戶和控制台的點擊整片吃掉 —— 它只有中間一小塊有畫東西,其餘都是透明的空 box。
   切換點是 stage 的子節點(z-index 9),不受這裡影響。 */
.aw-room{pointer-events:none;z-index:1}
.aw-hits{z-index:4}
/* 背景是亮的,四角壓一點暗才不會和卡片邊界糊在一起,角色也才跳得出來 */
.aw-vig{pointer-events:none;z-index:2;
  background:radial-gradient(120% 95% at 50% 42%,transparent 55%,rgba(9,11,14,.30) 100%)}
.aw-figure{left:20%;top:auto;bottom:2%;right:auto;width:52%;height:66%;z-index:3}
.aw-hint{left:10px;top:10px;right:auto;bottom:auto;z-index:5;padding:4px 9px;border-radius:999px;
  background:rgba(9,11,14,.55);color:#F2EFE8;font:600 10px/1.4 'Space Grotesk','Noto Sans TC',sans-serif;
  letter-spacing:.04em;pointer-events:none;transition:opacity .5s ease}
</style>
<img class="aw-bg" src="${BG}" alt="" aria-hidden="true">
<div class="aw-vig"></div>
<div class="aw-figure"></div>
<div class="aw-hint">${t('點一下打招呼', 'Tap to say hi')}</div>`;
  // 殼層已經把切換點放進 stage 了,插在它前面(背景在底、點在頂)
  stage.insertBefore(root, stage.firstChild);
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label',
    t('第一幕:Allen 站在他的工作間裡,滑鼠移過去會看你,點一下會揮手',
      "Act 1: Allen in his workshop — he follows the cursor, tap and he waves"));

  const mount = root.querySelector('.aw-figure');
  const hint = root.querySelector('.aw-hint');
  // 互動綁在整個場景上,不是綁在角色那個框上 —— 角色只佔卡片三分之一,綁在他身上
  // 等於卡片有三分之二在騙人(提示寫著「點一下打招呼」,點下去卻沒反應)。
  // 切換點是 root 的兄弟節點不是子節點,所以不會被這裡吃掉。
  const bot = createAllenBot(mount, { raf: api.raf, idleBeats: true, interactive: false });

  // ---------- 演出排程 ----------
  // 一段是「姿勢 + 長度 + 表情」。step 不是固定姿勢,是逐幀驅動的踮步,另外標出來。
  const BEATS = [
    { kind: 'wave', life: 2.0, expr: 'happy' },
    { kind: 'cheer', life: 1.7, expr: 'laugh' },
    { kind: 'step', life: 2.6, expr: 'idle' },
    { kind: 'stand', life: 1.2, expr: 'think' },
  ];
  // 節奏:第一段 3–6 秒後上,之後每 5–11 秒一段。再稀一點角色就會像只是一張貼圖,
  // 再密一點在團隊卡上會變成一直在動的干擾。
  let lastT = null, beatIn = 3 + R() * 3, cur = null, curT = 0, tapped = false;
  let exprBack = -1;                  // 反應完把表情交還給閒置演出的倒數

  const noticed = () => { if (!tapped) { tapped = true; hint.style.opacity = '0'; } };

  // 房間本身也活著:窗外的雲、控制台的螢幕、檯燈、馬克杯的蒸氣、機台的指示燈。
  // 戳房間裡的東西 Allen 會轉頭看過去 —— 這一條是把「角色」和「場景」接起來的線,
  // 少了它兩邊就只是各動各的。
  const room = createRoom(root, {
    raf: api.raf,
    rand: R,
    debug: /[?&]roomdebug=1/.test(location.search),
    onPoke(key, look) {
      bot.lookAt(look[0], look[1], 1.9);
      bot.setExpr(key === 'poster' ? 'happy' : 'surprise');
      cur = null;                     // 讓「看過去」蓋掉進行中的段落
      exprBack = 1.5;
      beatIn = 4 + R() * 5;
      noticed();
    },
  });

  function start(b) {
    cur = b; curT = 0;
    bot.setExpr(b.expr);
    if (b.kind === 'wave') bot.wave();
    else if (b.kind === 'cheer') bot.setPose('cheer');
    else if (b.kind === 'stand') bot.setPose('stand');
  }
  function end() {
    cur = null;
    bot.setPose('stand');
    bot.setExpr('idle');
    beatIn = 5 + R() * 6;
  }

  function frame(now) {
    if (lastT === null) lastT = now;
    const dt = clamp(now - lastT, 0, 0.05);
    lastT = now;

    if (cur) {
      curT += dt;
      if (cur.kind === 'step') {
        // 踮步:分解圖的「走路」是單張定格,而且是正面 —— 正面看不出前後跨步,
        // 髖關節一轉只會左右張開。所以不做走路循環,改用它的角度當振幅做「開腿下沉、
        // 併腿上來」的踮步,正面才讀得出來。收尾 0.4 秒振幅歸零,不會停在半蹲。
        const fade = clamp(Math.min(curT / 0.35, (cur.life - curT) / 0.4), 0, 1);
        const s = Math.sin(curT * 5.2);
        const open = Math.abs(s) * fade;               // 0=併腿 1=開到分解圖那個角度
        bot.setPose({
          gL: POSE.walk.gL * open, gR: -POSE.walk.gL * open,
          aL: POSE.walk.aR * s * fade, aR: -POSE.walk.aR * s * fade,
          lift: 20 * open,                             // 開腿時身體跟著沉,才像踮步不像開合跳
        });
      }
      if (curT >= cur.life) end();
    } else {
      beatIn -= dt;
      if (beatIn <= 0) start(BEATS[(R() * BEATS.length) | 0]);
    }
    // 反應完把表情交還出去 —— 不收的話「驚訝」會掛在臉上好幾秒
    if (exprBack > 0) {
      exprBack -= dt;
      if (exprBack <= 0) bot.setExpr('idle');
    }
  }
  const offRaf = api.raf(frame);

  // ---------- 互動 ----------
  const enter = () => bot.setExpr('happy');
  const leave = () => bot.setExpr('idle');
  const tap = () => {
    bot.setExpr('laugh');
    bot.wave();
    cur = null;                       // 取消進行中的段落,讓揮手是最上位的回應
    exprBack = 2.1;
    beatIn = 5 + R() * 6;
    noticed();                        // 提示只在還沒互動過時出現,點過就不再打擾
  };
  root.addEventListener('pointerenter', enter);
  root.addEventListener('pointerleave', leave);
  root.addEventListener('click', tap);

  return {
    /** 驗收用:直接點播一段或戳房間裡的東西,不必等隨機排程。殼層不會呼叫這兩個。 */
    play(kind) {
      const b = BEATS.find((x) => x.kind === kind);
      if (b) start(b);
    },
    poke(key) { room.poke(key); },
    get room() { return room; },
    destroy() {
      offRaf();
      root.removeEventListener('pointerenter', enter);
      root.removeEventListener('pointerleave', leave);
      root.removeEventListener('click', tap);
      try { room.destroy(); } catch (e) { /* 已被清 */ }
      try { bot.destroy(); } catch (e) { /* 已被清 */ }
      try { root.remove(); } catch (e) { /* 殼層已清 */ }
    },
  };
}
