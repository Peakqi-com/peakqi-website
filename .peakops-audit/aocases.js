// Cases 頁:塔樓在 iframe 裡。確認 (a) 暗部有掛上、(b) 引導層 HUD 仍然跟著章節走。
await new Promise((r) => setTimeout(r, 3000));
const run = document.getElementById('pq-bh-runway');
const fr = document.getElementById('pq-bh-frame');
if (!run || !fr) return JSON.stringify({ err: 'no runway/frame' });
const top = run.getBoundingClientRect().top + scrollY;
const total = run.offsetHeight - innerHeight;
scrollTo(0, Math.round(top + 0.32 * total));
await new Promise((r) => setTimeout(r, 2600));

const ui = document.getElementById('pq-bh-ui');
const q = (s) => (ui ? ui.querySelector(s) : null);
let inner = { err: 'no access' };
try {
  const w = fr.contentWindow, d = fr.contentDocument;
  const stage = d.querySelector('three-d-stage');
  const root = stage && stage._object;
  inner = {
    接觸陰影: root && root.getObjectByName('contact_shadows') ? root.getObjectByName('contact_shadows').count : 0,
    交界暗部: root && root.getObjectByName('edge_shade') ? root.getObjectByName('edge_shade').count : 0,
    drawCalls: stage && stage._renderer ? stage._renderer.info.render.calls : -1,
    iframe捲動: Math.round(w.scrollY)
  };
} catch (e) { inner = { err: String(e).slice(0, 90) }; }

return JSON.stringify({
  內部: inner,
  HUD章節: q('.bh-i') ? q('.bh-i').textContent : null,
  HUD總數: q('.bh-n') ? q('.bh-n').textContent : null,
  HUD名稱: q('.bh-nm') ? q('.bh-nm').textContent : null,
  進度條寬: q('.bh-bar u') ? q('.bh-bar u').style.width : null,
  引導層已啟動: !!(ui && ui.classList.contains('is-go')),
  章節清單收合: q('.bh-list') ? q('.bh-list').hidden : null
});
