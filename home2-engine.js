// PeakQi 首頁第二輪場景引擎:HANDOFF / DIAGNOSTIC / LIVE OPS / RELAY / RESULT WALL
// 全部走 motion-kit context(單 rAF+scroll 備援+unmount revert);reduced=模板靜態完成態
import { createMotionContext, ScrollChapter, StickyProductStage } from './motion-kit.js';
import { ezSmooth } from './motion-config.js';

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const ez = ezSmooth;

export function createHome2() {
  const ctx = createMotionContext('home2');
  const q = (s, r) => (r || document).querySelector(s);
  const qa = (s, r) => Array.from((r || document).querySelectorAll(s));
  const pin = (wrap, stage, vh) => {
    if (ctx.reduced || ctx.mobile) return false;
    return StickyProductStage(ctx, wrap, stage, { distanceVh: vh }).pinned;
  };

  // ---------- 一、SYSTEM HANDOFF(140vh) ----------
  function handoff() {
    const wrap = q('#handoff [data-wrap]'), stage = q('#handoff [data-stage]');
    if (!wrap || !stage) return;
    const paths = qa('#handoff [data-hpath]');
    const packs = qa('#handoff [data-hpack]');
    const nums = qa('#handoff [data-hnum]');
    const note = q('#handoff [data-hnote]');
    if (ctx.reduced || ctx.mobile) { // 簡化:脈衝+淡入(CSS 預設完成態,加一點呼吸)
      packs.forEach(p2 => { p2.style.animation = ctx.reduced ? 'none' : 'pqPulse 2.4s ease-in-out infinite'; });
      return;
    }
    pin(wrap, stage, 45);
    paths.forEach(p2 => {
      const len = p2.getTotalLength ? p2.getTotalLength() : 1200;
      p2.style.strokeDasharray = String(len);
      p2.style.strokeDashoffset = String(len);
      p2.__len = len;
    });
    nums.forEach(n => { n.style.opacity = '0'; n.style.transform = 'translateY(18px)'; n.style.transition = 'none'; });
    if (note) note.style.opacity = '0';
    ScrollChapter(ctx, wrap, (p) => {
      paths.forEach((p2, i) => {
        const k = ez(sub(p, 0.05 + i * 0.06, 0.55 + i * 0.06));
        p2.style.strokeDashoffset = String(p2.__len * (1 - k));
      });
      packs.forEach((pk, i) => {
        const k = sub(p, 0.08 + i * 0.05, 0.6 + i * 0.05);
        const path = paths[i % paths.length];
        if (path && path.getPointAtLength) {
          const pt = path.getPointAtLength(path.__len * ez(k));
          pk.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
          pk.style.opacity = k > 0 && k < 1 ? '1' : '0';
        }
      });
      nums.forEach((n, i) => {
        const k = ez(sub(p, 0.42 + i * 0.08, 0.6 + i * 0.08));
        n.style.opacity = String(k);
        n.style.transform = 'translateY(' + ((1 - k) * 18).toFixed(1) + 'px)';
      });
      if (note) note.style.opacity = String(ez(sub(p, 0.72, 0.85)));
    }, { pinned: true });
  }

  // ---------- 二、CHAOS DIAGNOSTIC(200vh) ----------
  function diagnostic() {
    const wrap = q('#diagnostic [data-wrap]'), stage = q('#diagnostic [data-stage]');
    if (!wrap || !stage) return;
    const tools = qa('#diagnostic [data-dtool]');
    const meters = qa('#diagnostic [data-dmeter]');
    const counts = qa('#diagnostic [data-dcount]');
    const takeover = q('#diagnostic [data-dtake]');
    const closing = q('#diagnostic [data-dclose]');
    const scan = q('#diagnostic [data-dscan]');
    if (ctx.reduced || ctx.mobile) return; // 模板預設=接管後狀態+結語
    pin(wrap, stage, 100);
    if (takeover) takeover.style.opacity = '0';
    if (closing) { closing.style.opacity = '0'; closing.style.transform = 'translateY(16px)'; }
    ScrollChapter(ctx, wrap, (p) => {
      const mess = ez(sub(p, 0.04, 0.55));          // 混亂升高
      const take = ez(sub(p, 0.6, 0.78));            // 系統接管
      tools.forEach((el, i) => {
        const j = (i % 2 ? 1 : -1) * mess * (4 + i * 1.6) * (1 - take);
        const rot = parseFloat(el.getAttribute('data-rot') || '0');
        el.style.transform = 'translateY(' + j.toFixed(1) + 'px) rotate(' + (rot * (1 - take * 0.85)).toFixed(2) + 'deg)';
        el.style.borderColor = take > 0.5 ? 'rgba(101,224,188,.45)' : (mess > 0.5 ? 'rgba(255,107,44,.5)' : 'rgba(242,239,232,.16)');
      });
      meters.forEach((m, i) => {
        const fill = m.firstElementChild;
        const bad = ez(sub(p, 0.05 + i * 0.06, 0.5 + i * 0.06));   // 問題嚴重度上升
        if (fill) {
          if (take > 0.5) {                                        // 接管後:填滿綠(=已處理完成)
            fill.style.width = (60 + 40 * take).toFixed(0) + '%';
            fill.style.background = '#65E0BC';
          } else {                                                 // 接管前:嚴重度上升,轉橘
            fill.style.width = (8 + bad * 84).toFixed(1) + '%';
            fill.style.background = bad > 0.5 ? '#FF6B2C' : 'rgba(242,239,232,.55)';
          }
        }
        const c = counts[i];
        if (c) {
          const max = parseInt(c.getAttribute('data-max') || '7', 10);
          let s2, col;
          if (take > 0.5) { s2 = 'AI 已接手 ✓'; col = '#65E0BC'; }
          else { s2 = Math.max(1, Math.round(max * bad)) + ' ' + (c.getAttribute('data-u') || ''); col = bad > 0.5 ? '#FF6B2C' : 'rgba(242,239,232,.7)'; }
          if (c.textContent !== s2) c.textContent = s2;
          c.style.color = col;
        }
      });
      if (scan) { scan.style.opacity = String(0.5 * mess * (1 - take)); scan.style.transform = 'translateY(' + (p * 300).toFixed(0) + 'px)'; }
      if (takeover) takeover.style.opacity = String(take);
      if (closing) {
        const k = ez(sub(p, 0.82, 0.94));
        closing.style.opacity = String(k);
        closing.style.transform = 'translateY(' + ((1 - k) * 16).toFixed(1) + 'px)';
      }
    }, { pinned: true });
  }

  // ---------- 三、LIVE OPS CONSOLE(280vh) ----------
  function liveops() {
    const wrap = q('#liveops [data-wrap]'), stage = q('#liveops [data-stage]');
    if (!wrap || !stage) return;
    const panels = qa('#liveops [data-live-panel]');
    const items = qa('#liveops [data-live-item]');
    const linkLine = q('#liveops [data-live-link]');
    const modName = q('#liveops [data-live-name]');
    if (!panels.length) return;
    const setActive = (idx, animate) => {
      panels.forEach((el, i) => {
        const on = i === idx;
        if (animate) el.style.transition = 'opacity 240ms cubic-bezier(0.65,0,0.35,1), clip-path 240ms cubic-bezier(0.16,1,0.3,1)';
        el.style.opacity = on ? '1' : '0';
        el.style.clipPath = on ? 'inset(0 0 0 0)' : 'inset(0 0 12% 0)';
        el.style.pointerEvents = on ? 'auto' : 'none';
      });
      items.forEach((el, i) => {
        const on = i === idx;
        el.style.borderColor = on ? '#FF6B2C' : 'rgba(9,11,14,.16)';
        el.style.background = on ? '#090B0E' : '#F2EFE8';
        el.style.color = on ? '#F2EFE8' : '#090B0E';
        el.style.transform = on ? 'translateX(-8px)' : 'none';
        el.style.transition = 'all 240ms cubic-bezier(0.16,1,0.3,1)';
        el.setAttribute('aria-current', on ? 'true' : 'false');
      });
      if (modName) modName.textContent = items[idx] ? (items[idx].getAttribute('data-name') || '') : '';
      if (linkLine) linkLine.style.top = (12 + idx * (100 / panels.length) * 0.72).toFixed(1) + '%';
    };
    const n = panels.length;
    const isCompact = () => ctx.reduced || ctx.mobile || (window.matchMedia && window.matchMedia('(max-width:899px)').matches);
    const scrollToChapter = (idx) => {
      const vh = window.innerHeight || 1;
      const pT = 0.04 + (idx + 0.5) / n * 0.92;
      const wrapTop = wrap.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      const y = wrapTop + pT * Math.max(1, wrap.offsetHeight - vh);
      window.scrollTo({ top: Math.round(y), behavior: 'smooth' });
    };
    // 右側項目可點擊切換左側情境:桌機平滑捲到該章節、行動版直接切換
    items.forEach((it, i) => {
      it.style.cursor = 'pointer';
      it.setAttribute('role', 'button');
      it.setAttribute('tabindex', '0');
      const go = () => { if (isCompact()) setActive(i, true); else scrollToChapter(i); };
      it.addEventListener('click', go);
      it.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    if (ctx.reduced || ctx.mobile) { setActive(0, false); return; } // 行動版:單一情境 + 點按切換
    pin(wrap, stage, 180);
    let cur = -1;
    setActive(0, false);
    ScrollChapter(ctx, wrap, (p) => {
      const idx = clamp(Math.floor(sub(p, 0.04, 0.96) * panels.length), 0, panels.length - 1);
      if (idx !== cur) { cur = idx; setActive(idx, true); }
    }, { pinned: true });
  }

  // ---------- 四、DATA RELAY(220vh) ----------
  function relay() {
    const wrap = q('#relay [data-wrap]'), stage = q('#relay [data-stage]');
    if (!wrap || !stage) return;
    const sts = qa('#relay [data-rstation]');
    const fill = q('#relay [data-rfill]');
    const pack = q('#relay [data-rpack]');
    if (ctx.reduced || ctx.mobile) return; // 模板預設=全站完成
    pin(wrap, stage, 120);
    sts.forEach(st => {
      st.style.opacity = '.35';
      const chip = st.querySelector('[data-rchip]');
      if (chip) { chip.style.background = 'transparent'; chip.style.color = 'rgba(9,11,14,.4)'; chip.style.borderColor = 'rgba(9,11,14,.25)'; }
    });
    if (fill) fill.style.transform = 'scaleX(0)';
    ScrollChapter(ctx, wrap, (p) => {
      const k = ez(sub(p, 0.05, 0.92));
      if (fill) fill.style.transform = 'scaleX(' + k.toFixed(3) + ')';
      if (pack) pack.style.left = (2 + k * 96).toFixed(2) + '%';
      const n = sts.length;
      sts.forEach((st, i) => {
        const on = k >= (i + 0.5) / n - 0.5 / n;
        st.style.transition = 'opacity 240ms cubic-bezier(0.16,1,0.3,1)';
        st.style.opacity = on ? '1' : '.35';
        const chip = st.querySelector('[data-rchip]');
        if (chip && on) { chip.style.background = '#090B0E'; chip.style.color = '#65E0BC'; chip.style.borderColor = '#090B0E'; }
      });
    }, { pinned: true });
  }

  // ---------- 五、RESULT WALL(150vh) ----------
  function wall() {
    const wrap = q('#resultwall [data-wrap]'), stage = q('#resultwall [data-stage]');
    const grid = q('#resultwall [data-wgrid]');
    if (!wrap || !stage || !grid) return;
    const metas = qa('#resultwall [data-wmeta]');
    if (ctx.reduced || ctx.mobile) return; // 模板預設=完整矩陣
    pin(wrap, stage, 50);
    grid.style.willChange = 'transform';
    ScrollChapter(ctx, wrap, (p) => {
      const k = ez(sub(p, 0.02, 0.62));
      const sc = 1.55 - 0.55 * k;
      grid.style.transform = 'scale(' + sc.toFixed(3) + ') translateY(' + ((1 - k) * 6).toFixed(2) + '%)';
      metas.forEach((m, i) => {
        const kk = ez(sub(p, 0.45 + i * 0.05, 0.62 + i * 0.05));
        m.style.opacity = String(kk);
        m.style.transform = 'translateY(' + ((1 - kk) * 12).toFixed(1) + 'px)';
      });
    }, { pinned: true });
  }

  // ---------- 結尾呼應:漂浮小物視差 ----------
  function endEcho() {
    if (ctx.reduced) return;
    qa('#demo-cta [data-echo]').forEach((el, i) => {
      el.style.animation = 'pqFloat ' + (5 + i * 1.2) + 's ease-in-out infinite alternate';
    });
  }

  function start() {
    let tries = 0;
    const boot = () => {
      if (!q('#handoff') && tries++ < 90) { requestAnimationFrame(boot); return; }
      try { handoff(); diagnostic(); liveops(); relay(); wall(); endEcho(); } catch (e) {}
      window.__pqHome2 = { ok: true };
    };
    boot();
    return ctx;
  }
  return { start, destroy: () => { ctx.destroy(); if (window.__pqHome2) delete window.__pqHome2; } };
}
