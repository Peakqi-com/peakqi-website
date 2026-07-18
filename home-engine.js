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
    const scrimEl = document.getElementById('pq-hero-scrim');
    const noiseEl = hero && hero.querySelector('.pq-cine-noise');
    const annotSvg = hero && hero.querySelector('[data-cine-annot]');
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
    StickyProductStage(ctx, hero, stage, { distanceVh: isMobile ? 520 : 720 });

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
    const BLACK = new THREE.Color(0x141414);
    // U1 鏡頭自轉:光學軸/樞紐(load 時算)+ 暫存四元數
    const lensAxis = new THREE.Vector3(1, 0, 0), lensPivot = new THREE.Vector3(), _spinQ = new THREE.Quaternion();
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
      const materials = [], edges = [];
      node.traverse(obj => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.frustumCulled = false;
        const src = Array.isArray(obj.material) ? obj.material : [obj.material];
        const clones = src.map(m => { const c = m.clone(); c.transparent = true; c.opacity = 0; c.depthWrite = false; materials.push(c); return c; });
        obj.material = Array.isArray(obj.material) ? clones : clones[0];
        const em = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthTest: true });
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(obj.geometry, 24), em); edge.renderOrder = 4; obj.add(edge); edges.push(em);
      });
      return { materials, edges };
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
          parts.push({ node, name: node.name, groupId: rule.id, center, home, offset, delay: Math.min(index * 0.014, 0.5), materials: vis.materials, edges: vis.edges, connector, baseColor: new THREE.Color(rule.color) });
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
    const CONTENT_END = 0.60, OFF = 0.62;

    const t0 = performance.now();
    ctx.onFrame((now) => {
      if (destroyed || !bound.inView) return;
      const t = (now - t0) / 1000;
      smoothP += (scrollP - smoothP) * 0.06;
      const p = smoothP;
      const beat = Math.max(0, Math.min(BEATS - 1, Math.floor((scrollP / CONTENT_END) * BEATS)));
      setBeat(beat);
      setPhase(p < 0.10 ? 0 : p < 0.34 ? 1 : p < 0.62 ? 2 : p < 0.82 ? 3 : 4);
      // 母:representation 轉場
      const disasK = ez(sub(p, 0.10, 0.44));        // 拆解(適度、在框內)
      const wireK = ez(sub(p, 0.34, 0.56));         // 光澤PBR → 發光彩色線稿
      const paperK = ez(sub(p, 0.62, 0.80));        // 彩色線稿 → 黑白宣紙藍圖
      const dark = 1 - paperK;
      const solid = 1 - wireK;                       // 材質(光澤)存在度
      const focusSet = cardFocus[beat] || new Set();
      // 子:快門捕捉閃光(暗場循環)
      const scy = t % 5.2, shot = scy < 0.16 ? (1 - scy / 0.16) : 0;
      // 背景/疊層切換
      if (paperEl) paperEl.style.opacity = paperK.toFixed(3);
      if (annotSvg) annotSvg.style.opacity = (paperK > 0.05 ? 1 : 0);
      if (scrimEl) scrimEl.style.opacity = dark.toFixed(3);
      if (noiseEl) noiseEl.style.opacity = (dark * 0.16).toFixed(3);
      hero.classList.toggle('pq-cine-paper-on', paperK > 0.55);
      // 母:旋轉(有界擺動)→ 藍圖俯視
      const spinY = -0.5 + Math.sin(p * Math.PI * 3.0) * 0.5 + pointer.x * 0.06;
      const tiltX = -0.14 + Math.sin(p * Math.PI * 1.8) * 0.14 - pointer.y * 0.04;
      rig.rotation.y += ((spinY * dark + (-0.5) * paperK) - rig.rotation.y) * 0.05;
      rig.rotation.x += ((tiltX * dark + (-0.95) * paperK) - rig.rotation.x) * 0.05;
      rig.rotation.z = Math.sin(p * Math.PI * 1.6) * 0.04 * dark;
      const align = cards[beat] && cards[beat].getAttribute('data-align');
      const targetX = (isMobile ? 0 : (align === 'right' ? -0.8 : 0.8)) * dark;
      rig.position.x += (targetX - rig.position.x) * 0.04;
      rig.position.y += (((isMobile ? 0.8 : 0) * dark) - rig.position.y) * 0.04;
      rig.scale.setScalar((isMobile ? 0.62 : 0.92) * (1 - disasK * 0.1) * (1 - paperK * (isMobile ? 0.3 : 0.22)));
      camera.position.z = (isMobile ? 13.4 : 11.8) + disasK * 0.8 + paperK * 2.2;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const focused = focusSet.has(part.groupId);
        // 拆解:所有零件適度散開(在框內),之後保持
        const staged = ez((disasK - part.delay * 0.5) / Math.max(0.3, 1 - part.delay * 0.5));
        const dest = part.home.clone().addScaledVector(part.offset, staged * OFF);
        // 子:鏡頭整組繞光學軸原地自轉(拆解時零件亦一起旋)
        if (part.lensSpin) {
          _spinQ.setFromAxisAngle(lensAxis, t * 0.5);
          dest.sub(lensPivot).applyQuaternion(_spinQ).add(lensPivot);
          part.node.quaternion.copy(part.lensBaseQuat).premultiply(_spinQ);
        }
        part.node.position.lerp(dest, 0.08);
        const hi = focused || paperK > 0.4;
        // 子:運作脈動(各零件不同節奏 —— 感光掃描 / 晶片閃爍 / 主機板資料流 / 排線傳輸)
        let op2;
        if (part.groupId === 'sensor') op2 = 0.5 + 0.5 * Math.sin(t * 3.2);
        else if (part.groupId === 'chip') op2 = Math.sin(t * 7) > 0.4 ? 1 : 0.25;
        else if (part.groupId === 'mainboard') op2 = 0.55 + 0.45 * Math.sin(t * 2.1 + i);
        else if (part.groupId === 'ribbon') op2 = 0.5 + 0.5 * Math.sin(t * 4 + i);
        else op2 = 0.7 + 0.3 * Math.sin(t * 1.8 + i * 0.6);
        // 材質(光澤 PBR):solid 主導,線稿階段淡出;emissive 運作微光 + 快門閃
        for (let m = 0; m < part.materials.length; m++) {
          const mat = part.materials[m];
          const mo = solid * (hi ? 1 : 0.9);
          mat.opacity = mo; mat.depthWrite = mo > 0.6;
          if (mat.emissive) mat.emissiveIntensity = (0.05 + op2 * (focused ? 0.5 : 0.2) + shot * 0.6) * solid;
        }
        // 邊線(發光彩色線稿 → 黑白):運作脈動
        for (let e = 0; e < part.edges.length; e++) {
          const em = part.edges[e];
          em.color.copy(part.baseColor).lerp(BLACK, paperK);
          em.blending = paperK > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
          const wireLine = wireK * (hi ? 0.95 : 0.5) * (0.6 + 0.4 * op2);
          em.opacity = Math.max(wireLine * dark, paperK * 0.85);
        }
        // 拆解連接線
        const attr = part.connector.geometry.getAttribute('position');
        const dx = part.node.position.x - part.home.x, dy = part.node.position.y - part.home.y, dz = part.node.position.z - part.home.z;
        attr.setXYZ(0, part.center.x, part.center.y, part.center.z);
        attr.setXYZ(1, part.center.x + dx, part.center.y + dy, part.center.z + dz);
        attr.needsUpdate = true;
        part.connector.material.color.copy(part.baseColor).lerp(BLACK, paperK);
        part.connector.material.opacity = Math.max(staged * wireK * (hi ? 0.5 : 0.14) * dark, staged * paperK * 0.45);
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
