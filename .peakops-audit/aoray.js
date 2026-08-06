// 試算:用向下射線找每個道具的落點,看會產生幾片接觸陰影、落點距離合不合理。
// 只是試算,不改任何東西。
await new Promise((r) => setTimeout(r, 2500));
const stage = document.querySelector('three-d-stage');
const root = stage && stage._object;
if (!root) return JSON.stringify({ err: 'no object' });
const THREE = stage._THREE;

const b = new THREE.Box3(), v = new THREE.Vector3(), c = new THREE.Vector3();
const DOWN = new THREE.Vector3(0, -1, 0);
const rc = new THREE.Raycaster();
rc.far = 3;

// 被射線打到的目標池:整棵樹(排除自己與自己的子孫)
const isDesc = (o, anc) => { for (let p = o; p; p = p.parent) if (p === anc) return true; return false; };

const GROUPS = root.children.filter((g) => /^(floor\d|engine_)/.test(g.name || ''));
const rep = [];
let total = 0, skipBig = 0, skipFlat = 0, skipNoHit = 0, skipFar = 0;

for (const g of GROUPS) {
  let n = 0; const ex = [];
  for (const ch of g.children) {
    b.setFromObject(ch);
    if (b.isEmpty()) continue;
    b.getSize(v); b.getCenter(c);
    const foot = Math.max(v.x, v.z);
    if (foot > 1.8) { skipBig++; continue; }        // 牆、樓板、天花板
    if (v.y < 0.04) { skipFlat++; continue; }        // 貼片、線條
    rc.set(new THREE.Vector3(c.x, b.min.y + 0.02, c.z), DOWN);
    const hits = rc.intersectObject(root, true).filter((h) => !isDesc(h.object, ch));
    if (!hits.length) { skipNoHit++; continue; }
    const d = hits[0].distance - 0.02;
    if (d > 0.14) { skipFar++; continue; }           // 懸空,不是站著
    n++; total++;
    if (ex.length < 5) ex.push({ n: (ch.name || '?').slice(0, 24), 落差: +d.toFixed(3), 寬: +foot.toFixed(2), 落在: (hits[0].object.name || '?').slice(0, 22) });
  }
  rep.push({ 層: g.name, 子物件: g.children.length, 產生陰影: n, 範例: ex });
}
return JSON.stringify({ 陰影總片數: total, 略過_太大: skipBig, 略過_太扁: skipFlat, 略過_下方無物: skipNoHit, 略過_懸空: skipFar, 逐層: rep }, null, 1);
