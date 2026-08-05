// 塔樓三修驗證:canvas touch-action、手機加長節奏、銅牌截圖
await new Promise((r) => setTimeout(r, 3800));
const stage = document.querySelector('three-d-stage');
const cv = stage && (stage.querySelector('canvas') || (stage.shadowRoot && stage.shadowRoot.querySelector('canvas')));
const spacer = document.getElementById('spacer');
return JSON.stringify({
  canvasTA: cv ? getComputedStyle(cv).touchAction : 'no-canvas',
  hostTA: stage ? getComputedStyle(stage).touchAction : 'no-stage',
  vh: innerHeight,
  spacerVh: spacer ? Math.round(spacer.getBoundingClientRect().height / innerHeight * 100) : 0
});
