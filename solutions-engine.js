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
    const wrap = pin('capture', 260);
    const root = q('#capture');
    if (!root) return;
    // 母動畫:往下捲切換情境 Tab(僅負責切 Tab,不碰訊息)
    let curTab = -1;
    const switchByScroll = (p) => {
      const tabs = qa('#capture [role="tab"]');   // 切換會重建節點,每幀現查
      const n = Math.max(1, tabs.length);
      const idx = clamp(Math.floor(p * n), 0, n - 1);
      if (idx !== curTab) { curTab = idx; if (tabs[idx]) tabs[idx].click(); }
    };
    // 子動畫:對話自動播放並循環(以時間驅動,永遠可見;切 Tab 時從頭播)
    let playT0 = -1, lastActive = -2;
    const autoplay = (now) => {
      const tabs = qa('#capture [role="tab"]');
      const active = tabs.findIndex(b => b.getAttribute('aria-selected') === 'true');
      if (active !== lastActive || playT0 < 0) { lastActive = active; playT0 = now; }
      const msgs = qa('#capture [data-cmsg]');
      const crm = qa('#capture [data-ccrm]');
      if (!msgs.length) return;
      const step = 0.85, hold = 2.8, fade = 0.55;
      const total = msgs.length * step + hold + fade;
      const tt = ((now - playT0) / 1000) % total;
      const outK = ez(clamp((tt - (total - fade)) / fade, 0, 1));  // 週期末一起淡出 → 重播
      msgs.forEach((m, i) => {
        const inK = ez(clamp((tt - i * step) / 0.42, 0, 1));
        const vis = inK * (1 - outK);
        m.style.opacity = (0.04 + 0.96 * vis).toFixed(3);
        m.style.transform = 'translateY(' + ((1 - inK) * 14).toFixed(1) + 'px)';
      });
      crm.forEach((c, i) => {
        const inK = ez(clamp((tt - (msgs.length * step * 0.45 + i * 0.4)) / 0.5, 0, 1));
        c.style.opacity = (0.14 + 0.86 * inK * (1 - outK)).toFixed(3);
        c.style.transform = 'translateX(' + ((1 - inK) * 16).toFixed(1) + 'px)';
      });
    };
    if (ctx.reduced) { // 減量動態:全部直接顯示,不播放
      qa('#capture [data-cmsg]').forEach(m => { m.style.opacity = '1'; m.style.transform = 'none'; });
      qa('#capture [data-ccrm]').forEach(c => { c.style.opacity = '1'; c.style.transform = 'none'; });
      return;
    }
    if (wrap) ScrollChapter(ctx, wrap, switchByScroll, { pinned: true }); // 手機無 pin:Tab 用點擊
    ctx.onFrame(autoplay);
  }

  function follow() {
    const wrap = pin('follow', 200);
    const sec = q('#follow');
    const card = q('#follow [data-fcard]');
    const cols = qa('#follow [data-fcol]');
    // 手機沒有 pin(pin 在 mobile 回 null)→ 原本整段直接 return,王小姐完全不動。
    // 改用 section 本身當進度來源(未釘選),直式分支以「視窗中的那一塊」決定停點。
    if ((!wrap && !ctx.mobile) || !card || !cols.length) return;
    const track = q('#follow [data-ftrack]');
    ScrollChapter(ctx, wrap || sec, (p) => {
      const k = ez(sub(p, 0.08, 0.85));
      const idx = clamp(Math.floor(k * cols.length), 0, cols.length - 1);
      // 卡片一次「滑到定點」,不隨捲動連續位移 —— 連續位移會有卡在兩張中間、把兩邊都擋住的時刻。
      // 手機是直式時間軸:停哪一張改由「目前在視窗中的那張」決定,所以整段捲動王小姐都在畫面上。
      const vertical = cols.length > 1 && cols[1].offsetTop > cols[0].offsetTop + 4;
      if (!card.style.transition) card.style.transition = 'transform .42s cubic-bezier(.16,1,.3,1)';
      let snap = idx;
      if (vertical) {
        const mid = (window.innerHeight || 800) * 0.42;
        let bd = Infinity;
        cols.forEach((c, i) => {
          const d = Math.abs(c.getBoundingClientRect().top + 40 - mid);
          if (d < bd) { bd = d; snap = i; }
        });
        card.style.transform = 'translateY(' + cols[snap].offsetTop + 'px)';
      } else {
        card.style.transform = 'translateX(' + cols[snap].offsetLeft + 'px)';
      }
      idx = snap;
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
    }, { pinned: !!wrap });
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
    const sec = q('#modules');
    const rows = qa('#modules [data-smod]');
    const dets = qa('#modules [data-sdet]');
    const core = q('#modules [data-score]');
    if (!rows.length) return;
    // 手機:桌機的「按鈕 → 右側面板切換」在手機看不到面板,切換無感。
    // 把每張細節卡搬到自己那一列底下變手風琴;捲動導覽照樣逐列開合。
    const mob = ctx.mobile;
    if (mob) rows.forEach((el, i) => {
      const d = dets[i];
      if (d) { el.insertAdjacentElement('afterend', d); d.classList.add('pq-sdet-m'); }
    });
    const setActive = (idx, anim) => {
      rows.forEach((el, i) => {
        const on = i === idx;
        el.style.transition = anim ? 'all 240ms cubic-bezier(0.16,1,0.3,1)' : 'none';
        el.style.borderColor = on ? '#FF6B2C' : 'rgba(9,11,14,.16)';
        el.style.background = on ? '#090B0E' : '#F2EFE8';
        el.style.color = on ? '#F2EFE8' : '#090B0E';
        el.setAttribute('aria-current', on ? 'true' : 'false');
        if (mob) el.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
      dets.forEach((el, i) => {
        const on = i === idx;
        if (mob) { el.classList.toggle('is-open', on); return; }   // 手風琴:CSS 控顯示
        if (anim) el.style.transition = 'opacity 240ms cubic-bezier(0.65,0,0.35,1), clip-path 240ms cubic-bezier(0.16,1,0.3,1)';
        el.style.opacity = on ? '1' : '0';
        el.style.clipPath = on ? 'inset(0 0 0 0)' : 'inset(0 0 14% 0)';
        el.style.pointerEvents = on ? 'auto' : 'none';
      });
    };
    // hover/focus(桌機)+ 點擊(手機手風琴),與捲動共用 setActive
    rows.forEach((el, i) => {
      const h = () => setActive(i, true);
      el.addEventListener('mouseenter', h);
      el.addEventListener('focus', h);
      el.addEventListener('click', h);
      ctx.add(() => { el.removeEventListener('mouseenter', h); el.removeEventListener('focus', h); el.removeEventListener('click', h); });
    });
    let cur = -1;
    setActive(0, false);
    if (!wrap && !mob) return;   // 桌機沒 pin(reduced)維持靜態第一項
    ScrollChapter(ctx, wrap || sec, (p) => {
      if (core) core.style.transform = 'translateY(' + ((0.5 - p) * 16).toFixed(1) + 'px)';
      const idx = clamp(Math.floor(sub(p, 0.04, 0.96) * rows.length), 0, rows.length - 1);
      if (idx !== cur) { cur = idx; setActive(idx, true); }
    }, { pinned: !!wrap });
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
