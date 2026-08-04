for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.9)) {
  scrollTo(0, y); await new Promise(r => requestAnimationFrame(r));
}
await new Promise(r => setTimeout(r, 500));
const w = document.querySelector('#flow > div');
const base = Math.round(w.getBoundingClientRect().top + scrollY);
const track = w.offsetHeight - innerHeight;
const target = base + Math.round(track * 0.90);
let y = scrollY;
while (Math.abs(y - target) > 6) { y += Math.sign(target - y) * Math.min(400, Math.abs(target - y)); scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
scrollTo(0, target);
await new Promise(r => setTimeout(r, 1200));
const cv = document.querySelector('body > canvas');
return JSON.stringify({ pinnedTrack: track, at: scrollY, glCanvas: !!cv, glState: window.__pqGL ? window.__pqGL.state() : null });
