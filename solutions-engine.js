// /solutions 長篇產品敘事引擎:overview 收攏、capture 對話、follow pipeline、nurture 圖層、modules 聚焦
import { createMotionContext, ScrollChapter, StickyProductStage } from './motion-kit.js';
import { ezSmooth } from './motion-config.js';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const ez = ezSmooth;

export function createSolutions() {
  const ctx = createMotionContext('solutions');
  const q = (s, r) => (r || document).querySelector(s);
  const qa = (s, r) => Array.from((r || document).querySelectorAll(s));
  const pin = (id, vh) => {
    const wrap = q('#' + id + ' [data-wrap]'), stage = q('#' + id + ' [data-stage]');
    if (!wrap || !stage || ctx.reduced || ctx.mobile) return null;
    StickyProductStage(ctx, wrap, stage, { distanceVh: vh });
    return wrap;
  };

  function overview() {
    const wrap = pin('overview', 40);
    const layers = qa('#overview [data-slayer]');
    if (!wrap || !layers.length) return;
    ScrollChapter(ctx, wrap, (p) => {
      const k = ez(sub(p, 0.08, 0.7));
      layers.forEach((el, i) => {
        const ox = [(-120), 0, 120][i], oy = [-46, 10, 60][i], rot = [-5, 2, 6][i];
        el.style.transform = 'translate(' + (ox * (1 - k)).toFixed(1) + 'px,' + (oy * (1 - k) + i * 14 * k).toFixed(1) + 'px) rotate(' + (rot * (1 - k)).toFixed(2) + 'deg)';
        el.style.borderColor = k > 0.85 ? 'rgba(255,107,44,.55)' : 'rgba(242,239,232,.22)';
      });
    }, { pinned: true });
  }

  function capture() {
    const wrap = pin('capture', 200);
    const root = q('#capture');
    if (!root) return;
    const crm = qa('#capture [data-ccrm]');
    const upd = (p) => {
      const msgs = qa('#capture [data-cmsg]'); // 情境切換會換節點,每次現查
      msgs.forEach((m, i) => {
        const k = ez(sub(p, 0.1 + i * 0.13, 0.24 + i * 0.13));
        m.style.opacity = String(0.06 + 0.94 * k);
        m.style.transform = 'translateY(' + ((1 - k) * 14).toFixed(1) + 'px)';
      });
      crm.forEach((c, i) => {
        const k = ez(sub(p, 0.55 + i * 0.09, 0.7 + i * 0.09));
        c.style.opacity = String(0.15 + 0.85 * k);
        c.style.transform = 'translateX(' + ((1 - k) * 16).toFixed(1) + 'px)';
      });
    };
    if (!wrap) { return; } // mobile/reduced:模板即完成態
    ScrollChapter(ctx, wrap, upd, { pinned: true });
  }

  function follow() {
    const wrap = pin('follow', 200);
    const card = q('#follow [data-fcard]');
    const cols = qa('#follow [data-fcol]');
    if (!wrap || !card || !cols.length) return;
    const track = q('#follow [data-ftrack]');
    ScrollChapter(ctx, wrap, (p) => {
      const k = ez(sub(p, 0.08, 0.85));
      const idx = clamp(Math.floor(k * cols.length), 0, cols.length - 1);
      const tw = track ? track.clientWidth : 1;
      const colW = tw / cols.length;
      card.style.transform = 'translateX(' + (k * (tw - colW) ).toFixed(1) + 'px)';
      cols.forEach((c, i) => {
        const on = i === idx;
        c.style.borderColor = on ? '#FF6B2C' : 'rgba(9,11,14,.14)';
        c.style.background = on ? 'rgba(255,107,44,.05)' : 'rgba(9,11,14,.02)';
      });
      const tag = card.querySelector('[data-ftag]');
      if (tag) {
        const labels = ['DAY 1・提醒已擬', 'DAY 3・補上案例', 'DAY 5・限時優惠', 'DAY 7・最後關心'];
        if (tag.textContent !== labels[idx]) tag.textContent = labels[idx];
      }
    }, { pinned: true });
  }

  function nurture() {
    const wrap = pin('nurture', 190);
    const planes = qa('#nurture [data-nplane]');
    if (!wrap || !planes.length) return;
    ScrollChapter(ctx, wrap, (p) => {
      planes.forEach((el, i) => {
        const k = ez(sub(p, 0.06 + i * 0.12, 0.3 + i * 0.12));
        el.style.opacity = String(0.12 + 0.88 * k);
        el.style.transform = 'translateY(' + ((1 - k) * 34).toFixed(1) + 'px) scale(' + (0.96 + 0.04 * k).toFixed(3) + ')';
      });
      const line = q('#nurture [data-nline]');
      if (line) line.style.transform = 'scaleX(' + ez(sub(p, 0.42, 0.8)).toFixed(3) + ')';
    }, { pinned: true });
  }

  function modules() {
    const wrap = pin('modules', 260);
    const rows = qa('#modules [data-smod]');
    const dets = qa('#modules [data-sdet]');
    const core = q('#modules [data-score]');
    if (!rows.length) return;
    const setActive = (idx, anim) => {
      rows.forEach((el, i) => {
        const on = i === idx;
        el.style.transition = anim ? 'all 240ms cubic-bezier(0.16,1,0.3,1)' : 'none';
        el.style.borderColor = on ? '#FF6B2C' : 'rgba(9,11,14,.16)';
        el.style.background = on ? '#090B0E' : '#F2EFE8';
        el.style.color = on ? '#F2EFE8' : '#090B0E';
        el.setAttribute('aria-current', on ? 'true' : 'false');
      });
      dets.forEach((el, i) => {
        const on = i === idx;
        if (anim) el.style.transition = 'opacity 240ms cubic-bezier(0.65,0,0.35,1), clip-path 240ms cubic-bezier(0.16,1,0.3,1)';
        el.style.opacity = on ? '1' : '0';
        el.style.clipPath = on ? 'inset(0 0 0 0)' : 'inset(0 0 14% 0)';
        el.style.pointerEvents = on ? 'auto' : 'none';
      });
    };
    // hover/focus 查看細節(桌機),與捲動共用 setActive
    rows.forEach((el, i) => {
      const h = () => setActive(i, true);
      el.addEventListener('mouseenter', h);
      el.addEventListener('focus', h);
      ctx.add(() => { el.removeEventListener('mouseenter', h); el.removeEventListener('focus', h); });
    });
    if (!wrap) { setActive(0, false); return; }
    let cur = -1;
    setActive(0, false);
    ScrollChapter(ctx, wrap, (p) => {
      if (core) core.style.transform = 'translateY(' + ((0.5 - p) * 16).toFixed(1) + 'px)';
      const idx = clamp(Math.floor(sub(p, 0.04, 0.96) * rows.length), 0, rows.length - 1);
      if (idx !== cur) { cur = idx; setActive(idx, true); }
    }, { pinned: true });
  }

  function integration() { // 結尾系統合併:三層 chips + 六模組收進控制台(pinned 可逆;mobile/reduced 走 IO 一次進場)
    const sec = q('#integration');
    if (!sec) return;
    const chips = qa('#integration [data-ichip]');
    const box = q('#integration [data-ibox]');
    const cta = q('#integration [data-cta]');
    const wrap = pin('integration', 140);
    if (wrap) {
      ScrollChapter(ctx, wrap, (p) => {
        chips.forEach((c, i) => {
          const kk = ez(sub(p, 0.03 + i * 0.04, 0.18 + i * 0.04));
          c.style.opacity = String(0.12 + 0.88 * kk);
          c.style.transform = 'translateY(' + ((1 - kk) * 18).toFixed(1) + 'px)';
          c.style.background = p > 0.6 ? 'rgba(255,107,44,.1)' : 'transparent';
        });
        if (box) {
          const kk = ez(sub(p, 0.3, 0.6));
          box.style.opacity = String(0.08 + 0.92 * kk);
          box.style.transform = 'translateY(' + ((1 - kk) * 34).toFixed(1) + 'px) scale(' + (0.965 + 0.035 * kk).toFixed(3) + ')';
        }
        if (cta) {
          const kk = ez(sub(p, 0.68, 0.9));
          cta.style.boxShadow = '0 12px 32px rgba(255,107,44,' + (kk * 0.32).toFixed(2) + ')';
          cta.style.transform = 'translateY(' + (-2 * kk).toFixed(1) + 'px)';
        }
      }, { pinned: true });
      return;
    }
    if (ctx.reduced) return; // 靜態即完成態
    chips.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(12px)'; });
    if (box) { box.style.opacity = '0'; box.style.transform = 'translateY(20px) scale(.97)'; }
    let done = false;
    ctx.io(sec, es => {
      if (done || !(es[0] && es[0].isIntersecting)) return;
      done = true;
      chips.forEach((c, i) => {
        c.style.transition = 'all 320ms cubic-bezier(0.16,1,0.3,1) ' + (i * 60) + 'ms';
        c.style.opacity = '1'; c.style.transform = 'none';
      });
      if (box) {
        box.style.transition = 'all 620ms cubic-bezier(0.16,1,0.3,1) 420ms';
        box.style.opacity = '1'; box.style.transform = 'none';
      }
    }, { threshold: 0.35 });
  }

  function start() {
    let tries = 0;
    const boot = () => {
      if (!q('#overview') && tries++ < 90) { requestAnimationFrame(boot); return; }
      try { overview(); capture(); follow(); nurture(); modules(); integration(); } catch (e) {}
      window.__pqSol = { ok: true };
    };
    boot();
    return ctx;
  }
  return { start, destroy: () => { ctx.destroy(); if (window.__pqSol) delete window.__pqSol; } };
}
