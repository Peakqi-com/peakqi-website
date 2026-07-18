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


  // ---------- 幕1 Hero:爆炸攝影機捲動分鏡(母=捲動組裝/爆炸/切章,子=時間邊線閃爍/微塵/光脈衝) ----------
  async function mountCinema() {
    const hero = document.getElementById('hero');
    const stage = hero && hero.querySelector('[data-cine-stage]');
    const canvas = document.getElementById('pq-hero-gl');
    const cards = hero ? Array.from(hero.querySelectorAll('[data-cine-card]')).sort((a, b) => (+a.dataset.cineCard) - (+b.dataset.cineCard)) : [];
    const railWrap = hero && hero.querySelector('[data-cine-rail]');
    const labelText = hero && hero.querySelector('[data-cine-labeltext]');
    if (!hero || !stage || !canvas || cards.length < 2) return;
    const BEATS = cards.length; // 6:0=開場 + 1..5 分鏡

    let okgl = false;
    try { const pr = document.createElement('canvas'); okgl = !!(pr.getContext('webgl2') || pr.getContext('webgl') || pr.getContext('experimental-webgl')); } catch (e) {}
    if (!okgl) return; // 無 WebGL:保留堆疊 + SVG 降級

    let THREE;
    try { THREE = await import('three'); }
    catch (e) { try { THREE = await import(/* @vite-ignore */ THREE_URL); } catch (e2) { return; } }
    if (destroyed) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch (e) { return; }

    const isMobile = ctx.mobile;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    // 接管:切成 pinned 分鏡
    hero.classList.add('pq-cine-on');
    canvas.style.opacity = '1';
    StickyProductStage(ctx, hero, stage, { distanceVh: isMobile ? 300 : 400 });

    // rail 按鈕(01..05)
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

    // 場景
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090B0E, 0.03);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.15, 11.8);
    scene.add(new THREE.AmbientLight(0xdce9ff, 1.05));
    const key = new THREE.PointLight(0xFF6B2C, 17, 24, 1.5); key.position.set(2, 4, 5); scene.add(key);
    const rim = new THREE.PointLight(0x3E9BFF, 13, 20, 1.4); rim.position.set(-5, -2, 4); scene.add(rim);
    const fillLight = new THREE.PointLight(0x65E0BC, 7, 18, 1.6); fillLight.position.set(0, -3, -4); scene.add(fillLight);

    // 真 bloom(UnrealBloom;桌機才開,失敗則退回直接 render)
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
          bloomPass = new UnrealBloomPass(new THREE.Vector2(stage.clientWidth || 1, stage.clientHeight || 1), 0.6, 0.5, 0.22);
          composer.addPass(bloomPass);
        }
      } catch (e) { composer = null; bloomPass = null; }
    }
    if (destroyed) return;

    const rig = new THREE.Group();
    rig.position.set(1.5, 0, 0);
    rig.rotation.set(-0.15, -0.52, 0.03);
    scene.add(rig);
    const connectors = new THREE.Group(); rig.add(connectors);

    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const gg = c.getContext('2d');
      const gr = gg.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      gg.fillStyle = gr; gg.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();

    const parts = [], glows = [];
    function addGlow(parent, color, scale, pos) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.setScalar(scale); if (pos) s.position.set(pos[0], pos[1], pos[2]); parent.add(s); glows.push(s); return s;
    }
    function addPart(geo, position, rotation, offset, color, glow) {
      const part = new THREE.Group();
      const fillMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x1b1f26, metalness: 0.5, roughness: 0.42, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 18), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
      part.add(fillMesh, edges);
      part.position.set(position[0], position[1], position[2]);
      part.rotation.set(rotation[0], rotation[1], rotation[2]);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(position[0], position[1], position[2]), new THREE.Vector3(position[0], position[1], position[2])]);
      const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xFF6B2C, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
      connectors.add(line);
      part.userData = { home: new THREE.Vector3(position[0], position[1], position[2]), offset: new THREE.Vector3(offset[0], offset[1], offset[2]), delay: parts.length * 0.03, line, edges };
      parts.push(part); rig.add(part);
      if (glow) addGlow(part, glow[0], glow[1], glow[2]);
      return part;
    }
    const HP = Math.PI / 2;
    // === 機身 ===
    addPart(new THREE.BoxGeometry(3.4, 2.16, 1.5, 3, 2, 2), [0, 0, 0], [0, 0, 0], [0.1, 0.1, -0.4], 0xFF6B2C);         // 機身主體
    addPart(new THREE.BoxGeometry(3.32, 0.2, 1.44), [0, 1.18, 0], [0, 0, 0], [0, 2.2, -0.2], 0xF2EFE8);               // 頂蓋
    addPart(new THREE.BoxGeometry(3.36, 0.16, 1.42), [0, -1.16, 0], [0, 0, 0], [0, -2.3, -0.25], 0xF2EFE8);           // 底座
    addPart(new THREE.BoxGeometry(0.8, 2.12, 1.28), [1.42, 0, 0.14], [0, 0, 0], [3.35, -0.3, 0.6], 0xFF6B2C);          // 握把
    // === 鏡頭(前方 -x,同軸堆疊)===
    addPart(new THREE.CylinderGeometry(0.86, 0.94, 0.92, 44, 1, true), [-1.98, 0, 0.02], [0, 0, HP], [-2.5, 0, 0.1], 0xFF6B2C);   // 鏡筒
    addPart(new THREE.TorusGeometry(0.86, 0.08, 16, 46), [-2.42, 0, 0.02], [0, HP, 0], [-3.1, 0.1, 0.3], 0xF2EFE8);              // 對焦環
    addPart(new THREE.CylinderGeometry(0.66, 0.78, 0.66, 44, 1, true), [-2.72, 0, 0.02], [0, 0, HP], [-3.5, 0.05, 0.2], 0xFF8A4C); // 鏡頭中節
    addPart(new THREE.TorusGeometry(0.68, 0.06, 16, 46), [-3.04, 0, 0.02], [0, HP, 0], [-4.0, 0.1, 0.35], 0xF2EFE8);             // 前端環
    addPart(new THREE.CylinderGeometry(0.94, 0.74, 0.5, 44, 1, true), [-3.3, 0, 0.02], [0, 0, HP], [-4.75, 0.15, 0.62], 0xF2EFE8); // 遮光罩
    addPart(new THREE.CircleGeometry(0.64, 46), [-3.52, 0, 0.02], [0, -HP, 0], [-5.25, 0.05, 0.5], 0x3E9BFF, [0x3E9BFF, 1.3, [0, 0, -0.06]]); // 前玉(發光)
    // === 觀景窗五稜鏡(頂部)===
    addPart(new THREE.CylinderGeometry(0.34, 0.66, 0.64, 4, 1), [-0.18, 1.52, 0.04], [0, Math.PI / 4, 0], [0, 3.1, -0.3], 0xFF6B2C); // 五稜鏡凸起
    addPart(new THREE.BoxGeometry(0.48, 0.16, 0.42), [-0.18, 1.9, 0.04], [0, 0, 0], [0, 3.75, -0.15], 0xF2EFE8);      // 熱靴
    addPart(new THREE.BoxGeometry(0.52, 0.44, 0.34), [-0.18, 1.42, -0.7], [0, 0, 0], [-0.4, 2.9, -1.7], 0xF2EFE8);    // 觀景窗目鏡
    // === 頂部控制 ===
    addPart(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 30), [1.22, 1.32, -0.4], [0, 0, 0], [1.9, 3.0, -1.2], 0xF2EFE8);         // 模式轉盤
    addPart(new THREE.CylinderGeometry(0.18, 0.18, 0.15, 26), [1.34, 1.3, 0.42], [0, 0, 0], [2.6, 2.9, 1.2], 0xFF6B2C, [0xFF6B2C, 0.45, [0, 0.22, 0]]); // 快門鈕(發光)
    addPart(new THREE.SphereGeometry(0.11, 20, 16), [0.86, 1.3, 0.5], [0, 0, 0], [1.4, 2.7, 1.35], 0xFF6B2C);         // 錄影鈕
    // === 背面 ===
    addPart(new THREE.BoxGeometry(0.12, 1.42, 2.0), [1.65, -0.04, 0], [0, 0, 0], [3.5, 0, -0.5], 0x3E9BFF, [0x3E9BFF, 0.7, [0.12, 0, 0]]); // LCD 螢幕(發光)
    // === 內部(爆炸時露出)===
    addPart(new THREE.BoxGeometry(0.12, 1.2, 1.1), [-0.95, 0, 0], [0, 0, 0], [-1.2, 0, 2.7], 0x3E9BFF);               // 感光元件
    const board = addPart(new THREE.BoxGeometry(0.14, 1.5, 1.15), [0.4, 0, 0], [0, 0, 0], [0.7, 0.1, -3.0], 0x65E0BC, [0x65E0BC, 0.9, [0.1, 0, 0]]); // 主機板
    for (let i = 0; i < 8; i++) {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15 + (i % 3) * 0.05, 0.2), new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xFF6B2C : i % 3 === 1 ? 0x3E9BFF : 0x65E0BC }));
      chip.position.set(-0.11, -0.56 + i * 0.17, -0.42 + (i % 3) * 0.34); board.add(chip);
    }
    const gear = addPart(new THREE.TorusGeometry(0.4, 0.12, 8, 28), [0.4, 0, 0.45], [0, HP, 0], [1.0, 1.6, -2.4], 0x65E0BC, [0x65E0BC, 0.7, [0, 0, 0]]); // 資料飛輪
    addPart(new THREE.BoxGeometry(0.72, 1.5, 0.7), [1.05, -0.12, 0], [0, 0, 0], [2.4, -0.6, -2.5], 0xF2EFE8);          // 電池
    // === 背帶環 ===
    addPart(new THREE.BoxGeometry(0.14, 0.16, 0.34), [-1.55, 1.02, 0.55], [0, 0, 0], [-2.6, 2.4, 1.0], 0xF2EFE8);
    addPart(new THREE.BoxGeometry(0.14, 0.16, 0.34), [1.55, 1.02, 0.55], [0, 0, 0], [2.8, 2.4, 1.0], 0xF2EFE8);

    // 微塵 + 地面格線
    const dustGeo = new THREE.BufferGeometry();
    const dpos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) { dpos[i * 3] = (Math.random() - 0.5) * 13; dpos[i * 3 + 1] = (Math.random() - 0.5) * 7.5; dpos[i * 3 + 2] = (Math.random() - 0.5) * 6; }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xFF6B2C, size: 0.02, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(dust);
    const grid = new THREE.GridHelper(24, 30, 0x3c281f, 0x16191e); grid.position.y = -3.2; scene.add(grid);

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
      try { renderer.dispose(); glowTex.dispose(); } catch (e) {}
    });

    let scrollP = 0, smoothP = 0, curBeat = -1;
    ScrollChapter(ctx, hero, (p) => { scrollP = p; }, { pinned: true });
    const bound = { inView: true };
    ctx.io(hero, es => { bound.inView = !!(es[0] && es[0].isIntersecting); }, { rootMargin: '10px' });

    function setBeat(b) {
      if (b === curBeat) return; curBeat = b;
      cards.forEach((c, i) => c.classList.toggle('is-active', i === b));
      railBtns.forEach((btn, i) => btn.classList.toggle('active', (i + 1) === b));
      if (labelText) { const a = cards[b]; labelText.textContent = (a && a.getAttribute('data-eyebrow')) || 'ENGINE · ONLINE'; }
    }
    setBeat(0);

    const t0 = performance.now();
    ctx.onFrame((now) => {
      if (destroyed || !bound.inView) return;
      const t = (now - t0) / 1000;
      smoothP += (scrollP - smoothP) * 0.075;
      const p = smoothP;
      setBeat(Math.max(0, Math.min(BEATS - 1, Math.floor(scrollP * BEATS))));
      // 節奏:第 0 幕維持完整組裝(先讓人看清是相機),0.17 之後才開始爆炸
      const explosion = ez(sub(p, 0.16, 0.9));
      rig.rotation.y += ((-0.5 + p * Math.PI * 1.7 + pointer.x * 0.07) - rig.rotation.y) * 0.045;
      rig.rotation.x += ((-0.12 + Math.sin(p * Math.PI * 2.2) * 0.16 - pointer.y * 0.045) - rig.rotation.x) * 0.045;
      rig.rotation.z = Math.sin(p * Math.PI * 2.6) * 0.05;
      // 相機依目前分鏡卡片位置左右讓位(卡片在右→相機往左,避免重疊)
      const targetX = isMobile ? 0 : ((curBeat === 2 || curBeat === 4) ? -1.35 : 1.35);
      rig.position.x += (targetX - rig.position.x) * 0.04;
      rig.position.y = isMobile ? 1.15 : Math.sin(p * Math.PI * 2) * 0.14;
      rig.scale.setScalar(isMobile ? 0.68 : 0.98);
      parts.forEach((part, index) => {
        const staged = ez((explosion - part.userData.delay) / 0.72);
        const dest = part.userData.home.clone().addScaledVector(part.userData.offset, staged);
        part.position.lerp(dest, 0.08);
        const flick = 0.72 + Math.sin(t * 4.1 + index * 1.7) * 0.2;
        part.userData.edges.material.opacity = flick;
        const attr = part.userData.line.geometry.getAttribute('position');
        attr.setXYZ(0, part.userData.home.x, part.userData.home.y, part.userData.home.z);
        attr.setXYZ(1, part.position.x, part.position.y, part.position.z);
        attr.needsUpdate = true;
        part.userData.line.material.opacity = staged * 0.42 * flick;
      });
      gear.rotation.z = t * 0.9;
      dust.rotation.y = t * 0.02; dust.rotation.z = -t * 0.01;
      key.intensity = 15 + Math.sin(t * 2.6) * 3;
      glows.forEach((s, i) => { s.material.opacity = 0.42 + 0.28 * Math.sin(t * 2.4 + i * 1.3); });
      if (bloomPass) bloomPass.strength = 0.5 + Math.sin(t * 1.8) * 0.07 + explosion * 0.18;
      if (composer) composer.render(); else renderer.render(scene, camera);
    });
  }

  return { start, destroy };
}
