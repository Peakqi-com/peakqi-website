"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const chapters = [
  {
    id: "engine",
    no: "01",
    eyebrow: "CORE ENGINE",
    title: "一套引擎，\n驅動 47 個 AI 模組",
    body: "PeakQi 把接客、CRM、行銷、報價、專案與數據收進同一套營運底層，讓中小企業不再切換五六個工具。",
    tags: ["AI 業務模組引擎", "共用資料核心", "24/7 自動運轉"],
  },
  {
    id: "crm",
    no: "02",
    eyebrow: "ACQUISITION / CRM",
    title: "從接客開始，\n一路追蹤到成交",
    body: "自動回覆、異議處理、持續跟進、養客與 CRM 共用同一份客戶脈絡。訊息不漏接，關係不中斷。",
    tags: ["AI 接客", "客戶追蹤", "標籤與分群"],
  },
  {
    id: "creative",
    no: "03",
    eyebrow: "CREATIVE / KNOWLEDGE",
    title: "內容會生成，\n更懂你的產業",
    body: "文字、圖片、影片與產業知識庫彼此連動。不是多一個聊天機器人，而是能把情境做深的創意工作流。",
    tags: ["行銷內容", "AI 圖片・影片", "產業知識庫"],
  },
  {
    id: "ops",
    no: "04",
    eyebrow: "PROJECT / OPERATIONS",
    title: "專案、報價、數據，\n在同一個視野裡",
    body: "從報價到執行、從專案財務到管理月報，資訊回到同一座營運駕駛艙，讓每個決定都有依據。",
    tags: ["專案報價", "財務管理", "營運儀表板"],
  },
  {
    id: "brands",
    no: "05",
    eyebrow: "ONE ENGINE / MANY FACES",
    title: "一套底層，\n長出多個產業品牌",
    body: "Peak Ops 服務通用中小企業；冒泡、AI Wedding Pro、AI Interior Pro 則把知識與工作流做進垂直場景。",
    tags: ["通用型 SaaS", "垂直產業品牌", "共用底層引擎"],
  },
  {
    id: "adoption",
    no: "06",
    eyebrow: "INDUSTRY ADOPTION",
    title: "導入夠深，\n架構依然保持乾淨",
    body: "從知識庫、產業話術、流程標籤到介面語言，PeakQi 用微客製把系統貼近現場；需要跨界開發時，再走獨立專案線。",
    tags: ["知識庫建置", "話術產業化", "流程微客製"],
  },
  {
    id: "proof",
    no: "07",
    eyebrow: "DUAL PROOF",
    title: "產品自己跑，\n市場也願意買",
    body: "自家垂直品牌驗證產品深度，Peak Ops 外部客戶驗證 SaaS 市場。雙軌證明，指向同一個 AI 營運平台。",
    tags: ["場景驗證", "SaaS ARR", "平台護城河"],
  },
];

type ModelPart = THREE.Group & {
  userData: {
    home: THREE.Vector3;
    offset: THREE.Vector3;
    delay: number;
    line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  };
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function ease(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function CameraBlueprint({ active }: { active: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08090b, 0.035);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.15, 11.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x08090b, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      1.25,
      0.72,
      0.18,
    );
    composer.addPass(bloom);

    scene.add(new THREE.AmbientLight(0xdce9ff, 1.1));
    const key = new THREE.PointLight(0xfe6a2d, 18, 22, 1.5);
    key.position.set(2, 4, 5);
    scene.add(key);
    const rim = new THREE.PointLight(0x72e6ff, 15, 18, 1.4);
    rim.position.set(-5, -2, 4);
    scene.add(rim);

    const rig = new THREE.Group();
    rig.position.set(1.5, 0, 0);
    rig.rotation.set(-0.15, -0.52, 0.03);
    scene.add(rig);

    const parts: ModelPart[] = [];
    const connectors = new THREE.Group();
    rig.add(connectors);

    const addPart = (
      geometry: THREE.BufferGeometry,
      position: [number, number, number],
      rotation: [number, number, number],
      offset: [number, number, number],
      color = 0xfe6a2d,
    ) => {
      const part = new THREE.Group() as ModelPart;
      const fill = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: 0x17191e,
          metalness: 0.75,
          roughness: 0.24,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
        }),
      );
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 18),
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.92,
          blending: THREE.AdditiveBlending,
        }),
      );
      part.add(fill, edges);
      part.position.set(...position);
      part.rotation.set(...rotation);

      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...position),
        new THREE.Vector3(...position),
      ]);
      const line = new THREE.Line(
        lineGeometry,
        new THREE.LineBasicMaterial({
          color: 0xfe6a2d,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
        }),
      );
      connectors.add(line);

      part.userData = {
        home: new THREE.Vector3(...position),
        offset: new THREE.Vector3(...offset),
        delay: parts.length * 0.035,
        line,
      };
      parts.push(part);
      rig.add(part);
      return part;
    };

    // Main chassis and outer shell
    addPart(new THREE.BoxGeometry(3.55, 2.28, 1.52, 2, 2, 2), [0, 0, 0], [0, 0, 0], [0.1, 0.1, -0.4], 0xff7b42);
    addPart(new THREE.BoxGeometry(3.2, 0.22, 1.4), [0, 1.25, 0], [0, 0, 0], [0, 2.15, -0.2], 0xffffff);
    addPart(new THREE.BoxGeometry(3.25, 0.18, 1.36), [0, -1.23, 0], [0, 0, 0], [0, -2.2, -0.25], 0xffffff);
    addPart(new THREE.BoxGeometry(0.18, 2.05, 1.35), [1.78, 0, 0], [0, 0, 0], [2.8, 0.2, 0.3], 0xffffff);

    // Lens assembly — the optical entry point
    addPart(new THREE.CylinderGeometry(0.9, 1.04, 1.15, 28, 1, true), [-2.15, 0, 0.15], [Math.PI / 2, 0, 0], [-2.2, 0, 0.1], 0xfe6a2d);
    addPart(new THREE.CylinderGeometry(0.64, 0.74, 0.74, 28, 1, true), [-2.9, 0, 0.15], [Math.PI / 2, 0, 0], [-3.05, 0.05, 0.2], 0xffab7f);
    addPart(new THREE.TorusGeometry(0.64, 0.055, 8, 32), [-3.28, 0, 0.15], [0, 0, 0], [-3.9, 0.1, 0.35], 0xffffff);
    addPart(new THREE.CircleGeometry(0.55, 32), [-3.34, 0, 0.15], [0, Math.PI / 2, 0], [-4.35, 0.05, 0.5], 0x72e6ff);

    // Sensor, logic board and battery
    addPart(new THREE.BoxGeometry(0.12, 1.18, 1.08), [-0.88, 0, 0.08], [0, 0, 0], [-1.1, 0, 2.5], 0x72e6ff);
    const board = addPart(new THREE.BoxGeometry(0.14, 1.62, 1.2), [0.36, 0, 0], [0, 0, 0], [0.6, 0.1, -2.8], 0x72e6ff);
    for (let i = 0; i < 7; i += 1) {
      const chip = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.18 + (i % 3) * 0.05, 0.2),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xfe6a2d : 0x72e6ff }),
      );
      chip.position.set(-0.1, -0.58 + i * 0.19, -0.42 + (i % 3) * 0.36);
      board.add(chip);
    }
    addPart(new THREE.BoxGeometry(0.8, 1.58, 0.72), [1.28, -0.06, 0], [0, 0, 0], [2.4, -0.45, -2.35], 0xffffff);

    // Display, viewfinder, shutter and controls
    addPart(new THREE.BoxGeometry(2.18, 1.35, 0.12), [0.05, 0, -0.84], [0, 0, 0], [0.15, 0.15, -4.3], 0x72e6ff);
    addPart(new THREE.BoxGeometry(0.92, 0.55, 0.78), [0.65, 1.38, -0.05], [0, 0, 0], [0.9, 3.25, -0.8], 0xfe6a2d);
    addPart(new THREE.CylinderGeometry(0.25, 0.25, 0.16, 20), [-0.9, 1.32, 0.14], [0, 0, Math.PI / 2], [-1.55, 2.85, 0.6], 0xffffff);
    addPart(new THREE.SphereGeometry(0.13, 16, 12), [1.23, 1.25, 0.46], [0, 0, 0], [2.35, 2.65, 1.05], 0xfe6a2d);

    // Floating calibration points
    const pointsGeometry = new THREE.BufferGeometry();
    const points = new Float32Array(210 * 3);
    for (let i = 0; i < 210; i += 1) {
      points[i * 3] = (Math.random() - 0.5) * 12;
      points[i * 3 + 1] = (Math.random() - 0.5) * 7;
      points[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
    const dust = new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({
        color: 0xfe6a2d,
        size: 0.018,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(dust);

    const grid = new THREE.GridHelper(22, 32, 0x3c281f, 0x16191e);
    grid.position.y = -3.15;
    grid.rotation.z = 0.02;
    scene.add(grid);

    let animationFrame = 0;
    let currentProgress = 0;
    const clock = new THREE.Clock();

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current = max > 0 ? window.scrollY / max : 0;
    };
    const onPointer = (event: PointerEvent) => {
      pointerRef.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerRef.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const onResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      currentProgress += (progressRef.current - currentProgress) * 0.055;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const p = reduced ? progressRef.current : currentProgress;
      const explosion = ease((p - 0.08) / 0.62);

      rig.rotation.y += ((-0.52 + p * Math.PI * 2.32 + pointerRef.current.x * 0.08) - rig.rotation.y) * 0.05;
      rig.rotation.x += ((-0.15 + Math.sin(p * Math.PI * 2.5) * 0.22 - pointerRef.current.y * 0.05) - rig.rotation.x) * 0.05;
      rig.rotation.z = Math.sin(p * Math.PI * 3) * 0.08;
      const desktop = window.innerWidth > 820;
      const modelSide = activeRef.current % 2 === 0 ? 1.35 : -1.35;
      rig.position.x += (((desktop ? modelSide : 0) + Math.sin(p * Math.PI * 4) * 0.18) - rig.position.x) * 0.045;
      rig.position.y = desktop ? Math.sin(p * Math.PI * 2) * 0.18 : 1.05;
      rig.scale.setScalar(desktop ? 1 : 0.72);

      parts.forEach((part, index) => {
        const staged = ease((explosion - part.userData.delay) / 0.72);
        const destination = part.userData.home.clone().addScaledVector(part.userData.offset, staged);
        part.position.lerp(destination, 0.075);

        const edge = part.children[1] as THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial>;
        const flicker = 0.78 + Math.sin(time * 4.2 + index * 1.73) * 0.18;
        edge.material.opacity = index === activeRef.current + 4 ? 1 : flicker;
        const attr = part.userData.line.geometry.getAttribute("position") as THREE.BufferAttribute;
        attr.setXYZ(0, part.userData.home.x, part.userData.home.y, part.userData.home.z);
        attr.setXYZ(1, part.position.x, part.position.y, part.position.z);
        attr.needsUpdate = true;
        part.userData.line.material.opacity = staged * 0.48 * flicker;
      });

      dust.rotation.y = time * 0.018;
      dust.rotation.z = -time * 0.009;
      key.intensity = 16 + Math.sin(time * 2.7) * 3;
      bloom.strength = 1.1 + Math.sin(time * 1.9) * 0.12 + explosion * 0.4;
      composer.render();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    onResize();
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments || object instanceof THREE.Points) {
          object.geometry?.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material?.dispose();
        }
      });
      composer.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="blueprint-canvas" aria-hidden="true" />;
}

export default function Home() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.chapter));
        });
      },
      { rootMargin: "-34% 0px -46%", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <CameraBlueprint active={active} />
      <div className="screen-noise" aria-hidden="true" />

      <header className="site-header">
        <a href="#top" className="brand" aria-label="PeakQi 首頁">
          <span className="brand-mark">P/Q</span>
          <span>PEAKQI</span>
        </a>
        <div className="header-meta">
          <span className="live-dot" />
          SYSTEM ARCHITECTURE / 2026
        </div>
        <a href="#engine" className="header-link">探索引擎 ↘</a>
      </header>

      <div className="chapter-rail" aria-label="章節進度">
        {chapters.map((chapter, index) => (
          <a key={chapter.id} href={`#${chapter.id}`} className={active === index ? "active" : ""} aria-label={chapter.title.replace("\n", " ")}>
            <span>{chapter.no}</span>
          </a>
        ))}
      </div>

      <div className="blueprint-label" aria-live="polite">
        <span>ACTIVE LAYER / {chapters[active].no}</span>
        <strong>{chapters[active].eyebrow}</strong>
      </div>

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="hero-kicker"><span /> AI OPERATIONS INFRASTRUCTURE</p>
          <h1>看見生意<br />如何<span>自動運轉</span></h1>
          <p className="hero-lede">以一台攝影機為入口，拆解 PeakQi 如何把散落的營運日常，收進同一套 AI 業務引擎。</p>
          <a className="scroll-cue" href="#engine"><span>SCROLL TO EXPLODE</span><i>↓</i></a>
        </div>
        <div className="hero-spec" aria-hidden="true">
          <span>MODEL / PQ–47</span>
          <span>ENGINE / ONLINE</span>
          <span>MODULES / 47</span>
        </div>
      </section>

      <div className="story">
        {chapters.map((chapter, index) => (
          <section
            id={chapter.id}
            key={chapter.id}
            data-chapter={index}
            className={`story-chapter ${index % 2 ? "align-right" : "align-left"}`}
          >
            <article className={`story-card ${active === index ? "is-active" : ""}`}>
              <div className="card-topline">
                <span>{chapter.no}</span>
                <span>{chapter.eyebrow}</span>
              </div>
              <h2>{chapter.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h2>
              <p>{chapter.body}</p>
              <ul>
                {chapter.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            </article>
          </section>
        ))}
      </div>

      <section className="intermission">
        <div className="intermission-copy">
          <p>ONE ENGINE / MULTIPLE BRANDS / DUAL PROOF</p>
          <h2>同一套引擎，<br />換上每個產業最需要的臉。</h2>
        </div>
        <div className="brand-house">
          <article className="product-card featured">
            <span>00 / UNIVERSAL</span>
            <h3>Peak Ops</h3>
            <p>通用型 AI 營運平台，服務仍在等待專門工具的中小企業。</p>
            <i>AI BUSINESS OS</i>
          </article>
          <article className="product-card">
            <span>01 / REAL ESTATE</span>
            <h3>冒泡</h3>
            <p>為房仲業務打造的深度產業版本。</p>
            <i>BUBBLE.TW</i>
          </article>
          <article className="product-card">
            <span>02 / WEDDING</span>
            <h3>AI Wedding Pro</h3>
            <p>婚顧流程、內容與視覺模擬的一站式工作台。</p>
            <i>VERTICAL AI</i>
          </article>
          <article className="product-card">
            <span>03 / INTERIOR</span>
            <h3>AI Interior Pro</h3>
            <p>把提案、渲染與專案管理放在同一條線上。</p>
            <i>VERTICAL AI</i>
          </article>
        </div>
      </section>

      <section className="manifesto">
        <div className="manifesto-stamp">PQ<br />47</div>
        <p className="manifesto-kicker">PEAKQI / AI OPERATIONS INFRASTRUCTURE</p>
        <h2>不是再加一個工具。<br />是讓<span>所有事情</span>一起運轉。</h2>
        <p className="manifesto-body">我們是台灣中小企業的 AI 營運基礎設施——一套引擎、多個品牌、雙軌驗證。</p>
        <div className="manifesto-actions">
          <a href="#top" className="primary-action">重新組裝攝影機 <span>↗</span></a>
          <span>別讓瑣碎，耽誤真正重要的事。</span>
        </div>
      </section>

      <footer>
        <a href="#top" className="brand"><span className="brand-mark">P/Q</span><span>PEAKQI</span></a>
        <p>AI OPERATIONS PLATFORM COMPANY</p>
        <p>© 2026 PEAKQI / BUILT TO KEEP BUSINESS MOVING</p>
      </footer>
    </main>
  );
}
