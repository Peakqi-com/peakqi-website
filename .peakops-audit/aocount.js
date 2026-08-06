// 驗收:兩套暗部各掛了幾片、是否真的只多兩個 draw call、有沒有污染 bbox。
await new Promise((r) => setTimeout(r, 2500));
const stage = document.querySelector('three-d-stage');
const root = stage && stage._object;
if (!root) return JSON.stringify({ err: 'no object' });
const info = stage._renderer.info;
return JSON.stringify({
  接觸陰影片數: stage._contactShadows ? stage._contactShadows.count : 0,
  交界暗部片數: stage._edgeShade ? stage._edgeShade.count : 0,
  本幀drawCalls: info.render.calls,
  三角形: info.render.triangles,
  幾何體數: info.memory.geometries,
  材質貼圖數: info.memory.textures,
  接觸陰影是單一物件: !!(stage._contactShadows && stage._contactShadows.isInstancedMesh),
  交界暗部是單一物件: !!(stage._edgeShade && stage._edgeShade.isInstancedMesh)
});
