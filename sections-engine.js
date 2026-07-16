// PeakQi 首頁四區塊動畫引擎:痛點/損失/三層敘事/功能軌道(共用 motion tokens、IO 暫停、reduced 降級)
export function createSectionsEngine({ refs }) {
  const ORANGE = '#FF6B2C', GREEN = '#65E0BC';
  const TOK = { fast: 160, base: 320, slow: 700, out: 'cubic-bezier(0.16,1,0.3,1)', inout: 'cubic-bezier(0.65,0,0.35,1)' };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const ez = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  let destroyed = false, reduced = false, mobile = false, raf = 0, vh = 1, resizeTmr = 0;
  const vis = { pain: true, loss: true, flow: true };
  const ios = [];
  let pain = null, loss = null, flow = null, orbit = null;
  let lastPain = -1, lastLoss = -1, lastFlow = -1;
  let lagFired = 0, noiseAt = 0, prevFlowP = 0, nPain = 0, nLoss = 0, nFlow = 0, nLoop = 0, lastErr = null;

  function q(root, sel) { return root ? Array.from(root.querySelectorAll(sel)) : []; }
  function q1(root, sel) { return root ? root.querySelector(sel) : null; }

  // ---------- 痛點 ----------
  function setupPain() {
    const root = refs.pain;
    if (!root) return;
    pain = {
      root,
      wins: q(root, '[data-win]').map(el => ({ el, dep: parseFloat(el.getAttribute('data-dep') || '1') })),
      badge: q1(root, '[data-badge]'),
      brk: q1(root, '[data-break]'),
      gap: q1(root, '[data-gap]'),
      leaks: q(root, '[data-leak]'),
      cursor: q1(root, '[data-cursor]'),
      ba: q1(root, '[data-ba]')
    };
    if (pain.cursor) pain.cursor.style.transition = 'transform ' + TOK.base + 'ms ' + TOK.out;
    if (reduced) {
      pain.wins.forEach(w => { w.el.style.transform = 'none'; });
      if (pain.badge) pain.badge.textContent = '5';
      if (pain.brk) pain.brk.style.opacity = '1';
      if (pain.gap) pain.gap.style.transform = 'scaleX(1.6)';
      pain.leaks.forEach((el, i) => { el.style.opacity = '1'; el.style.transform = 'translateY(' + (36 + i * 16) + 'px)'; });
      if (pain.cursor) pain.cursor.style.display = 'none';
      if (pain.ba) pain.ba.style.display = 'flex';
      pain = null; // 靜態,不再更新
    }
  }
  function painUpdate(p) {
    if (!pain) return;
    if (Math.abs(p - lastPain) < 0.002) return;
    const dir = p - lastPain;
    lastPain = p;
    const small = pain.root.clientWidth < 520;
    pain.wins.forEach((w, i) => {
      if (small && i > 2) { w.el.style.display = 'none'; return; }
      w.el.style.display = '';
      const ty = (w.dep - 1) * (p - 0.5) * 130;
      w.el.style.transform = 'translateY(' + ty.toFixed(1) + 'px) rotate(' + (w.el.getAttribute('data-rot') || 0) + 'deg)';
    });
    if (pain.badge) {
      const n = 1 + Math.floor(ez(sub(p, 0.08, 0.6)) * 5);
      if (pain.badge.textContent !== String(n)) pain.badge.textContent = String(n);
    }
    if (pain.brk) pain.brk.style.opacity = ez(sub(p, 0.32, 0.48)).toFixed(2);
    if (pain.gap) pain.gap.style.transform = 'scaleX(' + (0.4 + 1.3 * ez(sub(p, 0.15, 0.75))).toFixed(3) + ')';
    pain.leaks.forEach((el, i) => {
      const t = ez(sub(p, 0.24 + i * 0.1, 0.5 + i * 0.1));
      el.style.opacity = (t > 0 ? 0.4 + 0.6 * t : 0).toFixed(2);
      el.style.transform = 'translate(' + (t * (18 + i * 8)).toFixed(1) + 'px,' + (t * (58 + i * 20)).toFixed(1) + 'px)';
    });
    if (pain.cursor && !small) {
      const order = [0, 1, 2, 4, 2];
      const idx = p < 0.18 ? 0 : p < 0.4 ? 1 : p < 0.6 ? 2 : p < 0.82 ? 3 : 4;
      const w = pain.wins[order[idx]];
      if (w && pain.cursorIdx !== idx) {
        pain.cursorIdx = idx;
        const rr = pain.root.getBoundingClientRect(), wr = w.el.getBoundingClientRect();
        pain.cursor.style.transform = 'translate(' + (wr.left - rr.left + wr.width * 0.62) + 'px,' + (wr.top - rr.top + wr.height * 0.7) + 'px)';
      }
      if (p > 0.86 && dir > 0 && performance.now() - lagFired > 1200) {
        lagFired = performance.now();
        pain.cursor.style.animation = 'pqJitter .28s steps(3) 2';
        const w2 = pain.wins[2] && pain.wins[2].el;
        if (w2) w2.style.animation = 'pqJitter .3s steps(3) 2';
        setTimeout(() => { if (pain) { pain.cursor.style.animation = ''; if (w2) w2.style.animation = ''; } }, 700);
      }
    }
  }

  // ---------- 損失 ----------
  function setupLoss() {
    const wrap = refs.lossWrap, stage = refs.lossStage;
    if (!wrap || !stage) return;
    loss = {
      wrap, stage,
      vals: q(wrap, '[data-lossv]').map(el => ({ el, t: parseInt(el.getAttribute('data-t') || '0', 10) })),
      gap: q1(wrap, '[data-lgap]'),
      drops: q(wrap, '[data-drop]'),
      pinned: false
    };
    if (reduced) { loss = null; return; } // 模板預設即最終數字
  }
  function lossUpdate(p) {
    if (!loss) return;
    if (Math.abs(p - lastLoss) < 0.0015) return;
    lastLoss = p;
    loss.vals.forEach((v, i) => {
      const isTotal = i === loss.vals.length - 1;
      const k = isTotal ? ez(sub(p, 0.42, 0.66)) : ez(sub(p, 0.1 + i * 0.08, 0.3 + i * 0.08));
      const n = Math.round(v.t * k);
      const s = String(n);
      if (v.el.textContent !== s) v.el.textContent = s;
    });
    if (loss.gap) loss.gap.style.transform = 'scaleX(' + (0.2 + 0.8 * ez(sub(p, 0.14, 0.55))).toFixed(3) + ') rotate(-1.5deg)';
    loss.drops.forEach((el, i) => {
      const t = ez(sub(p, 0.2 + i * 0.07, 0.44 + i * 0.07));
      el.style.opacity = (t > 0 ? 0.35 + 0.65 * t : 0).toFixed(2);
      el.style.transform = 'translateY(' + (t * (40 + i * 12)).toFixed(1) + 'px)';
    });
  }

  // ---------- 三層敘事 ----------
  function setupFlow() {
    const wrap = refs.flowWrap, stage = refs.flowStage;
    if (!wrap || !stage) return;
    flow = {
      wrap, stage,
      deck: q1(wrap, '[data-deck]'),
      layers: [0, 1, 2].map(i => q1(wrap, '[data-layer="' + i + '"]')),
      merged: q1(wrap, '[data-layer="m"]'),
      mergedCap: q1(wrap, '[data-mcap]'),
      rails: q(wrap, '[data-rail]'),
      noise: q1(wrap, '[data-noise]'),
      pinned: false
    };
    if (reduced || mobile || vh < 640) { flow = null; return; } // 模板預設:垂直堆疊+合併卡
    flow.pinned = true;
    wrap.style.height = '265vh';
    stage.style.position = 'sticky';
    stage.style.top = '0';
    stage.style.height = '100vh';
    stage.style.padding = '0 clamp(20px,5vw,48px)';
    stage.style.display = 'flex';
    stage.style.flexDirection = 'column';
    stage.style.justifyContent = 'center';
    stage.style.boxSizing = 'border-box';
    stage.style.overflow = 'hidden';
    if (flow.deck) {
      flow.deck.style.position = 'relative';
      flow.deck.style.height = Math.max(340, vh - 330) + 'px';
      flow.deck.style.display = 'block';
    }
    flow.layers.concat([flow.merged]).forEach(el => {
      if (!el) return;
      el.style.position = 'absolute';
      el.style.left = '50%'; el.style.top = '50%';
      el.style.width = 'min(760px, 96%)';
      el.style.margin = '0';
      el.style.willChange = 'transform,opacity';
    });
    if (flow.mergedCap) flow.mergedCap.style.display = 'none';
    // 保險:內容若仍裝不下就退回堆疊模式
    requestAnimationFrame(() => {
      if (!flow || destroyed) return;
      if (stage.scrollHeight > vh + 12) unpinFlow();
    });
  }
  function unpinFlow() {
    if (!flow) return;
    const { wrap, stage, deck, mergedCap } = flow;
    wrap.style.height = '';
    ['position', 'top', 'height', 'padding', 'display', 'flexDirection', 'justifyContent', 'boxSizing', 'overflow'].forEach(k => { stage.style[k] = ''; });
    if (deck) { deck.style.position = 'relative'; deck.style.height = ''; deck.style.display = ''; }
    flow.layers.concat([flow.merged]).forEach(el => {
      if (!el) return;
      ['position', 'left', 'top', 'width', 'margin', 'willChange', 'opacity', 'transform', 'zIndex', 'pointerEvents'].forEach(k => { el.style[k] = ''; });
    });
    if (mergedCap) mergedCap.style.display = '';
    flow.rails.forEach(el => { el.style.color = ''; const d2 = el.firstElementChild; if (d2) d2.style.background = ''; });
    flow = null;
  }
  function flowLayerState(p, i) {
    const spans = [[0.02, 0.28], [0.3, 0.54], [0.56, 0.78]];
    const [s, e] = spans[i];
    const off = [[-26, -22], [0, 0], [26, 22]][i];
    const fold = ez(sub(p, 0.8, 0.9));
    if (fold > 0) {
      return { op: 0.9 * (1 - ez(sub(p, 0.88, 0.94))), sc: lerp(1, 0.46, fold), x: lerp(off[0], 0, fold), y: lerp(off[1], 0, fold), z: 10 + i };
    }
    if (p < s) { const en = ez(sub(p, s - 0.09, s)); return { op: 0.08 + 0.1 * en, sc: 0.95, x: off[0], y: off[1] + 58, z: 3 - i }; }
    if (p <= e) { const k = ez(sub(p, s, s + 0.06)); return { op: lerp(0.2, 1, k), sc: lerp(0.96, 1, k), x: lerp(off[0], 0, k), y: lerp(off[1] + 40, 0, k), z: 10 };
    }
    const out = ez(sub(p, e, e + 0.08));
    return { op: 1 - out, sc: 1 + 0.06 * out, x: 0, y: -44 * out, z: 5 };
  }
  function flowUpdate(p) {
    if (!flow) return;
    if (Math.abs(p - lastFlow) < 0.0015) return;
    const dir = p - prevFlowP; prevFlowP = p;
    lastFlow = p;
    flow.layers.forEach((el, i) => {
      if (!el) return;
      const st = flowLayerState(p, i);
      el.style.opacity = st.op.toFixed(3);
      el.style.zIndex = String(st.z);
      el.style.transform = 'translate(calc(-50% + ' + st.x.toFixed(1) + 'px), calc(-50% + ' + st.y.toFixed(1) + 'px)) scale(' + st.sc.toFixed(3) + ')';
      el.style.pointerEvents = st.op > 0.8 ? 'auto' : 'none';
    });
    if (flow.merged) {
      const k = ez(sub(p, 0.87, 0.96));
      flow.merged.style.opacity = k.toFixed(3);
      flow.merged.style.zIndex = '20';
      flow.merged.style.transform = 'translate(-50%, -50%) scale(' + lerp(0.6, 1, k).toFixed(3) + ')';
      flow.merged.style.pointerEvents = k > 0.7 ? 'auto' : 'none';
    }
    flow.rails.forEach((el, i) => {
      const act = p > 0.8 ? true : (p >= [0.02, 0.3, 0.56][i] && p <= [0.28, 0.54, 0.78][i]);
      el.style.color = act ? '#090B0E' : 'rgba(9,11,14,.4)';
      const dot = el.firstElementChild;
      if (dot) dot.style.background = p > 0.8 ? GREEN : act ? ORANGE : 'rgba(9,11,14,.25)';
    });
    if (flow.noise && Math.abs(dir) > 0 && ((prevFlowP - dir) < 0.85) !== (prevFlowP < 0.85)) {
      const now = performance.now();
      if (now - noiseAt > 500) {
        noiseAt = now;
        flow.noise.style.transition = 'none';
        flow.noise.style.opacity = '0.4';
        requestAnimationFrame(() => {
          if (flow && flow.noise) {
            flow.noise.style.transition = 'opacity 240ms ' + TOK.inout;
            flow.noise.style.opacity = '0';
          }
        });
      }
    }
  }

  // ---------- 功能軌道:核心 pointer depth ----------
  function setupOrbit() {
    const box = refs.orbitBox, core = refs.orbitCore;
    if (!box || !core || reduced) return;
    core.style.transition = 'transform ' + TOK.base + 'ms ' + TOK.out;
    const move = (e) => {
      if (mobile) return;
      const r = box.getBoundingClientRect();
      const dx = clamp((e.clientX - r.left - r.width / 2) / r.width, -0.5, 0.5);
      const dy = clamp((e.clientY - r.top - r.height / 2) / r.height, -0.5, 0.5);
      core.style.transform = 'translate(calc(-50% + ' + (dx * 14).toFixed(1) + 'px), calc(-50% + ' + (dy * 12).toFixed(1) + 'px))';
    };
    const leave = () => { core.style.transform = 'translate(-50%, -50%)'; };
    box.addEventListener('mousemove', move);
    box.addEventListener('mouseleave', leave);
    orbit = { box, core, move, leave };
  }

  // ---------- progress 計算 ----------
  function traverseP(el) {
    const r = el.getBoundingClientRect();
    return clamp((vh - r.top) / (vh + r.height), 0, 1);
  }
  function pinP(wrap) {
    const r = wrap.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, wrap.offsetHeight - vh), 0, 1);
  }
  function runUpdates() {
    try {
      if (pain && vis.pain) { nPain++; painUpdate(traverseP(pain.root)); }
      if (loss && vis.loss) { nLoss++; lossUpdate(loss.pinned ? pinP(loss.wrap) : traverseP(loss.wrap)); }
      if (flow && vis.flow) { nFlow++; flowUpdate(flow.pinned ? pinP(flow.wrap) : traverseP(flow.wrap)); }
    } catch (e) { lastErr = String(e && e.message || e); }
  }
  let lastTick = 0;
  function loop() {
    if (destroyed) return;
    raf = requestAnimationFrame(loop);
    nLoop++;
    lastTick = performance.now();
    runUpdates();
  }
  const onScroll = () => {
    if (destroyed || reduced) return;
    if (performance.now() - lastTick > 200) runUpdates(); // rAF 停擺時的備援驅動
  };

  const onResize = () => {
    clearTimeout(resizeTmr);
    resizeTmr = setTimeout(() => {
      if (destroyed) return;
      vh = window.innerHeight || 1;
      if (pain) pain.cursorIdx = -1;
      lastPain = lastLoss = lastFlow = -1;
    }, 140);
  };

  function start() {
    vh = window.innerHeight || 1;
    mobile = (window.innerWidth || 1200) < 900;
    reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let tries = 0;
    const boot = () => {
      if (destroyed) return;
      if (!refs.pain && !refs.lossWrap && !refs.flowWrap && tries++ < 90) { raf = requestAnimationFrame(boot); return; }
      setupPain(); setupLoss(); setupFlow(); setupOrbit();
      [['pain', refs.pain], ['loss', refs.lossWrap], ['flow', refs.flowWrap]].forEach(([k, el]) => {
        if (!el || !('IntersectionObserver' in window)) return;
        const io = new IntersectionObserver(es => { vis[k] = es[0] ? es[0].isIntersecting : true; }, { rootMargin: '160px' });
        io.observe(el); ios.push(io);
      });
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onScroll, { passive: true });
      if (!reduced) raf = requestAnimationFrame(loop);
      window.__pqSections = {
        pain: v => painUpdate(v), loss: v => lossUpdate(v), flow: v => flowUpdate(v),
        kick: () => { raf = requestAnimationFrame(loop); },
        state: () => ({ mobile, reduced, hasPain: !!pain, hasLoss: !!loss, lossPinned: loss && loss.pinned, hasFlow: !!flow, flowPinned: flow && flow.pinned, vis: { ...vis }, nLoop, nPain, nLoss, nFlow, lastFlow, lastLoss, err: lastErr })
      };
    };
    boot();
  }
  function destroy() {
    destroyed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    ios.forEach(io => io.disconnect());
    if (orbit) { orbit.box.removeEventListener('mousemove', orbit.move); orbit.box.removeEventListener('mouseleave', orbit.leave); }
    if (window.__pqSections) delete window.__pqSections;
  }
  return { start, destroy };
}
