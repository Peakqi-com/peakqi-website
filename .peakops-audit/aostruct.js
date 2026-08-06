// 塔樓結構盤點:要知道「哪些物件是站在地板上的小道具」,才知道接觸陰影該掛幾片。
// 用向下射線找出每個候選物件正下方的落點 —— 有落點才是「站著」,沒有就是懸空/裝飾。
await new Promise((r) => setTimeout(r, 2500));
const stage = document.querySelector('three-d-stage');
const root = stage && stage._object;
if (!root) return JSON.stringify({ err: 'no object' });
const THREE = stage._THREE;

const whole = new THREE.Box3().setFromObject(root);
const size = whole.getSize(new THREE.Vector3());

// 候選:命名過的節點(tower.js 幫道具都取了名字),且不是整層樓板/外殼
const named = [];
root.traverse((o) => { if (o.name) named.push(o); });

let meshCount = 0;
root.traverse((o) => { if (o.isMesh) meshCount++; });

// 統計命名節點的尺寸分佈,決定「小道具」的門檻
const b = new THREE.Box3(), v = new THREE.Vector3();
const rows = [];
for (const o of named) {
  b.setFromObject(o);
  if (b.isEmpty()) continue;
  b.getSize(v);
  rows.push({ n: o.name, t: o.type, sx: +v.x.toFixed(3), sy: +v.y.toFixed(3), sz: +v.z.toFixed(3), y0: +b.min.y.toFixed(3) });
}
rows.sort((a, c) => (a.sx * a.sz) - (c.sx * c.sz));

// 頂層 children(通常是「層」或大區塊)
const tops = root.children.map((c) => {
  b.setFromObject(c); if (b.isEmpty()) return { n: c.name || '(匿名)', t: c.type, empty: 1 };
  b.getSize(v);
  return { n: c.name || '(匿名)', t: c.type, sx: +v.x.toFixed(2), sy: +v.y.toFixed(2), y0: +b.min.y.toFixed(2), kids: c.children.length };
});

return JSON.stringify({
  整體尺寸: { x: +size.x.toFixed(2), y: +size.y.toFixed(2), z: +size.z.toFixed(2), 地板y: +whole.min.y.toFixed(3) },
  mesh總數: meshCount,
  命名節點數: named.length,
  頂層children: tops,
  最小的20個命名節點: rows.slice(0, 20),
  最大的12個命名節點: rows.slice(-12)
}, null, 1);
