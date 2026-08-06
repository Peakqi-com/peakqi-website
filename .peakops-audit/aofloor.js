// 每一層樓:找出「甲板高度」與站在甲板上的道具。
// 甲板 = 該層 bbox 的最低點(樓板本身一定是最低的那塊)。
// 站著 = 物件 bbox 底部貼近甲板(容差取整棟高度的 0.4%)。
await new Promise((r) => setTimeout(r, 2500));
const stage = document.querySelector('three-d-stage');
const root = stage && stage._object;
if (!root) return JSON.stringify({ err: 'no object' });
const THREE = stage._THREE;
const b = new THREE.Box3(), v = new THREE.Vector3(), c = new THREE.Vector3();

const out = [];
for (const g of root.children) {
  if (!/^floor\d/.test(g.name || '')) continue;
  b.setFromObject(g);
  const deck = b.min.y;
  const stand = [], air = [];
  for (const ch of g.children) {
    b.setFromObject(ch);
    if (b.isEmpty()) continue;
    b.getSize(v); b.getCenter(c);
    const gap = b.min.y - deck;
    const foot = Math.max(v.x, v.z);
    const rec = { n: (ch.name || '(匿名)').slice(0, 26), gap: +gap.toFixed(3), 寬: +foot.toFixed(3), 高: +v.y.toFixed(3) };
    if (gap < 0.08 && foot < 1.6 && v.y > 0.02) stand.push(rec); else air.push(rec);
  }
  out.push({
    層: g.name, 甲板y: +deck.toFixed(3), 子物件: g.children.length,
    站在甲板上: stand.length, 其他: air.length,
    站著範例: stand.slice(0, 8),
    其他範例: air.slice(0, 5)
  });
}
return JSON.stringify(out, null, 1);
