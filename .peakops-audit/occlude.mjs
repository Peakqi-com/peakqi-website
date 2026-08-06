// 品牌屋 3D:沿整段跑道取樣,找出「畫面中央被大型暗色幾何擋住」的章節
// WebGL 畫布沒有 preserveDrawingBuffer 就讀不到像素,所以改用 CDP 截圖 →
// 把 base64 送回頁面解碼成 Image → 畫進 2D canvas 再統計。不必動到產品程式碼。
import { spawn } from 'child_process'; import fs from 'fs';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [, , url, wS, hS, nS] = process.argv;
const W = +wS || 1440, H = +hS || 900, N = +nS || 34;
const PORT = 9900 + (process.pid % 70); const PROF = 'C:/tmp/cdpprof-oc-' + process.pid;
process.on('exit', () => { try { fs.rmSync(PROF, { recursive: true, force: true }); } catch (e) {} });
const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader', '--hide-scrollbars', '--force-device-scale-factor=1',
  `--user-data-dir=${PROF}`, '--no-first-run', '--no-default-browser-check',
  `--window-size=${W},${H}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let tgt = null;
for (let i = 0; i < 60; i++) { await sleep(400); try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); tgt = l.find((t) => t.type === 'page'); if (tgt) break; } catch (e) {} }
const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const evalJs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  return r.result?.result?.value;
};
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 900, screenWidth: W, screenHeight: H });
await send('Page.navigate', { url });
await sleep(7000);

// 章節資料:直接向頁面要(引導層已經算好了)
const meta = await evalJs(`(()=>{const run=document.getElementById('pq-bh-runway');
 if(!run) return null;
 const fr=document.getElementById('pq-bh-frame');
 let ch=[];
 try{const d=fr.contentDocument;const sh=d.documentElement.scrollHeight-fr.contentWindow.innerHeight;
  ch=[...d.querySelectorAll('#spacer section')].map((s,i)=>({i,name:(s.querySelector('h2')||{}).textContent||'',p0:s.offsetTop/sh}));}catch(e){}
 return {top: run.getBoundingClientRect().top+scrollY, total: run.offsetHeight-innerHeight, ch};})()`);
if (!meta) { console.log(JSON.stringify({ err: 'no runway' })); ws.close(); ch.kill(); process.exit(0); }

const rows = [];
for (let i = 0; i <= N; i++) {
  const p = i / N;
  await evalJs(`scrollTo(0, ${Math.round(meta.top + p * meta.total)}); 1`);
  await sleep(650);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const b64 = shot.result?.data;
  if (!b64) continue;
  // 把截圖送回頁面解碼並統計:中央框內的近黑比例、以及暗塊是否碰到左右邊
  const stat = await evalJs(`(async()=>{
    const img=new Image(); img.src='data:image/png;base64,${b64}';
    await img.decode();
    const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
    const g=c.getContext('2d'); g.drawImage(img,0,0);
    const NAV=68;                                  // 上方導覽列不列入統計
    const x0=Math.round(c.width*0.30), x1=Math.round(c.width*0.70);
    const y0=Math.round(NAV+(c.height-NAV)*0.18), y1=Math.round(NAV+(c.height-NAV)*0.78);
    const d=g.getImageData(x0,y0,x1-x0,y1-y0).data;
    let dark=0,tot=0;
    for(let k=0;k<d.length;k+=16){tot++; const l=d[k]*0.3+d[k+1]*0.6+d[k+2]*0.1; if(l<34)dark++;}
    // 中線橫掃:暗塊是否從左邊一路連到右邊(像被貼到鏡頭上)
    const my=Math.round((y0+y1)/2);
    const row=g.getImageData(0,my,c.width,1).data;
    let run=0,maxRun=0;
    for(let k=0;k<row.length;k+=4){const l=row[k]*0.3+row[k+1]*0.6+row[k+2]*0.1;
      if(l<34){run++; if(run>maxRun)maxRun=run;} else run=0;}
    return {darkC:+(dark/tot).toFixed(3), spanPct:+(maxRun/c.width*100).toFixed(1)};
  })()`);
  let ci = 0;
  for (let k = 0; k < meta.ch.length; k++) if (p >= meta.ch[k].p0 - 0.0005) ci = k;
  rows.push({ p: +p.toFixed(3), ch: ci + 1, name: (meta.ch[ci]?.name || '').trim().slice(0, 16), ...stat });
}
const bad = rows.filter((r) => r.darkC > 0.42 || r.spanPct > 62);
console.log(JSON.stringify({
  取樣: rows.length,
  疑似遮擋: bad.length,
  明細: bad,
  全部: rows.map((r) => r.ch + ':' + r.darkC + '/' + r.spanPct)
}));
ws.close(); ch.kill(); process.exit(0);
