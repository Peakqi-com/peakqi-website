// /about BUILT FROM REAL WORKFLOWS 開場引擎:7 場景真實截圖節點網路
// 節點為 <a>(featured 進 Case 詳細、其餘進 Cases 索引);僅 NET/CORE(與 static)可點,其餘場景 tabindex=-1。
import { createMotionContext } from './motion-kit.js';
import { BP, capabilityTier } from './motion-config.js';
import { heroConfig } from './hero-config.js';
import { HeroScene, ScrollStage } from './hero-kit.js';

export function mountAboutHero() {
  let dead = false, ctx = null, tmr = 0, bpNow = null;
  const mob = () => (window.innerWidth || 0) < BP.mobile;

  function build() {
    const root = document.querySelector('[data-hero="about"]');
    const wall = root && root.querySelector('[data-ashotwall]');
    const nodes = wall ? Array.from(wall.querySelectorAll('[data-shot]')) : [];
    if (!root || !wall || nodes.length < 8) return false;
    bpNow = mob();
    ctx = createMotionContext('about-shotnet');
    const tier = capabilityTier();
    const mobile = mob();
    const svg = wall.querySelector('[data-alines]');
    const clusts = Array.from(wall.querySelectorAll('[data-aclust]'));
    const core = wall.querySelector('[data-acore]');
    const N = mobile ? 8 : nodes.length;
    const band = mobile ? { y0: 4, y1: 96 } : { y0: 0, y1: 100 }; // mobile:鋪滿整面牆;垂直讓位交給頁面 CSS 牆帶,避免雙重壓帶
    const BY = (y) => band.y0 + (band.y1 - band.y0) * y / 100;
    const CX = mobile ? 50 : 69, CYr = BY(46);

    // 手機分層鐵律:牆永遠從文案實際底部以下開始,不與文字/CTA 交錯(收合時跟著上移)
    let syncTmr = 0;
    function syncWallBand() {
      if (!mobile) return;
      const stage = root.querySelector('[data-hero-stage]');
      const copy = root.querySelector('[data-hero-copy]');
      if (!stage || !copy) return;
      const st = stage.getBoundingClientRect();
      const cb = copy.getBoundingClientRect().bottom - st.top;
      const top = Math.max(st.height * .28, Math.min(cb + 12, st.height - 150));
      wall.style.top = top + 'px';
      wall.style.height = Math.max(150, st.height - top - 6) + 'px';
    }
    if (mobile) {
      syncWallBand();
      const copyColEl = root.querySelector('.pq-clp') && root.querySelector('.pq-clp').parentElement;
      try {
        const mo = new MutationObserver(() => {
          clearTimeout(syncTmr);
          syncTmr = setTimeout(syncWallBand, 60);
          setTimeout(syncWallBand, 300);
          setTimeout(syncWallBand, 520);
        });
        if (copyColEl) mo.observe(copyColEl, { attributes: true, attributeFilter: ['class'] });
        ctx.add(() => { try { mo.disconnect(); } catch (e2) {} clearTimeout(syncTmr); });
      } catch (e2) {}
      setTimeout(syncWallBand, 400);
      setTimeout(syncWallBand, 1200);
    }
    const L = {};
    // S1 FRAGMENTS:5 片細小局部
    const fragPos = mobile
      ? [{ x: 4, y: 4, w: 44 }, { x: 52, y: 0, w: 44 }, { x: 4, y: 50, w: 44 }, { x: 52, y: 46, w: 44 }]
      : [{ x: 58, y: -5, w: 16 }, { x: 84, y: 16, w: 12 }, { x: 55, y: 36, w: 11 }, { x: 76, y: 58, w: 14 }, { x: 51, y: 78, w: 12 }];
    L.frag = nodes.map((n, i) => i < fragPos.length
      ? { o: 1, x: fragPos[i].x, y: mobile ? BY(fragPos[i].y) : fragPos[i].y, w: fragPos[i].w, z: 3, dim: 0 }
      : { o: 0, x: 60, y: BY(40), w: 12, z: 1, dim: 0 }); // 手機:2x2 秩序網格帶微錯位,不散亂
    // S2 CONNECTED:沿資料線的鏈
    L.link = nodes.map((n, i) => {
      if (i >= N) return { o: 0, x: 60, y: BY(40), w: 11, z: 1 };
      if (mobile) { // 手機:2x4 整齊鏈(連線走 Z 字),不擠成一團
        const col = i % 4, row = (i - col) / 4;
        return { o: 1, x: 2 + col * 24.5, y: BY(10 + row * 46), w: 23, z: 3, dim: 0 };
      }
      const t = i / Math.max(1, N - 1);
      const x = 42 + t * 50;
      const y = BY(12 + Math.sin(t * Math.PI) * 52 + (i % 2) * 8);
      return { o: 1, x, y, w: 10.5, z: 3, dim: 0 };
    });
    // S3 BY INDUSTRY:四群
    const quad = mobile
      ? [{ x: 3, y: 6 }, { x: 53, y: 6 }, { x: 3, y: 54 }, { x: 53, y: 54 }]
      : [{ x: 43, y: 6 }, { x: 72, y: 6 }, { x: 43, y: 54 }, { x: 72, y: 54 }];
    L.group = nodes.map((n, i) => {
      const clu = parseInt(n.getAttribute('data-clu') || '0', 10) % 4;
      const within = nodes.filter((o, j) => j < i && (parseInt(o.getAttribute('data-clu') || '0', 10) % 4) === clu).length;
      if (i >= N || within > 2) return { o: 0, x: quad[clu].x, y: BY(quad[clu].y), w: 10, z: 1 };
      const col = within % 2, row = (within - col) / 2;
      return { o: 1, x: quad[clu].x + col * (mobile ? 23.5 : 12.6), y: BY(quad[clu].y + 4 + row * (mobile ? 22 : 20)), w: mobile ? 22 : 11.5, z: 3, dim: 0 };
    });
    // S4/S5:退為底(canvas 前景畫導入流程與 DAY 0–10)
    L.pipe = L.group.map(p => ({ o: p.o * .14, x: p.x, y: p.y, w: p.w, z: 1, dim: .5 }));
    L.days = L.pipe;
    // S6 THE NETWORK:環狀網,節點可點
    L.net = nodes.map((n, i) => {
      if (i >= N) return { o: 0, x: CX, y: CYr, w: 10, z: 1 };
      const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
      const rx = mobile ? 34 : 24, ry2 = mobile ? 36 : 40;
      return { o: 1, x: CX + Math.cos(ang) * rx - (mobile ? 10 : 5), y: BY(46 + Math.sin(ang) * ry2 / (band.y1 - band.y0) * 100 * (mobile ? .5 : 1)) - 4, w: mobile ? 20 : 10, z: 4, dim: 0 };
    });
    // S7 THE CORE:收束
    L.core = nodes.map((p, i) => ({ o: i < N ? .2 : 0, x: CX - 4, y: CYr - 3, w: 8, z: 1, dim: .4 }));

    const centerOf = (p) => ({ x: p.x + p.w / 2, y: p.y + (mobile ? 5 : 4) });
    function lines(id) {
      if (!svg) return;
      let html = '';
      const mk = (a, b, c2, w2) => {
        const A = centerOf(a), B = centerOf(b);
        return '<line x1="' + A.x + '" y1="' + A.y + '" x2="' + B.x + '" y2="' + B.y + '" stroke="' + c2 + '" stroke-width="' + (w2 || 1) + '" vector-effect="non-scaling-stroke"></line>';
      };
      const lay = L[id];
      if (id === 'link') for (let i = 1; i < N; i++) html += mk(lay[i - 1], lay[i], 'rgba(255,107,44,.5)', 1.2);
      if (id === 'net') {
        for (let i = 0; i < N; i++) html += mk(lay[i], lay[(i + 1) % N], 'rgba(242,239,232,.28)', 1);
        for (let i = 0; i < N; i += 2) html += mk(lay[i], { x: CX - 4, y: CYr - 3, w: 8 }, 'rgba(62,155,255,.3)', 1);
      }
      if (id === 'core') for (let i = 0; i < N; i += 2) html += mk(lay[i], { x: CX - 4, y: CYr - 3, w: 8 }, 'rgba(255,107,44,.45)', 1.2);
      svg.innerHTML = html;
      svg.style.opacity = html ? '1' : '0';
    }

    function apply(id) {
      const lay = L[id] || L.net;
      const clickable = id === 'net';
      lay.forEach((p, i) => {
        const el = nodes[i], st = el.style;
        st.left = p.x + '%'; st.top = p.y + '%'; st.width = p.w + '%';
        st.opacity = String(p.o);
        st.zIndex = String(p.z || 1);
        st.filter = p.dim ? 'brightness(' + (1 - .3 * p.dim).toFixed(2) + ')' : 'none';
        st.pointerEvents = clickable && p.o > .5 ? 'auto' : 'none';
        el.tabIndex = clickable && p.o > .5 ? 0 : -1;
        el.setAttribute('aria-hidden', clickable && p.o > .5 ? 'false' : 'true');
      });
      clusts.forEach(el => { el.style.opacity = id === 'group' ? '1' : '0'; });
      if (core) core.style.opacity = id === 'core' ? '1' : '0';
      lines(id);
      wall.setAttribute('data-scene', id);
    }

    if (tier === 'static') { apply('net'); window.__pqAboutHero = { mode: 'static' }; return true; }
    const model = HeroScene(heroConfig.about, mobile);
    const wrap = root.querySelector('[data-hero-wrap]');
    if (!wrap) { apply('net'); return true; }
    let cur = '';
    apply(model.included[0].id);
    ScrollStage(ctx, wrap, (p) => {
      const id = model.included[model.activeIdx(p)].id;
      if (id !== cur) { cur = id; apply(id); }
    });
    window.__pqAboutHero = { mode: 'on', nodes: nodes.length };
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
      if (window.__pqAboutHero) delete window.__pqAboutHero;
    }
  };
}
