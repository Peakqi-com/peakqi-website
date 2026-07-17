// PeakQi 共用動畫元件庫 — 單一 rAF conductor、IO 邊界、可完整 revert 的 context
// 元件:PageIntroSequence / CinematicDivider / ScrollChapter / StickyProductStage /
//       PageProgressRail / MaskRevealMedia / DataLine / ParallaxLayer /
//       MotionBoundary / ReducedMotionFallback / WebGLFallback
import { DUR, EASE, SCROLL, BP, COLORS, capabilityTier, ezSmooth, FLAGS as GFLAGS } from './motion-config.js';

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);

// ---------- Motion context(gsap.context 等效:集中註冊、unmount 全清) ----------
export function createMotionContext(name) {
  const disposers = [], frames = [], ios = [];
  let destroyed = false, raf = 0, lastTick = 0;
  function loop(now) {
    if (destroyed) return;
    raf = requestAnimationFrame(loop);
    lastTick = now;
    for (let i = 0; i < frames.length; i++) { try { frames[i](now); } catch (e) {} }
  }
  const onScroll = () => { // rAF 停擺時 scroll 直驅備援(與既有引擎同模式)
    if (destroyed) return;
    const now = performance.now();
    if (now - lastTick > 200) for (let i = 0; i < frames.length; i++) { try { frames[i](now); } catch (e) {} }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  const ctx = {
    name,
    tier: capabilityTier(),
    reduced: capabilityTier() === 'static',
    mobile: (window.innerWidth || 0) < BP.mobile,
    add(fn) { disposers.push(fn); return fn; },
    io(target, cb, opt) {
      if (!target || !('IntersectionObserver' in window)) return () => {};
      const o = new IntersectionObserver(cb, opt || { rootMargin: '160px' });
      o.observe(target); ios.push(o);
      return () => o.disconnect();
    },
    onFrame(fn) {
      frames.push(fn);
      if (frames.length === 1) raf = requestAnimationFrame(loop);
      return () => { const i = frames.indexOf(fn); if (i >= 0) frames.splice(i, 1); };
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      ios.forEach(o => o.disconnect());
      disposers.forEach(d => { try { d(); } catch (e) {} });
      disposers.length = frames.length = ios.length = 0;
    }
  };
  return ctx;
}

// ---------- MotionBoundary:viewport 內才啟動,離場暫停 ----------
export function MotionBoundary(ctx, el, { onEnter, onLeave } = {}) {
  let inView = false;
  ctx.io(el, es => {
    const v = !!(es[0] && es[0].isIntersecting);
    if (v === inView) return;
    inView = v;
    if (v && onEnter) onEnter(); else if (!v && onLeave) onLeave();
  });
  return { get inView() { return inView; } };
}

// ---------- ReducedMotionFallback:reduced 時套靜態並短路 ----------
export function ReducedMotionFallback(ctx, applyStatic) {
  if (ctx.reduced) { try { applyStatic && applyStatic(); } catch (e) {} return true; }
  return false;
}

// ---------- WebGLFallback:能力檢查+context lost 包裝 ----------
export function WebGLFallback({ canvas, onUnavailable, onLost }) {
  try {
    const gl = canvas.getContext('webgl', { alpha: true, powerPreference: 'low-power' });
    if (!gl) throw new Error('no-webgl');
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onLost && onLost(); }, false);
    return { ok: true, gl };
  } catch (e) { onUnavailable && onUnavailable(); return { ok: false, gl: null }; }
}

// ---------- ScrollChapter:區塊進度驅動(traverse 或 pinned) ----------
export function ScrollChapter(ctx, el, onProgress, { pinned = false } = {}) {
  if (!el) return { off: () => {} };
  const bound = MotionBoundary(ctx, el);
  let last = -1;
  const off = ctx.onFrame(() => {
    if (!bound.inView) return;
    const vh = window.innerHeight || 1;
    const r = el.getBoundingClientRect();
    const p = pinned
      ? clamp(-r.top / Math.max(1, el.offsetHeight - vh), 0, 1)
      : clamp((vh - r.top) / (vh + r.height), 0, 1);
    if (Math.abs(p - last) < 0.0015) return;
    last = p;
    try { onProgress(p); } catch (e) {}
  });
  ctx.add(off);
  return { off };
}

// ---------- StickyProductStage:pin 包裝(wrap 高度+sticky stage) ----------
export function StickyProductStage(ctx, wrap, stage, { distanceVh = 120, top = 0 } = {}) {
  if (!wrap || !stage || ctx.reduced) return { pinned: false, revert: () => {} };
  const vh = window.innerHeight || 1;
  wrap.style.height = (vh + vh * distanceVh / 100) + 'px';
  stage.style.position = 'sticky';
  stage.style.top = top + 'px';
  stage.style.minHeight = '100vh';
  stage.style.boxSizing = 'border-box';
  const revert = () => {
    wrap.style.height = '';
    ['position', 'top', 'minHeight', 'boxSizing'].forEach(k => { stage.style[k] = ''; });
  };
  ctx.add(revert);
  return { pinned: true, revert };
}

// ---------- PageIntroSequence:80–140vh 頁面開場(scroll 控制,DOM 文字常在) ----------
export function PageIntroSequence(ctx, cfg) {
  const root = document.querySelector('[data-intro]');
  if (!root) return;
  const title = root.querySelector('[data-intro-title]');
  const num = root.querySelector('[data-intro-num]');
  const obj = root.querySelector('[data-intro-obj]');
  const stage = root.querySelector('[data-intro-stage]') || root.firstElementChild;
  if (ReducedMotionFallback(ctx, () => { /* 模板預設即靜態完成態 */ })) return;
  if (ctx.mobile) return; // 手機:不 pin,維持一般文件流
  const vh = clamp(cfg.vh || 110, SCROLL.introVhMin, SCROLL.introVhMax);
  StickyProductStage(ctx, root, stage, { distanceVh: vh - 100 });
  ScrollChapter(ctx, root, (p) => {
    const k = ezSmooth(sub(p, 0, 0.55));
    if (title) { title.style.transform = 'translateY(' + ((1 - k) * 34).toFixed(1) + 'px)'; title.style.opacity = String(0.35 + 0.65 * k); }
    if (num) num.style.opacity = String(0.2 + 0.8 * k);
    if (obj) obj.style.transform = 'translateY(' + ((0.5 - p) * 40).toFixed(1) + 'px)';
  }, { pinned: true });
}

// ---------- CinematicDivider:三種可重用章節切面(line / shutter / aperture) ----------
export function CinematicDivider(ctx, el) {
  if (!el) return;
  const type = el.getAttribute('data-divider') || 'line';
  const line = el.querySelector('[data-line]');
  const label = el.querySelector('[data-label]');
  const shutL = el.querySelector('[data-shut-l]');
  const shutR = el.querySelector('[data-shut-r]');
  const ap = el.querySelector('[data-ap]');
  const finish = () => {
    if (line) line.style.transform = 'scaleX(1)';
    if (label) label.style.opacity = '1';
    if (shutL) shutL.style.transform = 'translateX(-100%)';
    if (shutR) shutR.style.transform = 'translateX(100%)';
    if (ap) ap.style.transform = 'scale(1)';
  };
  if (ReducedMotionFallback(ctx, finish)) return;
  if (line) { line.style.transform = 'scaleX(0)'; line.style.transformOrigin = 'left center'; }
  if (label) label.style.opacity = '0';
  if (ap) { ap.style.transform = 'scale(.12)'; ap.style.transformOrigin = 'center'; }
  let done = false;
  ctx.io(el, es => {
    if (done || !(es[0] && es[0].isIntersecting)) return;
    done = true;
    const tr = (n, ms, delay) => { if (n) n.style.transition = 'transform ' + ms + 'ms ' + EASE.out + (delay ? ' ' + delay + 'ms' : '') + ', opacity ' + DUR.base + 'ms ' + EASE.out; };
    tr(line, DUR.slow); tr(shutL, DUR.slow); tr(shutR, DUR.slow); tr(ap, DUR.slow);
    if (label) label.style.transition = 'opacity ' + DUR.base + 'ms ' + EASE.out + ' 200ms';
    finish();
  }, { threshold: type === 'aperture' ? 0.6 : 0.5 });
}

// ---------- MaskRevealMedia:媒體遮罩進場(一次性,reduced 直接可見) ----------
export function MaskRevealMedia(ctx, el, { dir = 'left' } = {}) {
  if (!el) return;
  if (ReducedMotionFallback(ctx, () => { el.style.clipPath = 'none'; })) return;
  const hidden = dir === 'left' ? 'inset(0 100% 0 0)' : dir === 'up' ? 'inset(100% 0 0 0)' : 'inset(0 0 0 100%)';
  el.style.clipPath = hidden;
  let done = false;
  ctx.io(el, es => {
    if (done || !(es[0] && es[0].isIntersecting)) return;
    done = true;
    el.style.transition = 'clip-path ' + DUR.slow + 'ms ' + EASE.out;
    el.style.clipPath = 'inset(0 0 0 0)';
  }, { threshold: 0.35 });
}

// ---------- DataLine:資料線隨捲動填充(reduced=完成態) ----------
export function DataLine(ctx, el, { axis = 'x', section = null, range = [0.2, 0.6] } = {}) {
  if (!el) return;
  const apply = (k) => { el.style.transform = (axis === 'x' ? 'scaleX(' : 'scaleY(') + k.toFixed(3) + ')'; };
  el.style.transformOrigin = axis === 'x' ? 'left center' : 'top center';
  if (ReducedMotionFallback(ctx, () => apply(1))) return;
  apply(0);
  ScrollChapter(ctx, section || el.parentElement, (p) => apply(ezSmooth(sub(p, range[0], range[1]))));
}

// ---------- ParallaxLayer:克制視差(±定量,reduced/mobile 取消) ----------
export function ParallaxLayer(ctx, el, depth = 1, maxPx = 60) {
  if (!el || ctx.reduced || ctx.mobile) return;
  ScrollChapter(ctx, el.closest('section') || el.parentElement, (p) => {
    const off = clamp((p - 0.5) * 2 * (depth - 1) * maxPx, -maxPx, maxPx);
    el.style.transform = 'translateY(' + off.toFixed(1) + 'px)';
  });
}

// ---------- PageProgressRail:固定章節導覽(低干擾、鍵盤可用、不遮內容) ----------
export function PageProgressRail(ctx, chapters, { active = true } = {}) {
  if (!active || !chapters || !chapters.length) return;
  if (document.getElementById('pq-rail')) return;
  const isMobile = ctx.mobile;
  const nav = document.createElement('nav');
  nav.id = 'pq-rail';
  nav.setAttribute('aria-label', '頁面章節導覽');
  const jumpBehavior = ctx.reduced ? 'auto' : 'smooth';
  const items = [];
  if (isMobile) {
    // 手機:貼齊視窗最上緣的細進度條(在 nav 之上、零遮擋)
    nav.style.cssText = 'position:fixed;left:0;right:0;top:0;height:3px;z-index:400;pointer-events:none;background:rgba(9,11,14,.08)';
    const fill = document.createElement('div');
    fill.style.cssText = 'height:100%;width:0%;background:' + COLORS.orange + ';transition:width .1s linear';
    nav.appendChild(fill);
    document.body.appendChild(nav);
    ctx.onFrame(() => {
      const de = document.scrollingElement || document.documentElement;
      const k = clamp(de.scrollTop / Math.max(1, de.scrollHeight - window.innerHeight), 0, 1);
      fill.style.width = (k * 100).toFixed(1) + '%';
    });
  } else {
    nav.style.cssText = 'position:fixed;right:14px;top:50%;transform:translateY(-50%);z-index:90;display:flex;flex-direction:column;gap:10px;align-items:flex-end';
    chapters.forEach((ch, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', '跳到「' + ch.label + '」');
      b.style.cssText = 'display:flex;align-items:center;gap:8px;background:none;border:none;cursor:pointer;padding:4px;font:600 11px "Noto Sans TC",sans-serif;color:rgba(9,11,14,.55)';
      const tag = document.createElement('span');
      tag.textContent = ch.label;
      tag.style.cssText = 'opacity:0;transform:translateX(4px);transition:opacity .16s,transform .16s;background:#090B0E;color:#F2EFE8;padding:3px 9px;border-radius:2px;pointer-events:none;white-space:nowrap';
      const dot = document.createElement('span');
      dot.style.cssText = 'width:8px;height:8px;border-radius:999px;background:rgba(9,11,14,.28);transition:all .2s ' + EASE.out + ';flex-shrink:0';
      b.appendChild(tag); b.appendChild(dot);
      const show = () => { tag.style.opacity = '1'; tag.style.transform = 'translateX(0)'; };
      const hide = () => { tag.style.opacity = '0'; tag.style.transform = 'translateX(4px)'; };
      b.addEventListener('mouseenter', show); b.addEventListener('mouseleave', hide);
      b.addEventListener('focus', show); b.addEventListener('blur', hide);
      b.addEventListener('click', () => {
        const t = ch.id ? document.getElementById(ch.id) : null;
        const top = t ? t.getBoundingClientRect().top + (window.scrollY || 0) - 70 : 0;
        window.scrollTo({ top: Math.max(0, top), behavior: jumpBehavior });
      });
      nav.appendChild(b);
      items.push({ b, dot, ch });
    });
    document.body.appendChild(nav);
    let cur = -1;
    ctx.onFrame(() => {
      const vh = window.innerHeight || 1;
      let idx = 0;
      for (let i = 0; i < items.length; i++) {
        const t = items[i].ch.id ? document.getElementById(items[i].ch.id) : null;
        if (t && t.getBoundingClientRect().top <= vh * SCROLL.chapterActivate) idx = i;
      }
      if (idx === cur) return;
      cur = idx;
      items.forEach((it, i) => {
        const on = i === idx;
        it.dot.style.background = on ? COLORS.orange : 'rgba(9,11,14,.28)';
        it.dot.style.height = on ? '22px' : '8px';
        it.b.setAttribute('aria-current', on ? 'true' : 'false');
      });
    });
  }
  ctx.add(() => { if (nav.parentNode) nav.parentNode.removeChild(nav); });
}

// ---------- 每頁入口:讀該頁 motion config、掛共用元件 ----------
export function initPageMotion(cfg) {
  const ctx = createMotionContext(cfg.key);
  const flags = { ...GFLAGS, ...(cfg.flags || {}) };
  if (flags.rail) PageProgressRail(ctx, cfg.chapters || []);
  if (flags.pageIntro && cfg.intro) PageIntroSequence(ctx, cfg.intro);
  if (flags.dividers) document.querySelectorAll('[data-divider]').forEach(el => CinematicDivider(ctx, el));
  document.querySelectorAll('[data-maskreveal]').forEach(el => MaskRevealMedia(ctx, el));
  document.querySelectorAll('[data-dataline]').forEach(el => DataLine(ctx, el, { axis: el.getAttribute('data-dataline') || 'x' }));
  document.querySelectorAll('[data-parallax]').forEach(el => ParallaxLayer(ctx, el, parseFloat(el.getAttribute('data-parallax') || '1')));
  return ctx;
}
