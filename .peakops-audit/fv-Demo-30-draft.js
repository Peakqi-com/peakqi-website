// Demo #draft 新 section:面板底緣 vs 下一段(#scene)頂緣、超寬掃描
// ?state=picked 時先點「婚禮婚慶」+「LINE 客服」再量(面板會長高:相似場景圖卡+摘要)
const q = new URLSearchParams(location.search);
const sec = document.getElementById('draft');
if (!sec) return JSON.stringify({ fatal: 'no #draft' });
const statusEl = sec.querySelector('[role="status"]');
const panel = statusEl ? statusEl.closest('div').parentElement : null;
if (!panel) return JSON.stringify({ fatal: 'no panel' });
if (q.get('state') === 'picked') {
  const btns = Array.from(panel.querySelectorAll('button'));
  const bi = btns.find(b => b.textContent.trim().indexOf('婚禮婚慶') >= 0);
  const bf = btns.find(b => b.textContent.trim().indexOf('LINE 客服') >= 0);
  if (bi) bi.click();
  await new Promise(r => setTimeout(r, 400));
  if (bf) bf.click();
  await new Promise(r => setTimeout(r, 900));
}
sec.scrollIntoView();
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const sy = scrollY;
const pr = panel.getBoundingClientRect();
const sr = sec.getBoundingClientRect();
const scene = document.getElementById('scene');
const nr = scene.getBoundingClientRect();
// 超寬掃描:任何元素右緣超出視窗(SVG 子元素量的是 viewBox 未縮放座標,量 svg 根即可)
let wide = [];
document.querySelectorAll('body *').forEach(el => {
  if (el.namespaceURI && el.namespaceURI.indexOf('svg') >= 0 && el.tagName.toLowerCase() !== 'svg') return;
  const r = el.getBoundingClientRect();
  if (r.width > 5 && r.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed')
    wide.push({ t: el.tagName + '.' + String(el.className).slice(0, 24), right: Math.round(r.right) });
});
return JSON.stringify({
  state: q.get('state') || 'empty',
  status: statusEl.textContent.trim(),
  panelBottom: Math.round(pr.bottom + sy),
  draftSecBottom: Math.round(sr.bottom + sy),
  sceneTop: Math.round(nr.top + sy),
  gapPanelToScene: Math.round(nr.top - pr.bottom),
  panelInsideSec: pr.bottom <= sr.bottom + 0.5,
  panelH: Math.round(pr.height),
  scrollW: document.documentElement.scrollWidth, innerW: innerWidth,
  wide: wide.slice(0, 6)
}, null, 1);
