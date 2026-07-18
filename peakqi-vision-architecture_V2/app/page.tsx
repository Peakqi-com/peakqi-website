"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const chapters = [
  {
    id: "engine",
    no: "01",
    eyebrow: "CORE ENGINE",
    part: "PQ-47 AI PROCESSOR / MAINBOARD",
    title: "一套引擎，\n驅動 47 個 AI 模組",
    body: "PeakQi 把接客、CRM、行銷、報價、專案與數據收進同一套營運底層，讓中小企業不再切換五六個工具。",
    tags: ["AI 業務模組引擎", "共用資料核心", "24/7 自動運轉"],
  },
  {
    id: "crm",
    no: "02",
    eyebrow: "ACQUISITION / CRM",
    part: "OPTICAL LENS ASSEMBLY",
    title: "從接客開始，\n一路追蹤到成交",
    body: "自動回覆、異議處理、持續跟進、養客與 CRM 共用同一份客戶脈絡。訊息不漏接，關係不中斷。",
    tags: ["AI 接客", "客戶追蹤", "標籤與分群"],
  },
  {
    id: "creative",
    no: "03",
    eyebrow: "CREATIVE / KNOWLEDGE",
    part: "IMAGE SENSOR / KNOWLEDGE CORE",
    title: "內容會生成，\n更懂你的產業",
    body: "文字、圖片、影片與產業知識庫彼此連動。不是多一個聊天機器人，而是能把情境做深的創意工作流。",
    tags: ["行銷內容", "AI 圖片・影片", "產業知識庫"],
  },
  {
    id: "ops",
    no: "04",
    eyebrow: "PROJECT / OPERATIONS",
    part: "BATTERY / CONTROL DISPLAY",
    title: "專案、報價、數據，\n在同一個視野裡",
    body: "從報價到執行、從專案財務到管理月報，資訊回到同一座營運駕駛艙，讓每個決定都有依據。",
    tags: ["專案報價", "財務管理", "營運儀表板"],
  },
  {
    id: "brands",
    no: "05",
    eyebrow: "ONE ENGINE / MANY FACES",
    part: "OUTER SHELL / PLATFORM LAYER",
    title: "一套底層，\n長出多個產業品牌",
    body: "Peak Ops 服務通用中小企業；冒泡、AI Wedding Pro、AI Interior Pro 則把知識與工作流做進垂直場景。",
    tags: ["通用型 SaaS", "垂直產業品牌", "共用底層引擎"],
  },
  {
    id: "adoption",
    no: "06",
    eyebrow: "INDUSTRY ADOPTION",
    part: "I/O BUS / RIBBON CABLE",
    title: "導入夠深，\n架構依然保持乾淨",
    body: "從知識庫、產業話術、流程標籤到介面語言，PeakQi 用微客製把系統貼近現場；需要跨界開發時，再走獨立專案線。",
    tags: ["知識庫建置", "話術產業化", "流程微客製"],
  },
  {
    id: "proof",
    no: "07",
    eyebrow: "DUAL PROOF",
    part: "COMPLETE SYSTEM / DUAL PROOF",
    title: "產品自己跑，\n市場也願意買",
    body: "自家垂直品牌驗證產品深度，Peak Ops 外部客戶驗證 SaaS 市場。雙軌證明，指向同一個 AI 營運平台。",
    tags: ["場景驗證", "SaaS ARR", "平台護城河"],
  },
];

const phases = ["LINE STUDY", "PBR MATERIAL", "EXPLODED VIEW", "PART FOCUS"];

type PartRule = {
  id: string;
  label: string;
  prefix?: string;
  focusChapters: number[];
  color: string;
};

type PartMap = {
  version: number;
  groups: PartRule[];
  internals: PartRule[];
};

type ExplodedPart = {
  node: THREE.Object3D;
  name: string;
  label: string;
  center: THREE.Vector3;
  home: THREE.Vector3;
  offset: THREE.Vector3;
  delay: number;
  focusChapters: number[];
  materials: THREE.Material[];
  edges: THREE.LineBasicMaterial[];
  connector: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function ease(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function colorNumber(value: string) {
  return new THREE.Color(value).getHex();
}

function CameraBlueprint({ active }: { active: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(active);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let animationFrame = 0;
    let currentProgress = 0;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08090b, 0.03);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.1, 11.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x08090b, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      1.1,
      0.68,
      0.2,
    );
    composer.addPass(bloom);

    scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x17110f, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(4, 6, 7);
    scene.add(key);
    const orangeLight = new THREE.PointLight(0xfe6a2d, 22, 18, 1.4);
    orangeLight.position.set(4, -1, 5);
    scene.add(orangeLight);
    const cyanLight = new THREE.PointLight(0x72e6ff, 16, 16, 1.6);
    cyanLight.position.set(-5, 2, 3);
    scene.add(cyanLight);

    const rig = new THREE.Group();
    rig.position.set(1.45, 0, 0);
    rig.rotation.set(-0.16, -0.58, 0.02);
    scene.add(rig);

    const parts: ExplodedPart[] = [];
    const clock = new THREE.Clock();

    const makeInternalMaterial = (hex: number, emissive = hex) =>
      new THREE.MeshStandardMaterial({
        color: hex,
        metalness: 0.62,
        roughness: 0.27,
        emissive,
        emissiveIntensity: 0.3,
      });

    const createInternalComponents = (asset: THREE.Object3D) => {
      const sensor = new THREE.Group();
      sensor.name = "PQ_SENSOR";
      sensor.position.set(0, 0, 0.74);
      const sensorPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.51, 0.045, 4, 4, 1),
        makeInternalMaterial(0x1a7185, 0x72e6ff),
      );
      sensor.add(sensorPlate);
      const sensorCore = new THREE.Mesh(
        new THREE.BoxGeometry(0.43, 0.33, 0.025),
        makeInternalMaterial(0x0b1115, 0x72e6ff),
      );
      sensorCore.position.z = 0.038;
      sensor.add(sensorCore);
      asset.add(sensor);

      const board = new THREE.Group();
      board.name = "PQ_MAINBOARD";
      board.position.set(0, 0, -0.06);
      board.add(new THREE.Mesh(new THREE.BoxGeometry(1.34, 1.08, 0.055), makeInternalMaterial(0x103f35, 0x0c7a60)));
      for (let i = 0; i < 12; i += 1) {
        const trace = new THREE.Mesh(
          new THREE.BoxGeometry(0.035 + (i % 3) * 0.045, 0.012, 0.012),
          makeInternalMaterial(i % 3 === 0 ? 0xfe6a2d : 0x72e6ff),
        );
        trace.position.set(-0.52 + (i % 4) * 0.34, -0.42 + Math.floor(i / 4) * 0.38, 0.04);
        board.add(trace);
      }
      asset.add(board);

      const chip = new THREE.Group();
      chip.name = "PQ_AI_CHIP";
      chip.position.set(0.05, 0.04, 0.015);
      chip.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.11), makeInternalMaterial(0x15171b, 0xfe6a2d)));
      const chipCap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.025), makeInternalMaterial(0xfe6a2d, 0xfe6a2d));
      chipCap.position.z = 0.07;
      chip.add(chipCap);
      asset.add(chip);

      const battery = new THREE.Group();
      battery.name = "PQ_BATTERY";
      battery.position.set(0.54, -0.08, -0.55);
      battery.add(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.3, 2, 2, 2), makeInternalMaterial(0x202329, 0xffffff)));
      const batteryStripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.315), makeInternalMaterial(0xfe6a2d, 0xfe6a2d));
      batteryStripe.position.y = 0.28;
      battery.add(batteryStripe);
      asset.add(battery);

      const ribbon = new THREE.Group();
      ribbon.name = "PQ_RIBBON";
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.26, -0.1, 0.67),
        new THREE.Vector3(-0.45, -0.28, 0.45),
        new THREE.Vector3(-0.42, -0.32, 0.1),
        new THREE.Vector3(-0.25, -0.23, -0.02),
      ]);
      ribbon.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.025, 6, false), makeInternalMaterial(0xfe6a2d, 0xfe6a2d)));
      asset.add(ribbon);
    };

    const addPartVisuals = (part: THREE.Object3D, color: number) => {
      const materials: THREE.Material[] = [];
      const edgeMaterials: THREE.LineBasicMaterial[] = [];
      part.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.frustumCulled = false;
        const source = Array.isArray(object.material) ? object.material : [object.material];
        const clones = source.map((material) => {
          const clone = material.clone();
          clone.transparent = true;
          clone.opacity = 0;
          clone.depthWrite = false;
          materials.push(clone);
          return clone;
        });
        object.material = Array.isArray(object.material) ? clones : clones[0];

        const edgeMaterial = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthTest: true,
        });
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry, 24), edgeMaterial);
        edge.renderOrder = 4;
        object.add(edge);
        edgeMaterials.push(edgeMaterial);
      });
      return { materials, edgeMaterials };
    };

    const calculateOffset = (name: string, center: THREE.Vector3, index: number) => {
      if (name.startsWith("lenses")) {
        return new THREE.Vector3(center.x * 0.18, center.y * 0.18, 1.35 + Math.max(0, center.z - 0.75) * 1.35);
      }
      if (name.startsWith("case_")) {
        return new THREE.Vector3(0, name.includes("case_2") ? 0.55 : -0.28, -1.7 - (index % 2) * 0.45);
      }
      if (name === "PQ_SENSOR") return new THREE.Vector3(0, 0, 1.85);
      if (name === "PQ_MAINBOARD") return new THREE.Vector3(-0.35, 0.1, -1.35);
      if (name === "PQ_AI_CHIP") return new THREE.Vector3(0.15, 0.28, -2.05);
      if (name === "PQ_BATTERY") return new THREE.Vector3(2.25, -0.4, -1.2);
      if (name === "PQ_RIBBON") return new THREE.Vector3(-1.65, -1.15, -0.4);
      if (Math.abs(center.x) > 0.72) return new THREE.Vector3(Math.sign(center.x) * (1.35 + Math.abs(center.y) * 0.45), center.y * 0.42, center.z * 0.22);
      if (Math.abs(center.y) > 0.56) return new THREE.Vector3(center.x * 0.25, Math.sign(center.y) * (1.15 + Math.abs(center.x) * 0.28), center.z * 0.18);
      return new THREE.Vector3(center.x * 0.42, center.y * 0.42, -0.72 - (index % 4) * 0.2);
    };

    const loadModel = async () => {
      try {
        const [gltf, mapResponse] = await Promise.all([
          new GLTFLoader().loadAsync("/models/peakqi-camera-web.glb"),
          fetch("/models/peakqi-camera-parts.json"),
        ]);
        if (!mapResponse.ok) throw new Error("Part map unavailable");
        const partMap = (await mapResponse.json()) as PartMap;
        if (disposed) return;

        const asset = gltf.scene;
        const ground = asset.getObjectByName("ground_0");
        if (ground?.parent) ground.parent.remove(ground);
        createInternalComponents(asset);

        const connectorLayer = new THREE.Group();
        connectorLayer.name = "EXPLODED_CONNECTORS";
        asset.add(connectorLayer);

        const candidates: THREE.Object3D[] = [];
        asset.traverse((object) => {
          const isOriginalPart = /^(body|case_|lenses)/.test(object.name);
          const isInternal = partMap.internals.some((rule) => rule.id === object.name);
          if ((isOriginalPart || isInternal) && object.children.some((child) => child instanceof THREE.Mesh)) candidates.push(object);
        });

        candidates.forEach((node, index) => {
          const internalRule = partMap.internals.find((rule) => rule.id === node.name);
          let rule = internalRule ?? partMap.groups.find((item) => item.prefix && node.name.startsWith(item.prefix));
          if (node.name === "body.001_low_41" || node.name === "body.002_low_1" || node.name === "body.019_low_18") {
            rule = { id: "chassis", label: "CORE CHASSIS", focusChapters: [0, 4], color: "#ffffff" };
          }
          const fallback: PartRule = { id: "body", label: "CAMERA BODY", focusChapters: [3, 5], color: "#72e6ff" };
          const appliedRule = rule ?? fallback;
          const bounds = new THREE.Box3().setFromObject(node);
          const center = bounds.getCenter(new THREE.Vector3());
          const visual = addPartVisuals(node, colorNumber(appliedRule.color));
          const home = node.position.clone();
          const offset = calculateOffset(node.name, center, index);
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([center.clone(), center.clone()]);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: colorNumber(appliedRule.color),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
          });
          const connector = new THREE.Line(lineGeometry, lineMaterial);
          connectorLayer.add(connector);
          parts.push({
            node,
            name: node.name,
            label: appliedRule.label,
            center,
            home,
            offset,
            delay: Math.min(index * 0.014, 0.52),
            focusChapters: appliedRule.focusChapters,
            materials: visual.materials,
            edges: visual.edgeMaterials,
            connector,
          });
        });

        const modelBounds = new THREE.Box3().setFromObject(asset);
        const modelCenter = modelBounds.getCenter(new THREE.Vector3());
        const modelSize = modelBounds.getSize(new THREE.Vector3());
        asset.position.sub(modelCenter);
        asset.scale.setScalar(2.45 / modelSize.y);
        rig.add(asset);
        setLoadState("ready");
      } catch (error) {
        console.error(error);
        if (!disposed) setLoadState("error");
      }
    };

    const pointsGeometry = new THREE.BufferGeometry();
    const pointValues = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i += 1) {
      pointValues[i * 3] = (Math.random() - 0.5) * 13;
      pointValues[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pointValues[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(pointValues, 3));
    const dust = new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({ color: 0xfe6a2d, size: 0.016, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending }),
    );
    scene.add(dust);

    const grid = new THREE.GridHelper(22, 34, 0x3c281f, 0x16191e);
    grid.position.y = -3.15;
    scene.add(grid);

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
      const materialReveal = ease((p - 0.035) / 0.075);
      const explodeOut = ease((p - 0.09) / 0.48);
      const reassemble = 1 - ease((p - 0.83) / 0.1);
      const explosion = explodeOut * reassemble;
      const desktop = window.innerWidth > 820;
      const modelSide = activeRef.current % 2 === 0 ? 1.3 : -1.3;

      rig.rotation.y += ((-0.62 + p * Math.PI * 2.06 + pointerRef.current.x * 0.075) - rig.rotation.y) * 0.05;
      rig.rotation.x += ((-0.12 + Math.sin(p * Math.PI * 2.7) * 0.2 - pointerRef.current.y * 0.045) - rig.rotation.x) * 0.05;
      rig.rotation.z = Math.sin(p * Math.PI * 2.3) * 0.055;
      rig.position.x += (((desktop ? modelSide : 0) + Math.sin(p * Math.PI * 4) * 0.16) - rig.position.x) * 0.045;
      rig.position.y += (((desktop ? 0 : 1.05) + Math.sin(p * Math.PI * 2) * 0.12) - rig.position.y) * 0.045;
      rig.scale.setScalar(desktop ? 1 : 0.7);

      parts.forEach((part, index) => {
        const staged = ease((explosion - part.delay) / Math.max(0.2, 0.78 - part.delay));
        const destination = part.home.clone().addScaledVector(part.offset, staged);
        part.node.position.lerp(destination, 0.075);
        const focused = activeRef.current === 6 || part.focusChapters.includes(activeRef.current);
        const flicker = 0.84 + Math.sin(time * 4.6 + index * 1.43) * 0.14;

        part.materials.forEach((material) => {
          const opacity = materialReveal * (focused ? 0.98 : 0.38);
          material.opacity = opacity;
          material.transparent = opacity < 0.98;
          material.depthWrite = opacity > 0.62;
          if (material instanceof THREE.MeshStandardMaterial) {
            material.emissiveIntensity = focused ? 0.35 + Math.sin(time * 2.2) * 0.08 : 0.035;
          }
        });
        part.edges.forEach((edge) => {
          edge.opacity = ((1 - materialReveal) * 0.92 + (focused ? 0.75 : 0.16)) * flicker;
        });

        const attr = part.connector.geometry.getAttribute("position") as THREE.BufferAttribute;
        const delta = part.node.position.clone().sub(part.home);
        attr.setXYZ(0, part.center.x, part.center.y, part.center.z);
        attr.setXYZ(1, part.center.x + delta.x, part.center.y + delta.y, part.center.z + delta.z);
        attr.needsUpdate = true;
        part.connector.material.opacity = staged * (focused ? 0.62 : 0.12) * flicker;
      });

      dust.rotation.y = time * 0.016;
      dust.rotation.z = -time * 0.008;
      orangeLight.intensity = 20 + Math.sin(time * 2.7) * 3;
      bloom.strength = 0.92 + Math.sin(time * 1.8) * 0.1 + explosion * 0.42;
      composer.render();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    onResize();
    loadModel();
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
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

  return (
    <div className="blueprint-canvas" aria-hidden="true">
      <div ref={mountRef} className="canvas-mount" />
      <div className={`model-loader ${loadState}`}>
        <span>{loadState === "loading" ? "LOADING 42-MESH ASSEMBLY" : loadState === "ready" ? "42 MESH / READY" : "MODEL LOAD ERROR"}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState(0);

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
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setPhase(p < 0.04 ? 0 : p < 0.1 ? 1 : p < 0.27 ? 2 : 3);
    };
    sections.forEach((section) => observer.observe(section));
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <main>
      <CameraBlueprint active={active} />
      <div className="screen-noise" aria-hidden="true" />

      <header className="site-header">
        <a href="#top" className="brand" aria-label="PeakQi 首頁"><span className="brand-mark">P/Q</span><span>PEAKQI</span></a>
        <div className="header-meta"><span className="live-dot" />SYSTEM ARCHITECTURE / 2026</div>
        <a href="#engine" className="header-link">探索引擎 ↘</a>
      </header>

      <div className="phase-strip" aria-label="模型呈現階段">
        {phases.map((label, index) => <span key={label} className={phase === index ? "active" : ""}>{String(index + 1).padStart(2, "0")} / {label}</span>)}
      </div>

      <div className="chapter-rail" aria-label="章節進度">
        {chapters.map((chapter, index) => (
          <a key={chapter.id} href={`#${chapter.id}`} className={active === index ? "active" : ""} aria-label={chapter.title.replace("\n", " ")}><span>{chapter.no}</span></a>
        ))}
      </div>

      <div className="blueprint-label" aria-live="polite">
        <span>ACTIVE LAYER / {chapters[active].no}</span>
        <strong>{chapters[active].part}</strong>
      </div>

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="hero-kicker"><span /> AI OPERATIONS INFRASTRUCTURE</p>
          <h1>看見生意<br />如何<span>自動運轉</span></h1>
          <p className="hero-lede">從線稿、材質到 42 個真實零件的拆解，觀看 PeakQi 如何把散落的營運日常收進同一套 AI 業務引擎。</p>
          <a className="scroll-cue" href="#engine"><span>SCROLL TO EXPLODE</span><i>↓</i></a>
        </div>
        <div className="hero-spec" aria-hidden="true"><span>MODEL / PQ–47 CINEMA</span><span>MESHES / 42 + 5 INTERNAL</span><span>ENGINE / ONLINE</span></div>
      </section>

      <div className="story">
        {chapters.map((chapter, index) => (
          <section id={chapter.id} key={chapter.id} data-chapter={index} className={`story-chapter ${index % 2 ? "align-right" : "align-left"}`}>
            <article className={`story-card ${active === index ? "is-active" : ""}`}>
              <div className="card-topline"><span>{chapter.no}</span><span>{chapter.eyebrow}</span></div>
              <div className="part-callout"><span>FOCUS COMPONENT</span><b>{chapter.part}</b></div>
              <h2>{chapter.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h2>
              <p>{chapter.body}</p>
              <ul>{chapter.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
            </article>
          </section>
        ))}
      </div>

      <section className="intermission">
        <div className="intermission-copy"><p>ONE ENGINE / MULTIPLE BRANDS / DUAL PROOF</p><h2>同一套引擎，<br />換上每個產業最需要的臉。</h2></div>
        <div className="brand-house">
          <article className="product-card featured"><span>00 / UNIVERSAL</span><h3>Peak Ops</h3><p>通用型 AI 營運平台，服務仍在等待專門工具的中小企業。</p><i>AI BUSINESS OS</i></article>
          <article className="product-card"><span>01 / REAL ESTATE</span><h3>冒泡</h3><p>為房仲業務打造的深度產業版本。</p><i>BUBBLE.TW</i></article>
          <article className="product-card"><span>02 / WEDDING</span><h3>AI Wedding Pro</h3><p>婚顧流程、內容與視覺模擬的一站式工作台。</p><i>VERTICAL AI</i></article>
          <article className="product-card"><span>03 / INTERIOR</span><h3>AI Interior Pro</h3><p>把提案、渲染與專案管理放在同一條線上。</p><i>VERTICAL AI</i></article>
        </div>
      </section>

      <section className="manifesto">
        <div className="manifesto-stamp">PQ<br />47</div>
        <p className="manifesto-kicker">PEAKQI / AI OPERATIONS INFRASTRUCTURE</p>
        <h2>不是再加一個工具。<br />是讓<span>所有事情</span>一起運轉。</h2>
        <p className="manifesto-body">我們是台灣中小企業的 AI 營運基礎設施——一套引擎、多個品牌、雙軌驗證。</p>
        <div className="manifesto-actions"><a href="#top" className="primary-action">重新組裝攝影機 <span>↗</span></a><span>別讓瑣碎，耽誤真正重要的事。</span></div>
      </section>

      <footer>
        <a href="#top" className="brand"><span className="brand-mark">P/Q</span><span>PEAKQI</span></a>
        <p>AI OPERATIONS PLATFORM COMPANY</p>
        <p>© 2026 PEAKQI / BUILT TO KEEP BUSINESS MOVING</p>
      </footer>
    </main>
  );
}
