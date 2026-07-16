// /cases 長篇頁引擎:透視牆開場、Featured Stories 相位、Work Index FLIP、Lightbox、count-up
import { createMotionContext, ScrollChapter, StickyProductStage } from './motion-kit.js';
import { ezSmooth } from './motion-config.js';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const ez = ezSmooth;

export function createCasesFX() {
  const ctx = createMotionContext('cases');
  const q = (s, r) => (r || document).querySelector(s);
  const qa = (s, r) => Array.from((r || document).querySelectorAll(s));
  const pin = (id, vh) => {
    const wrap = q('#' + id + ' [data-wrap]'), stage = q('#' + id + ' [data-stage]');
    if (!wrap || !stage || ctx.reduced || ctx.mobile) return null;
    StickyProductStage(ctx, wrap, stage, { distanceVh: vh });
    return wrap;
  };

  // ---------- 開場透視牆:近景拉開成矩陣 ----------
  function wall() {
    const wrap = pin('wall', 55);
    const grid = q('#wall [data-wgrid]');
    const head = q('#wall [data-whead]');
    if (!wrap || !grid) return;
    grid.style.willChange = 'transform';
    grid.style.transformOrigin = '50% 42%';
    ScrollChapter(ctx, wrap, (p) => {
      const k = ez(sub(p, 0.02, 0.7));
      grid.style.transform = 'perspective(1100px) rotateX(' + (7 * (1 - k)).toFixed(2) + 'deg) scale(' + (1.7 - 0.7 * k).toFixed(3) + ')';
      if (head) { head.style.opacity = String(0.15 + 0.85 * ez(sub(p, 0.45, 0.75))); }
    }, { pinned: true });
  }

  // ---------- Featured Stories:固定畫面+BEFORE/SYSTEM/RESULT 相位 ----------
  function stories() {
    qa('[data-story]').forEach(sec => {
      const wrap = sec.querySelector('[data-wrap]'), stage = sec.querySelector('[data-stage]');
      const shots = qa('[data-shot]', sec);
      const phases = qa('[data-phase]', sec);
      const dots = qa('[data-pdot]', sec);
      const setPh = (idx, anim) => {
        phases.forEach((el, i) => {
          const on = i === idx;
          if (anim) el.style.transition = 'opacity 240ms cubic-bezier(0.65,0,0.35,1), transform 240ms cubic-bezier(0.16,1,0.3,1)';
          el.style.opacity = on ? '1' : '0';
          el.style.transform = on ? 'none' : 'translateY(10px)';
          el.style.pointerEvents = on ? 'auto' : 'none';
        });
        shots.forEach((el, i) => {
          const on = i === Math.min(idx, shots.length - 1);
          if (anim) el.style.transition = 'opacity 300ms cubic-bezier(0.65,0,0.35,1), clip-path 300ms cubic-bezier(0.16,1,0.3,1), transform 300ms cubic-bezier(0.16,1,0.3,1)';
          el.style.opacity = on ? '1' : '0';
          el.style.clipPath = on ? 'inset(0 0 0 0)' : 'inset(0 0 10% 0)';
          el.style.transform = on ? 'scale(1)' : 'scale(1.03)';
        });
        dots.forEach((d, i) => { d.style.background = i === idx ? '#FF6B2C' : 'rgba(9,11,14,.25)'; d.style.width = i === idx ? '22px' : '8px'; });
      };
      if (ctx.reduced || ctx.mobile || !wrap || !stage) {
        // 直排:全部相位可讀
        phases.forEach(el => { el.style.position = 'relative'; el.style.opacity = '1'; el.style.transform = 'none'; el.style.pointerEvents = 'auto'; });
        shots.forEach((el, i) => { if (i > 0) el.style.display = 'none'; });
        return;
      }
      StickyProductStage(ctx, wrap, stage, { distanceVh: 120 });
      let cur = -1;
      setPh(0, false);
      ScrollChapter(ctx, wrap, (p) => {
        const idx = clamp(Math.floor(sub(p, 0.04, 0.96) * 3), 0, 2);
        if (idx !== cur) { cur = idx; setPh(idx, true); }
      }, { pinned: true });
    });
  }

  // ---------- Result count-up(一次) ----------
  function counts() {
    if (ctx.reduced) return;
    const els = qa('[data-count]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    const done = new WeakSet();
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting || done.has(e.target)) return;
        done.add(e.target); io.unobserve(e.target);
        const el = e.target, final = el.textContent;
        const m = final.match(/(\d[\d,]*)/);
        if (!m) return;
        const target = parseInt(m[1].replace(/,/g, ''), 10);
        if (!isFinite(target) || target <= 0) return;
        const pre = final.slice(0, m.index), post = final.slice(m.index + m[1].length);
        const t0 = performance.now();
        const step = (now) => {
          const k = ez(clamp((now - t0) / 700, 0, 1));
          el.textContent = pre + Math.round(target * k) + post;
          if (k < 1) requestAnimationFrame(step); else el.textContent = final;
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    els.forEach(el => io.observe(el));
    ios.push(io);
  }
  const ios = [];

  // ---------- Work Index FLIP ----------
  function flip(gridEl) {
    if (ctx.reduced || !gridEl) return () => {};
    const first = new Map();
    qa('[data-card]', gridEl).forEach(el => first.set(el.getAttribute('data-card'), el.getBoundingClientRect()));
    return () => {
      qa('[data-card]', gridEl).forEach(el => {
        const f = first.get(el.getAttribute('data-card'));
        if (!f) { el.style.opacity = '0'; requestAnimationFrame(() => { el.style.transition = 'opacity 280ms cubic-bezier(0.16,1,0.3,1)'; el.style.opacity = '1'; }); return; }
        const n = el.getBoundingClientRect();
        const dx = f.left - n.left, dy = f.top - n.top;
        if (!dx && !dy) return;
        el.style.transition = 'none';
        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        requestAnimationFrame(() => {
          el.style.transition = 'transform 320ms cubic-bezier(0.16,1,0.3,1)';
          el.style.transform = '';
        });
      });
    };
  }

  // ---------- Accessible Lightbox ----------
  const lb = { el: null, items: [], idx: 0, lastFocus: null };
  function lbBuild() {
    if (lb.el) return;
    const el = document.createElement('div');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '案例截圖瀏覽');
    el.style.cssText = 'position:fixed;inset:0;z-index:640;background:rgba(9,11,14,.92);display:none;align-items:center;justify-content:center;padding:4vh 4vw';
    el.innerHTML = [
      '<button data-lb-close aria-label="關閉(Esc)" style="position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;background:rgba(242,239,232,.1);border:1px solid rgba(242,239,232,.3);color:#F2EFE8;font:500 16px sans-serif;cursor:pointer">✕</button>',
      '<button data-lb-prev aria-label="上一張" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;background:rgba(242,239,232,.1);border:1px solid rgba(242,239,232,.3);color:#F2EFE8;font:600 18px sans-serif;cursor:pointer">←</button>',
      '<button data-lb-next aria-label="下一張" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;background:rgba(242,239,232,.1);border:1px solid rgba(242,239,232,.3);color:#F2EFE8;font:600 18px sans-serif;cursor:pointer">→</button>',
      '<figure style="margin:0;max-width:min(1200px,92vw);display:flex;flex-direction:column;gap:12px;align-items:center">',
      '<img data-lb-img alt="" style="max-width:100%;max-height:76vh;border-radius:6px;border:1px solid rgba(242,239,232,.2);background:#14171C">',
      '<figcaption style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center">',
      '<span data-lb-cap style="font:600 14px \'Noto Sans TC\',sans-serif;color:#F2EFE8"></span>',
      '<a data-lb-link target="_blank" rel="noopener" style="display:none;font:700 13px \'Noto Sans TC\',sans-serif;color:#FF6B2C;text-decoration:none">造訪網站 ↗</a>',
      '<a data-lb-detail style="display:none;font:700 13px \'Noto Sans TC\',sans-serif;color:#65E0BC;text-decoration:none">看完整案例 →</a>',
      '</figcaption></figure>'
    ].join('');
    document.body.appendChild(el);
    const close = () => lbClose();
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    el.querySelector('[data-lb-close]').addEventListener('click', close);
    el.querySelector('[data-lb-prev]').addEventListener('click', () => lbShow(lb.idx - 1));
    el.querySelector('[data-lb-next]').addEventListener('click', () => lbShow(lb.idx + 1));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); lbShow(lb.idx - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); lbShow(lb.idx + 1); }
      else if (e.key === 'Tab') {
        const f = qa('button,a[href]', el).filter(n => n.offsetParent);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    lb.el = el;
    ctx.add(() => { if (el.parentNode) el.parentNode.removeChild(el); });
  }
  function lbShow(i) {
    const n = lb.items.length;
    lb.idx = ((i % n) + n) % n;
    const it = lb.items[lb.idx];
    const img = lb.el.querySelector('[data-lb-img]');
    img.src = it.src;
    img.alt = it.alt || '';
    if (it.fallback) img.onerror = () => { img.onerror = null; img.src = it.fallback; };
    lb.el.querySelector('[data-lb-cap]').textContent = it.cap || '';
    const link = lb.el.querySelector('[data-lb-link]');
    link.style.display = it.url ? 'inline' : 'none';
    if (it.url) link.href = it.url;
    const det = lb.el.querySelector('[data-lb-detail]');
    det.style.display = it.detail ? 'inline' : 'none';
    if (it.detail) det.href = it.detail;
  }
  function lbOpen(items, i, trigger) {
    lbBuild();
    lb.items = items;
    lb.lastFocus = trigger || document.activeElement;
    lb.el.style.display = 'flex';
    document.documentElement.style.overflow = 'hidden';
    lbShow(i);
    setTimeout(() => lb.el.querySelector('[data-lb-close]').focus(), 40);
  }
  function lbClose() {
    if (!lb.el) return;
    lb.el.style.display = 'none';
    document.documentElement.style.overflow = '';
    if (lb.lastFocus && lb.lastFocus.focus) lb.lastFocus.focus();
  }

  function start() {
    let tries = 0;
    const boot = () => {
      if (!q('#wall') && tries++ < 90) { requestAnimationFrame(boot); return; }
      try { wall(); stories(); counts(); } catch (e) {}
      window.__pqCases = { lightbox: lbOpen, flip, ok: true };
    };
    boot();
    return ctx;
  }
  return {
    start,
    lightbox: lbOpen,
    flip,
    destroy: () => { ios.forEach(o => o.disconnect()); ctx.destroy(); if (window.__pqCases) delete window.__pqCases; }
  };
}
