// PeakQi 品牌首頁動畫引擎 — 母動畫(捲動)/ 子動畫(時間)分離
// 幕1 Hero:three.js「47 模組引擎 → 品牌屋發散」3D 光場(full tier,失敗退回 SVG)
// 幕3 雙軌:兩軌進度隨捲動填充(母)+ 飛輪/微光由 CSS(子)
// 幕4 跨產業:8 產業節點網路 2D canvas,漂浮(子)+ 隨捲動收束成核心(母)
// 全站:PageProgressRail 章節導覽(母)。reduced-motion 一律靜態。
import { createMotionContext, ScrollChapter, StickyProductStage } from './motion-kit.js';
import { capabilityTier } from './motion-config.js';

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const ez = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

const THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js';

const BRANDS = [
  { hex: 0xFF6B2C, css: '#FF6B2C', pos: [1.85, 1.15, 0.25] },   // Peak Ops
  { hex: 0x3E9BFF, css: '#3E9BFF', pos: [2.25, 0.15, -0.35] },  // 冒泡
  { hex: 0xE06B9C, css: '#E06B9C', pos: [2.15, -0.85, 0.15] },  // AI Wedding Pro
  { hex: 0x65E0BC, css: '#65E0BC', pos: [1.65, -1.75, -0.2] }   // AI Interior Pro
];

export function createHomeEngine() {
  const tier = capabilityTier();
  const reduced = tier === 'static';
  const ctx = createMotionContext('home-brand');
  let destroyed = false;
  const cleanups = [];

  function start() {
    if (reduced) return;               // reduced:維持靜態堆疊版,無子動畫
    mountDualtrack();
    mountCasesNet();
    mountCinema();                     // 爆炸攝影機分鏡(內含 WebGL 能力檢查與降級)
  }

  function destroy() {
    destroyed = true;
    try { ctx.destroy(); } catch (e) {}
    cleanups.forEach(f => { try { f(); } catch (e) {} });
    cleanups.length = 0;
  }

  // ---------- 幕3 雙軌:進度條隨捲動填充(母動畫) ----------
  function mountDualtrack() {
    const sec = document.getElementById('dualtrack');
    if (!sec) return;
    const fills = Array.from(sec.querySelectorAll('[data-track-fill]'));
    if (!fills.length) return;
    fills.forEach(f => { f.style.transformOrigin = 'left center'; f.style.transform = 'scaleX(0)'; });
    ScrollChapter(ctx, sec, (p) => {
      const k = ez(sub(p, 0.12, 0.62));
      fills.forEach(f => {
        const target = parseFloat(f.getAttribute('data-track-fill')) || 1;
        f.style.transform = 'scaleX(' + (k * target).toFixed(3) + ')';
      });
    });
  }

  // ---------- 幕4 跨產業:節點網路(子=漂浮,母=收束成核心) ----------
  function mountCasesNet() {
    const sec = document.getElementById('cases');
    const canvas = sec && sec.querySelector('[data-cases-net]');
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;
    const palette = ['#65E0BC', '#E06B9C', '#3E9BFF', '#FF6B2C', '#65E0BC', '#3E9BFF', '#E06B9C', '#FF6B2C', '#65E0BC'];
    let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const N = palette.length;
    const nodes = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      nodes.push({
        bx: 0.5 + Math.cos(a) * (0.30 + 0.08 * ((i % 3) - 1)),
        by: 0.5 + Math.sin(a) * (0.34 + 0.06 * ((i % 2) ? 1 : -1)),
        px: 0.06 * Math.cos(a * 1.7 + i),
        py: 0.06 * Math.sin(a * 1.3 + i),
        ph: i * 0.7,
        col: palette[i]
      });
    }
    function resize() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize, { passive: true });
    cleanups.push(() => window.removeEventListener('resize', onResize));

    let scrollP = 0;
    ScrollChapter(ctx, sec, (p) => { scrollP = p; });
    const bound = { inView: false };
    ctx.io(sec, es => { bound.inView = !!(es[0] && es[0].isIntersecting); }, { rootMargin: '120px' });
    const t0 = performance.now();

    ctx.onFrame((now) => {
      if (!bound.inView || W < 2) return;
      const t = (now - t0) / 1000;
      const converge = ez(sub(scrollP, 0.05, 0.75)); // 越往下越收束到中心
      const cx = 0.5, cy = 0.5;
      const pts = nodes.map(n => {
        const driftX = n.bx + n.px * Math.sin(t * 0.5 + n.ph);
        const driftY = n.by + n.py * Math.cos(t * 0.6 + n.ph);
        return {
          x: (driftX + (cx - driftX) * converge * 0.72) * W,
          y: (driftY + (cy - driftY) * converge * 0.72) * H,
          col: n.col
        };
      });
      g.clearRect(0, 0, W, H);
      // 連線(近距離才連,alpha 隨收束提高)
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy), max = Math.min(W, H) * 0.34;
          if (d > max) continue;
          const a = (1 - d / max) * (0.12 + converge * 0.28);
          g.strokeStyle = 'rgba(242,239,232,' + a.toFixed(3) + ')';
          g.lineWidth = 1;
          g.beginPath(); g.moveTo(pts[i].x, pts[i].y); g.lineTo(pts[j].x, pts[j].y); g.stroke();
        }
      }
      // 節點
      for (let i = 0; i < pts.length; i++) {
        const pulse = 0.6 + 0.4 * Math.sin(t * 1.8 + nodes[i].ph);
        const r = 2.4 + pulse * 1.6;
        const grad = g.createRadialGradient(pts[i].x, pts[i].y, 0, pts[i].x, pts[i].y, r * 4);
        grad.addColorStop(0, pts[i].col);
        grad.addColorStop(1, 'rgba(9,11,14,0)');
        g.globalAlpha = 0.5 + 0.3 * pulse;
        g.fillStyle = grad;
        g.beginPath(); g.arc(pts[i].x, pts[i].y, r * 4, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1;
        g.fillStyle = pts[i].col;
        g.beginPath(); g.arc(pts[i].x, pts[i].y, r * 0.62, 0, Math.PI * 2); g.fill();
      }
      // 收束核心
      if (converge > 0.05) {
        const cr = 6 + converge * 10;
        const cg = g.createRadialGradient(cx * W, cy * H, 0, cx * W, cy * H, cr * 3);
        cg.addColorStop(0, 'rgba(255,107,44,' + (0.5 * converge).toFixed(3) + ')');
        cg.addColorStop(1, 'rgba(255,107,44,0)');
        g.fillStyle = cg;
        g.beginPath(); g.arc(cx * W, cy * H, cr * 3, 0, Math.PI * 2); g.fill();
      }
    });
  }


  // ---------- 幕1 Hero:爆炸攝影機捲動分鏡(載入真實 GLB 模型)----------
  // 母=捲動(線稿→材質→爆炸→零件聚焦→回組、切章);子=時間(邊線閃爍、微塵、光脈衝、emissive 呼吸)
  async function mountCinema() {
    const hero = document.getElementById('hero');
    const stage = hero && hero.querySelector('[data-cine-stage]');
    const canvas = document.getElementById('pq-hero-gl');
    const cards = hero ? Array.from(hero.querySelectorAll('[data-cine-card]')).sort((a, b) => (+a.dataset.cineCard) - (+b.dataset.cineCard)) : [];
    const railWrap = hero && hero.querySelector('[data-cine-rail]');
    const labelText = hero && hero.querySelector('[data-cine-labeltext]');
    const phaseSpans = hero ? Array.from(hero.querySelectorAll('[data-cine-phase] > span')) : [];
    const loader = hero && hero.querySelector('[data-cine-loader]');
    const paperEl = hero && hero.querySelector('[data-cine-paper]');
    const studyTitleEl = hero && hero.querySelector('[data-cine-studytitle]');
    const studyCards = hero ? Array.from(hero.querySelectorAll('.pq-study-card')) : [];
    const scrimEl = document.getElementById('pq-hero-scrim');
    const noiseEl = hero && hero.querySelector('.pq-cine-noise');
    const annotSvg = hero && hero.querySelector('[data-cine-annot]');
    // U4 螢幕看影片
    const reviewEl = hero && hero.querySelector('[data-cine-review]');
    const vids = reviewEl ? Array.from(reviewEl.querySelectorAll('.pq-cine-vid')) : [];
    // 影片一律無限重播:loop 屬性 + ended 保險(隱藏面板/節流時仍自動接回)
    vids.forEach(v => {
      v.loop = true; v.muted = true;
      v.addEventListener('ended', () => { try { v.currentTime = 0; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {} });
    });
    const vcards = reviewEl ? Array.from(reviewEl.querySelectorAll('.pq-cine-vcard')) : [];
    const flashEl = hero && hero.querySelector('[data-cine-flash]');
    const lensTitleEl = hero && hero.querySelector('[data-cine-lenstitle]');
    const sloganEl = hero && hero.querySelector('[data-cine-slogan]');
    // U5 slogan:把標題切成逐字 span(--i 索引;末 N 字=橘色重點),CSS 用 --k 做「逐字開機/解碼」科技感浮現
    const sloganTitleEl = sloganEl && sloganEl.querySelector('.pq-slogan-title');
    if (sloganTitleEl && !sloganTitleEl.querySelector('.ch')) {
      const full = Array.from(sloganTitleEl.textContent);
      const accentN = parseInt(sloganTitleEl.getAttribute('data-accent') || '0', 10);
      const accentStart = full.length - accentN;
      sloganTitleEl.textContent = '';
      full.forEach((chr, i) => {
        const s = document.createElement('span');
        s.className = 'ch' + (i >= accentStart ? ' accent' : '');
        s.style.setProperty('--i', i);
        s.textContent = chr;
        sloganTitleEl.appendChild(s);
      });
    }
    // DOM 影片螢幕:裁切容器 + debug 邊界線(紅=影片裁切,藍=螢幕遮罩;.debug class 顯示)
    const screenEl = hero && hero.querySelector('[data-cine-screen]');
    const dbgRedEl = hero && hero.querySelector('[data-cine-dbg-red]');
    const dbgBlueEl = hero && hero.querySelector('[data-cine-dbg-blue]');
    if (typeof window !== 'undefined') {
      window.__vdebug = (on) => { if (reviewEl) reviewEl.classList.toggle('debug', on !== false); };
      window.__scrTune = (ox, oy, rot, sc) => { if (ox != null) SCR_OFFX = ox; if (oy != null) SCR_OFFY = oy; if (rot != null) SCR_ROT_DEG = rot; if (sc != null) SCR_SCALE = sc; cornerLocal = null; if (screenMesh) buildScreenPts(screenMesh); return { SCR_OFFX, SCR_OFFY, SCR_ROT_DEG, SCR_SCALE }; };
      // 用畫面像素設定影片 4 角(反投影到螢幕 mesh);回傳 mesh-local 座標可貼進 SCR_CORNERS_HARD 寫死。順序:左上、右上、左下、右下
      window.__setCorners = (tl, tr, bl, br) => {
        if (!screenMesh) return 'no screenMesh';
        const el = renderer.domElement, W = el.clientWidth || window.innerWidth, H = el.clientHeight || window.innerHeight;
        const rc = new THREE.Raycaster();
        const toLocal = (pt) => {
          rc.setFromCamera(new THREE.Vector2(pt[0] / W * 2 - 1, -(pt[1] / H * 2 - 1)), camera);
          const hs = rc.intersectObject(screenMesh, false);
          return hs.length ? screenMesh.worldToLocal(hs[0].point.clone()) : null;
        };
        const c = [toLocal(tl), toLocal(tr), toLocal(br), toLocal(bl)];   // TL,TR,BR,BL
        if (c.some(v => !v)) return 'ray miss (需在影片顯示的角度呼叫,且點要落在螢幕上)';
        cornerLocal = c.map(v => [+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)]);
        buildScreenPts(screenMesh);
        return JSON.stringify(cornerLocal);
      };
      // 只調單一角(其他不動):i = 0左上/1右上/2右下/3左下,pt=[畫面x,畫面y]。回傳完整 4 角可寫死
      window.__setCorner = (i, pt) => {
        if (!screenMesh || !cornerLocal) return 'need cornerLocal';
        const el = renderer.domElement, W = el.clientWidth || window.innerWidth, H = el.clientHeight || window.innerHeight;
        const rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(pt[0] / W * 2 - 1, -(pt[1] / H * 2 - 1)), camera);
        const hs = rc.intersectObject(screenMesh, false);
        if (!hs.length) return 'ray miss';
        const v = screenMesh.worldToLocal(hs[0].point.clone());
        cornerLocal[i] = [+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)];
        buildScreenPts(screenMesh);
        return JSON.stringify(cornerLocal);
      };
      // 互動式四角拖曳工具:window.__cornerTool(true) 開,拖藍點對齊,左下框顯示可貼給 AI 的數值
      const _rayToLocal = (px, py) => {
        const el = renderer.domElement, W = el.clientWidth || window.innerWidth, H = el.clientHeight || window.innerHeight;
        const rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(px / W * 2 - 1, -(py / H * 2 - 1)), camera);
        const hs = rc.intersectObject(screenMesh, false);
        return hs.length ? screenMesh.worldToLocal(hs[0].point.clone()) : null;
      };
      const _ctEnsure = () => {
        if (_ctEls) return;
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:fixed;inset:0;z-index:99998;pointer-events:none';
        const labels = ['左上', '右上', '右下', '左下'], handles = [];
        for (let i = 0; i < 4; i++) {
          const h = document.createElement('div');
          h.style.cssText = 'position:absolute;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;border:2px solid #3E9BFF;background:rgba(62,155,255,.4);pointer-events:auto;cursor:grab;box-shadow:0 0 12px #3E9BFF;touch-action:none';
          const lb = document.createElement('span');
          lb.textContent = labels[i];
          lb.style.cssText = 'position:absolute;left:26px;top:-2px;font:700 11px sans-serif;color:#9fd2ff;white-space:nowrap;text-shadow:0 1px 3px #000';
          h.appendChild(lb);
          h.addEventListener('pointerdown', (e) => { _ctDrag = i; try { h.setPointerCapture(e.pointerId); } catch (er) {} h.style.cursor = 'grabbing'; e.preventDefault(); });
          wrap.appendChild(h); handles.push(h);
        }
        const read = document.createElement('textarea');
        read.readOnly = true;
        read.style.cssText = 'position:fixed;left:16px;bottom:16px;width:560px;height:56px;z-index:99999;pointer-events:auto;background:rgba(9,11,14,.92);color:#65E0BC;border:1px solid #3E9BFF;font:12px/1.4 monospace;padding:8px;border-radius:6px;resize:none';
        document.body.appendChild(wrap); document.body.appendChild(read);
        const onMove = (e) => {
          if (_ctDrag < 0 || !screenMesh || !cornerLocal) return;
          const rect = renderer.domElement.getBoundingClientRect();
          const v = _rayToLocal(e.clientX - rect.left, e.clientY - rect.top);
          if (v) { cornerLocal[_ctDrag] = [+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)]; buildScreenPts(screenMesh); }
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', () => { if (_ctDrag >= 0) { _ctDrag = -1; handles.forEach(h => h.style.cursor = 'grab'); } });
        _ctEls = { wrap, handles, read };
      };
      window.__cornerTool = (on) => {
        if (!screenMesh) return 'screenMesh 還沒好,捲到影片顯示的段落再開';
        if (!cornerLocal) {   // 初始化為螢幕 mesh bbox 四角
          screenMesh.geometry.computeBoundingBox(); const b = screenMesh.geometry.boundingBox, z = b.min.z;
          cornerLocal = [[b.max.x, b.max.y, z], [b.min.x, b.max.y, z], [b.min.x, b.min.y, z], [b.max.x, b.min.y, z]].map(c => [+c[0].toFixed(4), +c[1].toFixed(4), +c[2].toFixed(4)]);
          buildScreenPts(screenMesh);
        }
        _ctEnsure();
        _ctOn = on !== false;
        _ctEls.wrap.style.display = _ctOn ? 'block' : 'none';
        _ctEls.read.style.display = _ctOn ? 'block' : 'none';
        return _ctOn ? '拖曳四個藍點對齊螢幕,左下框的數值複製貼給我(關閉:window.__cornerTool(false))' : '已關閉';
      };
    }
    if (!hero || !stage || !canvas || cards.length < 2) return;
    const BEATS = cards.length;

    let okgl = false;
    try { const pr = document.createElement('canvas'); okgl = !!(pr.getContext('webgl2') || pr.getContext('webgl') || pr.getContext('experimental-webgl')); } catch (e) {}
    if (!okgl) return;

    let THREE, GLTFLoader;
    try {
      THREE = await import('three');
      GLTFLoader = (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader;
    } catch (e) { return; } // 無法載入 three/loader:保留堆疊 + SVG 降級
    if (destroyed) return;

    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch (e) { return; }
    const isMobile = ctx.mobile;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.3 : 1.65));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    hero.classList.add('pq-cine-on');
    canvas.style.opacity = '1';
    // 更長的視差行程
    StickyProductStage(ctx, hero, stage, { distanceVh: isMobile ? 1400 : 1750 });   // 加長:騰出白藍圖「單一零件展示」章節(~525vh);組回→翻面→影片→slogan 的 scrollP 不變

    // rail 按鈕
    const railBtns = [];
    if (railWrap) {
      for (let i = 1; i < BEATS; i++) {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = ('0' + i).slice(-2);
        b.setAttribute('aria-label', '跳到分鏡 ' + i);
        b.addEventListener('click', () => {
          const H = hero.offsetHeight, vh = window.innerHeight || 1;
          const topAbs = hero.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
          window.scrollTo({ top: topAbs + ((i + 0.5) / BEATS) * (H - vh), behavior: ctx.reduced ? 'auto' : 'smooth' });
        });
        railWrap.appendChild(b); railBtns.push(b);
      }
    }
    // 每張卡片聚焦的零件群組
    const cardFocus = cards.map(c => new Set(((c.getAttribute('data-focus') || '').split(',').map(s => s.trim()).filter(Boolean))));

    // 場景
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090B0E, 0.028);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.1, 11.5);
    scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x17110f, 2.6));
    const keyL = new THREE.DirectionalLight(0xffffff, 4.8); keyL.position.set(4, 6, 7); scene.add(keyL);
    const fillL = new THREE.DirectionalLight(0xbcd4ff, 1.6); fillL.position.set(-6, 1, 4); scene.add(fillL);
    const orangeL = new THREE.PointLight(0xFF6B2C, 13, 18, 1.5); orangeL.position.set(4, -1, 5); scene.add(orangeL);
    const blueL = new THREE.PointLight(0x3E9BFF, 10, 16, 1.7); blueL.position.set(-5, 2, 3); scene.add(blueL);

    // bloom(桌機)
    let composer = null, bloomPass = null;
    if (!isMobile) {
      try {
        const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }] = await Promise.all([
          import('three/addons/postprocessing/EffectComposer.js'),
          import('three/addons/postprocessing/RenderPass.js'),
          import('three/addons/postprocessing/UnrealBloomPass.js')
        ]);
        if (!destroyed) {
          composer = new EffectComposer(renderer);
          composer.addPass(new RenderPass(scene, camera));
          bloomPass = new UnrealBloomPass(new THREE.Vector2(stage.clientWidth || 1, stage.clientHeight || 1), 0.5, 0.55, 0.25);
          composer.addPass(bloomPass);
        }
      } catch (e) { composer = null; bloomPass = null; }
    }
    if (destroyed) return;

    const rig = new THREE.Group();
    rig.position.set(1.45, 0, 0);
    rig.rotation.set(-0.16, -0.58, 0.02);
    scene.add(rig);

    // 微塵 + 地面格線
    const dustGeo = new THREE.BufferGeometry();
    const dpos = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) { dpos[i * 3] = (Math.random() - 0.5) * 13; dpos[i * 3 + 1] = (Math.random() - 0.5) * 7; dpos[i * 3 + 2] = (Math.random() - 0.5) * 7; }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xFF6B2C, size: 0.016, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(dust);
    const grid = new THREE.GridHelper(22, 34, 0x3c281f, 0x16191e); grid.position.y = -3.15; scene.add(grid);

    // 零件群組規則(CIS 配色)
    const CHASSIS = new Set(['body.001_low_41', 'body.002_low_1', 'body.019_low_18']);
    const INTERNALS = {
      PQ_SENSOR: { id: 'sensor', label: 'IMAGE SENSOR / 知識核心', color: 0x65E0BC },
      PQ_MAINBOARD: { id: 'mainboard', label: 'MAINBOARD / CRM 資料核心', color: 0x3E9BFF },
      PQ_AI_CHIP: { id: 'chip', label: 'PQ-47 AI 處理器', color: 0xFF6B2C },
      PQ_BATTERY: { id: 'battery', label: '24/7 自動運轉電源', color: 0xF2EFE8 },
      PQ_RIBBON: { id: 'ribbon', label: '產業導入排線', color: 0xFF6B2C }
    };
    function resolveRule(name) {
      if (INTERNALS[name]) return INTERNALS[name];
      if (name.startsWith('lenses')) return { id: 'optics', label: 'OPTICAL LENS ASSEMBLY', color: 0xFF6B2C };
      if (name.startsWith('case_')) return { id: 'shell', label: 'OUTER SHELL / 平台層', color: 0xF2EFE8 };
      if (name.startsWith('body_low') || CHASSIS.has(name)) return { id: 'chassis', label: 'CORE CHASSIS', color: 0xF2EFE8 };
      if (name.startsWith('body')) return { id: 'controls', label: 'CONTROL / 操作介面', color: 0x3E9BFF };
      return { id: 'controls', label: 'CAMERA BODY', color: 0x3E9BFF };
    }

    const parts = [];
    const BLACK = new THREE.Color(0x141414), PQ_ORANGE = new THREE.Color(0xFF6B2C);
    const PAPER = new THREE.Color(0xF2EFE8);   // 白藍圖紙色:零件平塗填色用(遮住後方線條)
    // 共用的「紙色遮擋面」材質:不吃光的平塗 + 寫深度,並用 polygonOffset 稍微退後,邊線才不會 z-fighting
    const PAPER_FILL = new THREE.MeshBasicMaterial({ color: PAPER, transparent: true, opacity: 1, depthWrite: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    // U1 鏡頭自轉:光學軸/樞紐(load 時算)+ 暫存四元數
    const lensAxis = new THREE.Vector3(1, 0, 0), lensPivot = new THREE.Vector3(), _spinQ = new THREE.Quaternion();
    // 程式加的內部零件(只在拆解/藍圖需要;組回後隱藏,避免灰塊透出機身)
    const INT_GROUPS = new Set(['sensor', 'mainboard', 'chip', 'battery', 'ribbon']);
    // U3s 白藍圖「單一零件展示」:5 個零件設定(part 於 load 後填入真實 node;文案繁中、動詞、白話)
    const INT_GRP = ['sensor', 'mainboard', 'chip', 'battery', 'ribbon'];
    // 機身「主元件」= 整台機身(外殼/控制/機架 + 全部內部零件),移出放大時整台一起跑,不留下零件
    const BODY_GRP = ['controls', 'chassis', 'shell'].concat(INT_GRP);
    const STUDY = [
      { action: 'ring',  side: 'right', code: 'LENS-R01', title: '對焦需求',     biz: '接住詢問、辨識需求、安排下一步', part: null, group: ['optics'] },   // 鏡桶(標對焦環)
      { action: 'press', side: 'left',  code: 'BODY-B02', title: '啟動下一步',   biz: '自動回覆、跟進、提醒與流程觸發', part: null, group: BODY_GRP },     // 機身(標頂部按鈕)
      { action: 'iris',  side: 'right', code: 'OPT-I03',  title: '調整每一次輸出', biz: '文案、圖片與影片內容',           part: null, group: ['optics'] },   // 鏡桶(標內側鏡片/光圈)
      { action: 'mark',  side: 'left',  code: 'CTRL-D04', title: '推進每一件工作', biz: '報價、專案、進度與財務',         part: null, group: BODY_GRP },     // 機身(標側邊控制鍵)
      { action: 'scan',  side: 'right', code: 'CIS-S05',  title: '留下每一次結果', biz: '資料、紀錄、月報與營運判讀',     part: null, group: BODY_GRP }   // 機身+內部(標感光板)
    ];
    // 零件展示暫存向量/四元數(相機相對展示位置 + 換角度面向鏡頭)
    const _fwd = new THREE.Vector3(), _rgt = new THREE.Vector3(), _up2 = new THREE.Vector3(), _disp = new THREE.Vector3(), _dispL = new THREE.Vector3(), _WUP = new THREE.Vector3(0, 1, 0), _actQ = new THREE.Quaternion();
    const _axisW = new THREE.Vector3(), _toCam = new THREE.Vector3(), _rgtCam = new THREE.Vector3(), _tgtAxis = new THREE.Vector3(), _gcOff = new THREE.Vector3(), _tmpV = new THREE.Vector3();
    const _groupCentroid = {};   // displayGroup → 組合中心(parent-local,爆炸排列下)
    const _qP = new THREE.Quaternion(), _partW = new THREE.Quaternion(), _tgtW = new THREE.Quaternion(), _locT = new THREE.Quaternion(), _delta = new THREE.Quaternion(), _spin = new THREE.Quaternion(), _qInv = new THREE.Quaternion(), _turnQ = new THREE.Quaternion();
    const _upLocal = new THREE.Vector3(), _wScale = new THREE.Vector3(), _knollW = new THREE.Vector3(), _knollL = new THREE.Vector3();
    let sGroupScale = 1, sTurn = 0;   // 群組展示:填滿畫面的放大倍率 + 轉盤角度
    // U3s「攤平陳列」(knolling):展示章節期間所有零件排成不重疊的整齊網格,中央留空給主角
    let sKnollK = 0;                  // 章節級進度(整段維持 1,不隨單一零件歸零)
    let knollMaxSize = 1;             // 最大零件尺寸(壓縮大小差距用,避免小零件小到看不見)
    const _knoll = { slots: [], cellWn: 0, cellHn: 0, cellMin: 0, key: '' };
    // 版面用「正規化座標」(-0.5~0.5)算一次就好:只跟零件數與長寬比有關,與相機距離無關。
    // (先前把 gridW/gridH 放進 cache key,而它們每幀隨相機距離變動 → 每幀重建整個網格 → 卡頓/當機)
    function buildKnollSlots(n, aspect, holeRXn, holeRYn) {
      // 逐步加密網格,直到「扣掉中央留空後」的格子數足夠容納 n 個零件 → 一格一件,保證不重疊
      for (let cols = 4; cols <= 40; cols++) {
        const rows = Math.max(1, Math.round(cols / aspect));
        const cwn = 1 / cols, chn = 1 / rows;
        const slots = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const nx = -0.5 + (c + 0.5) * cwn, ny = 0.5 - (r + 0.5) * chn;
          const dh = Math.hypot(nx / holeRXn, ny / holeRYn);
          if (dh < 1) continue;   // 中央淨空
          slots.push({ nx, ny, d: dh });
        }
        if (slots.length >= n) {
          slots.sort((a, b) => a.d - b.d);   // 由內而外:大零件靠近中央,小零件往外圍
          return { slots, cellWn: cwn, cellHn: chn };
        }
      }
      return { slots: [], cellWn: 0, cellHn: 0 };
    }
    // U4b:影片改用 DOM 疊層(CSS clip-path),邊界直接錨定 GLB 內的「螢幕面 mesh」(Object_12),每幀投影控制點 → 精準貼齊、不飄
    let screenMesh = null;
    const SCR_NAME = 'Object_12';                 // 螢幕面 mesh(camera_body,前面靠相機那面就是螢幕玻璃)
    const SCR_R = 0.05, SCR_INSET = 0.0, SCR_SEG = 5;   // 圓角半徑(寬/高比例,不要太大)+ 邊緣內縮(0=貼滿 bbox 四角)+ 每角分段
    let SCR_OFFX = 0.0, SCR_OFFY = 0.0, SCR_ROT_DEG = 0, SCR_SCALE = 1.0;   // 預設不位移/旋轉/縮放 → 影片精準貼「螢幕 mesh 四角(=藍色 debug 框)」。window.__scrTune(ox,oy,rot,scale)
    // 影片 4 角(mesh-local,TL,TR,BR,BL;隨相機轉、不飄);由 window.__cornerTool 拖曳對位後寫死。null=用螢幕 mesh bbox 四角
    const SCR_CORNERS_HARD = [[0.6342, 0.4508, -0.2926], [-0.6555, 0.461, -0.2912], [-0.6517, -0.4537, -0.4193], [0.6299, -0.4491, -0.4186]];
    const screenLocalPts = [];                    // 圓角多邊形控制點(Object_12 幾何 local 座標)
    const _scrPx = [];                            // 投影後畫面像素(數量隨 screenLocalPts)
    let _ctOn = false, _ctEls = null, _ctDrag = -1;   // 互動式四角拖曳工具狀態
    // 4 個角(mesh-local,順序 TL,TR,BR,BL);由 __setCorners 用畫面像素反投影設定 → 影片精準貼 4 點且隨相機轉;null=用 bbox
    let cornerLocal = SCR_CORNERS_HARD;
    // 由 4 個角(自訂或 bbox 前面)建「圓角四邊形」控制點:每角用二次貝茲曲線做圓角(對任意四邊形都成立)
    function buildScreenPts(mesh) {
      let C4;
      if (cornerLocal && cornerLocal.length === 4) {
        C4 = cornerLocal.map(c => new THREE.Vector3(c[0], c[1], c[2]));
      } else {
        mesh.geometry.computeBoundingBox();
        const b = mesh.geometry.boundingBox;
        const w = b.max.x - b.min.x, h = b.max.y - b.min.y, z = b.min.z;   // zMin=靠相機的前面
        const ix = w * SCR_INSET, iy = h * SCR_INSET, cx0 = (b.min.x + b.max.x) / 2, cy0 = (b.min.y + b.max.y) / 2;
        const rot = SCR_ROT_DEG * Math.PI / 180, cs = Math.cos(rot), sn = Math.sin(rot);
        const offX = w * SCR_OFFX, offY = h * SCR_OFFY;
        const tf = (x, y) => { const dx = (x - cx0) * SCR_SCALE, dy = (y - cy0) * SCR_SCALE; return new THREE.Vector3(cx0 + (dx * cs - dy * sn) + offX, cy0 + (dx * sn + dy * cs) + offY, z); };
        const L = b.min.x + ix, R = b.max.x - ix, Bt = b.min.y + iy, TP = b.max.y - iy;
        C4 = [tf(L, TP), tf(R, TP), tf(R, Bt), tf(L, Bt)];   // TL,TR,BR,BL
      }
      screenLocalPts.length = 0; _scrPx.length = 0;
      const n = C4.length;
      for (let i = 0; i < n; i++) {
        const C = C4[i], P = C4[(i + n - 1) % n], N = C4[(i + 1) % n];
        const A = C.clone().addScaledVector(P.clone().sub(C), SCR_R), Bp = C.clone().addScaledVector(N.clone().sub(C), SCR_R);
        for (let s = 0; s <= SCR_SEG; s++) {   // 二次貝茲 A→C→B 做圓角
          const u = s / SCR_SEG, iu = 1 - u, a = iu * iu, bq = 2 * iu * u, cq = u * u;
          screenLocalPts.push(new THREE.Vector3(a * A.x + bq * C.x + cq * Bp.x, a * A.y + bq * C.y + cq * Bp.y, a * A.z + bq * C.z + cq * Bp.z));
          _scrPx.push({ x: 0, y: 0 });
        }
      }
    }
    // U2 細拆:相機追焦點(平順甩鏡)
    const camAim = new THREE.Vector3(0, 0.1, 0), _tmp2 = new THREE.Vector3();
    // U3 翻面:轉到相機「背面 LCD 螢幕」正對觀眾(實測值)
    const EMPTY = new Set();
    const FLIP_YAW = 2.9;
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    function mkMat(hex, emissive) { return new THREE.MeshStandardMaterial({ color: hex, metalness: 0.62, roughness: 0.27, emissive: emissive == null ? hex : emissive, emissiveIntensity: 0.3 }); }
    function createInternals(asset) {
      const sensor = new THREE.Group(); sensor.name = 'PQ_SENSOR'; sensor.position.set(0, 0, 0.74);
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.51, 0.045, 4, 4, 1), mkMat(0x1a7185, 0x65E0BC)); sensor.add(sp);
      const sc = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.33, 0.025), mkMat(0x0b1115, 0x65E0BC)); sc.position.z = 0.038; sensor.add(sc); asset.add(sensor);
      const board = new THREE.Group(); board.name = 'PQ_MAINBOARD'; board.position.set(0, 0, -0.06);
      board.add(new THREE.Mesh(new THREE.BoxGeometry(1.34, 1.08, 0.055), mkMat(0x103f35, 0x0c7a60)));
      for (let i = 0; i < 12; i++) { const tr = new THREE.Mesh(new THREE.BoxGeometry(0.035 + (i % 3) * 0.045, 0.012, 0.012), mkMat(i % 3 === 0 ? 0xFF6B2C : 0x3E9BFF)); tr.position.set(-0.52 + (i % 4) * 0.34, -0.42 + Math.floor(i / 4) * 0.38, 0.04); board.add(tr); } asset.add(board);
      const chip = new THREE.Group(); chip.name = 'PQ_AI_CHIP'; chip.position.set(0.05, 0.04, 0.015);
      chip.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.11), mkMat(0x15171b, 0xFF6B2C)));
      const cc = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.025), mkMat(0xFF6B2C, 0xFF6B2C)); cc.position.z = 0.07; chip.add(cc); asset.add(chip);
      const battery = new THREE.Group(); battery.name = 'PQ_BATTERY'; battery.position.set(0.54, -0.08, -0.55);
      battery.add(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.3, 2, 2, 2), mkMat(0x202329, 0xffffff)));
      const bs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.315), mkMat(0xFF6B2C, 0xFF6B2C)); bs.position.y = 0.28; battery.add(bs); asset.add(battery);
      const ribbon = new THREE.Group(); ribbon.name = 'PQ_RIBBON';
      const curve = new THREE.CatmullRomCurve3([V3(-0.26, -0.1, 0.67), V3(-0.45, -0.28, 0.45), V3(-0.42, -0.32, 0.1), V3(-0.25, -0.23, -0.02)]);
      ribbon.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.025, 6, false), mkMat(0xFF6B2C, 0xFF6B2C))); asset.add(ribbon);
    }
    function addPartVisuals(node, color) {
      const materials = [], edges = [], fills = [];
      // 先蒐集,再加子物件:traverse 期間若把「Mesh」掛成子節點,會被同一次走訪再次拜訪 →
      // 無限遞迴、模型永遠載不完(頁面直接 HUNG)。原本的 edge 是 LineSegments 不是 Mesh 才沒事。
      const meshes = [];
      node.traverse(obj => { if (obj instanceof THREE.Mesh) meshes.push(obj); });
      meshes.forEach(obj => {
        obj.frustumCulled = false;
        const src = Array.isArray(obj.material) ? obj.material : [obj.material];
        const clones = src.map(m => { const c = m.clone(); c.transparent = true; c.opacity = 0; c.depthWrite = false; materials.push(c); return c; });
        obj.material = Array.isArray(obj.material) ? clones : clones[0];
        // 白藍圖「遮擋面」:同一份幾何、紙色平塗、會寫深度 → 擋掉後方線條(隱線消除),
        // 讓機身/鏡頭/感光元件各自看起來是一個完整實體,而不是一堆半透明線稿疊在一起。
        // 用獨立 mesh 而非改原材質:原材質有貼圖與金屬度,改色會變黑/露出貼圖,且切換貼圖會觸發 shader 重編。
        const fill = new THREE.Mesh(obj.geometry, PAPER_FILL); fill.renderOrder = 3; fill.frustumCulled = false; fill.visible = false;
        obj.add(fill); fills.push(fill);
        const em = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthTest: true });
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(obj.geometry, 24), em); edge.renderOrder = 4; obj.add(edge); edges.push(em);
      });
      return { materials, edges, fills };
    }
    function calcOffset(name, center, index) {
      if (name.startsWith('lenses')) return V3(center.x * 0.18, center.y * 0.18, 1.35 + Math.max(0, center.z - 0.75) * 1.35);
      if (name.startsWith('case_')) return V3(0, name.includes('case_2') ? 0.55 : -0.28, -1.7 - (index % 2) * 0.45);
      if (name === 'PQ_SENSOR') return V3(0, 0, 1.85);
      if (name === 'PQ_MAINBOARD') return V3(-0.35, 0.1, -1.35);
      if (name === 'PQ_AI_CHIP') return V3(0.15, 0.28, -2.05);
      if (name === 'PQ_BATTERY') return V3(2.25, -0.4, -1.2);
      if (name === 'PQ_RIBBON') return V3(-1.65, -1.15, -0.4);
      if (Math.abs(center.x) > 0.72) return V3(Math.sign(center.x) * (1.35 + Math.abs(center.y) * 0.45), center.y * 0.42, center.z * 0.22);
      if (Math.abs(center.y) > 0.56) return V3(center.x * 0.25, Math.sign(center.y) * (1.15 + Math.abs(center.x) * 0.28), center.z * 0.18);
      return V3(center.x * 0.42, center.y * 0.42, -0.72 - (index % 4) * 0.2);
    }

    let modelReady = false;
    const connectorLayer = new THREE.Group(); connectorLayer.name = 'CONNECTORS';
    (async function loadModel() {
      try {
        const gltf = await new GLTFLoader().loadAsync('assets/models/peakqi-camera-web.glb');
        if (destroyed) return;
        const asset = gltf.scene;
        const ground = asset.getObjectByName('ground_0'); if (ground && ground.parent) ground.parent.remove(ground);
        createInternals(asset);
        asset.add(connectorLayer);
        const candidates = [];
        asset.traverse(obj => {
          const isOrig = /^(body|case_|lenses)/.test(obj.name);
          const isInt = !!INTERNALS[obj.name];
          if ((isOrig || isInt) && obj.children.some(c => c instanceof THREE.Mesh)) candidates.push(obj);
        });
        candidates.forEach((node, index) => {
          const rule = resolveRule(node.name);
          const bounds = new THREE.Box3().setFromObject(node);
          const center = bounds.getCenter(new THREE.Vector3());
          const vis = addPartVisuals(node, rule.color);
          const home = node.position.clone();
          const offset = calcOffset(node.name, center, index);
          const lineGeo = new THREE.BufferGeometry().setFromPoints([center.clone(), center.clone()]);
          const lineMat = new THREE.LineBasicMaterial({ color: rule.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
          const connector = new THREE.Line(lineGeo, lineMat); connectorLayer.add(connector);
          parts.push({ node, name: node.name, groupId: rule.id, center, home, offset, delay: Math.min(index * 0.014, 0.5), materials: vis.materials, edges: vis.edges, fills: vis.fills, connector, baseColor: new THREE.Color(rule.color), baseScale: node.scale.clone(), baseQuat: node.quaternion.clone() });
        });
        // U1 鏡頭自轉變焦:用「幾何中心」算光學軸+樞紐(繞軸原地自轉,與拆解相容)
        {
          const optics = parts.filter(pp => pp.groupId === 'optics');
          if (optics.length >= 2) {
            let maxd = 0;
            optics.forEach(a => optics.forEach(b => { const d = a.center.distanceTo(b.center); if (d > maxd) { maxd = d; lensAxis.copy(a.center).sub(b.center); } }));
            if (lensAxis.lengthSq() < 1e-6) lensAxis.set(1, 0, 0);
            lensAxis.normalize();
            lensPivot.set(0, 0, 0); optics.forEach(pp => lensPivot.add(pp.center)); lensPivot.multiplyScalar(1 / optics.length);
            optics.forEach(pp => { pp.lensSpin = true; pp.lensBaseQuat = pp.node.quaternion.clone(); });
          }
        }
        // U3s:把 5 個零件對到現有真實 node(沿用模型零件;找不到就用最接近的,見註解)
        {
          const byName = (nm) => parts.find(pp => pp.name === nm);
          const optics = parts.filter(pp => pp.groupId === 'optics');
          const ctrls = parts.filter(pp => pp.groupId === 'controls');
          const topBtn = ctrls.slice().sort((a, b) => b.center.y - a.center.y)[0];                              // 02 頂部按鈕≈center.y 最高的 control
          const sideDial = ctrls.slice().sort((a, b) => Math.abs(b.center.x) - Math.abs(a.center.x)).find(pp => pp !== topBtn) || ctrls[1]; // 04 側邊控制鍵≈|x| 最大
          STUDY[0].part = byName('lenses_low_40') || optics[0];                        // 01 對焦環=最外圈鏡組
          STUDY[1].part = topBtn;                                                       // 02 快門/頂部按鈕(替代:最頂部 control node,下壓一次)
          STUDY[2].part = byName('lenses005_low_32') || optics[Math.floor(optics.length / 2)]; // 03 光圈(替代:中段鏡片)
          STUDY[3].part = sideDial;                                                     // 04 模式轉盤(替代:側邊 control 鍵)
          STUDY[4].part = parts.find(pp => pp.groupId === 'sensor') || parts.find(pp => pp.groupId === 'chip'); // 05 感光元件/晶片
          // 每個零件的「幾何中心」相對其 node 原點的父層 local 偏移(node 原點多有偏移;展示定位要對準幾何中心)
          parts.forEach(pp => {
            pp.node.parent.updateWorldMatrix(true, false);
            const bb = new THREE.Box3().setFromObject(pp.node);   // world bbox
            // 換算成「父層 local」bbox(轉 8 個角點):此時 asset 尚未縮放/掛上 rig,不能直接拿 world 尺寸當 local
            const bl = new THREE.Box3();
            for (let sx = 0; sx < 2; sx++) for (let sy = 0; sy < 2; sy++) for (let sz = 0; sz < 2; sz++) {
              bl.expandByPoint(pp.node.parent.worldToLocal(new THREE.Vector3(
                sx ? bb.max.x : bb.min.x, sy ? bb.max.y : bb.min.y, sz ? bb.max.z : bb.min.z)));
            }
            pp.bbMin = bl.min.clone(); pp.bbMax = bl.max.clone();
            pp.gcLocal = bl.getCenter(new THREE.Vector3());
            const bs = bl.getSize(new THREE.Vector3());
            pp.sizeLocal = Math.max(bs.x, bs.y, bs.z) || 0.001;   // 攤平陳列:縮到格子內用
          });
          // 攤平陳列順序:大件排前面(靠近中央),小件往外圍
          parts.slice().sort((a, b) => b.sizeLocal - a.sizeLocal).forEach((pp, r) => { pp.knollIdx = r; });
          knollMaxSize = parts.reduce((m, pp) => Math.max(m, pp.sizeLocal), 0.001);
          // 展示零件的「主面法線」(幾何最薄軸,node local)+ node 自身幾何中心(不含 base 旋轉)
          parts.forEach(pp => {
            let thin = new THREE.Vector3(0, 0, 1), minD = Infinity;
            pp.node.traverse(o => { if (o.isMesh && o.geometry) { o.geometry.computeBoundingBox(); const s = o.geometry.boundingBox.getSize(new THREE.Vector3()); const m = Math.min(s.x, s.y, s.z); if (m < minD) { minD = m; thin.set(s.x === m ? 1 : 0, s.y === m ? 1 : 0, s.z === m ? 1 : 0); } } });
            pp.faceLocal = thin;
            pp.gcNode = pp.gcLocal.clone().applyQuaternion(pp.baseQuat.clone().invert());
          });
          // 每個展示章節的「主元件群組」:組合中心(parent-local,爆炸排列)+ 主面軸(換角度朝鏡頭用)+ 群組尺寸(決定放大幅度)
          STUDY.forEach(c => {
            if (!c.group) return;
            c.groupParts = parts.filter(pp => c.group.indexOf(pp.groupId) >= 0);
            if (!c.groupParts.length) { c.group = null; return; }
            const box = new THREE.Box3();
            // 用「組裝態」排列(bbMin/bbMax,無爆炸位移)→ 緊湊的真實元件形狀,展示時才能放大填滿畫面
            // 用每個零件的真實 bbox(只用中心點會讓實際邊界超出 → 主角偏移、尺寸低估)
            c.groupParts.forEach(pp => { box.expandByPoint(pp.bbMin); box.expandByPoint(pp.bbMax); });
            // 用 bbox 中心(不是各零件中心的平均):零件分布不均時平均值會偏掉,導致主角沒對準畫面中央
            c.groupCentroid = box.getCenter(new THREE.Vector3());
            // 相對組合中心的 bbox:每幀用它投影到畫面量實際大小 → 不同角度都能正確填滿
            c.groupBoxMin = box.min.clone().sub(c.groupCentroid);
            c.groupBoxMax = box.max.clone().sub(c.groupCentroid);
            // 用「兩個最大邊的平均」當視覺尺寸:鏡桶端面朝鏡頭時看到的是直徑而非長度,單用最長邊會把它縮得太小
            const gsz = box.getSize(new THREE.Vector3());
            const gd = [gsz.x, gsz.y, gsz.z].sort((a, b) => b - a);
            c.groupSpan = (gd[0] + gd[1]) / 2 || 1;
            // 主面軸:optics 用光學軸;其他(機身/內部)用群組 bounding box 最薄軸(≈正面法線)
            if (c.group.indexOf('optics') >= 0) { c.faceAxisLocal = lensAxis.clone(); }
            else { const m = Math.min(gsz.x, gsz.y, gsz.z); c.faceAxisLocal = new THREE.Vector3(gsz.x === m ? 1 : 0, gsz.y === m ? 1 : 0, gsz.z === m ? 1 : 0); }
          });
        }
        // U4b:找到 GLB 內的螢幕面 mesh(Object_12),由它的幾何前面建立 8 個斜切角控制點 → DOM 影片直接錨定真實螢幕位置
        asset.traverse(o => { if (o.isMesh && o.name === SCR_NAME) screenMesh = o; });
        if (!screenMesh) {   // 後備:找最像螢幕的扁平 camera_body mesh(寬>1、高>0.7、深<0.25)
          let best = null, bestScore = 1e9;
          asset.traverse(o => {
            if (!o.isMesh || !o.geometry) return;
            const m = Array.isArray(o.material) ? o.material[0] : o.material;
            if (!m || m.name !== 'camera_body') return;
            o.geometry.computeBoundingBox(); const s = new THREE.Vector3(); o.geometry.boundingBox.getSize(s);
            if (s.x > 1 && s.y > 0.7 && s.z < 0.25) { const sc = s.z; if (sc < bestScore) { bestScore = sc; best = o; } }
          });
          screenMesh = best;
        }
        if (screenMesh) buildScreenPts(screenMesh);
        const mb = new THREE.Box3().setFromObject(asset);
        const mc = mb.getCenter(new THREE.Vector3());
        const ms = mb.getSize(new THREE.Vector3());
        asset.position.sub(mc);
        asset.scale.setScalar(2.45 / (ms.y || 1));
        rig.add(asset);
        modelReady = true;
        if (loader) { loader.classList.add('ready'); }
      } catch (e) {
        if (loader) { loader.classList.add('error'); loader.textContent = 'MODEL LOAD ERROR'; }
      }
    })();

    function resize() {
      const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
      renderer.setSize(w, h, false);
      if (composer) composer.setSize(w, h);
      if (bloomPass) bloomPass.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    resize();
    const onResize = () => { if (!destroyed) resize(); };
    window.addEventListener('resize', onResize, { passive: true });
    const pointer = { x: 0, y: 0 };
    const onPointer = (e) => { pointer.x = (e.clientX / (window.innerWidth || 1) - 0.5) * 2; pointer.y = (e.clientY / (window.innerHeight || 1) - 0.5) * 2; };
    if (!isMobile) window.addEventListener('pointermove', onPointer, { passive: true });
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); hero.classList.remove('pq-cine-on'); }, false);
    cleanups.push(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      vids.forEach(v => { try { v.pause(); } catch (e) {} });
      try { renderer.dispose(); } catch (e) {}
    });

    let scrollP = 0, smoothP = 0, curBeat = -1, curPhase = -1;
    ScrollChapter(ctx, hero, (p) => { scrollP = p; }, { pinned: true });
    const bound = { inView: true };
    ctx.io(hero, es => { bound.inView = !!(es[0] && es[0].isIntersecting); }, { rootMargin: '10px' });

    function setBeat(b) {
      if (b === curBeat) return; curBeat = b;
      cards.forEach((c, i) => c.classList.toggle('is-active', i === b));
      railBtns.forEach((btn, i) => btn.classList.toggle('active', (i + 1) === b));
      if (labelText) { const a = cards[b]; labelText.textContent = (a && a.getAttribute('data-part')) || (a && a.getAttribute('data-eyebrow')) || 'PQ-47 CINEMA'; }
    }
    function setPhase(ph) {
      if (ph === curPhase) return; curPhase = ph;
      phaseSpans.forEach((s, i) => s.classList.toggle('active', i === ph));
    }
    // U4:切換目前播放的影片 + 業務字卡(母=捲動;影片獨立自動播=子)
    let curShot = -2, flashStart = 0, shotFadeStart = -1;
    function setShot(s, now) {
      if (s === curShot) return;
      curShot = s;
      if (s >= 0) shotFadeStart = now;   // 每次換片 → 影片在原地淡入
      vids.forEach((v, i) => {
        const on = i === s; v.classList.toggle('is-on', on);
        if (on) { try { v.currentTime = 0; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {} }
        else { try { v.pause(); } catch (e) {} }
      });
      vcards.forEach((c, i) => c.classList.toggle('is-on', i === s));
      if (s >= 0) doFlash();          // 切換=整屏快門閃光(乾淨一閃)
    }
    function doFlash() {
      if (!flashEl) return;
      flashEl.style.transition = 'none';
      flashEl.style.opacity = '0.95';
      requestAnimationFrame(() => { if (flashEl) { flashEl.style.transition = 'opacity .26s ease-out'; flashEl.style.opacity = '0'; } });
    }
    setBeat(0);

    // ---- 攤開白宣紙藍圖:座標 + 業務類別 + 白話(卡片式,逐一浮現)----
    const NS = 'http://www.w3.org/2000/svg';
    const svgEl = (tag, cls) => { const e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); return e; };
    const CARDW = ctx.mobile ? 150 : 248, CARDH = ctx.mobile ? 52 : 72;
    const ANNOT = [
      { g: 'optics', idx: '01', biz: '接客 · AI 客服', note: '客人從這裡進來,AI 先接住、先理解', ax: 0.055, ay: 0.26, reveal: 0.70 },
      { g: 'sensor', idx: '02', biz: '行銷 · 內容生成', note: '把產業 know-how 變成貼文、圖片、影片', ax: 0.055, ay: 0.60, reveal: 0.75 },
      { g: 'mainboard', idx: '03', biz: 'CRM · 追客', note: '每個客人走到哪一步,都記在同一塊板上', ax: 0.945, ay: 0.26, reveal: 0.80 },
      { g: 'shell', idx: '04', biz: '品牌屋 · 平台層', note: '同一顆引擎,換上不同產業的臉', ax: 0.945, ay: 0.60, reveal: 0.85 }
    ];
    const annItems = [];
    if (annotSvg) {
      ANNOT.forEach(cfg => {
        const left = cfg.ax < 0.5;
        const g = svgEl('g');
        const lead = svgEl('polyline', 'lead');
        const rect = svgEl('rect', 'card'); rect.setAttribute('rx', '3');
        const dot = svgEl('circle', 'dot'); dot.setAttribute('r', '3.5');
        const idxT = svgEl('text', 'idx'); idxT.textContent = cfg.idx;
        const coordT = svgEl('text', 'coord'); coordT.setAttribute('text-anchor', 'end');
        const bizT = svgEl('text', 'biz'); bizT.textContent = cfg.biz;
        const noteT = svgEl('text', 'note'); noteT.textContent = cfg.note;
        g.appendChild(lead); g.appendChild(rect); g.appendChild(dot); g.appendChild(idxT); g.appendChild(coordT); g.appendChild(bizT); g.appendChild(noteT);
        annotSvg.appendChild(g);
        annItems.push({ cfg, left, g, rect, lead, dot, idxT, coordT, bizT, noteT, node: null });
      });
    }
    const _wp = THREE ? new THREE.Vector3() : null;

    // 分鏡節奏:光澤PBR → 拆解 → 發光彩色線稿 → 黑白藍圖(母=捲動;運作=時間子動畫)
    const CONTENT_END = 0.24, OFF = 0.62;   // 8 段故事卡集中在拆解/線稿(0–0.24),之後進白藍圖零件展示

    const t0 = performance.now();
    ctx.onFrame((now) => {
      if (destroyed || !bound.inView) return;
      const t = (now - t0) / 1000;
      smoothP += (scrollP - smoothP) * 0.06;
      const p = smoothP;
      const beat = Math.max(0, Math.min(BEATS - 1, Math.floor((scrollP / CONTENT_END) * BEATS)));
      const review = p > 0.26;                      // 藍圖/零件展示起,不顯示故事卡
      setBeat(review ? -1 : beat);
      // 新增相位 3=黑白藍圖(含零件展示 0.22–0.56);組回(4)、翻面看螢幕(5)沿用
      setPhase(p < 0.05 ? 0 : p < 0.14 ? 1 : p < 0.22 ? 2 : p < 0.56 ? 3 : p < 0.665 ? 4 : 5);
      // 母:representation 轉場(藍圖後 R 倒放 → 組回光澤實體 → 翻面)。組回/翻面/影片/slogan scrollP 全部不變
      const R = ez(sub(p, 0.56, 0.62));             // U3a 組回實體(提早到 0.62 完成,騰出鏡頭總結標題停留)
      const sloganK = ez(sub(p, 0.92, 0.99));       // U5 回機身 + Slogan
      const flipK = ez(sub(scrollP, 0.67, 0.72)) * (1 - sloganK);  // U3b 翻面:0.67 起(讓 0.62–0.67 停在鏡頭正面顯示總結標題);用 scrollP + 快 lerp 迅速就位。影片/slogan(0.72+)時間軸不變
      const summaryK = ez(sub(scrollP, 0.618, 0.652)) * (1 - ez(sub(scrollP, 0.678, 0.705)));   // U3c 組裝完成鏡頭正面「章節總結標題」(用 scrollP,0.652–0.678 停留,翻面 0.67 起淡出)
      const disasK = ez(sub(p, 0.05, 0.20)) * (1 - R);   // 前段壓縮,騰出零件展示
      const wireK = ez(sub(p, 0.14, 0.24)) * (1 - R);
      const paperK = ez(sub(p, 0.22, 0.28)) * (1 - R);   // 白藍圖:0.28 起完全展開,一路持有到組回
      // U3s 白藍圖「單一零件展示」章節:studyP 0→1 對應 5 個零件(每個 0.2);章節標題在最前面淡入淡出
      const studyP = sub(p, 0.29, 0.53);
      const introK = ez(sub(p, 0.242, 0.278)) * (1 - ez(sub(p, 0.283, 0.30)));   // 章節標題:藍圖展開時出現,第一個零件文字卡出現前(~0.30)完全淡出,避免重疊
      // U3s 零件展示狀態:哪個零件、聚焦/動作/文字/回位進度(每個零件 15%移出 20%放大 35%動作 15%文字 15%回位)
      let sComp = -1, sFocusK = 0, sActionK = 0, sTextK = 0; sGroupScale = 1; sTurn = 0; sKnollK = 0;
      if (paperK > 0.4 && studyP > 0.0005 && studyP < 0.9995) {
        sComp = Math.min(4, Math.floor(studyP * 5));
        const cp = clamp((studyP - sComp * 0.2) / 0.2, 0, 1);
        sFocusK = ez(sub(cp, 0.0, 0.32)) * (1 - ez(sub(cp, 0.85, 1.0)));   // 移出+放大 → 定住 → 回位
        sActionK = ez(sub(cp, 0.35, 0.70));                                // 本體機械動作(一次,不循環)
        sTextK = ez(sub(cp, 0.26, 0.40)) * (1 - ez(sub(cp, 0.80, 0.94)));  // 文字停留
        sTurn = (cp - 0.5) * (isMobile ? 1.3 : 2.2);                        // 轉盤:隨捲動掃過角度(換角度看,過中點時正對)
        // 章節級:進場攤平成陳列、離場收回。整段維持 1,零件不會在每個零件之間彈回爆炸雲
        sKnollK = ez(sub(studyP, 0.0, 0.055)) * (1 - ez(sub(studyP, 0.945, 1.0)));
      }
      const sPartNode = (sComp >= 0 && STUDY[sComp].part) ? STUDY[sComp].part.node : null;
      // 展示舞台:畫面正中央 + 攤平陳列網格(中央淨空給主角);主元件群組放大到「主導畫面」
      if ((sKnollK > 0.001 || sFocusK > 0.001) && parts.length) {
        _fwd.copy(camAim).sub(camera.position).normalize();
        const dist = camera.position.distanceTo(camAim) * (isMobile ? 0.86 : 0.72);
        _disp.copy(camera.position).addScaledVector(_fwd, dist);           // 畫面中央
        _rgt.crossVectors(_fwd, _WUP).normalize();                         // 攤平平面 = 垂直視線的平面(正對鏡頭)
        _up2.crossVectors(_rgt, _fwd).normalize();
        const viewH = 2 * dist * Math.tan(camera.fov * Math.PI / 360);     // 展示距離下的畫面世界尺寸
        const viewW = viewH * camera.aspect;
        parts[0].node.parent.getWorldScale(_wScale);
        const wS = (_wScale.x + _wScale.y + _wScale.z) / 3;
        _knoll.wS = wS;
        const gridW = viewW * 0.94, gridH = viewH * 0.92;
        // 中央淨空(正規化):半徑要蓋得住放大的主元件
        const holeRXn = (isMobile ? 0.34 : 0.30) / 0.94, holeRYn = (isMobile ? 0.30 : 0.36) / 0.92;
        const aspect = gridW / gridH;
        // cache key 只放「零件數 + 長寬比」→ 捲動時不會每幀重建網格
        const key = parts.length + '|' + aspect.toFixed(2);
        if (_knoll.key !== key) {
          const b = buildKnollSlots(parts.length, aspect, holeRXn, holeRYn);
          _knoll.slots = b.slots; _knoll.cellWn = b.cellWn; _knoll.cellHn = b.cellHn; _knoll.key = key;
        }
        _knoll.cellMin = Math.min(_knoll.cellWn * gridW, _knoll.cellHn * gridH);
        _knoll.gridW = gridW; _knoll.gridH = gridH;
        if (sFocusK > 0.001 && sPartNode) {
          const cfg = STUDY[sComp];
          if (cfg.group && cfg.groupParts && cfg.groupParts.length && cfg.groupBoxMin) {
            // 依「投影到畫面的尺寸」決定放大倍率(3D bbox 在不同轉角投影差很多,單一係數無法同時服務鏡桶與機身)
            // 但量測必須「與當下轉角無關」,否則:轉盤每幀變角度 → 目標倍率跟著變 → studyScale 永遠在追移動目標 → 畫面持續抖動。
            // 轉盤是繞世界垂直軸轉,因此「垂直高度」與「離垂直軸的水平半徑」都是轉不變量,用它們量測即可穩定。
            cfg.groupParts[0].node.parent.getWorldQuaternion(_qP);
            const bmn = cfg.groupBoxMin, bmx = cfg.groupBoxMax;
            let mny = Infinity, mxy = -Infinity, rmax = 0;
            for (let cx = 0; cx < 2; cx++) for (let cy = 0; cy < 2; cy++) for (let cz = 0; cz < 2; cz++) {
              _tmpV.set(cx ? bmx.x : bmn.x, cy ? bmx.y : bmn.y, cz ? bmx.z : bmn.z);
              _tmpV.applyQuaternion(_qP).multiplyScalar(wS);        // → 世界方向(不含 turn)
              const py = _tmpV.dot(_up2);
              if (py < mny) mny = py; if (py > mxy) mxy = py;
              const r = Math.hypot(_tmpV.dot(_rgt), _tmpV.dot(_fwd));   // 水平面上離軸半徑(轉不變)
              if (r > rmax) rmax = r;
            }
            const ph = Math.max(1e-4, mxy - mny), pw = Math.max(1e-4, 2 * rmax);
            sGroupScale = clamp(Math.min(viewW * 0.72 / pw, viewH * 0.88 / ph), 1, 16);
          }
        }
      }
      const dark = 1 - paperK;
      const solid = 1 - wireK;
      const focusSet = review ? EMPTY : (cardFocus[beat] || EMPTY);
      // 子:快門捕捉閃光(暗場循環)
      const scy = t % 5.2, shot = scy < 0.16 ? (1 - scy / 0.16) : 0;
      // 背景/疊層切換
      if (paperEl) paperEl.style.opacity = paperK.toFixed(3);
      PAPER_FILL.opacity = paperK;   // 紙色遮擋面隨白藍圖淡入(彩色線稿階段維持全透明,不影響原本的發光線稿轉場)
      if (studyTitleEl) studyTitleEl.style.setProperty('--k', introK.toFixed(3));   // U3s 零件展示章節標題
      for (let c = 0; c < studyCards.length; c++) {   // U3s 零件文字卡:只顯示當前零件,隨停留淡入淡出
        const on = c === sComp ? sTextK : 0;
        studyCards[c].style.opacity = on.toFixed(3);
        studyCards[c].style.setProperty('--on', on.toFixed(3));
      }
      if (annotSvg) annotSvg.style.opacity = (paperK > 0.05 && p < 0.58 ? 1 : 0);
      if (scrimEl) scrimEl.style.opacity = dark.toFixed(3);
      if (noiseEl) noiseEl.style.opacity = (dark * 0.16).toFixed(3);
      hero.classList.toggle('pq-cine-paper-on', paperK > 0.55);
      // 母:旋轉(有界擺動 → 藍圖俯視 → 翻面螢幕正對)
      const spinY = -0.5 + Math.sin(p * Math.PI * 3.0) * 0.5 + pointer.x * 0.06;
      const tiltX = -0.14 + Math.sin(p * Math.PI * 1.8) * 0.14 - pointer.y * 0.04;
      const yawNormal = spinY * dark + (-0.5) * paperK;
      const xNormal = tiltX * dark + (-0.95) * paperK;
      const flipYaw = (typeof window !== 'undefined' && window.__flipYaw != null) ? window.__flipYaw : FLIP_YAW;
      // 翻面時大幅加快收斂(否則捲動到影片段相機還卡在半途轉、看到鏡頭正面),避免「就位太慢=看起來壞掉」
      const flipLerp = 0.05 + flipK * flipK * 0.4;
      const _rotTargetY = yawNormal * (1 - flipK) + flipYaw * flipK;
      rig.rotation.y += (_rotTargetY - rig.rotation.y) * flipLerp;
      rig.rotation.x += ((xNormal * (1 - flipK) + 0.05 * flipK) - rig.rotation.x) * flipLerp;
      rig.rotation.z = Math.sin(p * Math.PI * 1.6) * 0.04 * dark * (1 - flipK);
      const align = cards[beat] && cards[beat].getAttribute('data-align');
      const targetX = (isMobile ? 0 : (align === 'right' ? -0.8 : 0.8)) * dark * (1 - flipK);
      const _posTargetX = targetX + flipK * (isMobile ? 0 : 1.1);
      rig.position.x += (_posTargetX - rig.position.x) * (0.04 + flipK * flipK * 0.35);   // 翻面時相機靠右(前面不變)並快速就位
      rig.position.y += (((isMobile ? 0.8 : 0) * dark * (1 - flipK)) - rig.position.y) * 0.04;
      // 相機是否已停在最終翻面姿態(寬鬆判定:只擋大幅移動,避免正常捲動時影片不出現)
      const settleK = clamp(1 - (Math.abs(rig.rotation.y - _rotTargetY) / 0.5 + Math.abs(rig.position.x - _posTargetX) / 0.7), 0, 1);
      // 開場放大;拆解縮小;翻面看螢幕再放大
      rig.scale.setScalar((isMobile ? 0.72 : 1.18) * (1 - disasK * 0.32) * (1 - paperK * (isMobile ? 0.3 : 0.22)) * (1 + flipK * (isMobile ? 0.5 : 0.6)));
      // U2 放大細拆:拆解/線稿階段推近並框住聚焦零件,camAim 平順追焦(切換=甩鏡)
      const framingK = ez(sub(p, 0.08, 0.14)) * (1 - ez(sub(p, 0.18, 0.24)));
      let aimX = 0, aimY = 0.1, aimZ = 0;
      if (framingK > 0.01) {
        const fp = parts.find(pp => focusSet.has(pp.groupId));
        if (fp) { fp.node.getWorldPosition(_tmp2); aimX = _tmp2.x * framingK; aimY = 0.1 * (1 - framingK) + _tmp2.y * framingK; aimZ = _tmp2.z * framingK; }
      }
      camAim.lerp(_tmp2.set(aimX, aimY, aimZ), 0.1);
      camera.position.z = (isMobile ? 13.4 : 11.8) + disasK * 0.8 + paperK * 2.2 - framingK * (isMobile ? 2.2 : 3.4) - flipK * (isMobile ? 0.6 : 1.0);
      camera.lookAt(camAim);

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const focused = focusSet.has(part.groupId);
        // 拆解:所有零件適度散開(在框內),之後保持
        const staged = ez((disasK - part.delay * 0.5) / Math.max(0.3, 1 - part.delay * 0.5));
        const dest = part.home.clone().addScaledVector(part.offset, staged * OFF);
        // U3s 零件展示:聚焦零件 / 同一「主元件」群組(整組一起移出放大)/ 其餘變淡
        const dg = sComp >= 0 ? STUDY[sComp].group : null;
        const isGroupMember = !!dg && dg.indexOf(part.groupId) >= 0 && sFocusK > 0.001;
        const isFocus = sPartNode === part.node && sFocusK > 0.001;
        const isShown = isFocus || isGroupMember;                   // 展示中(移出放大)的零件
        const isStudyDim = sComp >= 0 && !isShown;
        // 子:鏡頭整組繞光學軸原地自轉(展示中的零件停自轉)
        if (part.lensSpin && !isShown) {
          _spinQ.setFromAxisAngle(lensAxis, t * 0.5);
          dest.sub(lensPivot).applyQuaternion(_spinQ).add(lensPivot);
          part.node.quaternion.copy(part.lensBaseQuat).premultiply(_spinQ);
        }
        // 縮放:攤平陳列時縮到「不超過自己的格子」→ 一格一件、絕不重疊;被拆出來的主元件再放大
        if (part.studyScale == null) part.studyScale = 1;
        let knollFit = 1;
        if (sKnollK > 0.001 && _knoll.cellMin > 0) {
          // 全部零件套「同一個」縮放比例 → 維持彼此真實的大小比例(大的還是大、小的還是小),不個別亂調
          // 比例基準:最大的零件剛好塞進一格 → 其餘都比一格小 → 一格一件,保證不重疊
          knollFit = (_knoll.cellMin * 0.92) / Math.max(1e-4, knollMaxSize * _knoll.wS);
        }
        const knollBase = 1 + (knollFit - 1) * sKnollK;
        let tScale = knollBase;
        if (isShown) {
          const shownTgt = dg ? sGroupScale : (isMobile ? 1.55 : 1.75);
          tScale = knollBase + (shownTgt - knollBase) * sFocusK;   // 由陳列尺寸放大到主角尺寸
          if (isFocus && !dg && STUDY[sComp].action === 'iris') tScale *= 0.55 + 0.62 * ez(sub(sActionK, 0.0, 0.42)) - 0.18 * ez(sub(sActionK, 0.55, 0.9));
        }
        part.studyScale += (tScale - part.studyScale) * 0.12;
        // 攤平陳列:正對鏡頭的平面上,一件一格排開(先定姿態再定位置,gcOff 才算得準)
        if (sComp >= 0 && _knoll.slots.length) {
          part.node.quaternion.copy(part.baseQuat);
          if (sKnollK > 0.001 && part.faceLocal) {
            part.node.parent.getWorldQuaternion(_qP);
            _partW.copy(_qP).multiply(part.baseQuat);
            _axisW.copy(part.faceLocal).applyQuaternion(_partW).normalize();   // 零件最薄軸(正面法線)
            _toCam.copy(camera.position).sub(_disp).normalize();
            if (_axisW.dot(_toCam) < 0) _toCam.negate();
            _delta.setFromUnitVectors(_axisW, _toCam);                         // 轉到「面朝鏡頭」= 攤平
            _tgtW.copy(_delta).multiply(_partW);
            _locT.copy(_qP).invert().multiply(_tgtW);
            part.node.quaternion.slerp(_locT, sKnollK);                        // 由 baseQuat 出發 → 回位精確
          }
          if (sKnollK > 0.001) {
            const slot = _knoll.slots[part.knollIdx % _knoll.slots.length];
            _knollW.copy(_disp).addScaledVector(_rgt, slot.nx * _knoll.gridW).addScaledVector(_up2, slot.ny * _knoll.gridH);
            _knollL.copy(_knollW); part.node.parent.worldToLocal(_knollL);
            if (part.gcNode) { _gcOff.copy(part.gcNode).applyQuaternion(part.node.quaternion).multiplyScalar(part.studyScale); _knollL.sub(_gcOff); }
            dest.lerp(_knollL, sKnollK);
          }
        }
        if (isGroupMember) {
          // 主元件整組(鏡桶/機身):置中、放大到填滿畫面、整組轉盤旋轉(換角度看);保持相對排列
          const comp = STUDY[sComp];
          part.node.parent.getWorldQuaternion(_qP);
          _upLocal.set(0, 1, 0).applyQuaternion(_qInv.copy(_qP).invert());   // 世界垂直軸 → 父層 local(繞它轉盤)
          _turnQ.setFromAxisAngle(_upLocal, sTurn);
          _dispL.copy(_disp); part.node.parent.worldToLocal(_dispL);
          _tmpV.copy(part.gcLocal).sub(comp.groupCentroid);                                         // 相對組合中心(組裝態,緊湊)
          _tmpV.applyQuaternion(_turnQ).multiplyScalar(part.studyScale).add(_dispL);                // 轉盤 + 縮放 + 置中
          _gcOff.copy(part.gcLocal).applyQuaternion(_turnQ).multiplyScalar(part.studyScale);
          _tmpV.sub(_gcOff);                                                 // 幾何中心 → node 原點
          dest.lerp(_tmpV, sFocusK);
          _tgtW.copy(_turnQ).multiply(part.baseQuat);
          part.node.quaternion.slerp(_tgtW, sFocusK);                        // 由「陳列姿態」轉到組合姿態;sFocusK→0 時留在陳列姿態(每幀重算,不累積)
        } else if (isFocus) {
          const act = STUDY[sComp].action;
          // 換角度:把單一零件「主面」轉向鏡頭(3/4 視角)清楚呈現;動作繞主面軸疊加
          if (part.faceLocal) {
            part.node.parent.getWorldQuaternion(_qP);
            _partW.copy(_qP).multiply(part.baseQuat);
            _axisW.copy(part.faceLocal).applyQuaternion(_partW).normalize();
            _toCam.copy(camera.position).sub(_disp).normalize();
            _rgtCam.crossVectors(_toCam, _WUP).normalize();
            _tgtAxis.copy(_toCam).applyAxisAngle(_rgtCam, 0.4);
            if (_axisW.dot(_tgtAxis) < 0) _tgtAxis.negate();
            _delta.setFromUnitVectors(_axisW, _tgtAxis);
            const ang = act === 'dial' ? (Math.round(sActionK * 3) / 3) * 0.5 : (act === 'ring' ? sActionK * 0.55 : 0);
            _spin.setFromAxisAngle(_tgtAxis, ang);
            _tgtW.copy(_spin).multiply(_delta).multiply(_partW);
            _locT.copy(_qP).invert().multiply(_tgtW);
            part.node.quaternion.copy(part.baseQuat).slerp(_locT, sFocusK);
          }
          _dispL.copy(_disp); part.node.parent.worldToLocal(_dispL);
          if (part.gcNode) { _gcOff.copy(part.gcNode).applyQuaternion(part.node.quaternion).multiplyScalar(part.studyScale); _dispL.sub(_gcOff); }
          dest.lerp(_dispL, sFocusK);
          if (act === 'press') dest.addScaledVector(_up2, -Math.sin(sActionK * Math.PI) * 0.5);
        }
        if (isShown || Math.abs(part.studyScale - 1) > 0.002) part.node.scale.copy(part.baseScale).multiplyScalar(part.studyScale);
        part.node.position.lerp(dest, isShown ? 0.12 : 0.08);
        const hi = focused || isShown || paperK > 0.4;
        // 子:運作脈動(各零件不同節奏 —— 感光掃描 / 晶片閃爍 / 主機板資料流 / 排線傳輸)
        let op2;
        if (part.groupId === 'sensor') op2 = 0.5 + 0.5 * Math.sin(t * 3.2);
        else if (part.groupId === 'chip') op2 = Math.sin(t * 7) > 0.4 ? 1 : 0.25;
        else if (part.groupId === 'mainboard') op2 = 0.55 + 0.45 * Math.sin(t * 2.1 + i);
        else if (part.groupId === 'ribbon') op2 = 0.5 + 0.5 * Math.sin(t * 4 + i);
        else op2 = 0.7 + 0.3 * Math.sin(t * 1.8 + i * 0.6);
        // 材質(光澤 PBR):solid 主導,線稿階段淡出;emissive 運作微光 + 快門閃
        const intHide = INT_GROUPS.has(part.groupId) ? (1 - R) : 1;   // 組回後隱藏內部零件
        const studyDim = isStudyDim ? (1 - paperK * 0.78) : 1;         // 展示時非聚焦零件降到 ~22%(隨 paperK)
        for (let m = 0; m < part.materials.length; m++) {
          const mat = part.materials[m];
          const mo = solid * (hi ? 1 : 0.9) * intHide * studyDim;
          mat.opacity = mo; mat.depthWrite = mo > 0.6;
          if (mat.emissive) mat.emissiveIntensity = (0.05 + op2 * (focused || isShown ? 0.5 : 0.2) + shot * 0.6) * solid;
        }
        // 白藍圖紙色遮擋面:只在藍圖階段開啟,零件被隱藏時(組回後的內部件)一併關掉
        const fillOn = paperK > 0.06 && intHide > 0.5;
        for (let f = 0; f < part.fills.length; f++) part.fills[f].visible = fillOn;
        // 邊線(發光彩色線稿 → 黑白藍圖線):展示時聚焦零件線條較深、其餘變淡;聚焦零件帶少量橘
        for (let e = 0; e < part.edges.length; e++) {
          const em = part.edges[e];
          em.color.copy(part.baseColor).lerp(BLACK, paperK);
          if (isFocus) em.color.lerp(PQ_ORANGE, 0.32 * sFocusK);
          em.blending = paperK > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
          const wireLine = wireK * (hi ? 0.95 : 0.5) * (0.6 + 0.4 * op2);
          // 展示時的線條層次(壓掉雜線):強調零件 1.0 → 同組其餘 0.4 → 被推開的零件最淡;隨 sFocusK 平順過渡
          const edgeTgt = isFocus ? 1 : (isShown ? 0.4 : 0.24);
          const paperEdge = sComp >= 0 ? 0.85 + (edgeTgt - 0.85) * sFocusK : 0.85;
          em.opacity = Math.max(wireLine * dark, paperK * paperEdge);
        }
        // 拆解連接線
        const attr = part.connector.geometry.getAttribute('position');
        const dx = part.node.position.x - part.home.x, dy = part.node.position.y - part.home.y, dz = part.node.position.z - part.home.z;
        attr.setXYZ(0, part.center.x, part.center.y, part.center.z);
        attr.setXYZ(1, part.center.x + dx, part.center.y + dy, part.center.z + dz);
        attr.needsUpdate = true;
        part.connector.material.color.copy(part.baseColor).lerp(BLACK, paperK);
        part.connector.material.opacity = Math.max(staged * wireK * (hi ? 0.5 : 0.14) * dark, staged * paperK * 0.45) * (1 - sKnollK);   // 攤平陳列時收掉拆解連接線(否則滿畫面放射雜線)
      }
      // 藍圖卡片標註(逐一浮現,組裝回組時淡出)
      if (annotSvg && paperK > 0.02) {
        const W = stage.clientWidth || 1, H = stage.clientHeight || 1;
        annotSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        const fade = 1;
        for (let a = 0; a < annItems.length; a++) {
          const it = annItems[a];
          if (!it.node) { const f = parts.find(pp => pp.groupId === it.cfg.g); it.node = f ? f.node : null; }
          if (!it.node) continue;
          it.node.getWorldPosition(_wp); _wp.project(camera);
          const sx = (_wp.x * 0.5 + 0.5) * W, sy = (-_wp.y * 0.5 + 0.5) * H;
          const lx = it.cfg.ax * W, ly = it.cfg.ay * H;
          const cardX = it.left ? lx : lx - CARDW, cardY = ly - CARDH / 2;
          it.rect.setAttribute('x', cardX.toFixed(1)); it.rect.setAttribute('y', cardY.toFixed(1)); it.rect.setAttribute('width', CARDW); it.rect.setAttribute('height', CARDH);
          it.idxT.setAttribute('x', (cardX + 12).toFixed(1)); it.idxT.setAttribute('y', (cardY + CARDH * 0.27).toFixed(1));
          it.coordT.setAttribute('x', (cardX + CARDW - 12).toFixed(1)); it.coordT.setAttribute('y', (cardY + CARDH * 0.27).toFixed(1));
          it.bizT.setAttribute('x', (cardX + 12).toFixed(1)); it.bizT.setAttribute('y', (cardY + CARDH * 0.58).toFixed(1));
          it.noteT.setAttribute('x', (cardX + 12).toFixed(1)); it.noteT.setAttribute('y', (cardY + CARDH * 0.84).toFixed(1));
          const edgeX = it.left ? cardX + CARDW : cardX;
          it.lead.setAttribute('points', edgeX.toFixed(1) + ',' + (cardY + CARDH / 2).toFixed(1) + ' ' + sx.toFixed(1) + ',' + sy.toFixed(1));
          it.dot.setAttribute('cx', sx.toFixed(1)); it.dot.setAttribute('cy', sy.toFixed(1));
          const q = it.node.position;
          it.coordT.textContent = 'X ' + q.x.toFixed(2) + ' Y ' + q.y.toFixed(2) + ' Z ' + q.z.toFixed(2);
          const rev = ez(sub(p, it.cfg.reveal, it.cfg.reveal + 0.035)) * fade;
          it.g.setAttribute('opacity', rev.toFixed(3));
        }
      }
      // U4 螢幕看影片:翻面完成 → 左側業務字卡 + LCD 螢幕亮起播影片 + 快門閃光切換
      const reviewK = ez(sub(p, 0.66, 0.74)) * (1 - ez(sub(p, 0.89, 0.94)));   // 左側字卡:翻面途中即可進場
      // 螢幕影片只在「翻面完成、停在最終角度」後才亮起(不在旋轉途中滑入,避免脫離螢幕)
      const screenK = ez(sub(scrollP, 0.72, 0.78)) * (1 - ez(sub(scrollP, 0.89, 0.94)));   // 用 scrollP,相機就位後影片即現(淡入交給 shotFadeK)
      if (reviewEl) { reviewEl.style.opacity = reviewK.toFixed(3); reviewEl.style.pointerEvents = reviewK > 0.5 ? 'auto' : 'none'; }
      if (canvas) canvas.style.opacity = (1 - reviewK * 0.4).toFixed(3);   // 影片時把 3D 相機壓暗當背景
      if (reviewK > 0.02) {
        const si = Math.max(0, Math.min(vids.length - 1, Math.floor((scrollP - 0.72) / ((0.92 - 0.72) / Math.max(1, vids.length)))));
        setShot(si, now);
      } else if (curShot !== -2) { setShot(-1, now); }
      // DOM 影片螢幕:每幀把「螢幕面 mesh(Object_12)」前面圓角控制點投影到畫面像素 → 設定裁切容器 + clip-path
      if (screenMesh && screenEl && screenLocalPts.length >= 4) {
        const shotFadeK = shotFadeStart < 0 ? 1 : ez(clamp((now - shotFadeStart) / 420, 0, 1));
        const vidK = screenK * settleK * shotFadeK;   // 就位後原地淡入 + 每支影片切換原地淡入
        if (vidK < 0.004) {
          screenEl.style.opacity = '0';
        } else {
          screenMesh.updateWorldMatrix(true, false);
          const SW = stage.clientWidth || 1, SH = stage.clientHeight || 1;
          const N = screenLocalPts.length;
          let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
          for (let i = 0; i < N; i++) {
            _wp.copy(screenLocalPts[i]).applyMatrix4(screenMesh.matrixWorld).project(camera);
            const x = (_wp.x * 0.5 + 0.5) * SW, y = (-_wp.y * 0.5 + 0.5) * SH;
            _scrPx[i].x = x; _scrPx[i].y = y;
            if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
          }
          const bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
          screenEl.style.left = minX.toFixed(1) + 'px'; screenEl.style.top = minY.toFixed(1) + 'px';
          screenEl.style.width = bw.toFixed(1) + 'px'; screenEl.style.height = bh.toFixed(1) + 'px';
          let poly = '';
          for (let i = 0; i < N; i++) poly += (_scrPx[i].x - minX).toFixed(1) + 'px ' + (_scrPx[i].y - minY).toFixed(1) + 'px' + (i < N - 1 ? ', ' : '');
          screenEl.style.clipPath = 'polygon(' + poly + ')';
          screenEl.style.opacity = vidK.toFixed(3);
          if (dbgRedEl) dbgRedEl.setAttribute('points', _scrPx.map(pp => pp.x.toFixed(1) + ',' + pp.y.toFixed(1)).join(' '));
          if (dbgBlueEl) {   // 藍=螢幕 mesh bounding box 前面矩形(未斜切),當開口參考
            const b = screenMesh.geometry.boundingBox, z = b.min.z;
            const rc = [[b.min.x, b.max.y, z], [b.max.x, b.max.y, z], [b.max.x, b.min.y, z], [b.min.x, b.min.y, z]].map(c => {
              _wp.set(c[0], c[1], c[2]).applyMatrix4(screenMesh.matrixWorld).project(camera);
              return ((_wp.x * 0.5 + 0.5) * SW).toFixed(1) + ',' + ((-_wp.y * 0.5 + 0.5) * SH).toFixed(1);
            });
            dbgBlueEl.setAttribute('points', rc.join(' '));
          }
        }
      }
      // 互動式四角拖曳工具:把 4 角投影到畫面定位藍點手把 + 更新可複製數值
      if (_ctOn && _ctEls && cornerLocal && screenMesh) {
        screenMesh.updateWorldMatrix(true, false);
        const el = renderer.domElement, SW = el.clientWidth || 1, SH = el.clientHeight || 1, rect = el.getBoundingClientRect();
        for (let i = 0; i < 4; i++) {
          _wp.set(cornerLocal[i][0], cornerLocal[i][1], cornerLocal[i][2]).applyMatrix4(screenMesh.matrixWorld).project(camera);
          _ctEls.handles[i].style.left = ((_wp.x * 0.5 + 0.5) * SW + rect.left).toFixed(1) + 'px';
          _ctEls.handles[i].style.top = ((-_wp.y * 0.5 + 0.5) * SH + rect.top).toFixed(1) + 'px';
        }
        _ctEls.read.value = 'const SCR_CORNERS_HARD = ' + JSON.stringify(cornerLocal) + ';';
      }
      if (lensTitleEl) lensTitleEl.style.setProperty('--k', summaryK.toFixed(3));   // U3c 組裝完成鏡頭總結標題
      if (sloganEl) sloganEl.style.setProperty('--k', sloganK.toFixed(3));   // U5 Slogan 進度
      dust.rotation.y = t * 0.016; dust.rotation.z = -t * 0.008;
      dust.material.opacity = 0.32 * dark * wireK;
      grid.material.transparent = true; grid.material.opacity = dark;
      orangeL.intensity = (15 + Math.sin(t * 2.7) * 3 + shot * 26) * (0.4 + 0.6 * dark);
      if (bloomPass) bloomPass.strength = (0.32 + wireK * 0.28 + shot * 1.4) * dark;
      if (composer && paperK < 0.6) composer.render(); else renderer.render(scene, camera);
    });
  }

  return { start, destroy };
}
