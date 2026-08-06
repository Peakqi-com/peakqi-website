// 角色綁定工具:彈簧、麵條四肢、眨眼排程、游標偏移。
//
// 刻意不建立自己的 rAF —— 呼叫端把既有的每幀回呼傳進來(motion-kit 的
// ctx.onFrame,或 allen-avatar 的 api.raf)。「整站單一 rAF」的規則不因為
// 角色動畫破例。
//
// 這裡只放「怎麼動」,不放「長什麼樣」。角色的 SVG 換掉時這一份不用改。

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** 半隱式尤拉彈簧。
 *  dt 一定要夾住:分頁切到背景再切回來時,rAF 的第一個 dt 可能是好幾秒,
 *  不夾直接把彈簧炸成 NaN,整隻角色會消失。 */
export function Spring(value = 0, { k = 120, d = 18 } = {}) {
  return {
    value, target: value, v: 0, k, d,
    to(t) { this.target = t; return this; },
    snap(t) { this.value = this.target = t; this.v = 0; return this; },
    step(dt) {
      const h = clamp(dt, 0, 1 / 30);
      this.v += (-this.k * (this.value - this.target) - this.d * this.v) * h;
      this.value += this.v * h;
      return this.value;
    },
  };
}

/** 二維彈簧,給腕點與踝點用。速度會被麵條拿去算鞭尾,所以要露出來。 */
export function Spring2(x = 0, y = 0, opts) {
  const sx = Spring(x, opts), sy = Spring(y, opts);
  return {
    get x() { return sx.value; }, get y() { return sy.value; },
    get vx() { return sx.v; }, get vy() { return sy.v; },
    to(nx, ny) { sx.to(nx); sy.to(ny); return this; },
    snap(nx, ny) { sx.snap(nx); sy.snap(ny); return this; },
    step(dt) { sx.step(dt); sy.step(dt); return this; },
  };
}

/** 麵條四肢:肩 → 腕一條三次貝茲。
 *
 *  控制點不是擺出來的姿勢,是從腕點的「速度」推出來的 —— 手往哪去,曲線就
 *  往反方向落後多少。鞭尾、跟隨延遲、甩動因此自動發生,不用逐幀 K 動畫,
 *  也不需要分節骨架。sag 是靜止時的自然下垂。
 *
 *  回傳 { d, angle }:angle 是末端切線角度,手掌/腳掌拿去對齊。 */
export function noodle(ax, ay, bx, by, vx, vy, { sag = 5, lag = 0.06 } = {}) {
  const dx = bx - ax, dy = by - ay;
  const c1x = ax + dx * 0.35 - vx * lag;
  const c1y = ay + dy * 0.35 + sag - vy * lag;
  const c2x = ax + dx * 0.72 - vx * lag * 0.6;
  const c2y = ay + dy * 0.72 + sag * 0.6 - vy * lag * 0.6;
  const f = (n) => Math.round(n * 10) / 10;
  return {
    d: `M${f(ax)},${f(ay)}C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(bx)},${f(by)}`,
    angle: Math.atan2(by - c2y, bx - c2x) * 180 / Math.PI,
  };
}

/** 眨眼排程。回傳 0(全開)~ 1(全閉)。
 *  閉比開快 —— 真實的眨眼就是這樣,等速會看起來像想睡。 */
export function Blinker({ min = 2.6, max = 6.5, close = 0.075, open = 0.095 } = {}) {
  const gap = () => min + Math.random() * (max - min);
  let wait = gap(), t = -1;
  return {
    step(dt) {
      if (t < 0) { wait -= dt; if (wait <= 0) t = 0; return 0; }
      t += dt;
      if (t < close) return t / close;
      if (t < close + open) return 1 - (t - close) / open;
      t = -1; wait = gap();
      return 0;
    },
    /** 外部事件想讓角色眨一下(例如剛完成某個動作) */
    blink() { if (t < 0) t = 0; },
  };
}

/** 游標相對於元件中心的正規化偏移(-1 ~ 1)。
 *
 *  觸控裝置沒有游標。如果只靠 pointermove,角色會永遠直視前方像當機,
 *  所以沒有游標訊號時改走一個很慢的隨機漫遊 —— 看起來像在自己發呆張望。 */
export function Pointer(el, { wander = true } = {}) {
  const st = { x: 0, y: 0, active: false, destroy() {} };
  let wx = 0, wy = 0, wtx = 0, wty = 0, wt = 0, idle = 0;

  const onMove = (ev) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    st.x = clamp((ev.clientX - (r.left + r.width / 2)) / (r.width * 0.9), -1, 1);
    st.y = clamp((ev.clientY - (r.top + r.height / 2)) / (r.height * 0.9), -1, 1);
    st.active = true;
    idle = 0;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  st.destroy = () => window.removeEventListener('pointermove', onMove);

  st.step = (dt) => {
    idle += dt;
    // 游標停了兩秒就交還給漫遊,角色不會盯著最後一個位置不放
    if (st.active && idle > 2) st.active = false;
    if (st.active || !wander) return st;
    wt -= dt;
    if (wt <= 0) {
      wt = 1.4 + Math.random() * 2.6;
      wtx = (Math.random() * 2 - 1) * 0.55;
      wty = (Math.random() * 2 - 1) * 0.4;
    }
    wx += (wtx - wx) * clamp(dt * 1.8, 0, 1);
    wy += (wty - wy) * clamp(dt * 1.8, 0, 1);
    st.x = wx; st.y = wy;
    return st;
  };
  return st;
}

/** 降幀:老動畫一秒是 12 格,不是 60 格。
 *
 *  這是「看起來像手繪動畫」和「看起來像網頁動畫」最大的一條分界 —— 比任何
 *  美術細節都關鍵。平滑內插到 60fps,再怎麼平塗都會讀成電腦畫的。
 *
 *  物理照 rAF 全速跑(彈簧要穩、要吃得到真實 dt),只有「畫面更新」被關進
 *  格子裡。順帶是效能利多:DOM 寫入少了五分之四。 */
export function FrameStep(fps = 12) {
  let acc = 0, n = 0;
  return {
    get frame() { return n; },
    /** 回傳 true 代表跨進新的一格,該重畫了 */
    step(dt) {
      acc += dt;
      const k = Math.floor(acc * fps);
      if (k === n) return false;
      n = k;
      return true;
    },
  };
}

/** 線條沸騰:手繪動畫每一格都是重畫的,同一條線在相鄰格之間會有微小差異。
 *
 *  用「格數」當亂數種子,不是用時間 —— 同一格永遠抖同一個量。若每個 rAF
 *  都重抽,會變成高頻雜訊(看起來像壞掉),不是沸騰。 */
export function boil(frame, seed, amp = 0.5) {
  const s = Math.sin(frame * 12.9898 + seed * 78.233) * 43758.5453;
  return (s - Math.floor(s) - 0.5) * 2 * amp;
}

/** 把 SVG 內的 [data-p="…"] 收成一張表,省掉四處 querySelector。 */
export function parts(root) {
  const map = {};
  root.querySelectorAll('[data-p]').forEach((el) => { map[el.getAttribute('data-p')] = el; });
  return map;
}
