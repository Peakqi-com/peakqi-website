// PeakQi 首頁進階互動:案例 reveal/count-up、作品展廊、比較 sweep、時間軸資料線
export function createInteractions({ refs }) {
  const ORANGE = '#FF6B2C', GREEN = '#65E0BC';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const ez = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  let destroyed = false, reduced = false, mobile = false, raf = 0, vh = 1, lastTick = 0, resizeTmr = 0, lastErr = null;
  const ios = [];
  const vis = { gal: true, tl: true, cases: true };
  let gal = null, tl = null, caseFx = null;

  // ---------- 成果數字 count-up(一次性) ----------
  function countUp(el) {
    const final = el.textContent;
    const m = final.match(/(\d[\d,]*)/);
    if (!m) return;
    const target = parseInt(m[1].replace(/,/g, ''), 10);
    if (!isFinite(target) || target <= 0) return;
    const pre = final.slice(0, m.index), post = final.slice(m.index + m[1].length);
    const t0 = performance.now(), dur = 700;
    const step = (now) => {
      if (destroyed) { el.textContent = final; return; }
      const k = ez(clamp((now - t0) / dur, 0, 1));
      el.textContent = pre + Math.round(target * k) + post;
      if (k < 1) requestAnimationFrame(step); else el.textContent = final;
    };
    requestAnimationFrame(step);
  }
  function setupCounts() {
    if (reduced) return;
    const els = Array.from(document.querySelectorAll('#cases [data-count]'));
    if (!els.length || !('IntersectionObserver' in window)) return;
    const done = new WeakSet();
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting && !done.has(e.target)) { done.add(e.target); countUp(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
    ios.push(io);
  }

  // ---------- 案例圖 mask reveal + 輕視差 ----------
  function setupCases() {
    const boxes = Array.from(document.querySelectorAll('#cases [data-caseimg]'));
    if (!boxes.length || reduced) return;
    caseFx = { items: boxes.map(box => ({ box, bg: box.firstElementChild, on: false })) };
    caseFx.items.forEach(it => {
      it.box.style.clipPath = 'inset(0 100% 0 0)';
      if (it.bg) it.bg.style.transform = 'scale(1.07) translateY(6px)';
    });
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        const it = caseFx && caseFx.items.find(i => i.box === e.target);
        if (it && e.isIntersecting && !it.on) {
          it.on = true;
          it.box.style.transition = 'clip-path 700ms cubic-bezier(0.16,1,0.3,1)';
          it.box.style.clipPath = 'inset(0 0 0 0)';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    caseFx.items.forEach(it => io.observe(it.box));
    ios.push(io);
  }
  function caseUpdate() {
    if (!caseFx) return;
    caseFx.items.forEach(it => {
      if (!it.on || !it.bg) return;
      const r = it.box.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40) return;
      const c = (r.top + r.height / 2) / vh - 0.5;
      it.bg.style.transform = 'scale(1.05) translateY(' + (-c * 14).toFixed(1) + 'px)';
    });
  }

  // ---------- 作品水平展廊 ----------
  function setupGallery() {
    const wrap = refs.galWrap, stage = refs.galStage, scroller = refs.galScroller, track = refs.galTrack;
    if (!wrap || !scroller || !track) return;
    gal = { wrap, stage, scroller, track, simple: true, extra: 0, top: 72, loaded: false };
    const io = new IntersectionObserver(es => {
      if (es[0] && es[0].isIntersecting) { loadImgs(); io.disconnect(); }
    }, { rootMargin: '600px' });
    io.observe(wrap); ios.push(io);
    const key = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); galNav(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); galNav(-1); }
    };
    scroller.addEventListener('keydown', key);
    gal.key = key;
    if (reduced || mobile) return; // 原生橫向 snap(模板預設)
    galMeasure();
  }
  function loadImgs() {
    if (!gal || gal.loaded) return;
    gal.loaded = true;
    gal.wrap.querySelectorAll('[data-bg]').forEach(el => {
      const src = el.getAttribute('data-bg');
      if (!src) return;
      const im = new Image();
      im.onload = () => { el.style.backgroundImage = 'url("' + src + '")'; el.style.opacity = '1'; };
      im.src = src;
    });
  }
  function galMeasure() {
    if (!gal) return;
    const { wrap, stage, scroller, track } = gal;
    const extra = Math.max(0, track.scrollWidth - scroller.clientWidth);
    if (extra < 60) { galReset(); return; }
    gal.simple = false;
    gal.extra = extra;
    scroller.style.overflowX = 'hidden';
    scroller.style.scrollSnapType = 'none';
    const sh = stage.offsetHeight;
    gal.top = Math.max(76, Math.round((vh - sh) / 2));
    stage.style.position = 'sticky';
    stage.style.top = gal.top + 'px';
    wrap.style.height = (sh + extra) + 'px';
    track.style.willChange = 'transform';
  }
  function galReset() {
    if (!gal) return;
    gal.simple = true; gal.extra = 0;
    gal.scroller.style.overflowX = 'auto';
    gal.scroller.style.scrollSnapType = 'x proximity';
    gal.stage.style.position = '';
    gal.stage.style.top = '';
    gal.wrap.style.height = '';
    gal.track.style.transform = '';
    gal.track.style.willChange = '';
  }
  function galUpdate() {
    if (!gal || gal.simple) return;
    const r = gal.wrap.getBoundingClientRect();
    const p = clamp((gal.top - r.top) / gal.extra, 0, 1);
    gal.track.style.transform = 'translateX(' + (-p * gal.extra).toFixed(1) + 'px)';
  }
  function galNav(dir) {
    if (!gal) return;
    const step = 314;
    if (gal.simple) gal.scroller.scrollBy({ left: dir * step, behavior: 'smooth' });
    else window.scrollBy({ top: dir * step, behavior: 'smooth' });
  }

  // ---------- 比較 light sweep(一次) ----------
  function setupSweep() {
    const el = document.querySelector('#compare [data-sweeper]');
    if (!el || reduced) return;
    const io = new IntersectionObserver(es => {
      if (es[0] && es[0].isIntersecting) {
        el.style.animation = 'pqSweep 900ms cubic-bezier(0.65,0,0.35,1) 250ms 1 both';
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el.parentElement || el); ios.push(io);
  }

  // ---------- 10 天時間軸資料線 ----------
  function setupTimeline() {
    const sec = document.querySelector('#timeline');
    if (!sec) return;
    const line = sec.querySelector('[data-tline]');
    const cont = document.getElementById('pq-tl');
    const dots = Array.from(sec.querySelectorAll('[data-dot]'));
    if (!line || !cont) return;
    if (reduced) return; // 模板預設 = 完成線
    tl = { sec, line, cont, dots, n: dots.length };
    line.style.transform = 'scaleX(0)';
    dots.forEach(d => { d.style.background = 'rgba(242,239,232,.25)'; });
  }
  function tlUpdate() {
    if (!tl) return;
    const r = tl.sec.getBoundingClientRect();
    const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    const k = ez(sub(p, 0.22, 0.62));
    const vertical = getComputedStyle(tl.cont).flexDirection === 'column';
    tl.line.style.transformOrigin = vertical ? 'top center' : 'left center';
    tl.line.style.transform = vertical ? 'scaleY(' + k.toFixed(3) + ')' : 'scaleX(' + k.toFixed(3) + ')';
    tl.dots.forEach((d, i) => {
      const on = k >= (i / Math.max(1, tl.n - 1)) - 0.02;
      const want = on ? (i === tl.n - 1 ? GREEN : ORANGE) : 'rgba(242,239,232,.25)';
      if (d.style.background !== want) d.style.background = want;
    });
  }

  // ---------- 迴圈 + scroll 備援 ----------
  function runUpdates() {
    try {
      if (gal && vis.gal) galUpdate();
      if (tl && vis.tl) tlUpdate();
      if (caseFx && vis.cases) caseUpdate();
    } catch (e) { lastErr = String(e && e.message || e); }
  }
  function loop() {
    if (destroyed) return;
    raf = requestAnimationFrame(loop);
    lastTick = performance.now();
    runUpdates();
  }
  const onScroll = () => {
    if (destroyed || reduced) return;
    if (performance.now() - lastTick > 200) runUpdates();
  };
  const onResize = () => {
    clearTimeout(resizeTmr);
    resizeTmr = setTimeout(() => {
      if (destroyed) return;
      vh = window.innerHeight || 1;
      const m2 = (window.innerWidth || 1200) < 900;
      if (gal && !reduced) {
        if (m2) galReset();
        else galMeasure();
      }
      mobile = m2;
    }, 150);
  };

  function start() {
    vh = window.innerHeight || 1;
    mobile = (window.innerWidth || 1200) < 900;
    reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let tries = 0;
    const boot = () => {
      if (destroyed) return;
      const ready = refs.galTrack && document.querySelector('#timeline');
      if (!ready && tries++ < 90) { raf = requestAnimationFrame(boot); return; }
      setupCounts(); setupCases(); setupGallery(); setupSweep(); setupTimeline();
      [['gal', refs.galWrap], ['tl', document.querySelector('#timeline')], ['cases', document.querySelector('#cases')]].forEach(([k, el]) => {
        if (!el || !('IntersectionObserver' in window)) return;
        const io = new IntersectionObserver(es => { vis[k] = es[0] ? es[0].isIntersecting : true; }, { rootMargin: '200px' });
        io.observe(el); ios.push(io);
      });
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onScroll, { passive: true });
      if (!reduced) raf = requestAnimationFrame(loop);
      window.__pqInteractions = {
        galNav,
        state: () => ({ reduced, mobile, gal: gal ? { simple: gal.simple, extra: gal.extra, loaded: gal.loaded } : null, tl: !!tl, caseN: caseFx ? caseFx.items.length : 0, err: lastErr })
      };
    };
    boot();
  }
  function destroy() {
    destroyed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    if (gal && gal.key) gal.scroller.removeEventListener('keydown', gal.key);
    ios.forEach(io => io.disconnect());
    if (window.__pqInteractions) delete window.__pqInteractions;
  }
  return { start, destroy, galNav };
}
