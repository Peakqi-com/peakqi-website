// PeakQi 微互動(全站,由 Nav 掛載一次):CTA 按壓/箭頭、卡片 tilt、spring cursor、CTA spotlight
export function createMicro() {
  const fine = !!(window.matchMedia && window.matchMedia('(pointer:fine)').matches && window.matchMedia('(hover:hover)').matches);
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const save = !!(navigator.connection && navigator.connection.saveData);
  const lowMem = !!(navigator.deviceMemory && navigator.deviceMemory < 4);
  let destroyed = false, raf = 0, styleEl = null, dot = null, ring = null;
  const binds = [];
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); binds.push([el, ev, fn]); };

  function injectCSS() {
    // View Transitions 在 reload/skip 時會拋良性 unhandled rejection,靜默處理(不影響導航)
    if (!window.__pqVTGuard) {
      window.__pqVTGuard = (e) => {
        const r = String((e && e.reason && (e.reason.message || e.reason)) || '');
        if (r.indexOf('Transition was skipped') >= 0 || r.indexOf('AbortError') >= 0) e.preventDefault();
      };
      window.addEventListener('unhandledrejection', window.__pqVTGuard);
    }
    styleEl = document.createElement('style');
    styleEl.id = 'pq-micro-css';
    styleEl.textContent = [
      'a:focus-visible,button:focus-visible,summary:focus-visible,[role="tab"]:focus-visible{outline:2px solid #FF6B2C;outline-offset:2px}',
      '[data-cta]{transition:transform 160ms cubic-bezier(.16,1,.3,1),background 160ms cubic-bezier(.16,1,.3,1),color 160ms cubic-bezier(.16,1,.3,1)}',
      '[data-cta] [data-arrow]{display:inline-block;transition:transform 320ms cubic-bezier(.16,1,.3,1)}',
      '[data-cta]:hover [data-arrow]{transform:translateX(6px)}',
      '[data-cta].pq-press{transform:scale(.97)}',
      '@media (prefers-reduced-motion:reduce){[data-cta],[data-cta] [data-arrow]{transition:none}}'
    ].join('\n');
    document.head.appendChild(styleEl);
  }

  // CTA 按壓(不覆蓋原生 focus)
  function pressWire() {
    const down = (e) => { const el = e.target.closest && e.target.closest('[data-cta]'); if (el) el.classList.add('pq-press'); };
    const up = () => { document.querySelectorAll('[data-cta].pq-press').forEach(el => el.classList.remove('pq-press')); };
    on(document, 'pointerdown', down, { passive: true });
    on(document, 'pointerup', up, { passive: true });
    on(document, 'pointercancel', up, { passive: true });
    on(window, 'blur', up);
  }

  // 卡片 tilt:fine pointer 限定,±4deg,spring 回正
  function tiltWire() {
    if (!fine || reduced) return;
    const bind = (el) => {
      if (el.__pqTilt) return;
      el.__pqTilt = true;
      let rid = 0;
      const move = (e) => {
        cancelAnimationFrame(rid);
        rid = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          el.style.transition = 'transform 120ms ease-out';
          el.style.transform = 'perspective(820px) rotateX(' + (-dy * 4).toFixed(2) + 'deg) rotateY(' + (dx * 4).toFixed(2) + 'deg)';
        });
      };
      const leave = () => {
        cancelAnimationFrame(rid);
        el.style.transition = 'transform 620ms cubic-bezier(.34,1.56,.64,1)';
        el.style.transform = '';
      };
      on(el, 'pointermove', move, { passive: true });
      on(el, 'pointerleave', leave, { passive: true });
    };
    const sweep = () => document.querySelectorAll('[data-tilt]').forEach(bind);
    sweep();
    setTimeout(() => { if (!destroyed) sweep(); }, 1800);
    setTimeout(() => { if (!destroyed) sweep(); }, 4500);
  }

  // spring cursor follower(不取代原生游標)
  function cursorWire() {
    if (!fine || reduced || save || lowMem) return;
    dot = document.createElement('div');
    ring = document.createElement('div');
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    dot.style.cssText = 'position:fixed;left:0;top:0;width:6px;height:6px;border-radius:50%;background:#FF6B2C;pointer-events:none;z-index:480;transform:translate(-50%,-50%);opacity:0';
    ring.style.cssText = 'position:fixed;left:0;top:0;width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(255,107,44,.55);pointer-events:none;z-index:479;transform:translate(-50%,-50%) scale(1);opacity:0;transition:opacity .25s';
    document.body.appendChild(dot); document.body.appendChild(ring);
    let tx = -100, ty = -100, dx2 = -100, dy2 = -100, rx = -100, ry = -100, scale = 1, tScale = 1, shown = false, overForm = false;
    const move = (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; dot.style.opacity = '1'; ring.style.opacity = '1'; dx2 = rx = tx; dy2 = ry = ty; }
      const t = e.target;
      overForm = !!(t && t.closest && t.closest('input,textarea,select,[contenteditable="true"]'));
      const hot = !overForm && !!(t && t.closest && t.closest('a,button,[role="tab"],summary'));
      tScale = overForm ? 0 : hot ? 1.55 : 1;
    };
    const out = () => { shown = false; dot.style.opacity = '0'; ring.style.opacity = '0'; };
    on(window, 'pointermove', move, { passive: true });
    on(document.documentElement, 'pointerleave', out);
    const tick = () => {
      if (destroyed) return;
      raf = requestAnimationFrame(tick);
      dx2 += (tx - dx2) * 0.35; dy2 += (ty - dy2) * 0.35;
      rx += (tx - rx) * 0.14; ry += (ty - ry) * 0.14;
      scale += (tScale - scale) * 0.16;
      dot.style.transform = 'translate(' + (dx2 - 3) + 'px,' + (dy2 - 3) + 'px)';
      dot.style.opacity = shown && !overForm ? '1' : '0';
      ring.style.transform = 'translate(' + (rx - 15) + 'px,' + (ry - 15) + 'px) scale(' + scale.toFixed(3) + ')';
    };
    raf = requestAnimationFrame(tick);
  }

  // 結尾 CTA pointer spotlight(低干擾,不降對比)
  function spotWire() {
    if (!fine || reduced) return;
    let tries = 0;
    const boot = () => {
      if (destroyed) return;
      const sec = document.querySelector('#demo-cta');
      const spot = sec && sec.querySelector('[data-spot]');
      if (!spot) { if (tries++ < 60) setTimeout(boot, 200); return; }
      const move = (e) => {
        const r = sec.getBoundingClientRect();
        spot.style.setProperty('--sx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        spot.style.setProperty('--sy', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      };
      on(sec, 'pointermove', move, { passive: true });
    };
    boot();
  }

  function start() {
    injectCSS();
    pressWire();
    tiltWire();
    cursorWire();
    spotWire();
  }
  function destroy() {
    destroyed = true;
    cancelAnimationFrame(raf);
    binds.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    if (dot && dot.parentNode) dot.parentNode.removeChild(dot);
    if (ring && ring.parentNode) ring.parentNode.removeChild(ring);
  }
  return { start, destroy };
}
