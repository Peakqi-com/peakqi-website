// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <three-d-stage> — 3D object viewer + exporter shell (three.js).
 *
 * The stage owns the whole scene: WebGL renderer, neutral studio lighting
 * with a soft ground shadow, orbit controls (drag to orbit, wheel to zoom,
 * right-drag to pan), a camera auto-framed to the object's bounds, resize
 * handling, and a download toolbar that exports the current object as
 * OBJ + MTL or GLB (binary glTF). FBX cannot be exported in the browser;
 * GLB is the interchange format every modern 3D tool imports.
 *
 * three.js loads through the page's import map. Include this EXACT pinned
 * map in <head>, before any module runs — versions and integrity hashes
 * stay together (same map the "3D object" skill mandates):
 *
 *   <script type="importmap">
 *   {
 *     "imports": {
 *       "three": "https://unpkg.com/three@0.184.0/build/three.module.js",
 *       "three/addons/controls/OrbitControls.js": "https://unpkg.com/three@0.184.0/examples/jsm/controls/OrbitControls.js",
 *       "three/addons/exporters/OBJExporter.js": "https://unpkg.com/three@0.184.0/examples/jsm/exporters/OBJExporter.js",
 *       "three/addons/exporters/GLTFExporter.js": "https://unpkg.com/three@0.184.0/examples/jsm/exporters/GLTFExporter.js"
 *     },
 *     "integrity": {
 *       "https://unpkg.com/three@0.184.0/build/three.module.js": "sha384-8FCZ1eVO6it4+pbec2aDtnTrwjWXZLJRC+MAGCIPDgsYnUrl/E0A2YlF8ioMKI/J",
 *       "https://unpkg.com/three@0.184.0/build/three.core.js": "sha384-dw2ooPewaEIrAgl6oFDBmmBWCE9oW9LxRGcfwZ0hLvEprzo202wXl7vCYHRlSnOT",
 *       "https://unpkg.com/three@0.184.0/examples/jsm/controls/OrbitControls.js": "sha384-4rziNxOBZKQ69i+w+f89KJ55TCYquwchVbByQwmaOeIOXdOU2PLDn3kOfXHwIJC9",
 *       "https://unpkg.com/three@0.184.0/examples/jsm/exporters/OBJExporter.js": "sha384-nbwtoZENJD3Vq+ACK0CuGQdPMuDWHkamC2KJD70EV5nfg6jQjfppKOea07YJN+N3",
 *       "https://unpkg.com/three@0.184.0/examples/jsm/exporters/GLTFExporter.js": "sha384-VofkvpG6HERhFCYbsUOHeNXBCqID2nfqkQqnVzE1jc/oPcz+qJ13ADdXH08hE+cQ"
 *     }
 *   }
 *   </script>
 *
 * Usage:
 *   <style>three-d-stage:not(:defined){visibility:hidden}</style>
 *   <three-d-stage name="rocket"></three-d-stage>
 *   <script src="three-d-stage.js"></script>
 *   <script type="module">
 *     const stage = document.querySelector('three-d-stage');
 *     const { THREE } = await stage.ready;
 *     const model = new THREE.Group();
 *     // …build the model out of named meshes with named materials —
 *     // the names become the o / usemtl entries in the exported OBJ…
 *     stage.setObject(model);
 *   </script>
 *
 * Attributes:
 *   name       — export file basename (default "model")
 *   background — CSS color behind the scene (default a warm paper tone)
 *   autorotate — when present, a slow turntable until the user interacts
 *
 * Model in real-world meters, centered on the origin, y-up — exports
 * inherit the scene's units and orientation. The stage fills its own box;
 * size it with ordinary CSS (default 100vw/100vh page hero).
 *
 * Default setup: neutral studio lighting (hemisphere + key + fill), a
 * soft ground shadow, and NO environment map — so high metalness has
 * nothing to reflect and renders near-black. Cap metalness around
 * 0.3–0.4 and carry a metal look with a brighter base color. The copied
 * file is yours: adjust the lights, shadow, or background in _boot()
 * when the object needs a different look.
 */
/* END USAGE */

(() => {
  const stylesheet = `
    :host {
      position: relative;
      display: block;
      width: 100%;
      height: 100vh;
      background: var(--stage-bg, #f0eee6);
      overflow: hidden;
    }
    canvas { display: block; outline: none; }
    /* chrome="off":對外展示用,隱藏開發用的匯出按鈕與滑鼠操作提示 */
    :host([chrome="off"]) .toolbar,
    :host([chrome="off"]) .note { display: none; }
    .toolbar {
      position: absolute;
      right: 16px;
      bottom: 16px;
      display: flex;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .toolbar button {
      appearance: none;
      border: 1px solid rgba(20, 20, 19, 0.18);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.92);
      color: #1a1915;
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 500;
      line-height: 1;
      padding: 9px 12px;
      cursor: default;
    }
    .toolbar button:hover { background: #fff; }
    .toolbar button:active { transform: translateY(1px); }
    .toolbar button[disabled] { opacity: 0.5; pointer-events: none; }
    .note {
      position: absolute;
      left: 16px;
      bottom: 16px;
      max-width: 60%;
      font: 400 12px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: rgba(26, 25, 21, 0.55);
      user-select: none;
    }
    .err {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font: 500 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #8a2f20;
      text-align: center;
      white-space: pre-line;
    }
  `;

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /** Tell the host an export attempt settled — telemetry only. The host
   *  (HTMLViewer) verifies the source and re-reads these fields defensively
   *  before counting; nothing else crosses the frame boundary. Guarded so
   *  telemetry can never break the download path. */
  function notifyExport(format, ok) {
    try {
      window.parent.postMessage(
        { type: 'omelette:notify-3d-export', format: format, ok: ok === true },
        '*'
      );
    } catch (e) {}
  }

  class ThreeDStage extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = stylesheet;
      root.appendChild(style);
      this._err = document.createElement('div');
      this._err.className = 'err';
      root.appendChild(this._err);
      const note = document.createElement('div');
      note.className = 'note';
      note.textContent = 'Drag to orbit · scroll to zoom · right-drag to pan';
      root.appendChild(note);
      this._toolbar = document.createElement('div');
      this._toolbar.className = 'toolbar';
      this._objBtn = document.createElement('button');
      this._objBtn.type = 'button';
      this._objBtn.textContent = 'Download OBJ + MTL';
      this._objBtn.addEventListener('click', () => this._runExport('obj'));
      this._glbBtn = document.createElement('button');
      this._glbBtn.type = 'button';
      this._glbBtn.textContent = 'Download GLB';
      this._glbBtn.addEventListener('click', () => this._runExport('glb'));
      this._toolbar.appendChild(this._objBtn);
      this._toolbar.appendChild(this._glbBtn);
      root.appendChild(this._toolbar);
      this._setButtonsEnabled(false);
      /** Resolves with { THREE } once the scene is live — build the model
       *  in `await stage.ready` so nothing races the library load. */
      this.ready = new Promise((resolve, reject) => {
        this._readyResolve = resolve;
        this._readyReject = reject;
      });
    }

    /** 重畫一次陰影圖。主光或場景幾何真的動過才需要 —— 見 _boot 裡凍結的說明。 */
    invalidateShadows() {
      if (this._renderer) this._renderer.shadowMap.needsUpdate = true;
    }

    connectedCallback() {
      if (this._booted) {
        // Re-attached after a removal — resume what disconnected stopped.
        if (this._renderer) {
          this._renderer.setAnimationLoop(this._loop);
          this._ro && this._ro.observe(this);
        }
        return;
      }
      this._booted = true;
      this._boot().catch((err) => {
        this._err.style.display = 'flex';
        this._err.textContent =
          'three.js failed to load.\n' +
          'Check that the pinned <script type="importmap"> from the usage ' +
          'notes is in <head> before any module script.\n\n' +
          String(err && err.message ? err.message : err);
        this._readyReject(err);
      });
    }

    async _boot() {
      const bg = this.getAttribute('background');
      if (bg) this.style.setProperty('--stage-bg', bg);
      const [THREE, controlsMod] = await Promise.all([
        import('three'),
        import('three/addons/controls/OrbitControls.js'),
      ]);
      this._THREE = THREE;
      // preserveDrawingBuffer keeps the last frame readable after
      // compositing (toDataURL / drawImage) — it's what lets the
      // screenshot tools capture the scene instead of a blank canvas.
      // 手機降負載:DPR 2~3 的手機在此場景每幀成本過高,會出現捲動凍結(卡住)
      const isTouchDevice = (navigator.maxTouchPoints || 0) > 0 && Math.min(screen.width, screen.height) < 900;
      const renderer = new THREE.WebGLRenderer({
        antialias: !isTouchDevice,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouchDevice ? 1.25 : 2));
      renderer.shadowMap.enabled = true;
      // 陰影過濾:PCF(柔邊)。three r184 已移除 PCFSoftShadowMap —— 指定它只會
      // 收到 deprecation 警告然後被換回 PCF,所以不再分桌機/觸控,直接寫實際生效的那個。
      // 室內道具的貼地暗部不靠這張陰影圖,走 addContactShadows()。
      // 抗鋸齒維持「觸控不開」:實機檢視無階梯感,沒有理由付那個效能代價。
      renderer.shadowMap.type = THREE.PCFShadowMap;
      // 陰影圖不每幀重畫。這座舞台的主光位置固定、物件是「放上來給人繞著看」的,
      // 光空間裡的投影其實幀幀相同 —— 相機怎麼轉都不影響。
      // 實測(中階 Android 等級的節流):單幀 37.3ms → 16.7ms,陰影 pass 一個人
      // 吃掉 55%(這棵樹有 907 個 mesh、798 個投影物件,每幀重掃一次 2048² 圖)。
      // 場景幾何真的動過(換模型、改 castShadow、移動光源)就叫 invalidateShadows()。
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      this._renderer = renderer;
      this.shadowRoot.insertBefore(renderer.domElement, this._err);

      const scene = new THREE.Scene();
      this._scene = scene;

      const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 500);
      camera.position.set(3, 2.2, 4);
      this._camera = camera;

      const controls = new controlsMod.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      this._controls = controls;

      // Neutral studio: soft sky/ground wash, a shadow-casting key light,
      // and a dim fill from behind so silhouettes never go black.
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 1.0));
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(4, 7, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.bias = -0.0002;
      this._key = key;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xfff4e6, 0.5);
      fill.position.set(-5, 3, -4);
      scene.add(fill);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.ShadowMaterial({ opacity: 0.18 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this._ground = ground;
      scene.add(ground);

      this._autorotate = this.hasAttribute('autorotate');
      controls.autoRotate = this._autorotate;
      controls.autoRotateSpeed = 1.2;
      controls.addEventListener('start', () => {
        controls.autoRotate = false;
      });

      const fit = () => {
        const w = this.clientWidth || 1;
        const h = this.clientHeight || 1;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      fit();
      this._ro = new ResizeObserver(fit);
      this._loop = () => {
        controls.update();
        renderer.render(scene, camera);
      };
      // Detached while three.js was fetching? Stay idle — the
      // connectedCallback resume starts the loop and observer on
      // reattach.
      if (this.isConnected) {
        this._ro.observe(this);
        renderer.setAnimationLoop(this._loop);
      }

      this._readyResolve({ THREE });
    }

    disconnectedCallback() {
      // Stop rendering and observing while detached; connectedCallback
      // resumes both. (The renderer itself is kept — a move within the
      // document must not rebuild the scene.)
      if (this._renderer) this._renderer.setAnimationLoop(null);
      if (this._ro) this._ro.disconnect();
    }

    /** Show (and own) the object. Replaces any previous object, enables
     *  shadows on every mesh, rests it on the ground plane, and frames
     *  the camera to its bounds. */
    setObject(object) {
      const THREE = this._THREE;
      if (!THREE) throw new Error('three-d-stage: not ready — await stage.ready first');
      if (this._object) this._scene.remove(this._object);
      this._object = object;
      object.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      this.invalidateShadows();   // 換了物件,凍住的那張陰影圖要重畫一次
      const box = new THREE.Box3().setFromObject(object);
      if (!box.isEmpty()) {
        // Rest the object on the ground without moving its origin.
        this._ground.position.y = box.min.y;
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const dist =
          (sphere.radius / Math.tan((this._camera.fov * Math.PI) / 360)) * 1.35;
        const dir = new THREE.Vector3(1, 0.55, 1.25).normalize();
        this._camera.position
          .copy(sphere.center)
          .add(dir.multiplyScalar(dist));
        this._camera.near = Math.max(dist / 100, 0.01);
        this._camera.far = dist * 100;
        this._camera.updateProjectionMatrix();
        this._controls.target.copy(sphere.center);
        this._controls.update();
        const span = sphere.radius * 3;
        this._key.shadow.camera.left = -span;
        this._key.shadow.camera.right = span;
        this._key.shadow.camera.top = span;
        this._key.shadow.camera.bottom = -span;
        this._key.shadow.camera.updateProjectionMatrix();
      }
      this._scene.add(object);
      this._setButtonsEnabled(true);
    }

    /** Soft contact shadows for objects that stand on a surface.
     *
     *  Only the key light casts shadows, so anything the key light can't
     *  reach — every prop inside a closed interior — receives no shadow at
     *  all and reads as pasted onto the floor. This drops one soft dark
     *  ellipse under each object whose underside actually rests on
     *  something. "Rests on" is decided by a downward raycast, not by
     *  height, so a lamp standing on a desk lands its shadow on the desk
     *  and a hanging lamp gets none.
     *
     *  Everything shares a single InstancedMesh — one extra draw call for
     *  the whole model, which is what makes this affordable on phones.
     *
     *  opts.groups  RegExp matched against top-level child names; their
     *               direct children become the candidates (default: the
     *               object's own direct children)
     *  opts.filter  (obj) => boolean, false to skip a candidate
     *  opts.maxFoot largest footprint that still counts as a prop (world
     *               units) — above this it's a wall, deck or ceiling
     *  opts.maxGap  largest allowed gap to the surface below; more than
     *               this and the object is floating, not standing
     *  opts.opacity peak darkness at the centre of the blob
     *  opts.spread  blob size as a multiple of the object's footprint
     *
     *  Returns the number of shadows placed. */
    addContactShadows(opts = {}) {
      const THREE = this._THREE;
      if (!THREE) throw new Error('three-d-stage: not ready — await stage.ready first');
      const root = this._object;
      if (!root) return 0;
      const {
        groups = null, filter = null, maxFoot = 1.1, maxGap = 0.09,
        opacity = 0.55, spread = 1.18, minFoot = 0.04,
        minHeight = 0.1, minAspect = 0.2,
      } = opts;

      const pool = groups
        ? root.children.filter((g) => groups.test(g.name || ''))
        : [root];
      const cands = [];
      for (const g of pool) for (const ch of g.children) cands.push(ch);
      if (!cands.length) return 0;

      root.updateWorldMatrix(true, true);
      const box = new THREE.Box3(), size = new THREE.Vector3(), mid = new THREE.Vector3();
      const DOWN = new THREE.Vector3(0, -1, 0);
      const from = new THREE.Vector3();
      const rc = new THREE.Raycaster();
      rc.far = maxGap + 0.4;
      // The ray starts just above the underside so an object sunk a
      // millimetre into the deck still sees the deck, not what's beneath it.
      const LIFT = 0.02;
      const own = (hit, obj) => { for (let p = hit; p; p = p.parent) if (p === obj) return true; return false; };

      const hits = [];
      for (const o of cands) {
        if (!o.visible || o.userData.noShadow) continue;
        if (filter && !filter(o)) continue;
        box.setFromObject(o);
        if (box.isEmpty()) continue;
        box.getSize(size); box.getCenter(mid);
        const foot = Math.max(size.x, size.z);
        // Above maxFoot it is architecture — a porch or a dome — and a soft
        // ellipse under a wall-sized thing reads as a stain, not a shadow.
        if (foot > maxFoot) continue;
        // Wide and paper-thin means a band, a decal or a rug lying against a
        // surface, not an object standing on one.
        if (size.y < minHeight || size.y < foot * minAspect) continue;
        rc.set(from.set(mid.x, box.min.y + LIFT, mid.z), DOWN);
        const under = rc.intersectObject(root, true).find((h) => !own(h.object, o));
        if (!under) continue;
        const gap = under.distance - LIFT;
        if (gap > maxGap) continue;
        // A bigger gap means a shadow that has spread and softened. Peak
        // darkness is shared by every instance, so widening is the only
        // knob available — which happens to be the right one.
        const soften = 1 + Math.max(0, gap) * 2.2;
        hits.push({
          y: under.point.y,
          x: mid.x, z: mid.z,
          sx: Math.max(minFoot, size.x) * spread * soften,
          sz: Math.max(minFoot, size.z) * spread * soften,
        });
      }
      if (!hits.length) return 0;

      // Radial falloff, denser in the middle than a linear ramp — a plain
      // gradient reads as a grey disc rather than a shadow. The exponent
      // is what keeps the blob hugging the object instead of haloing it.
      const cv = document.createElement('canvas');
      cv.width = cv.height = 128;
      const g2 = cv.getContext('2d');
      const grad = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        grad.addColorStop(t, 'rgba(255,255,255,' + Math.pow(1 - t, 2.6).toFixed(4) + ')');
      }
      g2.fillStyle = grad;
      g2.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.NoColorSpace;

      const geo = new THREE.PlaneGeometry(1, 1);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x000000, alphaMap: tex, transparent: true, opacity,
        depthWrite: false, toneMapped: false,
        polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      });
      const inst = new THREE.InstancedMesh(geo, mat, hits.length);
      inst.name = 'contact_shadows';
      inst.castShadow = false;
      inst.receiveShadow = false;
      inst.userData.noShadow = true;
      // One mesh spanning the whole model can't be usefully culled, and
      // it is a single draw call either way.
      inst.frustumCulled = false;
      inst.renderOrder = 1;

      // Blobs live under the object so they follow it if it is ever moved.
      const toLocal = new THREE.Matrix4().copy(root.matrixWorld).invert();
      const m = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const rot = new THREE.Quaternion();
      const scl = new THREE.Vector3();
      for (let i = 0; i < hits.length; i++) {
        const h = hits[i];
        m.compose(
          pos.set(h.x, h.y + 0.004, h.z),
          rot.identity(),
          scl.set(h.sx, 1, h.sz)
        );
        inst.setMatrixAt(i, m.premultiply(toLocal));
      }
      inst.instanceMatrix.needsUpdate = true;
      root.add(inst);
      this._contactShadows = inst;
      return hits.length;
    }

    /** Cheap ambient occlusion for the seam where a floor meets its walls.
     *
     *  Real AO darkens creases because ambient light can't reach them. A
     *  full screen-space AO pass costs a second render every frame; for a
     *  fixed model the same read comes from one soft ring laid on each
     *  floor — clear in the middle, darkening toward the perimeter where
     *  the walls stand. Without it a room's floor meets its wall on a flat
     *  colour boundary and the whole interior reads as a diagram.
     *
     *  The ring is elliptical and sits at 0.98 of the floor's own bounds,
     *  so it can never spill past the floor edge onto the background —
     *  which a rectangular overlay would do on any non-rectangular room.
     *
     *  opts.surfaces RegExp matched against mesh names (e.g. /_floor$/)
     *  opts.opacity  darkness at the ring's peak
     *  opts.inner    radius where darkening starts (0–1 of the half-width)
     *  opts.peak     radius of maximum darkness
     *
     *  Returns the number of surfaces shaded. */
    addEdgeShade(opts = {}) {
      const THREE = this._THREE;
      if (!THREE) throw new Error('three-d-stage: not ready — await stage.ready first');
      const root = this._object;
      if (!root) return 0;
      const { surfaces, opacity = 0.2, inner = 0.72, peak = 0.95 } = opts;
      if (!surfaces) return 0;

      root.updateWorldMatrix(true, true);
      const box = new THREE.Box3(), size = new THREE.Vector3(), mid = new THREE.Vector3();
      const found = [];
      root.traverse((o) => {
        if (!o.isMesh || !o.visible || !surfaces.test(o.name || '')) return;
        box.setFromObject(o);
        if (box.isEmpty()) return;
        box.getSize(size); box.getCenter(mid);
        if (size.x < 0.3 || size.z < 0.3) return;
        found.push({ x: mid.x, y: box.max.y, z: mid.z, sx: size.x * 0.98, sz: size.z * 0.98 });
      });
      if (!found.length) return 0;

      const cv = document.createElement('canvas');
      cv.width = cv.height = 128;
      const g2 = cv.getContext('2d');
      const grad = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
      const smooth = (a, b, t) => {
        const u = Math.min(1, Math.max(0, (t - a) / (b - a)));
        return u * u * (3 - 2 * u);
      };
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        // Rise from `inner` to `peak`, then release to nothing by the rim so
        // the ellipse never ends on a hard edge.
        const a = smooth(inner, peak, t) * (1 - smooth(peak, 1, t));
        grad.addColorStop(t, 'rgba(255,255,255,' + a.toFixed(4) + ')');
      }
      g2.fillStyle = grad;
      g2.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.NoColorSpace;

      const geo = new THREE.PlaneGeometry(1, 1);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x000000, alphaMap: tex, transparent: true, opacity,
        depthWrite: false, toneMapped: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      });
      const inst = new THREE.InstancedMesh(geo, mat, found.length);
      inst.name = 'edge_shade';
      inst.castShadow = false;
      inst.receiveShadow = false;
      inst.userData.noShadow = true;
      inst.frustumCulled = false;
      // Under the contact blobs: the seam shading is the room's ambient
      // floor, the blobs sit on top of it.
      inst.renderOrder = 0.5;

      const toLocal = new THREE.Matrix4().copy(root.matrixWorld).invert();
      const m = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const rot = new THREE.Quaternion();
      const scl = new THREE.Vector3();
      for (let i = 0; i < found.length; i++) {
        const f = found[i];
        m.compose(
          pos.set(f.x, f.y + 0.002, f.z),
          rot.identity(),
          scl.set(f.sx, 1, f.sz)
        );
        inst.setMatrixAt(i, m.premultiply(toLocal));
      }
      inst.instanceMatrix.needsUpdate = true;
      root.add(inst);
      this._edgeShade = inst;
      return found.length;
    }

    get _basename() {
      return (this.getAttribute('name') || 'model').replace(/[^\w.-]+/g, '_');
    }

    _setButtonsEnabled(on) {
      this._objBtn.disabled = !on;
      this._glbBtn.disabled = !on;
    }

    /** Every mesh and material needs a unique name for o/usemtl lines —
     *  fill in stable fallbacks, and return the unique material list. */
    _nameParts() {
      const mats = [];
      const seen = new Set();
      let meshI = 0;
      let matI = 0;
      this._object.traverse((o) => {
        if (!o.isMesh) return;
        if (!o.name) o.name = 'part_' + meshI;
        meshI += 1;
        const list = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of list) {
          if (!m || mats.includes(m)) continue;
          if (!m.name) {
            m.name = 'mat_' + matI;
            matI += 1;
          }
          while (seen.has(m.name)) {
            m.name = m.name + '_' + matI;
            matI += 1;
          }
          seen.add(m.name);
          mats.push(m);
        }
      });
      return mats;
    }

    /** One export attempt, reported to the host however it settles.
     *  Rethrows so a failure stays visible on the guest console exactly as
     *  before. The no-object early return is not an attempt (the toolbar is
     *  disabled until the model loads) and reports nothing. */
    async _runExport(format) {
      if (!this._object) return;
      try {
        await (format === 'obj' ? this._exportObj() : this._exportGlb());
        notifyExport(format, true);
      } catch (err) {
        notifyExport(format, false);
        throw err;
      }
    }

    async _exportObj() {
      if (!this._object) return;
      const mod = await import('three/addons/exporters/OBJExporter.js');
      const mats = this._nameParts();
      const base = this._basename;
      const obj =
        'mtllib ' + base + '.mtl\n' + new mod.OBJExporter().parse(this._object);
      let mtl = '# Exported by three-d-stage\n';
      for (const m of mats) {
        const c = m.color || { r: 0.8, g: 0.8, b: 0.8 };
        const rough = typeof m.roughness === 'number' ? m.roughness : 0.5;
        const opacity = typeof m.opacity === 'number' ? m.opacity : 1;
        mtl += 'newmtl ' + m.name + '\n';
        mtl +=
          'Kd ' + c.r.toFixed(4) + ' ' + c.g.toFixed(4) + ' ' + c.b.toFixed(4) + '\n';
        mtl += 'Ks 0.2000 0.2000 0.2000\n';
        mtl += 'Ns ' + Math.round((1 - rough) * 200) + '\n';
        mtl += 'd ' + opacity.toFixed(4) + '\n\n';
      }
      download(new Blob([obj], { type: 'text/plain' }), base + '.obj');
      download(new Blob([mtl], { type: 'text/plain' }), base + '.mtl');
    }

    async _exportGlb() {
      if (!this._object) return;
      const mod = await import('three/addons/exporters/GLTFExporter.js');
      this._nameParts();
      const base = this._basename;
      const buf = await new mod.GLTFExporter().parseAsync(this._object, {
        binary: true,
      });
      download(
        new Blob([buf], { type: 'model/gltf-binary' }),
        base + '.glb'
      );
    }
  }

  customElements.define('three-d-stage', ThreeDStage);
})();
