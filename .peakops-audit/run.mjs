// PeakOps 驗收執行器:headless Chrome + console 收集 + probe 注入 + 截圖
// 用法: node .peakops-audit/run.mjs <url> <outPng> <W> <H> <scrollP> <probeFile>
import { spawn } from 'child_process';
import fs from 'fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [, , url, out, wS, hS, pStr, probeFile, mediaFlag] = process.argv;
const W = +wS || 1440, H = +hS || 900, P = parseFloat(pStr || '0');
const mobile = W < 900;
// 每次獨立的 port 與 profile:前一輪的 Chrome 可能還沒完全退出,
// 共用目錄會 EPERM,共用 port 會 attach 到別人的分頁
const PORT = 9400 + (process.pid % 90);
const PROF = 'C:/tmp/cdpprof-peakops-' + process.pid;
process.on('exit', () => { try { fs.rmSync(PROF, { recursive: true, force: true }); } catch (e) { /* Chrome 尚未釋放 */ } });

const args = ['--headless=new', `--remote-debugging-port=${PORT}`,
  '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
  '--force-device-scale-factor=1', `--user-data-dir=${PROF}`,
  '--no-first-run', '--no-default-browser-check', `--window-size=${W},${H}`,
  '--autoplay-policy=no-user-gesture-required', url];
const ch = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let tgt = null;
for (let i = 0; i < 60; i++) {
  await sleep(500);
  try {
    const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    tgt = l.find(t => t.type === 'page' && t.url && t.url.startsWith('http'));
    if (tgt) break;
  } catch (e) { /* chrome 還沒起來 */ }
}
if (!tgt) { ch.kill(); console.log(JSON.stringify({ fatal: 'no chrome target' })); process.exit(1); }

const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map();
const CONSOLE = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
    CONSOLE.push(m.params.type + ': ' + m.params.args.map(a =>
      String(a.value ?? a.description ?? a.unserializableValue ?? '')).join(' ').slice(0, 220));
  }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    CONSOLE.push('EXCEPTION: ' + (d.exception?.description || d.text || '').slice(0, 220));
  }
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
    CONSOLE.push('log: ' + String(m.params.entry.text).slice(0, 120) + ' <' + String(m.params.entry.url || '').slice(-90) + '>');
  }
};
const send = (method, params = {}) => new Promise(r => {
  const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params }));
});

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: W, height: H, deviceScaleFactor: 1, mobile,
  screenWidth: W, screenHeight: H,
  ...(mobile ? { screenOrientation: { angle: 0, type: 'portraitPrimary' } } : {})
});
if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
// 第 8 個參數傳 "reduced" 時模擬 prefers-reduced-motion: reduce
if (mediaFlag === 'reduced') {
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
}
await send('Page.reload', { ignoreCache: true });
await sleep(6000);

const probe = fs.readFileSync(probeFile, 'utf8');
const r = await send('Runtime.evaluate', {
  expression: `(async()=>{
    window.scrollTo(0, Math.round(${P}*(document.body.scrollHeight-window.innerHeight)));
    await new Promise(r=>setTimeout(r,200));
    for(let i=0;i<60;i++) await new Promise(r=>requestAnimationFrame(r));
    ${probe}
  })()`, awaitPromise: true, returnByValue: true
});
const val = r.result?.result?.value;
const err = r.result?.exceptionDetails?.exception?.description;

console.log(JSON.stringify({
  consoleErrors: CONSOLE.filter((v, i, a) => a.indexOf(v) === i).slice(0, 20),
  probeError: err || null,
}, null, 1));
if (val) console.log(val);

if (out && out !== '-') {
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
}
ws.close(); ch.kill(); process.exit(0);
