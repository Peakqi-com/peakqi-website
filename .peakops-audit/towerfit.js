// 3D 塔樓故事頁探針:掃過整條捲軸,量每一張字卡有沒有被 max-height/overflow:hidden 裁字,
// 並回報章節銅牌、左側章節軌、hero 文字的實際邊界(rail 會不會撞到 hero / secHead)。
// 用法: node .peakops-audit/run.mjs <url> <png> <W> <H> <p> .peakops-audit/towerfit.js
await new Promise((r) => setTimeout(r, 2200));

const clip = (el) => Math.round(el.scrollHeight - el.clientHeight);
const clips = [];      // 被裁到的字卡
const headClips = [];  // 被裁到的銅牌(理論上不會,它沒 max-height)
const seen = new Set();
let maxRailRight = 0;

const doc = document.scrollingElement;
const maxY = doc.scrollHeight - innerHeight;
const step = (p) => { if (typeof window.__step === 'function') window.__step(Math.round(p * maxY)); };

for (let i = 0; i <= 50; i++) {
  const p = i / 50;
  step(p);
  const head = document.getElementById('secHead');
  const cards = [...document.querySelectorAll('#cards .card')];
  cards.forEach((c, ci) => {
    const h3 = c.querySelector('h3');
    const key = (h3 ? h3.textContent : '') + '#' + ci;
    const over = clip(c);
    if (over > 1 && !seen.has(key)) {
      seen.add(key);
      clips.push({ p: +p.toFixed(2), card: ci, clipPx: over, boxH: c.offsetHeight, h3: (h3 ? h3.textContent : '').slice(0, 46) });
    }
  });
  if (head && head.style.display !== 'none') {
    const o = clip(head);
    if (o > 1) headClips.push({ p: +p.toFixed(2), clipPx: o, t: head.querySelector('h2').textContent.slice(0, 30) });
  }
  const rail = document.getElementById('rail');
  if (rail && getComputedStyle(rail).display !== 'none') {
    [...rail.children].forEach((s) => { maxRailRight = Math.max(maxRailRight, Math.round(s.getBoundingClientRect().right)); });
  }
}

// 回到 run.mjs 指定的捲動位置,讓相機收斂後再截圖
window.__scrollOverride = null;
await new Promise((r) => setTimeout(r, 1800));

const hero = document.getElementById('hero');
const h1 = hero ? hero.querySelector('h1') : null;
const slog = hero ? hero.querySelector('.slogan') : null;
const head = document.getElementById('secHead');
const headBox = head && head.style.display !== 'none' ? head.getBoundingClientRect() : null;
const onCard = document.querySelector('#cards .card.on');
const stage = document.querySelector('three-d-stage');
const cvs = (stage && stage.shadowRoot ? stage.shadowRoot.querySelector('canvas') : null) || document.querySelector('canvas');
const cam = (stage && stage._camera) ? stage._camera.position : null;
const tgt = (stage && stage._camera) ? null : null;

const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };

return JSON.stringify({
  lang: document.documentElement.lang,
  overflowX: doc.scrollWidth - innerWidth,
  clippedCards: clips,
  clippedHeads: headClips.slice(0, 4),
  railRight: maxRailRight,
  heroBox: r(hero), h1Box: r(h1), sloganBox: r(slog),
  h1Wrap: h1 ? Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)) : null,
  secHead: headBox ? [Math.round(headBox.left), Math.round(headBox.top), Math.round(headBox.right), Math.round(headBox.bottom)] : null,
  activeCard: onCard ? { h3: onCard.querySelector('h3').textContent.slice(0, 40), box: r(onCard), clipPx: clip(onCard) } : null,
  canvas: cvs ? [cvs.width, cvs.height] : null,
  camPos: cam ? [+cam.x.toFixed(2), +cam.y.toFixed(2), +cam.z.toFixed(2)] : null,
}, null, 1);
