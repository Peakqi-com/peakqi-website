// 第三幕驗收 probe:?chip=calm|disco|waltz|stop 按對應晶片後量測
// 量:場景群組透明度、機器人 transform 是否持續在動、晶片命中區尺寸、音訊狀態
const q = new URLSearchParams(location.search);
const stage = document.querySelector('[data-allen-stage]');
if (!stage) return JSON.stringify({ fatal: 'no stage' });
stage.scrollIntoView({ block: 'center' });
await new Promise(r => setTimeout(r, 700));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));

const out = { act3mounted: !!stage.querySelector('.a3-root') };
const chip = q.get('chip');
const btn = chip && stage.querySelector('[data-song="' + chip + '"]');
if (chip) {
  if (!btn) return JSON.stringify({ fatal: 'no chip button ' + chip });
  btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await new Promise(r => setTimeout(r, 1100));   // 過場混合 + 場景淡入
}
const chip2 = q.get('chip2');   // 第二次按(切歌或停止)
if (chip2) {
  const btn2 = stage.querySelector('[data-song="' + chip2 + '"]');
  if (!btn2) return JSON.stringify({ fatal: 'no chip2 ' + chip2 });
  btn2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await new Promise(r => setTimeout(r, 1300));
}
const rot = stage.querySelector('.a3-rot');
const tf1 = rot && rot.getAttribute('transform');
await new Promise(r => setTimeout(r, 350));
for (let i = 0; i < 12; i++) await new Promise(r => requestAnimationFrame(r));
const tf2 = rot && rot.getAttribute('transform');

const sc = {};
['stage', 'meadow', 'disco', 'ball'].forEach(k => {
  const el = stage.querySelector('.a3-sc-' + k);
  sc[k] = el ? getComputedStyle(el).opacity : null;
});
const fg = {};
['meadow', 'disco', 'ball'].forEach(k => {
  const el = stage.querySelector('.a3-scf-' + k);
  fg[k] = el ? getComputedStyle(el).opacity : null;
});
const hits = [];
stage.querySelectorAll('.a3-chip').forEach(b => {
  const r = b.getBoundingClientRect();
  hits.push(b.dataset.song + ':' + Math.round(r.width) + 'x' + Math.round(r.height));
});
const dotsEl = stage.querySelector('[aria-label="切換 Allen 的三個小劇場"]');
out.moved = tf1 !== tf2;
out.tf = tf2;
out.mode = stage.dataset.a3 || null;
out.audio = stage.dataset.a3audio || 'untouched';
out.scenes = sc;
out.fgScenes = fg;
out.chipHits = hits;
out.dotsAlive = !!dotsEl && dotsEl.children.length === 3;
out.stageRect = (() => { const r = stage.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); })();
return JSON.stringify(out);
