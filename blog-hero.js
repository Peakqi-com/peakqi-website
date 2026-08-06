// /blog 觀點頁開場:天文觀測。整段是自走的時間軸動畫,不吃捲動(捲動驅動留給品牌頁)。
// 互動:點畫面任一處 → 就近的星星被「觀測」到,依序連成星座;附近沒有星星就當場發現一顆。
//       連滿 STAR_GOAL 顆會完成一次觀測,標記編號後淡出重來。望遠鏡鏡筒會轉去對準最新那顆。
// 動畫全部掛在 motion-kit 的共用 rAF 上(整頁只有一個迴圈);離開視窗時自動停止繪製。
// 文案不寫死在這裡,由 Blog.dc.html 用 data-* 傳進來 —— 這支模組中英共用。
import { createMotionContext } from './motion-kit.js';

const STAR_GOAL = 6;                       // 連幾顆算完成一次觀測
const PICK_RADIUS = 64;                    // 點擊吸附半徑(px)
const RESET_MS = 2600;                     // 完成後停留多久再重來

const CREAM = '242,239,232';
const ORANGE = '255,107,44';

export function mountBlogHero() {
  const root = document.querySelector('[data-blog-sky]');
  if (!root) return () => {};
  const cv = root.querySelector('canvas');
  if (!cv) return () => {};
  const g = cv.getContext('2d', { alpha: false });
  if (!g) return () => {};

  const ctx = createMotionContext('blog-sky');
  const reduced = ctx.reduced;
  const TXT = {
    hint: root.getAttribute('data-hint') || '',
    done: root.getAttribute('data-done') || '',
    stars: root.getAttribute('data-stars') || ''
  };

  let W = 0, H = 0, DPR = 1, mobile = false;
  let stars = [], picks = [], ripples = [], shots = [];
  let pole = { x: 0, y: 0 }, spin = 0;
  let scope = { x: 0, y: 0, ang: -1.1, aim: -1.1 };
  let doneAt = 0, doneTag = '', nextShot = 3000, visible = true;
  let bg = null;                                    // 靜態背景預繪(每次 resize 重畫一次)

  const rnd = (a, b) => a + Math.random() * (b - a);

  // ── 版面 ────────────────────────────────────────────────
  function layout() {
    const r = root.getBoundingClientRect();
    W = Math.max(320, Math.round(r.width));
    H = Math.max(240, Math.round(r.height));
    DPR = Math.min(2, window.devicePixelRatio || 1);   // 上限 2:再高只是燒 GPU,肉眼看不出來
    mobile = W < 720;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    g.setTransform(DPR, 0, 0, DPR, 0, 0);

    // 天球極點放在畫面外的右下:星星繞它轉,離極點越遠走得越多 —— 和真實星空一致
    pole = { x: W * 0.72, y: H * 1.62 };

    // 望遠鏡站位:桌機靠右(文案佔左半),手機偏右下(文案在上方)
    scope.x = mobile ? W * 0.7 : W * 0.79;
    scope.y = H - groundY(scope.x) - (mobile ? 6 : 8);
    scope.s = mobile ? 1.02 : 1.42;
    scope.pivot = 30 * scope.s;                      // 雲台高度:鏡筒繞這個點轉,對準角度也從這裡算

    if (!stars.length) seed();
    else stars.forEach(project);                     // 已有的星星重新投影,已連的星座不會斷
    drawBackdrop();
  }

  // 地平線起伏(回傳距畫面底部的高度)
  const groundY = (x) => {
    const k = x / Math.max(1, W);
    return H * 0.13 + Math.sin(k * 3.1 + 0.6) * H * 0.028 + Math.sin(k * 7.3) * H * 0.012;
  };

  // 以「畫面比例」存位置,resize 後重算極座標 —— 星座不會因為轉向而錯位
  function project(s) {
    const x = s.nx * W, y = s.ny * H;
    const dx = x - pole.x, dy = y - pole.y;
    s.r = Math.hypot(dx, dy);
    s.a0 = Math.atan2(dy, dx);
  }

  function seed() {
    const n = mobile ? 74 : 116;
    stars = [];
    for (let i = 0; i < n; i++) {
      // 只在地平線以上撒點,而且避開最底部的剪影帶
      const nx = Math.random();
      const ny = Math.pow(Math.random(), 1.35) * 0.82;
      const s = { nx, ny, mag: Math.pow(Math.random(), 2.2), tw: rnd(0, 6.28), tws: rnd(0.6, 1.9), lit: 0 };
      project(s);
      stars.push(s);
    }
  }

  function pos(s, ang) {
    const a = s.a0 + ang;
    return { x: pole.x + s.r * Math.cos(a), y: pole.y + s.r * Math.sin(a) };
  }

  // ── 靜態背景:漸層 + 星雲 + 地面剪影,預繪一次,每幀只 blit ──
  function drawBackdrop() {
    bg = document.createElement('canvas');
    bg.width = Math.round(W * DPR);
    bg.height = Math.round(H * DPR);
    const b = bg.getContext('2d');
    b.setTransform(DPR, 0, 0, DPR, 0, 0);

    const sky = b.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#070A10');
    sky.addColorStop(0.55, '#0B0E16');
    sky.addColorStop(1, '#11131A');
    b.fillStyle = sky;
    b.fillRect(0, 0, W, H);

    // 星雲:兩團極淡的色霧,讓夜空不是死黑
    const neb = (x, y, r, col, a) => {
      const rg = b.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(${col},${a})`);
      rg.addColorStop(1, `rgba(${col},0)`);
      b.fillStyle = rg;
      b.fillRect(x - r, y - r, r * 2, r * 2);
    };
    neb(W * 0.24, H * 0.3, Math.max(W, H) * 0.42, '86,104,150', 0.16);
    neb(W * 0.82, H * 0.16, Math.max(W, H) * 0.3, ORANGE, 0.055);

    // 銀河:一道斜過去的微亮帶
    b.save();
    b.translate(W * 0.5, H * 0.34);
    b.rotate(-0.42);
    const mw = b.createLinearGradient(0, -H * 0.2, 0, H * 0.2);
    mw.addColorStop(0, 'rgba(150,168,205,0)');
    mw.addColorStop(0.5, 'rgba(150,168,205,.085)');
    mw.addColorStop(1, 'rgba(150,168,205,0)');
    b.fillStyle = mw;
    b.fillRect(-W, -H * 0.2, W * 2, H * 0.4);
    b.restore();

    // 地面剪影
    b.beginPath();
    b.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) b.lineTo(x, H - groundY(x));
    b.lineTo(W, H);
    b.closePath();
    b.fillStyle = '#05070A';
    b.fill();
    // 地平線上緣的微光
    b.beginPath();
    for (let x = 0; x <= W; x += 6) (x ? b.lineTo(x, H - groundY(x)) : b.moveTo(x, H - groundY(x)));
    b.strokeStyle = `rgba(${ORANGE},.16)`;
    b.lineWidth = 1;
    b.stroke();
  }

  // ── 望遠鏡與觀測者 ──────────────────────────────────────
  function drawAstronomer(now) {
    const s = scope.s;
    const bob = reduced ? 0 : Math.sin(now / 900) * 1.1;
    const x = scope.x, y = scope.y + bob;

    g.save();
    g.translate(x, y);

    // 三腳架
    g.strokeStyle = '#05070A';
    g.lineWidth = 3.4 * s;
    g.lineCap = 'round';
    [-1, 0, 1].forEach((k) => {
      g.beginPath();
      g.moveTo(0, -30 * s);
      g.lineTo(k * 15 * s, 0);
      g.stroke();
    });

    // 鏡筒:繞雲台旋轉
    g.save();
    g.translate(0, -30 * s);
    g.rotate(scope.ang);
    g.fillStyle = '#05070A';
    g.beginPath();                                   // 前粗後細的梯形筒身
    g.moveTo(-14 * s, -4.6 * s);
    g.lineTo(40 * s, -7.4 * s);
    g.lineTo(40 * s, 7.4 * s);
    g.lineTo(-14 * s, 4.6 * s);
    g.closePath();
    g.fill();
    g.fillRect(-20 * s, -3 * s, 8 * s, 6 * s);       // 目鏡
    // 物鏡口的橘色鏡面反光 —— 全站主色,讓剪影不是純黑
    g.beginPath();
    g.ellipse(39 * s, 0, 1.9 * s, 7 * s, 0, 0, 6.284);
    g.fillStyle = `rgba(${ORANGE},.72)`;
    g.fill();
    g.restore();

    // 觀測者:側身、單手扶著目鏡
    g.fillStyle = '#05070A';
    g.beginPath();
    g.ellipse(-26 * s, -30 * s, 6.4 * s, 7 * s, 0, 0, 6.284);   // 頭
    g.fill();
    g.beginPath();                                   // 身體
    g.moveTo(-33 * s, -22 * s);
    g.quadraticCurveTo(-26 * s, -20 * s, -22 * s, 0);
    g.lineTo(-36 * s, 0);
    g.quadraticCurveTo(-38 * s, -14 * s, -33 * s, -22 * s);
    g.closePath();
    g.fill();
    g.strokeStyle = '#05070A';                       // 手臂
    g.lineWidth = 3.2 * s;
    g.beginPath();
    g.moveTo(-30 * s, -20 * s);
    g.quadraticCurveTo(-24 * s, -26 * s, -19 * s, -29 * s);
    g.stroke();

    // 頭頂朝天的一道極淡輪廓光
    g.beginPath();
    g.arc(-26 * s, -30 * s, 6.4 * s, Math.PI * 1.05, Math.PI * 1.85);
    g.strokeStyle = `rgba(${CREAM},.34)`;
    g.lineWidth = 1.1;
    g.stroke();
    g.restore();
  }

  // ── 主繪製 ──────────────────────────────────────────────
  function frame(now) {
    if (!visible || !W) return;
    if (!reduced) spin += 0.0000165;                 // 天球轉動:約 6 分鐘一圈,慢到不吵但看得出來

    g.drawImage(bg, 0, 0, W, H);

    // 星星
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const p = pos(s, spin);
      if (p.y > H - groundY(p.x) + 4) continue;      // 沉到地平線下就不畫
      const tw = reduced ? 1 : 0.72 + 0.28 * Math.sin(now / 620 * s.tws + s.tw);
      const base = 0.3 + s.mag * 0.62;
      const rad = 0.7 + s.mag * 1.5;
      if (s.lit > 0) {
        const gl = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16 + s.lit * 12);
        gl.addColorStop(0, `rgba(${ORANGE},${0.5 * s.lit})`);
        gl.addColorStop(1, `rgba(${ORANGE},0)`);
        g.fillStyle = gl;
        g.beginPath();
        g.arc(p.x, p.y, 16 + s.lit * 12, 0, 6.284);
        g.fill();
      }
      g.beginPath();
      g.arc(p.x, p.y, rad * (s.lit ? 1.5 : 1), 0, 6.284);
      g.fillStyle = s.lit
        ? `rgba(${ORANGE},${0.75 + 0.25 * s.lit})`
        : `rgba(${CREAM},${base * tw})`;
      g.fill();
    }

    // 流星
    if (!reduced) {
      if (now > nextShot) {
        nextShot = now + rnd(4200, 9500);
        shots.push({ x: rnd(W * 0.1, W * 0.95), y: rnd(H * 0.04, H * 0.42), a: rnd(2.3, 2.85), t0: now, life: rnd(650, 950) });
      }
      shots = shots.filter((sh) => now - sh.t0 < sh.life);
      shots.forEach((sh) => {
        const k = (now - sh.t0) / sh.life;
        const len = 90 + 130 * Math.sin(Math.PI * k);
        const dx = Math.cos(sh.a), dy = Math.sin(sh.a);
        const hx = sh.x + dx * 300 * k, hy = sh.y + dy * 300 * k;
        const lg = g.createLinearGradient(hx, hy, hx - dx * len, hy - dy * len);
        const a = Math.sin(Math.PI * k) * 0.8;
        lg.addColorStop(0, `rgba(${CREAM},${a})`);
        lg.addColorStop(1, `rgba(${CREAM},0)`);
        g.strokeStyle = lg;
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(hx, hy);
        g.lineTo(hx - dx * len, hy - dy * len);
        g.stroke();
      });
    }

    // 星座連線
    if (picks.length) {
      const fade = doneAt ? Math.max(0, 1 - (now - doneAt) / RESET_MS) : 1;
      g.strokeStyle = `rgba(${ORANGE},${0.55 * fade})`;
      g.lineWidth = 1.3;
      g.setLineDash([]);
      g.beginPath();
      picks.forEach((s, i) => {
        const p = pos(s, spin);
        (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
      });
      g.stroke();

      // 每顆已觀測星星外圈的細環
      picks.forEach((s) => {
        const p = pos(s, spin);
        g.beginPath();
        g.arc(p.x, p.y, 7.5, 0, 6.284);
        g.strokeStyle = `rgba(${ORANGE},${0.42 * fade})`;
        g.lineWidth = 1;
        g.stroke();
      });

      // 完成標記
      if (doneAt) {
        const p = pos(picks[picks.length - 1], spin);
        g.font = `700 ${mobile ? 11 : 12}px "Space Grotesk","Noto Sans TC",sans-serif`;
        g.textAlign = 'left';
        g.fillStyle = `rgba(${ORANGE},${fade})`;
        const label = doneTag + '　' + STAR_GOAL + ' ' + TXT.stars;
        const lw = g.measureText(label).width;
        const lx = Math.min(Math.max(12, p.x + 14), W - lw - 12);   // 標籤永遠留在畫面內
        g.fillText(label, lx, Math.min(Math.max(20, p.y - 12), H - 14));
      }
    }

    // 點擊漣漪
    ripples = ripples.filter((r) => now - r.t0 < 620);
    ripples.forEach((r) => {
      const k = (now - r.t0) / 620;
      g.beginPath();
      g.arc(r.x, r.y, 8 + k * 44, 0, 6.284);
      g.strokeStyle = `rgba(${ORANGE},${(1 - k) * 0.5})`;
      g.lineWidth = 1.4 * (1 - k) + 0.3;
      g.stroke();
    });

    // 已觀測星星的點亮進度
    stars.forEach((s) => { if (s.want && s.lit < 1) s.lit = Math.min(1, s.lit + (reduced ? 1 : 0.06)); });

    // 鏡筒轉向:idle 時緩慢掃過天空
    if (!picks.length && !reduced) scope.aim = -1.28 + Math.sin(now / 4200) * 0.42;
    scope.ang += (scope.aim - scope.ang) * (reduced ? 1 : 0.055);

    drawAstronomer(now);

    // 完成後歸零,重新開始一輪
    if (doneAt && now - doneAt > RESET_MS) {
      picks.forEach((s) => { s.want = false; s.lit = 0; });
      picks = [];
      doneAt = 0;
      scope.aim = -1.28;
    }
  }

  // ── 互動 ────────────────────────────────────────────────
  function observe(cx, cy) {
    if (doneAt) return;                              // 完成動畫播放中,先不接受新的點
    ripples.push({ x: cx, y: cy, t0: performance.now() });

    let best = null, bestD = PICK_RADIUS;
    for (const s of stars) {
      if (s.want) continue;
      const p = pos(s, spin);
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d < bestD) { bestD = d; best = s; }
    }
    // 附近沒有星星就當場發現一顆 —— 點下去一定有反應,不會有「按了沒事」的空拍
    if (!best) {
      if (cy > H - groundY(cx) - 10) return;         // 但不在地面上生星星
      best = { nx: cx / W, ny: cy / H, mag: 0.85, tw: 0, tws: 1, lit: 0 };
      project(best);
      stars.push(best);
    }
    best.want = true;
    picks.push(best);

    const p = pos(best, spin);
    scope.aim = Math.atan2(p.y - (scope.y - scope.pivot), p.x - scope.x);

    if (picks.length >= STAR_GOAL) {
      doneAt = performance.now();
      // 編號由這次連到的星星決定,每次不一樣,但不是憑空假造的資料
      const n = picks.reduce((a, s, i) => a + Math.round(s.nx * 97) * (i + 1), 0) % 9000 + 1000;
      doneTag = 'PQ-' + n;
    }
  }

  // 手機在 hero 上往下滑會先觸發 pointerdown。用「按下與放開的位移」判斷是點擊還是捲動,
  // 否則每次捲過開場都會莫名點亮一顆星。
  let down = null;
  const onDown = (e) => { down = { x: e.clientX, y: e.clientY, t: e.timeStamp }; };
  const onUp = (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const held = e.timeStamp - down.t;
    down = null;
    if (moved > 12 || held > 600) return;            // 滑動或長按 → 不算觀測
    const r = cv.getBoundingClientRect();
    observe(e.clientX - r.left, e.clientY - r.top);
  };
  const onCancel = () => { down = null; };
  // 鍵盤操作:Enter / Space 隨機觀測一顆,鍵盤使用者也玩得到
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const free = stars.filter((s) => !s.want);
    if (!free.length) return;
    const s = free[Math.floor(Math.random() * free.length)];
    const p = pos(s, spin);
    observe(p.x, p.y);
  };

  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onCancel);
  cv.addEventListener('keydown', onKey);
  ctx.add(() => {
    cv.removeEventListener('pointerdown', onDown);
    cv.removeEventListener('pointerup', onUp);
    cv.removeEventListener('pointercancel', onCancel);
    cv.removeEventListener('keydown', onKey);
  });

  // resize:用 ResizeObserver 盯容器,手機網址列收合造成的高度變化也接得到
  let rt = 0;
  const relayout = () => { clearTimeout(rt); rt = setTimeout(layout, 120); };
  const ro = ('ResizeObserver' in window) ? new ResizeObserver(relayout) : null;
  if (ro) ro.observe(root); else window.addEventListener('resize', relayout);
  ctx.add(() => { clearTimeout(rt); if (ro) ro.disconnect(); else window.removeEventListener('resize', relayout); });

  // 離開視窗就不畫(捲到下面看文章時不該還在燒效能)
  ctx.io(root, (es) => { visible = es[0].isIntersecting; }, { rootMargin: '80px' });

  layout();
  ctx.onFrame(frame);
  frame(performance.now());

  const hint = root.querySelector('[data-sky-hint]');
  if (hint && TXT.hint) hint.textContent = TXT.hint;

  return () => ctx.destroy();
}
