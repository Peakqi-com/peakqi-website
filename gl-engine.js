// PeakQi 共用 WebGL 層(單一 renderer):hero 控制台資料流、flow 合併 dissolve、功能核心、案例圖轉場、結尾控制台
// 原生 WebGL(runtime 無 R3F/Drei 建置環境;three 可由 CDN 載入但為控制重量與單一 renderer,採 raw shader 等效)
export function createGL({ refs }) {
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sub = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const ez = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  let destroyed = false, disabled = false, canvas = null, gl = null;
  let raf = 0, lastTick = 0, W = 0, H = 0, DPR = 1, t0 = performance.now(), lastErr = null;
  const progs = {}, bufs = {}, texs = new Map(), ios = [];
  let caseQueue = [];
  const visFx = { hero: true, flow: true, orbit: true, end: true, cases: true };

  const VS = `attribute vec2 aXY;uniform vec2 uRes;uniform float uSize;varying vec2 vUV;
void main(){vec2 c=(aXY/uRes)*2.0-1.0;gl_Position=vec4(c.x,-c.y,0.,1.);gl_PointSize=uSize;vUV=aXY;}`;
  const NOISE = `float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*vnoise(p);p*=2.03;a*=.5;}return v;}`;
  const FS_GLOW = `precision mediump float;uniform vec2 uRes;uniform vec4 uRect;uniform float uT,uA;uniform vec3 uCol;varying vec2 vUV;
void main(){vec2 c=uRect.xy+uRect.zw*.5;vec2 h=uRect.zw*.5;vec2 d=abs(vUV-c)-h;
float sd=abs(length(max(d,0.))+min(max(d.x,d.y),0.));
float g=exp(-sd*.08)*.55+exp(-sd*.02)*.25;
float run=sin((vUV.x+vUV.y)*.02-uT*2.2)*.5+.5;
gl_FragColor=vec4(uCol,g*uA*(.7+.3*run));}`;
  const FS_PT = `precision mediump float;uniform vec3 uCol;uniform float uA;
void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(uCol,a*uA);}`;
  const FS_VEIL = `precision mediump float;uniform vec2 uRes;uniform vec4 uRect;uniform float uT,uP,uCh,uA;varying vec2 vUV;
${NOISE}
void main(){vec2 uv=(vUV-uRect.xy)/uRect.zw;
float n=fbm(uv*vec2(7.,5.)+uT*.25);
float edge=smoothstep(uP-.28,uP+.28,n);
vec3 ink=vec3(.035,.043,.055),org=vec3(1.,.42,.17);
float nr=fbm(uv*7.+vec2(uCh*.06,0.)+uT*.25);
float nb=fbm(uv*7.-vec2(uCh*.06,0.)+uT*.25);
vec3 col=mix(ink,org,smoothstep(.45,.9,n)*.5);
col.r+=(nr-n)*uCh*.9;col.b+=(nb-n)*uCh*.9;
gl_FragColor=vec4(col,edge*uA);}`;
  const FS_IMG = `precision mediump float;uniform sampler2D uTex;uniform vec4 uRect;uniform float uT,uP;varying vec2 vUV;
${NOISE}
void main(){vec2 uv=(vUV-uRect.xy)/uRect.zw;
float k=1.-uP;
float n=fbm(uv*6.+uT*.4);
vec2 duv=uv+vec2((n-.5)*.09*k,(fbm(uv*5.+3.7)-.5)*.05*k);
float ch=.012*k;
vec4 c;c.r=texture2D(uTex,duv+vec2(ch,0.)).r;c.g=texture2D(uTex,duv).g;c.b=texture2D(uTex,duv-vec2(ch,0.)).b;
c.a=1.;
float veil=smoothstep(uP-.25,uP+.25,fbm(uv*8.+1.3));
gl_FragColor=vec4(c.rgb,(1.-veil)*.95*step(.0,uv.x)*step(uv.x,1.)*step(.0,uv.y)*step(uv.y,1.));}`;
  const FS_RING = `precision mediump float;uniform vec2 uRes,uC,uRxy;uniform float uT,uA,uCore;varying vec2 vUV;
${NOISE}
void main(){vec2 p=(vUV-uC)/uRxy;
float r=length(p);
float ring=exp(-abs(r-1.)*22.);
float flow=fbm(vec2(atan(p.y,p.x)*2.2+uT*.5,r*3.))*.7+.3;
float core=exp(-length(vUV-uC)/uCore*2.6)*(.6+.4*sin(uT*1.6));
vec3 org=vec3(1.,.42,.17),grn=vec3(.4,.88,.74);
vec3 col=mix(org,grn,flow*.4);
gl_FragColor=vec4(col,(ring*flow*.55+core*.3)*uA);}`;

  function mkProg(fsSrc) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VS); gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) throw new Error('vs: ' + gl.getShaderInfoLog(vs));
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSrc); gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error('fs: ' + gl.getShaderInfoLog(fs));
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    gl.deleteShader(vs); gl.deleteShader(fs);
    return p;
  }
  function useProg(p) { gl.useProgram(p); const loc = gl.getAttribLocation(p, 'aXY'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); gl.uniform2f(gl.getUniformLocation(p, 'uRes'), W, H); return p; }
  function quad(r) { return new Float32Array([r.x, r.y, r.x + r.w, r.y, r.x, r.y + r.h, r.x + r.w, r.y, r.x + r.w, r.y + r.h, r.x, r.y + r.h]); }
  function setBuf(data) { gl.bindBuffer(gl.ARRAY_BUFFER, bufs.dyn); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW); }
  function u(p, n) { return gl.getUniformLocation(p, n); }

  function drawGlow(r, t, a, col) {
    setBuf(quad({ x: r.x - 40, y: r.y - 40, w: r.w + 80, h: r.h + 80 }));
    const p = useProg(progs.glow);
    gl.uniform4f(u(p, 'uRect'), r.x, r.y, r.w, r.h);
    gl.uniform1f(u(p, 'uT'), t); gl.uniform1f(u(p, 'uA'), a);
    gl.uniform3f(u(p, 'uCol'), 1, 0.42, 0.17);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function drawPoints(pts, size, a, col) {
    if (!pts.length) return;
    setBuf(new Float32Array(pts));
    const p = useProg(progs.pt);
    gl.uniform1f(u(p, 'uSize'), size * DPR);
    gl.uniform1f(u(p, 'uA'), a);
    gl.uniform3f(u(p, 'uCol'), col[0], col[1], col[2]);
    gl.drawArrays(gl.POINTS, 0, pts.length / 2);
  }
  function perimeterPts(r, t, n, speed) {
    const per = 2 * (r.w + r.h), out = [];
    for (let i = 0; i < n; i++) {
      let d = ((t * speed + i / n) % 1) * per;
      let x, y;
      if (d < r.w) { x = r.x + d; y = r.y; }
      else if (d < r.w + r.h) { x = r.x + r.w; y = r.y + (d - r.w); }
      else if (d < 2 * r.w + r.h) { x = r.x + r.w - (d - r.w - r.h); y = r.y + r.h; }
      else { x = r.x; y = r.y + r.h - (d - 2 * r.w - r.h); }
      out.push(x, y);
    }
    return out;
  }
  function vr(el) { const r = el.getBoundingClientRect(); return { x: r.left * DPR, y: r.top * DPR, w: r.width * DPR, h: r.height * DPR, cssTop: r.top, cssBot: r.bottom }; }
  function onScreen(r) { return r.cssBot > -60 && r.cssTop < H / DPR + 60; }

  // ---------- 效果狀態 ----------
  function fxHero(t) {
    const hp = window.__pqHero;
    if (!hp || !hp.cons) return;
    const c = hp.cons();
    if (!c || c.q < 0.6) return;
    const a = ez(sub(c.q, 0.6, 0.72)) * 0.16;
    const r = { x: c.x * DPR, y: c.y * DPR, w: c.w * DPR, h: c.h * DPR };
    if (r.y > H + 80 * DPR || r.y + r.h < -80 * DPR) return;
    drawGlow(r, t, a, null);
    drawPoints(perimeterPts(r, t, 9, 0.045), 7, 0.5 * ez(sub(c.q, 0.64, 0.75)), [1, 0.42, 0.17]);
    drawPoints(perimeterPts(r, t + 9, 5, -0.03), 5, 0.4 * ez(sub(c.q, 0.64, 0.75)), [0.4, 0.88, 0.74]);
  }
  let flowWrap = null, flowDeck = null;
  function fxFlow(t) {
    if (!flowWrap || !flowDeck) return;
    const wr = flowWrap.getBoundingClientRect();
    const vh = H / DPR;
    const pinned = flowWrap.offsetHeight > vh * 1.6;
    const p = pinned
      ? clamp(-wr.top / Math.max(1, flowWrap.offsetHeight - vh), 0, 1)
      : clamp((vh - wr.top) / (vh + wr.height), 0, 1);
    if (!pinned) return; // 堆疊模式不加 veil
    const a = ez(sub(p, 0.83, 0.895)) * (1 - ez(sub(p, 0.93, 0.985)));
    if (a < 0.02) return;
    const ch = ez(sub(p, 0.865, 0.895)) * (1 - ez(sub(p, 0.9, 0.93)));
    const r = vr(flowDeck);
    const pr = useProg(progs.veil);
    setBuf(quad(r));
    gl.uniform4f(u(pr, 'uRect'), r.x, r.y, r.w, r.h);
    gl.uniform1f(u(pr, 'uT'), t);
    gl.uniform1f(u(pr, 'uP'), sub(p, 0.83, 0.985));
    gl.uniform1f(u(pr, 'uCh'), ch);
    gl.uniform1f(u(pr, 'uA'), a * 0.85);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function fxOrbit(t) {
    const box = refs.orbitBox, core = refs.orbitCore;
    if (!box || !core || (window.innerWidth || 0) < 900) return;
    const tab = box.firstElementChild;
    if (!tab) return;
    const r = vr(tab);
    if (!onScreen(r)) return;
    const s = Math.min(r.w / 600, r.h / 460);
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const pr = useProg(progs.ring);
    setBuf(quad(r));
    gl.uniform2f(u(pr, 'uC'), cx, cy);
    gl.uniform2f(u(pr, 'uRxy'), 238 * s, 164 * s);
    gl.uniform1f(u(pr, 'uCore'), 95 * s);
    gl.uniform1f(u(pr, 'uT'), t);
    gl.uniform1f(u(pr, 'uA'), 0.34);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = t * 0.32 + i * Math.PI * 0.2;
      pts.push(cx + Math.cos(ang) * 238 * s, cy + Math.sin(ang) * 164 * s);
    }
    drawPoints(pts, 6, 0.45, [1, 0.42, 0.17]);
  }
  let endCons = null;
  function fxEnd(t) {
    if (!endCons) return;
    const r = vr(endCons);
    if (!onScreen(r)) return;
    drawGlow(r, t, 0.14, null);
    drawPoints(perimeterPts(r, t, 8, 0.04), 6.5, 0.5, [1, 0.42, 0.17]);
    drawPoints(perimeterPts(r, t + 5, 4, -0.028), 5, 0.4, [0.4, 0.88, 0.74]);
  }
  function fxCases(t, now) {
    for (let i = caseQueue.length - 1; i >= 0; i--) {
      const it = caseQueue[i];
      const p = clamp((now - it.t0) / 850, 0, 1);
      const r = vr(it.box);
      const pr = useProg(progs.img);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, it.tex);
      setBuf(quad(r));
      gl.uniform4f(u(pr, 'uRect'), r.x, r.y, r.w, r.h);
      gl.uniform1i(u(pr, 'uTex'), 0);
      gl.uniform1f(u(pr, 'uT'), t);
      gl.uniform1f(u(pr, 'uP'), ez(p));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (p >= 1) { gl.deleteTexture(it.tex); caseQueue.splice(i, 1); } // texture memory 釋放
    }
  }
  function queueCase(box, src) {
    const im = new Image();
    im.onload = () => {
      if (destroyed || disabled || !gl) return;
      try {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        caseQueue.push({ box, tex, t0: performance.now() });
      } catch (e) { lastErr = String(e); }
    };
    im.src = src;
  }

  // ---------- 迴圈 ----------
  function frame(now) {
    const t = (now - t0) / 1000;
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    try {
      if (visFx.flow) fxFlow(t);
      if (visFx.cases) fxCases(t, now);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive:光暈/粒子
      if (visFx.hero) fxHero(t);
      if (visFx.orbit) fxOrbit(t);
      if (visFx.end) fxEnd(t);
    } catch (e) { lastErr = String(e && e.message || e); kill(); }
  }
  function loop(now) {
    if (destroyed || disabled) return;
    raf = requestAnimationFrame(loop);
    lastTick = now;
    if (document.hidden) return;
    frame(now);
  }
  const onScroll = () => {
    if (destroyed || disabled) return;
    const now = performance.now();
    if (now - lastTick > 200) frame(now);
  };
  function resize() {
    if (!canvas) return;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.round((window.innerWidth || 1) * DPR);
    H = Math.round((window.innerHeight || 1) * DPR);
    canvas.width = W; canvas.height = H;
  }
  let resizeTmr = 0;
  const onResize = () => { clearTimeout(resizeTmr); resizeTmr = setTimeout(() => { if (!destroyed) resize(); }, 120); };
  function kill() {
    disabled = true;
    if (canvas) canvas.style.display = 'none'; // fallback:底層 Canvas2D/DOM 敘事完整保留
  }

  function start() {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const save = navigator.connection && navigator.connection.saveData;
    const lowMem = navigator.deviceMemory && navigator.deviceMemory < 4;
    if (reduced || save || lowMem || (window.innerWidth || 0) < 900) { disabled = true; return; }
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
    document.body.appendChild(canvas);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); kill(); }, false);
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'low-power' });
      if (!gl) throw new Error('no webgl');
      resize();
      progs.glow = mkProg(FS_GLOW);
      progs.pt = mkProg(FS_PT);
      progs.veil = mkProg(FS_VEIL);
      progs.img = mkProg(FS_IMG);
      progs.ring = mkProg(FS_RING);
      bufs.dyn = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bufs.dyn);
    } catch (e) { lastErr = String(e && e.message || e); kill(); return; }
    let tries = 0;
    const boot = () => {
      if (destroyed || disabled) return;
      flowWrap = document.querySelector('#flow > div');
      flowDeck = document.querySelector('#flow [data-deck]');
      endCons = document.querySelector('#demo-cta [data-console]');
      const boxes = Array.from(document.querySelectorAll('#cases [data-caseimg][data-src]'));
      if ((!flowWrap || !boxes.length) && tries++ < 90) { raf = requestAnimationFrame(boot); return; }
      if (boxes.length && 'IntersectionObserver' in window) {
        const done = new WeakSet();
        const io = new IntersectionObserver(es => {
          es.forEach(e => {
            if (e.isIntersecting && !done.has(e.target)) {
              done.add(e.target);
              queueCase(e.target, e.target.getAttribute('data-src'));
              io.unobserve(e.target);
            }
          });
        }, { threshold: 0.35 });
        boxes.forEach(b => io.observe(b));
        ios.push(io);
      }
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onScroll, { passive: true });
      raf = requestAnimationFrame(loop);
      window.__pqGL = { state: () => ({ disabled, err: lastErr, caseN: caseQueue.length, progs: Object.keys(progs).length }) };
    };
    boot();
  }
  function destroy() {
    destroyed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    ios.forEach(io => io.disconnect());
    if (gl) {
      try {
        caseQueue.forEach(it => gl.deleteTexture(it.tex));
        caseQueue = [];
        Object.values(progs).forEach(p => gl.deleteProgram(p));
        if (bufs.dyn) gl.deleteBuffer(bufs.dyn);
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      } catch (e) {}
    }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (window.__pqGL) delete window.__pqGL;
  }
  return { start, destroy };
}
