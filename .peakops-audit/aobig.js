// 找出「畫面上看起來像地板髒污」的那幾片:用目前生效的參數重跑一次挑選邏輯,
// 依面積排序回報來源物件,才知道該調參數還是該排除特定物件。
await new Promise((r) => setTimeout(r, 2500));
const stage = document.querySelector('three-d-stage');
const root = stage && stage._object;
if (!root) return JSON.stringify({ err: 'no object' });
const THREE = stage._THREE;
const maxFoot = 1.8, maxGap = 0.14, spread = 1.18, minFoot = 0.04, LIFT = 0.02;

const box = new THREE.Box3(), size = new THREE.Vector3(), mid = new THREE.Vector3();
const DOWN = new THREE.Vector3(0, -1, 0);
const rc = new THREE.Raycaster(); rc.far = maxGap + 0.4;
const own = (h, o) => { for (let p = h; p; p = p.parent) if (p === o) return true; return false; };
const cs = root.getObjectByName('contact_shadows');
const es = root.getObjectByName('edge_shade');

const out = [];
for (const g of root.children) {
  if (!/^(floor\d|engine_)/.test(g.name || '')) continue;
  for (const o of g.children) {
    if (!o.visible || o.userData.noShadow || /^anim_/.test(o.name || '')) continue;
    box.setFromObject(o);
    if (box.isEmpty()) continue;
    box.getSize(size); box.getCenter(mid);
    const foot = Math.max(size.x, size.z);
    if (foot > maxFoot || size.y < 0.04) continue;
    rc.set(new THREE.Vector3(mid.x, box.min.y + LIFT, mid.z), DOWN);
    const u = rc.intersectObject(root, true).find((h) => !own(h.object, o) && h.object !== cs && h.object !== es);
    if (!u) continue;
    const gap = u.distance - LIFT;
    if (gap > maxGap) continue;
    const soften = 1 + Math.max(0, gap) * 2.2;
    const sx = Math.max(minFoot, size.x) * spread * soften;
    const sz = Math.max(minFoot, size.z) * spread * soften;
    out.push({ n: (o.name || '?').slice(0, 26), 層: g.name.slice(0, 18), 陰影長: +sx.toFixed(2), 陰影寬: +sz.toFixed(2), 物高: +size.y.toFixed(2), 落差: +gap.toFixed(3), 面積: +(sx * sz).toFixed(3) });
  }
}
out.sort((a, b) => b.面積 - a.面積);
const areas = out.map((r) => r.面積);
return JSON.stringify({
  總數: out.length,
  面積中位數: areas.length ? +areas[Math.floor(areas.length / 2)].toFixed(3) : 0,
  最大15片: out.slice(0, 15)
}, null, 1);
