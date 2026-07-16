// /pricing 與 /about 動態引擎:方案機架、模組切換、sticky 比較高亮、雙管線、複雜度圖、時間軸、品牌節點、產業矩陣、方法流、作品帶
import { createMotionContext, ScrollChapter, StickyProductStage } from './motion-kit.js';
import { ezSmooth } from './motion-config.js';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const ez = ezSmooth;

function makeCtxTools(ctx) {
  const q = (s, r) => (r || document).querySelector(s);
  const qa = (s, r) => Array.from((r || document).querySelectorAll(s));
  const pin = (id, vh) => {
    const wrap = q('#' + id + ' [data-wrap]'), stage = q('#' + id + ' [data-stage]');
    if (!wrap || !stage || ctx.reduced || ctx.mobile) return null;
    StickyProductStage(ctx, wrap, stage, { distanceVh: vh });
    return wrap;
  };
  return { q, qa, pin };
}

// ---------------- PRICING ----------------
export function createPricingFX() {
  const ctx = createMotionContext('pricing');
  const { q, qa, pin } = makeCtxTools(ctx);

  function rackIntro() { // 三方案機架進場(價格不延遲:模板即完整)
    const racks = qa('#p-hero [data-rack]');
    if (!racks.length || ctx.reduced) return;
    racks.forEach((el, i) => { el.style.opacity = '0'; el.style.transform = 'translateY(26px)'; });
    let done = false;
    ctx.io(q('#p-hero'), es => {
      if (done || !(es[0] && es[0].isIntersecting)) return;
      done = true;
      racks.forEach((el, i) => {
        el.style.transition = 'all 480ms cubic-bezier(0.16,1,0.3,1) ' + (i * 90) + 'ms';
        el.style.opacity = '1'; el.style.transform = 'none';
      });
    }, { threshold: 0.3 });
  }

  function selector() { // 固定控制台+捲動切換 A/B/C(邏輯層 tabs 另供鍵盤/觸控)
    const wrap = pin('p-selector', 240);
    if (!wrap) return;
    let cur = -1;
    ScrollChapter(ctx, wrap, (p) => {
      const idx = clamp(Math.floor(sub(p, 0.05, 0.95) * 3), 0, 2);
      if (idx === cur) return;
      cur = idx;
      const btns = qa('#p-selector [role="tab"]');
      if (btns[idx]) btns[idx].click(); // 與鍵盤/觸控共用同一 setState 路徑
    }, { pinned: true });
  }

  function compareHi() { // sticky 比較:pinned 逐列高亮(mobile/reduced 退回非 pinned/靜態)
    const sec = q('#p-compare');
    const rows = qa('#p-compare [data-crow]');
    if (!sec || !rows.length || ctx.reduced) return;
    const wrap = pin('p-compare', 190);
    ScrollChapter(ctx, wrap || sec, (p) => {
      const idx = clamp(Math.floor(sub(p, wrap ? 0.04 : 0.25, wrap ? 0.94 : 0.75) * rows.length), 0, rows.length - 1);
      rows.forEach((r, i) => {
        const on = i === idx;
        r.style.transition = 'background 240ms cubic-bezier(0.16,1,0.3,1), box-shadow 240ms cubic-bezier(0.16,1,0.3,1)';
        r.style.background = on ? 'rgba(255,107,44,.07)' : 'transparent';
        r.style.boxShadow = on && wrap ? 'inset 3px 0 0 #FF6B2C' : 'none';
      });
    }, { pinned: !!wrap });
  }

  function pipes() { // Included / Usage-based 雙資料管線(pinned)
    const sec = q('#p-usage');
    if (!sec) return;
    const l1 = q('[data-pipe="in"]', sec), l2 = q('[data-pipe="use"]', sec);
    const dots = qa('[data-pdotm]', sec);
    if (ctx.reduced) return; // 模板=完成態
    const wrap = pin('p-usage', 150);
    if (l1) l1.style.transform = 'scaleX(0)';
    if (l2) l2.style.transform = 'scaleX(0)';
    ScrollChapter(ctx, wrap || sec, (p) => {
      const k1 = ez(sub(p, wrap ? 0.08 : 0.18, 0.5)), k2 = ez(sub(p, wrap ? 0.3 : 0.28, wrap ? 0.78 : 0.6));
      if (l1) l1.style.transform = 'scaleX(' + k1.toFixed(3) + ')';
      if (l2) l2.style.transform = 'scaleX(' + k2.toFixed(3) + ')';
      dots.forEach((d, i) => {
        const k = i === 0 ? k1 : k2;
        d.style.left = (4 + k * 90) + '%';
        d.style.opacity = k > 0.02 && k < 0.99 ? '1' : '0';
      });
    }, { pinned: !!wrap });
  }

  function usageTips() { // tooltip:focus / hover / touch
    const btns = qa('#p-usage [data-utip]');
    if (!btns.length) return;
    let tip = document.getElementById('pq-utip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'pq-utip';
      tip.setAttribute('role', 'tooltip');
      tip.style.cssText = 'position:fixed;z-index:620;max-width:260px;background:#090B0E;color:#F2EFE8;border:1px solid rgba(255,107,44,.5);border-radius:6px;padding:10px 13px;font:400 12.5px/1.6 "Noto Sans TC",sans-serif;box-shadow:0 14px 34px rgba(9,11,14,.3);opacity:0;pointer-events:none;transition:opacity 160ms ease';
      document.body.appendChild(tip);
    }
    let curBtn = null;
    const show = (btn) => {
      curBtn = btn;
      tip.textContent = btn.getAttribute('data-utip') || '';
      const r = btn.getBoundingClientRect();
      tip.style.left = Math.min(Math.max(8, r.left), (window.innerWidth || 0) - 270) + 'px';
      tip.style.top = (r.bottom + 8) + 'px';
      tip.style.opacity = '1';
      btn.setAttribute('aria-describedby', 'pq-utip');
    };
    const hide = () => { tip.style.opacity = '0'; if (curBtn) curBtn.removeAttribute('aria-describedby'); curBtn = null; };
    btns.forEach(btn => {
      const enter = () => show(btn);
      const click = (ev) => { ev.preventDefault(); if (curBtn === btn && tip.style.opacity === '1') hide(); else show(btn); };
      btn.addEventListener('mouseenter', enter);
      btn.addEventListener('mouseleave', hide);
      btn.addEventListener('focus', enter);
      btn.addEventListener('blur', hide);
      btn.addEventListener('click', click);
      ctx.add(() => { btn.removeEventListener('mouseenter', enter); btn.removeEventListener('mouseleave', hide); btn.removeEventListener('focus', enter); btn.removeEventListener('blur', hide); btn.removeEventListener('click', click); });
    });
    ctx.add(() => { hide(); if (tip.parentNode) tip.parentNode.removeChild(tip); });
  }

  function complexity() { // 客製 complexity map:pinned 四級距逐級點亮
    const sec = q('#p-custom');
    const nodes = qa('#p-custom [data-cnode]');
    if (!sec || !nodes.length || ctx.reduced) return;
    const wrap = pin('p-custom', 170);
    ScrollChapter(ctx, wrap || sec, (p) => {
      const k = ez(sub(p, wrap ? 0.06 : 0.2, wrap ? 0.8 : 0.6));
      nodes.forEach((n, i) => {
        const on = k >= (i + 1) / (nodes.length + 0.5);
        n.style.transition = 'all 300ms cubic-bezier(0.16,1,0.3,1)';
        n.style.borderColor = on ? '#FF6B2C' : 'rgba(242,239,232,.22)';
        n.style.transform = on ? 'scale(1.03)' : 'scale(1)';
      });
    }, { pinned: !!wrap });
  }

  function timeline() { // DAY0–10:pinned 資料線同步(mobile 垂直、reduced 靜態)
    const sec = q('#p-timeline');
    const line = sec && sec.querySelector('[data-tline]');
    const dots = qa('[data-dot]', sec);
    const cont = q('#pq-tl2');
    if (!line || !cont || ctx.reduced) return;
    const wrap = pin('p-timeline', 170);
    line.style.transform = 'scaleX(0)';
    dots.forEach(d => { d.style.background = 'rgba(9,11,14,.25)'; });
    ScrollChapter(ctx, wrap || sec, (p) => {
      const k = ez(sub(p, wrap ? 0.06 : 0.22, wrap ? 0.8 : 0.62));
      const vertical = getComputedStyle(cont).flexDirection === 'column';
      line.style.transformOrigin = vertical ? 'top center' : 'left center';
      line.style.transform = vertical ? 'scaleY(' + k.toFixed(3) + ')' : 'scaleX(' + k.toFixed(3) + ')';
      dots.forEach((d, i) => {
        const on = k >= i / Math.max(1, dots.length - 1) - 0.02;
        d.style.background = on ? (i === dots.length - 1 ? '#65E0BC' : '#FF6B2C') : 'rgba(9,11,14,.25)';
      });
    }, { pinned: !!wrap });
  }

  return {
    start() {
      let tries = 0;
      const boot = () => {
        if (!q('#p-hero') && tries++ < 90) { requestAnimationFrame(boot); return; }
        try { rackIntro(); selector(); compareHi(); pipes(); usageTips(); complexity(); timeline(); } catch (e) {}
        window.__pqPricing = { ok: true };
      };
      boot();
      return ctx;
    },
    destroy: () => { ctx.destroy(); if (window.__pqPricing) delete window.__pqPricing; }
  };
}

// ---------------- ABOUT ----------------
export function createAboutFX() {
  const ctx = createMotionContext('about');
  const { q, qa, pin } = makeCtxTools(ctx);

  function brand() { // 品牌節點連線開場
    const sec = q('#a-hero');
    const paths = qa('#a-hero [data-bpath]');
    const nodes = qa('#a-hero [data-bnode]');
    if (!sec || ctx.reduced) return;
    paths.forEach(p2 => {
      const len = p2.getTotalLength ? p2.getTotalLength() : 400;
      p2.style.strokeDasharray = String(len);
      p2.style.strokeDashoffset = String(len);
      p2.__len = len;
    });
    nodes.forEach(n => { n.style.opacity = '0'; });
    ScrollChapter(ctx, sec, (p) => {
      const k = ez(sub(p, 0.08, 0.5));
      paths.forEach((p2, i) => {
        const kk = ez(sub(k, i * 0.12, 0.6 + i * 0.12));
        p2.style.strokeDashoffset = String(p2.__len * (1 - kk));
      });
      nodes.forEach((n, i) => { n.style.opacity = String(ez(sub(k, 0.15 + i * 0.1, 0.4 + i * 0.1))); });
    });
  }

  function numbers() { // Editorial 大數字 count-up 一次
    if (ctx.reduced) return;
    const els = qa('#a-numbers [data-count]');
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
        const pre = final.slice(0, m.index), post = final.slice(m.index + m[1].length);
        const t0 = performance.now();
        const step = (now) => {
          const k = ez(clamp((now - t0) / 800, 0, 1));
          el.textContent = pre + Math.round(target * k) + post;
          if (k < 1) requestAnimationFrame(step); else el.textContent = final;
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    els.forEach(el => io.observe(el));
    ctx.add(() => io.disconnect());
  }

  function method() { // 方法工作台:pinned 六站資料流 + console 即時說明
    const sec = q('#a-method');
    const fill = sec && sec.querySelector('[data-mfill]');
    const steps = qa('#a-method [data-mstep]');
    const conTx = q('#a-method [data-mconsole-text]');
    if (!sec || !steps.length || ctx.reduced) return;
    const wrap = pin('a-method', 200);
    if (fill) fill.style.transform = 'scaleX(0)';
    steps.forEach(s => { s.style.opacity = '.4'; });
    let cur = -1;
    ScrollChapter(ctx, wrap || sec, (p) => {
      const k = ez(sub(p, wrap ? 0.05 : 0.18, wrap ? 0.85 : 0.66));
      if (fill) fill.style.transform = 'scaleX(' + k.toFixed(3) + ')';
      const idx = clamp(Math.floor(k * steps.length), 0, steps.length - 1);
      steps.forEach((s, i) => {
        const on = i <= idx;
        s.style.transition = 'opacity 260ms cubic-bezier(0.16,1,0.3,1), border-color 260ms cubic-bezier(0.16,1,0.3,1)';
        s.style.opacity = on ? '1' : '.4';
        s.style.borderColor = i === idx ? '#FF6B2C' : 'rgba(9,11,14,.14)';
      });
      if (conTx && idx !== cur) {
        cur = idx;
        const t2 = steps[idx].querySelector('span:nth-child(2)');
        const d2 = steps[idx].querySelector('span:nth-child(3)');
        conTx.textContent = 'STEP 0' + (idx + 1) + ' — ' + (t2 ? t2.textContent : '') + ':' + (d2 ? d2.textContent : '');
      }
    }, { pinned: !!wrap });
  }

  function strip() { // 作品帶:pinned scroll 控速平移(reduced:CSS 靜態網格)
    const sec = q('#a-strip');
    const track = sec && sec.querySelector('[data-strack]');
    if (!sec || !track || ctx.reduced) return;
    const wrap = pin('a-strip', 170);
    track.style.willChange = 'transform';
    ScrollChapter(ctx, wrap || sec, (p) => {
      const max = Math.max(0, track.scrollWidth - (sec.clientWidth || 1));
      track.style.transform = 'translateX(' + (-p * max * 0.9).toFixed(1) + 'px)';
    }, { pinned: !!wrap });
  }

  function spectrum() { // 能力光譜:逐列點亮
    const rows = qa('#a-spectrum [data-spec]');
    if (!rows.length || ctx.reduced) return;
    const sec = q('#a-spectrum');
    ScrollChapter(ctx, sec, (p) => {
      const idx = clamp(Math.floor(sub(p, 0.15, 0.8) * rows.length), 0, rows.length - 1);
      rows.forEach((r, i) => {
        r.style.background = i === idx ? 'rgba(255,107,44,.06)' : 'transparent';
        r.style.boxShadow = i === idx ? 'inset 3px 0 0 #FF6B2C' : 'none';
      });
    });
  }

  return {
    start() {
      let tries = 0;
      const boot = () => {
        if (!q('#a-hero') && tries++ < 90) { requestAnimationFrame(boot); return; }
        try { brand(); numbers(); method(); strip(); spectrum(); } catch (e) {}
        window.__pqAbout = { ok: true };
      };
      boot();
      return ctx;
    },
    destroy: () => { ctx.destroy(); if (window.__pqAbout) delete window.__pqAbout; }
  };
}
