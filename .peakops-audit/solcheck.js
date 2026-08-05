// Solutions 手機三合一驗收:hero 上下對調 / 王小姐移動 / 模組手風琴
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { y: Math.round(r.y), b: Math.round(r.bottom), h: Math.round(r.height) }; };
await new Promise(r => setTimeout(r, 1500));
// 1) hero:媒體區應在文案上方
const media = document.querySelector('[data-hero-media]');
const copy = document.querySelector('[data-hero-copy]');
const heroOK = media && copy && media.getBoundingClientRect().y < copy.getBoundingClientRect().y;
// 2) 王小姐:記兩個捲動點的 transform
const fol = document.querySelector('#follow');
const card = document.querySelector('#follow [data-fcard]');
let t1 = null, t2 = null, snapY = [];
if (fol && card) {
  const de = document.scrollingElement || document.documentElement;
  const top = fol.getBoundingClientRect().top + de.scrollTop;
  window.scrollTo(0, top - innerHeight * 0.3);
  await new Promise(r => setTimeout(r, 800));
  for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
  t1 = card.style.transform;
  window.scrollTo(0, top + fol.offsetHeight * 0.55 - innerHeight * 0.4);
  await new Promise(r => setTimeout(r, 900));
  for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
  t2 = card.style.transform;
  snapY = Array.from(document.querySelectorAll('#follow [data-fcol]')).map(c => c.offsetTop);
}
// 3) 模組:細節卡是否搬到列後、is-open 是否隨捲動切換、點擊列展開
const rows = Array.from(document.querySelectorAll('#modules [data-smod]'));
const dets = Array.from(document.querySelectorAll('#modules [data-sdet]'));
const moved = dets.length && dets.every(d => d.previousElementSibling && d.previousElementSibling.hasAttribute && d.previousElementSibling.hasAttribute('data-smod'));
const shell = document.querySelector('#pq-sol-detshell');
const mod = document.querySelector('#modules');
let openIdx1 = -1, openIdx2 = -1, clickOpen = -1;
if (mod && rows.length) {
  const de = document.scrollingElement || document.documentElement;
  const top = mod.getBoundingClientRect().top + de.scrollTop;
  window.scrollTo(0, top - innerHeight * 0.2);
  await new Promise(r => setTimeout(r, 700));
  openIdx1 = dets.findIndex(d => d.classList.contains('is-open'));
  window.scrollTo(0, top + mod.offsetHeight * 0.6 - innerHeight * 0.5);
  await new Promise(r => setTimeout(r, 900));
  for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
  openIdx2 = dets.findIndex(d => d.classList.contains('is-open'));
  rows[1].click();
  await new Promise(r => setTimeout(r, 400));
  clickOpen = dets.findIndex(d => d.classList.contains('is-open'));
}
const de2 = document.scrollingElement || document.documentElement;
return JSON.stringify({
  vw: innerWidth,
  heroMediaTop: heroOK, mediaR: R(media), copyR: R(copy),
  followT1: t1, followT2: t2, followMoves: !!(t1 !== null && t2 !== null && t1 !== t2), snapY,
  detsMoved: moved, shellHidden: shell ? getComputedStyle(shell).display === 'none' : null,
  openIdx1, openIdx2, clickOpen,
  overflowX: de2.scrollWidth - de2.clientWidth
}, null, 1);
