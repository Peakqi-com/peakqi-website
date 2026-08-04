window.scrollTo(0, Math.round(0.86 * (document.body.scrollHeight - window.innerHeight)));
await new Promise(r => setTimeout(r, 500));
for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r));
const st = window.__pqInteractions ? window.__pqInteractions.state() : null;
return JSON.stringify({ vw: innerWidth, present: !!window.__pqInteractions, state: st }, null, 1);
