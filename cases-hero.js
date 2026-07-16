// /cases PROOF IN MOTION 開場牆引擎:7 場景真實截圖編排
// DOM <img> 場景切換以 CSS transition 補間(捲動可逆);static/reduced 直接落在 index 網格。
import { createMotionContext } from './motion-kit.js';
import { BP, capabilityTier } from './motion-config.js';
import { heroConfig } from './hero-config.js';
import { HeroScene, ScrollStage } from './hero-kit.js';

export function mountCasesHero() {
  let dead = false, ctx = null, tmr = 0, bpNow = null;
  const mob = () => (window.innerWidth || 0) < BP.mobile;

  function build() {
    const root = document.querySelector('[data-hero="cases"]');
    const wall = root && root.querySelector('[data-shotwall]');
    const shots = wall ? Array.from(wall.querySelectorAll('[data-shot]')) : [];
    if (!root || !wall || shots.length < 8) return false;
    bpNow = mob();
    ctx = createMotionContext('cases-shotwall');
    const tier = capabilityTier();
    const mobile = mob();
    const cats = ['AI 系統', '客製平台', '品牌網站', '營運工具'];
    const labels = Array.from(wall.querySelectorAll('[data-catlabel]'));
    const chips = Array.from(wall.querySelectorAll('[data-featchip]'));
    const statsC = Array.from(wall.querySelectorAll('[data-statcard]'));
    const meta = shots.map((el, i) => ({ el, cat: el.getAttribute('data-cat') || cats[0], feat: el.getAttribute('data-feat') === '1' || i < 4 }));
    const band = mobile ? { y0: 50, y1: 98 } : { y0: 0, y1: 100 }; // mobile:牆佔下半帶,文字在上
    const BY = (y) => band.y0 + (band.y1 - band.y0) * y / 100;
    const N = mobile ? 8 : shots.length;

    const L = {};
    // S1 CLOSE-UP:3 張特寫溢出邊框(局部細節,不模糊)
    L.detail = meta.map((m, i) => {
      if (!m.feat || i > 2) return { o: 0, x: 50, y: BY(30), w: 30, z: 1 };
      const spots = mobile
        ? [{ x: 8, y: 2, w: 84 }, { x: 30, y: 44, w: 70 }, { x: -6, y: 72, w: 62 }]
        : [{ x: 43, y: -9, w: 50 }, { x: 68, y: 40, w: 38 }, { x: 38, y: 66, w: 33 }];
      const s2 = spots[i];
      return { o: 1, x: s2.x, y: mobile ? BY(s2.y) : s2.y, w: s2.w, z: 3 + i, dim: 0 };
    });
    // S2 THE WALL:全部截圖、三個深度帶
    L.wall = meta.map((m, i) => {
      if (i >= N) return { o: 0, x: 50, y: BY(40), w: 18, z: 1 };
      const col = i % 4, row = (i - col) / 4;
      const dep = [1, .82, .92, .72][(col + row) % 4];
      const x = (mobile ? 2 : 3) + col * (mobile ? 25 : 24.5) + (row % 2) * 2.4;
      const y = BY((mobile ? 4 : 3) + row * (mobile ? 46 : 24.5));
      return { o: .45 + .55 * dep, x, y, w: (mobile ? 22 : 17) * dep, z: Math.round(dep * 4), dim: 1 - dep };
    });
    // S3 SORTED:四類別直欄(每欄最多 4 張)
    L.sort = meta.map((m, i) => {
      const ciRaw = cats.indexOf(m.cat);
      const ci = ciRaw < 0 ? 3 : ciRaw;
      const within = meta.filter((o, j) => j < i && o.cat === m.cat).length;
      if (i >= N || within > 3) return { o: 0, x: 50, y: BY(40), w: 14, z: 1 };
      return { o: 1, x: (mobile ? 2 : 42) + ci * (mobile ? 25 : 14.6), y: BY((mobile ? 14 : 8) + within * (mobile ? 20 : 22.5)), w: mobile ? 22 : 12.8, z: 2, dim: 0 };
    });
    // S4 FOCUS:四個重點案例放大,其餘退場
    const FOC = mobile
      ? [{ x: 4, y: 6, w: 44 }, { x: 52, y: 6, w: 44 }, { x: 4, y: 52, w: 44 }, { x: 52, y: 52, w: 44 }]
      : [{ x: 42, y: 6, w: 26 }, { x: 71, y: 6, w: 26 }, { x: 42, y: 52, w: 26 }, { x: 71, y: 52, w: 26 }];
    let fi = 0;
    L.focus = meta.map((m, i) => {
      if (m.feat && fi < 4) { const f = FOC[fi++]; return { o: 1, x: f.x, y: mobile ? BY(f.y) : f.y, w: f.w, z: 6, dim: 0 }; }
      const p = L.sort[i];
      return { o: i >= N ? 0 : .1, x: p.x, y: p.y, w: p.w, z: 1, dim: .4 };
    });
    // S5 PROOF:同 FOCUS,數字卡配對顯示
    L.proof = L.focus;
    // S6 INDEX:清楚網格
    L.index = meta.map((m, i) => {
      if (i >= N) return { o: 0, x: 50, y: BY(40), w: 13, z: 1 };
      const col = i % 4, row = (i - col) / 4;
      return { o: 1, x: (mobile ? 2 : 42) + col * (mobile ? 25 : 14.4), y: BY((mobile ? 8 : 5) + row * (mobile ? 46 : 23.5)), w: mobile ? 22 : 13, z: 2, dim: 0 };
    });
    // S7 CTA:網格退為背景
    L.cta = L.index.map((p, i) => ({ o: p.o * (meta[i].feat ? .75 : .45), x: p.x, y: p.y, w: p.w, z: p.z, dim: .2 }));

    function apply(id) {
      const lay = L[id] || L.index;
      lay.forEach((p, i) => {
        const st = shots[i].style;
        st.left = p.x + '%'; st.top = p.y + '%'; st.width = p.w + '%';
        st.opacity = String(p.o);
        st.zIndex = String(p.z || 1);
        st.filter = p.dim ? 'brightness(' + (1 - .25 * p.dim).toFixed(2) + ')' : 'none';
      });
      labels.forEach(el => { el.style.opacity = id === 'sort' ? '1' : '0'; });
      chips.forEach(el => { el.style.opacity = id === 'focus' ? '1' : '0'; });
      statsC.forEach(el => { el.style.opacity = id === 'proof' ? '1' : '0'; });
      wall.setAttribute('data-scene', id);
    }

    if (tier === 'static') { // reduced-motion / Save-Data:靜態索引網格(仍是真實截圖)
      apply('index');
      window.__pqCasesHero = { mode: 'static' };
      return true;
    }
    const model = HeroScene(heroConfig.cases, mobile);
    const wrap = root.querySelector('[data-hero-wrap]');
    if (!wrap) { apply('index'); return true; }
    let cur = '';
    apply(model.included[0].id);
    ScrollStage(ctx, wrap, (p) => {
      const id = model.included[model.activeIdx(p)].id;
      if (id !== cur) { cur = id; apply(id); }
    });
    window.__pqCasesHero = { mode: 'on', shots: shots.length };
    return true;
  }

  const boot = (n) => { if (dead) return; if (!build() && n < 160) requestAnimationFrame(() => boot(n + 1)); };
  boot(0);
  const onRz = () => {
    clearTimeout(tmr);
    tmr = setTimeout(() => {
      if (dead || mob() === bpNow) return;
      if (ctx) { try { ctx.destroy(); } catch (e) {} ctx = null; }
      build();
    }, 240);
  };
  window.addEventListener('resize', onRz);
  return {
    destroy() {
      dead = true; clearTimeout(tmr);
      window.removeEventListener('resize', onRz);
      if (ctx) { try { ctx.destroy(); } catch (e) {} ctx = null; }
      if (window.__pqCasesHero) delete window.__pqCasesHero;
    }
  };
}
