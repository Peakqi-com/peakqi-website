// PeakQi 內頁 Hero 共用元件 — InnerPageHero / HeroScene / HeroCanvas / HeroMediaPlane /
// HeroDataLine / HeroProgress / HeroCopyStage / HeroCTAStage / HeroFallback /
// PageChapterRail / CinematicDivider / ScrollStage / StickyVisual / ReducedMotionScene
// 原則:scroll progress 0–1 驅動(非自動播放)、DOM 文字常在、CTA 始終可點、
// 靜態 fallback = 模板預設狀態、reduced-motion = 靜態關鍵畫面、單一 rAF、離場暫停、DPR ≤ 1.5。
import { BP, capabilityTier, ezSmooth } from './motion-config.js';
import { createMotionContext, MotionBoundary, PageProgressRail, CinematicDivider as MKCinematicDivider } from './motion-kit.js';
import { HERO_SHARED, heroConfig } from './hero-config.js';
import { painters, makeDraw } from './hero-scenes.js';

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
export const PageChapterRail = PageProgressRail;      // 全頁章節導覽(motion-kit 掛載)
export const CinematicDivider = MKCinematicDivider;   // 章節切面(motion-kit 掛載)

// ---------- 樣式保管:記住原始 cssText,destroy 時還原 ----------
function styleKeeper(ctx) {
  const saved = new Map();
  ctx.add(() => saved.forEach((css, el) => { el.style.cssText = css; }));
  return (el) => { if (el && !saved.has(el)) saved.set(el, el.style.cssText); return el; };
}

// ---------- HeroScene:場景模型(range 解析 + k 計算) ----------
export function HeroScene(cfg, isMobile) {
  const scenes = cfg.scenes;
  const ranges = scenes.map((s) => (isMobile ? s.m : s.d));
  const slaves = scenes.map((s, i) => {
    if (ranges[i]) return -1;
    for (let j = i + 1; j < scenes.length; j++) if (ranges[j]) return j; // 手機被略過的景併入下一景
    return scenes.length - 1;
  });
  const included = scenes.map((s, i) => ({ ...s, i, range: ranges[i] })).filter((s) => !!s.range);
  const kOf = (p) => {
    const out = {};
    scenes.forEach((s, i) => {
      const r = ranges[i] || ranges[slaves[i]];
      out[s.id] = r ? ezSmooth(sub(p, r[0], r[1])) : 1;
    });
    const f = included[0]; // 首場景底僴:p=0 也有完整構圖,不空白開場
    if (f) out[f.id] = 0.62 + 0.38 * out[f.id]; // 靜止首屏就要看得到構圖(檢測:0.45 太淡)
    return out;
  };
  const activeIdx = (p) => {
    let idx = 0;
    included.forEach((s, i) => { if (p >= s.range[0]) idx = i; });
    return idx;
  };
  return { scenes, included, kOf, activeIdx, isMobile };
}

// ---------- ScrollStage:wrap 進度 0–1(pinned 公式、IO 邊界、去抖) ----------
export function ScrollStage(ctx, wrap, onP) {
  const bound = MotionBoundary(ctx, wrap);
  let last = -1;
  const calc = () => {
    const vh = window.innerHeight || 1;
    const r = wrap.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, wrap.offsetHeight - vh), 0, 1);
  };
  ctx.onFrame(() => {
    if (!bound.inView) return;
    const p = calc();
    if (Math.abs(p - last) < 0.0012) return;
    last = p;
    try { onP(p, false); } catch (e) {}
  });
  try { onP(calc(), true); } catch (e) {} // 開站/深連結時直接落在正確狀態
  return { calc };
}

// ---------- StickyVisual:pin(wrap 高度 + sticky stage,可還原) ----------
export function StickyVisual(ctx, wrap, stage, totalVh) {
  const keep = styleKeeper(ctx);
  keep(wrap); keep(stage);
  wrap.style.height = totalVh + 'vh';
  stage.style.position = 'sticky';
  stage.style.top = '68px'; // NAV 固定於頂,舞台整段讓位,動畫不被蓋
  stage.style.height = 'calc(100vh - 68px)';
  try { stage.style.height = 'calc(100svh - 68px)'; if (!stage.style.height) stage.style.height = 'calc(100vh - 68px)'; } catch (e) {}
  stage.style.overflow = 'hidden';
  stage.style.boxSizing = 'border-box';
  stage.style.alignItems = 'safe center'; // 內容高於視窗時頂部優先,不裁 h1(不支援時維持 center)
  return { pinned: true };
}

// ---------- HeroCanvas:2D 敘事層(DPR≤1.5、離場暫停、lite 只跟捲動、錯誤即退) ----------
export function HeroCanvas(ctx, canvas, stage, cfg, model, opt) {
  if (!canvas || !canvas.getContext) return null;
  let g = null;
  try { g = canvas.getContext('2d'); } catch (e) { return null; }
  if (!g) return null;
  const d = makeDraw(g);
  const C = HERO_SHARED.colors;
  const paint = painters[cfg.paint];
  let W = 0, H = 0, zone = null, p = 0, ks = model.kOf(0), dirty = true, errors = 0, shown = false;
  const media = stage.querySelector('[data-hero-canvaszone]') || stage.querySelector('[data-hero-media]');
  const dpr = () => Math.min(window.devicePixelRatio || 1, HERO_SHARED.dprMax);
  function rectIn(el) {
    let x = 0, y = 0, n = el;
    while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }
  function computeZone() {
    let z = media ? rectIn(media) : null;
    if (!z || z.w < 120 || z.h < 120) z = opt.mobile
      ? { x: W * .04, y: H * .5, w: W * .92, h: H * .46 }
      : { x: W * .5, y: H * .14, w: W * .46, h: H * .72 };
    if (opt.mobile) {
      // 手機:繪圖區滿版寬,自「文案實際底部」起,往下吃到浮動 CTA pill 之上
      // (pill = fixed bottom:18px + 44px 高 → 保留 74px;不再用 .56H 上限,收合後畫面要大方)
      const copyEl = stage.querySelector('[data-hero-copy]');
      const cb = copyEl ? rectIn(copyEl).y + copyEl.offsetHeight + 12 : H * .3;
      const top = Math.max(cb, H * .2);   // 嚴格貼文案底,絕不上頂(寧可靜止只露一角,不可疊到 CTA)
      z = { x: 10, y: top, w: Math.max(180, W - 20), h: Math.max(150, H - 74 - top) };
    }
    const pad = 6;
    zone = { x: z.x + pad, y: z.y + pad, w: Math.max(60, z.w - pad * 2), h: Math.max(60, z.h - pad * 2) };
  }
  function resize() {
    const k = dpr();
    W = stage.clientWidth; H = stage.clientHeight;
    canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    g.setTransform(k, 0, 0, k, 0, 0);
    computeZone();
    dirty = true;
  }
  function draw(now) {
    if (errors > 3) return;
    try {
      if (opt.mobile) computeZone(); // 收合過渡中文案底部持續上移:zone 每繪一幀跟一次,畫面滑上去而非 480ms 後瞬跳
      g.clearRect(0, 0, W, H);
      paint(g, {
        w: W, h: H, t: now / 1000, p, zone,
        mobile: !!opt.mobile, tier: opt.tier,
        k: (id) => ks[id] ?? 0, gp: p, C, d
      });
      if (opt.flags.grain && opt.tier === 'full') d.grain(W, H, HERO_SHARED.material.grainAlpha);
      if (!shown) { shown = true; canvas.style.opacity = '1'; }
    } catch (e) { if (++errors > 3) canvas.style.opacity = '0'; }
    dirty = false;
  }
  resize();
  const bound = MotionBoundary(ctx, stage);
  const idle = opt.flags.idle && opt.tier === 'full';
  let _fl = 0; // 手機(lite 級)子動畫需要時間驅動:視口內以半幀率(~30fps)持續重繪,兼顧電量
  ctx.onFrame((now) => { if (!bound.inView) return; if (idle || dirty || (opt.mobile && (_fl = 1 - _fl))) draw(now); });
  let tmr = 0;
  const onRz = () => { clearTimeout(tmr); tmr = setTimeout(resize, 120); };
  window.addEventListener('resize', onRz);
  ctx.add(() => { window.removeEventListener('resize', onRz); clearTimeout(tmr); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dirty = true; }).catch(() => {});
  draw(performance.now());
  return { update(p2) { p = p2; ks = model.kOf(p2); dirty = true; }, resize };
}

// ---------- HeroCopyStage:DOM 文字層(場景文案 crossfade;文字常在,不重排) ----------
export function HeroCopyStage(ctx, root, model) {
  const keep = styleKeeper(ctx);
  const blocks = {};
  root.querySelectorAll('[data-hero-scene]').forEach((el) => { blocks[el.getAttribute('data-hero-scene')] = keep(el); });
  const ids = model.included.map((s) => s.id);
  let cur = -1, ready = false;
  function apply(i) {
    ids.forEach((id, j) => {
      const el = blocks[id];
      if (!el) return;
      const on = j === i;
      el.style.opacity = on ? '1' : '0';
      el.style.transform = on ? 'translateY(0)' : (j < i ? 'translateY(-12px)' : 'translateY(12px)');
      el.style.pointerEvents = on ? 'auto' : 'none';
    });
  }
  // 非本 tier 的景保持隱藏;第一次套用不帶 transition(避免載入閃動)
  model.scenes.forEach((s) => {
    const el = blocks[s.id];
    if (el && !ids.includes(s.id)) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; }
  });
  return {
    update(p) {
      const i = model.activeIdx(p);
      if (i === cur) return;
      cur = i;
      apply(i);
      if (!ready) {
        ready = true;
        requestAnimationFrame(() => ids.forEach((id) => {
          const el = blocks[id];
          if (el) el.style.transition = 'opacity 360ms cubic-bezier(0.16,1,0.3,1), transform 360ms cubic-bezier(0.16,1,0.3,1)';
        }));
      }
    }
  };
}

// ---------- HeroMediaPlane:浮動 UI / 真實截圖層(data-hero-m="a..b" 或 "a,b") ----------
export function HeroMediaPlane(ctx, root, model) {
  const keep = styleKeeper(ctx);
  const order = model.scenes.map((s) => s.id);
  const items = [];
  root.querySelectorAll('[data-hero-m]').forEach((el) => {
    const spec = (el.getAttribute('data-hero-m') || '').trim();
    if (!spec) return;
    let lo = Infinity, hi = -Infinity;
    spec.split(',').forEach((tok) => {
      tok = tok.trim();
      const mm = tok.split('..');
      const a = order.indexOf(mm[0]), b = order.indexOf(mm[1] !== undefined ? mm[1] : mm[0]);
      if (a >= 0) { lo = Math.min(lo, a); hi = Math.max(hi, Math.max(a, b < 0 ? a : b)); }
    });
    if (lo === Infinity) return;
    items.push({ el: keep(el), lo, hi });
  });
  const maxDrift = HERO_SHARED.camera.maxDriftPx;
  let ready = false;
  return {
    update(p) {
      const act = model.included[model.activeIdx(p)];
      const gi = act ? order.indexOf(act.id) : 0;
      items.forEach((it) => {
        const on = gi >= it.lo && gi <= it.hi;
        it.el.style.opacity = on ? '1' : '0';
        it.el.style.visibility = on ? 'visible' : 'hidden';
        it.el.style.transform = on ? 'translateY(0)' : 'translateY(' + (gi < it.lo ? maxDrift : -maxDrift) + 'px)';
      });
      if (!ready) {
        ready = true;
        requestAnimationFrame(() => items.forEach((it) => {
          it.el.style.transition = 'opacity 460ms cubic-bezier(0.16,1,0.3,1), transform 460ms cubic-bezier(0.16,1,0.3,1)';
        }));
      }
    }
  };
}

// ---------- HeroDataLine:SVG 資料線/節點層(stroke 進度;reduced/失敗 = 完成態) ----------
export function HeroDataLine(ctx, root, model) {
  const keep = styleKeeper(ctx);
  const lines = [];
  root.querySelectorAll('[data-hero-line]').forEach((el) => {
    const id = (el.getAttribute('data-hero-line') || '').split('..')[0].trim();
    if (!id) return;
    try {
      const L = el.getTotalLength();
      keep(el);
      el.style.strokeDasharray = L + ' ' + L;
      lines.push({ el, id, L });
    } catch (e) {}
  });
  const nodes = [];
  root.querySelectorAll('[data-hero-node]').forEach((el) => {
    const id = (el.getAttribute('data-hero-node') || '').trim();
    if (!id) return;
    nodes.push({ el: keep(el), id });
    el.style.transition = 'opacity 300ms cubic-bezier(0.16,1,0.3,1)';
  });
  return {
    update(p) {
      const ks = model.kOf(p);
      lines.forEach((l) => { l.el.style.strokeDashoffset = String(l.L * (1 - (ks[l.id] ?? 1))); });
      nodes.forEach((n) => { n.el.style.opacity = (ks[n.id] ?? 1) > 0.55 ? '1' : '0'; });
    }
  };
}

// ---------- HeroProgress:場景進度指示(裝飾層,不攔截滑鼠) ----------
export function HeroProgress(ctx, host, model, mobile) {
  if (!host) return null;
  const keep = styleKeeper(ctx);
  keep(host);
  host.innerHTML = '';
  host.style.display = 'flex';
  host.style.pointerEvents = 'none';
  const items = [];
  if (mobile) {
    host.style.cssText += ';gap:8px;align-items:center';
    const n = document.createElement('span');
    n.style.cssText = 'font:700 10px "Space Grotesk",sans-serif;letter-spacing:.18em;color:#FF6B2C;min-width:52px';
    const bar = document.createElement('span');
    bar.style.cssText = 'flex:1;max-width:120px;height:2px;background:rgba(242,239,232,.16);position:relative;display:block';
    const fill = document.createElement('span');
    fill.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:0%;background:#FF6B2C';
    bar.appendChild(fill); host.appendChild(n); host.appendChild(bar);
    ctx.add(() => { host.innerHTML = ''; });
    return {
      update(p) {
        const i = model.activeIdx(p);
        n.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(model.included.length).padStart(2, '0');
        fill.style.width = (p * 100).toFixed(1) + '%';
      }
    };
  }
  host.style.cssText += ';gap:18px;align-items:flex-end';
  model.included.forEach((s, i) => {
    const it = document.createElement('span');
    it.style.cssText = 'display:flex;flex-direction:column;gap:5px;min-width:64px';
    const lab = document.createElement('span');
    lab.textContent = String(i + 1).padStart(2, '0') + ' ' + s.label;
    lab.style.cssText = 'font:600 10px "Noto Sans TC",sans-serif;letter-spacing:.08em;color:rgba(242,239,232,.4);white-space:nowrap;transition:color .3s';
    const bar = document.createElement('span');
    bar.style.cssText = 'height:2px;background:rgba(242,239,232,.14);position:relative;overflow:hidden;display:block';
    const fill = document.createElement('span');
    fill.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:0%;background:#FF6B2C';
    bar.appendChild(fill); it.appendChild(lab); it.appendChild(bar); host.appendChild(it);
    items.push({ lab, fill, s });
  });
  ctx.add(() => { host.innerHTML = ''; });
  return {
    update(p) {
      const act = model.activeIdx(p);
      items.forEach((it, i) => {
        const k = ezSmooth(sub(p, it.s.range[0], it.s.range[1]));
        it.fill.style.width = (k * 100).toFixed(1) + '%';
        it.lab.style.color = i === act ? '#FF6B2C' : 'rgba(242,239,232,.4)';
      });
    }
  };
}

// ---------- HeroCTAStage:CTA 層(始終可點;末景微強調;analytics) ----------
export function HeroCTAStage(ctx, root, cfg, model, pageKey) {
  const wrapEl = root.querySelector('[data-hero-cta]');
  if (!wrapEl) return null;
  const keep = styleKeeper(ctx);
  keep(wrapEl);
  wrapEl.style.pointerEvents = 'auto';
  let track = null;
  import('./analytics.js').then((m) => { track = m.track; }).catch(() => {});
  const onClick = (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a[data-track]') : null;
    if (a && track) { try { track(a.getAttribute('data-track'), { page: pageKey, from: 'inner_hero' }); } catch (e2) {} }
  };
  wrapEl.addEventListener('click', onClick);
  ctx.add(() => wrapEl.removeEventListener('click', onClick));
  const prim = keep(wrapEl.querySelector('a[data-hero-primary]'));
  if (prim) prim.style.transition = 'transform 360ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 360ms';
  let hot = false;
  return {
    update(p) {
      if (!prim) return;
      const last = model.included[model.included.length - 1];
      const on = p >= last.range[0] + (last.range[1] - last.range[0]) * 0.25;
      if (on === hot) return;
      hot = on;
      prim.style.transform = on ? 'translateY(-2px)' : 'translateY(0)';
      prim.style.boxShadow = on ? '0 12px 30px rgba(255,107,44,.35)' : 'none';
    }
  };
}

// ---------- HeroFallback:靜態保底(模板預設即完成態;此處只確保 canvas 不搶戲) ----------
export function HeroFallback(root) {
  if (!root) return;
  const cv = root.querySelector('[data-hero-canvas]');
  if (cv) cv.style.opacity = '0';
  root.querySelectorAll('[data-hero-m]').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
  root.setAttribute('data-hero-static', '1');
}

// ---------- ReducedMotionScene:3–5 張靜態關鍵畫面(非 duration=0) ----------
export function ReducedMotionScene(ctx, root, cfg, mobile) {
  root.setAttribute('data-hero-reduced', '1');
  const keep = styleKeeper(ctx);
  const stage = root.querySelector('[data-hero-scenestage]');
  if (stage) { keep(stage); stage.style.minHeight = '0'; }
  const paint = painters[cfg.paint];
  const order = cfg.scenes.map((s) => s.id);
  const frameH = mobile ? HERO_SHARED.reducedAssets.frameHMobile : HERO_SHARED.reducedAssets.frameH;
  const dpr = Math.min(window.devicePixelRatio || 1, HERO_SHARED.dprMax);
  const added = [];
  cfg.reduced.forEach((id, fi) => {
    const el = root.querySelector('[data-hero-scene="' + id + '"]');
    if (!el) return;
    keep(el);
    el.style.position = 'relative';
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.pointerEvents = 'auto';
    el.style.marginTop = fi === 0 ? '0' : HERO_SHARED.reducedAssets.gap + 'px';
    el.style.paddingTop = fi === 0 ? '0' : '16px';
    if (fi > 0) el.style.borderTop = '1px solid rgba(242,239,232,.12)';
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:' + frameH + 'px;margin-top:10px;border:1px solid rgba(242,239,232,.14);border-radius:6px;background:#0C0F13';
    el.appendChild(cv);
    added.push(cv);
    try {
      const w = Math.max(260, el.clientWidth || 460), h = frameH;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const idx = order.indexOf(id);
      const ks = {}; order.forEach((oid, i) => { ks[oid] = i <= idx ? 1 : 0; });
      paint(g, {
        w, h, t: 0, p: 1, zone: { x: 10, y: 10, w: w - 20, h: h - 20 },
        mobile: true, tier: 'static', k: (sid) => ks[sid] ?? 0, gp: 1,
        C: HERO_SHARED.colors, d: makeDraw(g)
      });
    } catch (e) { cv.style.display = 'none'; }
  });
  ctx.add(() => added.forEach((cv) => cv.parentNode && cv.parentNode.removeChild(cv)));
  const cvMain = root.querySelector('[data-hero-canvas]');
  if (cvMain) cvMain.style.opacity = '0';
}

// ---------- HeroMobileCollapse:手機捲動即收合(靜止=完整文案;捲動=場景敘事+大視覺;尾景 CTA 回歸) ----------
let _mClpCss = false;
function ensureMobileCollapseCss() {
  if (_mClpCss) return; _mClpCss = true;
  const st = document.createElement('style');
  st.textContent = '@media (max-width:899px){' +
    '[data-hero-stage]{align-items:flex-start!important}' +
    '[data-hero-progress]{display:none!important}' +
    '[data-hero-stage]:has(.pq-hero-compact) [data-shotwall],[data-hero-stage]:has(.pq-hero-compact) [data-ashotwall]{top:40%!important;height:60%!important;transition:top .45s cubic-bezier(.16,1,.3,1),height .45s cubic-bezier(.16,1,.3,1)}' +
    '[data-hero-copy] .pq-clp{max-height:440px;transition:opacity .3s ease,max-height .45s cubic-bezier(.16,1,.3,1),margin .45s cubic-bezier(.16,1,.3,1);overflow:hidden}' +
    '.pq-hero-compact .pq-clp{opacity:0;max-height:0!important;margin:0!important;pointer-events:none}' +
    '.pq-hero-compact .pq-clp.pq-clp-keep{opacity:1;max-height:300px!important;pointer-events:auto}' +
    '}';
  document.head.appendChild(st);
}
function HeroMobileCollapse(ctx, root, canvasCtl) {
  ensureMobileCollapseCss();
  // 各頁 copy 結構不同:有的 [data-hero-copy] 本身就是欄,有的多包一層 div —— 找「直屬 h1 的那層」
  let copyCol = root.querySelector('[data-hero-copy]');
  if (copyCol && !copyCol.querySelector(':scope > h1')) {
    const inner = Array.from(copyCol.children).find(c => c.querySelector && c.querySelector(':scope > h1'));
    if (inner) copyCol = inner;
  }
  if (!copyCol || !copyCol.querySelector(':scope > h1')) return null;
  const cta = copyCol.querySelector('[data-hero-cta]');
  const els = Array.from(copyCol.children).filter(el =>
    el !== cta &&
    !el.hasAttribute('data-hero-scenestage') &&
    el.tagName !== 'NAV' && el.tagName !== 'SPAN');
  const all = cta ? els.concat([cta]) : els;
  all.forEach(el => { el.classList.add('pq-clp'); }); // max-height 由 CSS 靜態給(模板非同步渲染,init 量 scrollHeight 會量到 0)
  let compact = null, keep = null, tmr = 0, measured = false;
  const reflow = () => { clearTimeout(tmr); tmr = setTimeout(() => { try { canvasCtl && canvasCtl.resize(); } catch (e) {} }, 480); };
  // CSS 的 440px 是「模板非同步渲染時的安全值」,但實際內容常只有兩百多 px ——
  // 從 440 收到 0,前半段是看不見的空跑,手感就是「按鈕那邊卡一下」。
  // 展開狀態下量到真實高度後改寫成該值,收合行程才與視覺一致。
  const measure = () => {
    if (measured) return;
    let ok = true;
    all.forEach((el) => {
      const hh = el.scrollHeight;
      if (hh > 0) el.style.maxHeight = hh + 'px'; else ok = false;
    });
    measured = ok;
  };
  return { update(p) {
    if (!compact) measure();
    // 一捲即收(死區會讓人感覺「卡在按鈕那裡」);展開只在幾乎回頂,遲滯防止閾值附近反覆開合
    const c = compact ? p > 0.004 : p > 0.012;
    const k = p >= 0.985;   // 最後一景要先跑完才把 CTA 放回來,不與動畫同時出現
    if (c !== compact) { compact = c; copyCol.classList.toggle('pq-hero-compact', c); reflow(); }
    if (cta && k !== keep) { keep = k; cta.classList.toggle('pq-clp-keep', k); reflow(); }
  } };
}

// ---------- InnerPageHero:每頁入口(骨架 + config → 完整 Hero;含斷點重建與清理) ----------
export function InnerPageHero(root, cfg) {
  const ctx = createMotionContext('hero:' + cfg.key);
  const flags = { ...HERO_SHARED.flags, ...(cfg.flags || {}) };
  const tier = capabilityTier();
  const mobile = (window.innerWidth || 0) < BP.mobile;
  const widthTier = mobile ? 'mobile' : (window.innerWidth || 0) < BP.wide ? 'tablet' : 'desktop';
  if (!flags.enabled) { HeroFallback(root); return ctx; }
  const wrap = root.querySelector('[data-hero-wrap]');
  const stage = root.querySelector('[data-hero-stage]');
  if (!wrap || !stage) { HeroFallback(root); return ctx; }
  if (tier === 'static' || (window.innerHeight || 0) < 520) { // reduced-motion / Save-Data / 極短視窗:靜態關鍵畫面版
    ReducedMotionScene(ctx, root, cfg, mobile);
    root.setAttribute('data-hero-on', 'reduced');
    window.__pqHero = { key: cfg.key, ok: true, mode: 'reduced' };
    return ctx;
  }
  const model = HeroScene(cfg, mobile);
  StickyVisual(ctx, wrap, stage, cfg.totalVh[widthTier]);
  const copy = HeroCopyStage(ctx, root, model);
  const media = flags.media ? HeroMediaPlane(ctx, root, model) : null;
  const lines = flags.dataLines ? HeroDataLine(ctx, root, model) : null;
  const prog = flags.progress ? HeroProgress(ctx, root.querySelector('[data-hero-progress]'), model, mobile) : null;
  const cta = HeroCTAStage(ctx, root, cfg, model, cfg.key);
  const canvas = flags.canvas ? HeroCanvas(ctx, root.querySelector('[data-hero-canvas]'), stage, cfg, model, { tier, mobile, flags }) : null;
  if (!canvas) HeroFallback(root);
  const collapse = mobile ? HeroMobileCollapse(ctx, root, canvas) : null;
  if (mobile) { // 手機合併景會讓「階段 01→03」跳號:依實際場景數重編 kicker
    const total = model.included.length;
    model.included.forEach((sc, i) => {
      const el = root.querySelector('[data-hero-scene="' + sc.id + '"]');
      const kick = el && el.querySelector('span');
      if (!kick) return;
      const walk = (node) => {
        node.childNodes.forEach(ch => {
          if (ch.nodeType === 3 && /\d/.test(ch.textContent)) {
            ch.textContent = ch.textContent
              .replace(/(\d+)(\s*\/\s*)(\d+)/, (m, x, sep, y) =>
                String(i + 1).padStart(x.length, '0') + sep + String(total).padStart(y.length, '0'))
              .replace(/^(\s*)(\d+)(\s*[·・])/, (m, sp, x, dot) => sp + String(i + 1).padStart(x.length, '0') + dot);
          } else if (ch.nodeType === 1) walk(ch);
        });
      };
      walk(kick);
    });
  }
  ScrollStage(ctx, wrap, (p) => {
    if (collapse) collapse.update(p);
    copy.update(p);
    if (media) media.update(p);
    if (lines) lines.update(p);
    if (prog) prog.update(p);
    if (cta) cta.update(p);
    if (canvas) canvas.update(p);
  });
  root.setAttribute('data-hero-on', '1');
  window.__pqHero = { key: cfg.key, ok: true, mode: tier, scenes: model.included.length, totalVh: cfg.totalVh[widthTier] };
  return ctx;
}

// ---------- mountInnerPageHero:頁面一行接入(等模板就緒、斷點跨越時重建) ----------
export function mountInnerPageHero(key) {
  const cfg = heroConfig[key];
  let dead = false, ctx = null, bpNow = null, tmr = 0;
  const bpOf = () => ((window.innerWidth || 0) < BP.mobile ? 'm' : (window.innerWidth || 0) < BP.wide ? 't' : 'd');
  const build = () => {
    const root = document.querySelector('[data-hero="' + key + '"]');
    if (!root) return false;
    bpNow = bpOf();
    try { ctx = InnerPageHero(root, cfg); } catch (e) { try { HeroFallback(root); } catch (e2) {} }
    return true;
  };
  const boot = (tries) => {
    if (dead) return;
    if (!build() && tries < 120) requestAnimationFrame(() => boot(tries + 1));
  };
  if (cfg) boot(0);
  const onRz = () => {
    clearTimeout(tmr);
    tmr = setTimeout(() => {
      if (dead || bpOf() === bpNow) return;
      if (ctx) { try { ctx.destroy(); } catch (e) {} ctx = null; }
      build();
    }, 220);
  };
  window.addEventListener('resize', onRz);
  return {
    destroy() {
      dead = true;
      clearTimeout(tmr);
      window.removeEventListener('resize', onRz);
      if (ctx) { try { ctx.destroy(); } catch (e) {} ctx = null; }
    }
  };
}
