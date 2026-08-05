// 第一幕驗收 probe:等鳥啄 → 點鳥驅趕 → 驗證弧線飛離 + 視線追蹤 → 全清場後回復平靜
// 注意:此檔會被 run.mjs 以樣板字串內嵌,禁用反引號與 ${。
const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
const stage = document.querySelector('[data-allen-stage]');
if (!stage) return JSON.stringify({ fatal: 'no stage' });
window.scrollTo(0, stage.getBoundingClientRect().top + scrollY - 200);
await sleep(500);
const num = function (tr) { return (tr && tr.match(/-?\d+(\.\d+)?/g) || []).map(Number); };

// 1) 等到至少一隻鳥進入啄擊狀態(最長 14s)
let birds = [];
for (let i = 0; i < 70; i++) {
  birds = Array.prototype.slice.call(stage.querySelectorAll('[data-bird]'));
  if (birds.some(function (b) { return b.getAttribute('data-state') === 'peck'; })) break;
  await sleep(200);
}
const svg = stage.querySelector('#a1-svg');
const pupils = stage.querySelector('#a1-pupils');
if (!svg || !pupils) return JSON.stringify({ fatal: 'act1 not mounted', hasSvg: !!svg });
const target = birds.find(function (b) { return b.getAttribute('data-state') === 'peck'; }) || birds[0];
if (!target) return JSON.stringify({ fatal: 'no birds after 14s' });
const n0 = birds.length;
const before = target.getAttribute('transform');
const moodPeck = svg.getAttribute('data-mood');
const fxCount = stage.querySelectorAll('#a1-fx > *').length;   // 啄擊火花等特效有在跑

// 2) 點第一隻 → 應轉為 flee 並沿弧線移動;瞳孔應跟著鳥
target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
await sleep(120);
const stateAfter = target.getAttribute('data-state');
const s1 = { bird: num(target.getAttribute('transform')), eye: num(pupils.getAttribute('transform')) };
await sleep(280);
const s2 = { bird: num(target.getAttribute('transform')), eye: num(pupils.getAttribute('transform')) };
const birdMoved = s1.bird[0] !== s2.bird[0] || s1.bird[1] !== s2.bird[1];
const eyeMoved = s1.eye[0] !== s2.eye[0] || s1.eye[1] !== s2.eye[1];
// 瞳孔 x 偏移方向應與鳥相對眼睛中心 (200,250) 同向(鳥貼近中線時不計)
const dirOK = function (s) {
  if (!s.bird.length || !s.eye.length) return null;
  if (Math.abs(s.bird[0] - 200) < 40) return true;
  return (s.eye[0] > 0) === (s.bird[0] - 200 > 0);
};
await sleep(1400);
const targetRemoved = !stage.contains(target);

// 3) 把剩下的鳥全點掉 → 清場、心情回落(settle > 1.5s)
const rest = Array.prototype.slice.call(stage.querySelectorAll('[data-bird]'));
for (let i = 0; i < rest.length; i++) {
  rest[i].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await sleep(150);
}
await sleep(1800);
const birdsLeft = stage.querySelectorAll('[data-bird]').length;
await sleep(1600);
const moodCalm = svg.getAttribute('data-mood');
return JSON.stringify({
  birdsAtStart: n0,
  fxAliveWhilePecking: fxCount,
  stateAfterClick: stateAfter,
  birdMovedDuringFlee: birdMoved,
  eyeMovedDuringFlee: eyeMoved,
  gazeDirOK: [dirOK(s1), dirOK(s2)],
  eyeSample1: s1, eyeSample2: s2,
  targetRemoved: targetRemoved,
  birdsLeftAfterAllClicked: birdsLeft,
  moodWhilePecked: moodPeck,
  moodAfterCalm: moodCalm,
  transformBefore: before
}, null, 1);
