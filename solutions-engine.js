// /solutions 長篇產品敘事引擎:overview 收攏、capture 對話、follow pipeline、nurture 圖層、modules 聚焦
import { createMotionContext, ScrollChapter, StickyProductStage } from './motion-kit.js';
import { ezSmooth } from './motion-config.js';
import { t } from './i18n.js';
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
    // 釘住時舞台被鎖成一屏高,比視窗高的部分永遠捲不到(量到左欄對話被裁 232px)。
    // 先套上 data-capfit 把網格鎖進剩餘空間,再實測兩欄有沒有被切;
    // 真的裝不下就整段取消釘住,回到一般捲動 —— 寧可少一段視差,也不要有讀不到的內容。
    let pinned = !!wrap;
    if (wrap) {
      root.setAttribute('data-capfit', '');
      const grid = q('#pq-cap-grid');
      const clipped = () => !!grid && Array.from(grid.children).some((c) => c.scrollHeight - c.clientHeight > 24);
      let checks = 0;
      const verify = () => {
        if (checks++ > 30) return;
        if (!grid || !grid.clientHeight) { requestAnimationFrame(verify); return; }
        if (!clipped()) return;                       // 裝得下 → 維持釘住
        root.removeAttribute('data-capfit');
        wrap.style.height = '';
        ['position', 'top', 'minHeight', 'boxSizing'].forEach((k) => { stageEl && (stageEl.style[k] = ''); });
        pinned = false;
        ScrollChapter(ctx, root, switchByScroll, { pinned: false });
      };
      var stageEl = q('#capture [data-stage]');
      requestAnimationFrame(() => requestAnimationFrame(verify));
    }
    if (wrap) ScrollChapter(ctx, wrap, (p) => { if (pinned) switchByScroll(p); }, { pinned: true }); // 手機無 pin:Tab 用點擊
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
    ScrollChapter(ctx, wrap || sec, (p) => {
      // #capture 捲動切 Tab 會 setState,DC 會把所有 sc-for 區塊的節點整批重建。
      // 初始化時抓的參照會變成孤兒節點(樣式寫進去也看不到),所以這裡每幀現查。
      const card = q('#follow [data-fcard]');
      const cols = qa('#follow [data-fcol]');
      if (!card || !cols.length) return;
      const k = ez(sub(p, 0.08, 0.85));
      let idx = clamp(Math.floor(k * cols.length), 0, cols.length - 1);
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
        // #follow 是深色區:未選中要用亮色低透明邊框,寫成淺色版的值會讓邊框整個消失
        c.style.borderColor = on ? '#FF6B2C' : 'rgba(242,239,232,.14)';
        c.style.background = on ? 'rgba(255,107,44,.08)' : '#14171C';
      });
      const tag = card.querySelector('[data-ftag]');
      if (tag) {
        const labels = [t('DAY 1・提醒已擬', 'DAY 1 · Reminder ready'), t('DAY 3・補上案例', 'DAY 3 · Case added'), t('DAY 5・限時優惠', 'DAY 5 · Limited offer'), t('DAY 7・最後關心', 'DAY 7 · Final check-in')];
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
    // 手機(使用者定案):不做切換也不做手風琴 —— 捲動開合會一直跳版面很難往下滑。
    // 直接把六張「會動的細節卡」全部靜態排在清單後面;上面那六列變成純展示、不可互動。
    const mob = ctx.mobile;
    if (mob) {
      const shell = q('#pq-sol-detshell');
      const listBox = rows[0].parentElement;
      if (shell && shell.parentElement) {
        dets.forEach((d) => { d.classList.add('pq-sdet-m', 'is-open'); shell.parentElement.insertBefore(d, shell); });
      }
      if (listBox) listBox.style.pointerEvents = 'none';
      rows.forEach((el) => el.setAttribute('aria-hidden', 'false'));
      return;   // 不掛 hover/click/捲動,細節卡的子動畫由 CSS 自己跑
    }
    // 同樣的理由(setState 會重建 sc-for 節點):這裡每次都現查,不留參照
    const setActive = (idx, anim) => {
      const rows = qa('#modules [data-smod]');
      const dets = qa('#modules [data-sdet]');
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
    // hover/focus/點擊都走事件委派:掛在個別列上的監聽器會隨著 sc-for 重建一起消失,
    // 這也是「點擊切換突然沒反應、而且 console 乾乾淨淨」的原因。委派到 section 就不會掉。
    // cur = 目前顯示的那一張;scrollIdx = 捲動位置換算出來的那一張。
    // 兩者要分開:只在「捲動換算值真的變了」時才接管,否則使用者一點選,
    // 下一幀就會因為 idx !== cur 被捲動邏輯搶回去(看起來就是點了沒反應)。
    let cur = -1, scrollIdx = -1;
    const hit = (e) => {
      const row = e.target.closest && e.target.closest('[data-smod]');
      if (!row || !sec.contains(row)) return;
      const i = qa('#modules [data-smod]').indexOf(row);
      if (i < 0 || i === cur) return;
      cur = i;
      setActive(i, true);
    };
    ['mouseover', 'focusin', 'click'].forEach((ev) => {
      sec.addEventListener(ev, hit);
      ctx.add(() => sec.removeEventListener(ev, hit));
    });
    setActive(0, false);
    if (!wrap) return;   // 桌機沒 pin(reduced)維持靜態第一項
    ScrollChapter(ctx, wrap, (p) => {
      if (core) core.style.transform = 'translateY(' + ((0.5 - p) * 16).toFixed(1) + 'px)';
      const n = qa('#modules [data-smod]').length || rows.length;
      const idx = clamp(Math.floor(sub(p, 0.04, 0.96) * n), 0, n - 1);
      if (idx === scrollIdx) return;          // 捲動沒換段 → 不碰使用者手動選的那一張
      scrollIdx = idx;
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
    // 等的是「引擎真正需要的節點」,不是只等 #overview。
    // #overview 是靜態 markup,一開始就在;但 [data-fcol]、[data-smod] 由 sc-for 產生,
    // 要等 content.js 載入並 setState 後才存在。只等 #overview 會搶跑,
    // follow() 與 modules() 就在 guard 那行靜默 return —— 卡片不滑、點擊沒反應,而且 console 乾淨。
    const ready = () => q('#overview') && q('#follow [data-fcol]') && q('#modules [data-smod]');
    const boot = () => {
      if (!ready() && tries++ < 240) { requestAnimationFrame(boot); return; }
      // 六段各自 try/catch:包在同一個 try 裡的話,前面任何一段丟例外,
      // 後面全部靜默不執行(modules 的點擊切換就是這樣整段消失,而且 console 乾乾淨淨)。
      const report = { mobile: ctx.mobile, reduced: ctx.reduced, vw: window.innerWidth };
      [['overview', overview], ['capture', capture], ['follow', follow],
        ['nurture', nurture], ['modules', modules], ['integration', integration]
      ].forEach(([name, fn]) => {
        try { fn(); report[name] = 'ok'; }
        catch (e) {
          report[name] = 'ERR: ' + (e && (e.message || e));
          console.error('[solutions] ' + name + ' 初始化失敗:', e && (e.stack || e.message || e));
        }
      });
      window.__pqSol = { ok: true, report };
    };
    boot();
    return ctx;
  }
  return { start, destroy: () => { ctx.destroy(); if (window.__pqSol) delete window.__pqSol; } };
}
