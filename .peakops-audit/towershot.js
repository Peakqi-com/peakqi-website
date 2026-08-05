// 塔樓故事頁截圖前的輕量收斂:等相機阻尼跑完,並回報當下章節/字卡/裁切量
await new Promise((r) => setTimeout(r, 2600));
const head = document.getElementById('secHead');
const on = document.querySelector('#cards .card.on');
const rail = document.querySelector('#rail .stop.on');
const cards = [...document.querySelectorAll('#cards .card')];
return JSON.stringify({
  lang: document.documentElement.lang,
  overflowX: document.scrollingElement.scrollWidth - innerWidth,
  rail: rail ? rail.textContent : null,
  head: head && head.style.display !== 'none' ? head.querySelector('h2').textContent : null,
  card: on ? on.querySelector('h3').textContent : null,
  clipAny: cards.map((c) => c.scrollHeight - c.clientHeight).filter((v) => v > 1),
  badge: (document.querySelector('body > div[style*="24/7"]') ? 1 : 0),
  cam: (() => { const s = document.querySelector('three-d-stage'); return s && s._camera ? [+s._camera.position.x.toFixed(2), +s._camera.position.y.toFixed(2), +s._camera.position.z.toFixed(2)] : null; })(),
});
