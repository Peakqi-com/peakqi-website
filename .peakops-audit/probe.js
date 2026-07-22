// PeakOps 專用驗收 probe(給 C:/tmp/shot2.mjs 當 extra 用)
// 檢查:DC 是否渲染成功、console 有無錯誤、爆版、動畫 DOM 契約是否完整
await new Promise(r => setTimeout(r, 1500));
const $ = s => document.querySelector(s);
const n = s => document.querySelectorAll(s).length;

const SECTIONS = ['hero', 'hero-stats', 'handoff', 'diagnostic', 'pain', 'loss', 'flow',
  'liveops', 'relay', 'features', 'cases', 'portfolio', 'compare', 'pricing',
  'usage', 'timeline', 'risk', 'faq', 'demo-cta'];
const IDS = ['pq-orbit', 'pq-orbitrow', 'pq-tl', 'pq-live-grid', 'pq-live-console',
  'pq-live-items', 'pq-cmp-desk', 'pq-cmp-mob'];
// 引擎依賴的 data-* 契約(數量必須跨版本不變)
const HOOKS = ['[data-wrap]', '[data-stage]', '[data-scrim]', '[data-st]', '[data-chip]',
  '[data-win]', '[data-dep]', '[data-badge]', '[data-leak]', '[data-lossv]', '[data-t]',
  '[data-layer]', '[data-deck]', '[data-rail]', '[data-mcap]',
  '[data-hpath]', '[data-hpack]', '[data-hnum]', '[data-hnote]',
  '[data-dtool]', '[data-dmeter]', '[data-dcount]', '[data-dtake]', '[data-dscan]',
  '[data-live-panel]', '[data-live-item]', '[data-live-link]',
  '[data-rstation]', '[data-rchip]', '[data-rfill]',
  '[data-orbcard]', '[data-count]', '[data-caseimg]', '[data-sweeper]',
  '[data-tstep]', '[data-dot]', '[data-tline]', '[data-console]', '[data-echo]',
  '[data-spot]', '[data-tilt]', '[data-cta]', '[data-arrow]', '[data-divider]'];

// Nav 的浮動 CTA 也帶 data-cta,且只在捲動過門檻後出現 → 會污染契約計數。
// 契約計數一律排除任何位於 position:fixed 容器內的元素。
const inFixed = el => {
  for (let p = el; p && p !== document.body; p = p.parentElement) {
    if (getComputedStyle(p).position === 'fixed') return true;
  }
  return false;
};
const hooks = {};
for (const h of HOOKS) {
  hooks[h.slice(6, -1)] = [...document.querySelectorAll(h)].filter(el => !inFixed(el)).length;
}

// 巢狀契約
const nest = {
  heroThree: !!$('section#hero > div > div > canvas'),
  wrapStage: ['handoff', 'diagnostic', 'liveops', 'relay']
    .every(id => !!$('#' + id + ' > [data-wrap] > [data-stage]')),
  flowFirstDiv: !!($('#flow') && $('#flow').firstElementChild
    && $('#flow').firstElementChild.tagName === 'DIV'),
  orbitTablist: !!($('#pq-orbit') && $('#pq-orbit').firstElementChild),
};

// 爆版:找出實際超出視窗的元素
const over = [];
if (document.documentElement.scrollWidth > innerWidth + 1) {
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)) {
      over.push((el.tagName + (el.id ? '#' + el.id : '') + '|' +
        Math.round(r.left) + '~' + Math.round(r.right)));
      if (over.length > 8) break;
    }
  }
}

// 字級稽核:抓出過小的可見文字
const small = [];
for (const el of document.querySelectorAll('p,span,li,a,h1,h2,h3,h4,div')) {
  if (!el.childNodes.length) continue;
  let t = '';
  for (const c of el.childNodes) if (c.nodeType === 3) t += c.textContent.trim();
  if (t.length < 4) continue;
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
  const fs = parseFloat(cs.fontSize);
  const min = innerWidth < 900 ? 14 : 14;
  if (fs < min) { small.push(fs.toFixed(1) + 'px "' + t.slice(0, 18) + '"'); }
  if (small.length > 14) break;
}

// 對比稽核:抓「淺底淺字 / 深底深字」造成的隱形文字(P5 曾在 #relay 踩到)
const parseRGB = c => (c.match(/[\d.]+/g) || []).map(Number);
const lum = ([r, g, b]) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const bgOf = el => {
  for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
    const c = parseRGB(getComputedStyle(p).backgroundColor);
    if (c.length >= 3 && (c[3] === undefined || c[3] > 0.6)) return c;
  }
  return [255, 255, 255];
};
const lowContrast = [];
for (const el of document.querySelectorAll('p,span,li,a,h1,h2,h3,h4')) {
  let t = '';
  for (const c of el.childNodes) if (c.nodeType === 3) t += c.textContent.trim();
  if (t.length < 4) continue;
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.5) continue;
  const fg = parseRGB(cs.color);
  if (fg.length < 3) continue;
  const a = fg[3] === undefined ? 1 : fg[3];
  const bg = bgOf(el);
  // 前景帶 alpha 時先與底色混合
  const mixed = [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a));
  const L1 = lum(mixed), L2 = lum(bg);
  const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  if (ratio < 3) {
    lowContrast.push(ratio.toFixed(2) + ':1 "' + t.slice(0, 20) + '"');
    if (lowContrast.length > 10) break;
  }
}

// 觸控區
const tiny = [];
for (const el of document.querySelectorAll('a,button,[role="tab"],[role="button"]')) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) continue;
  if (r.height < 40) { tiny.push(((el.textContent || '').trim().slice(0, 14)) + '=' + Math.round(r.height)); }
  if (tiny.length > 10) break;
}

const missSec = SECTIONS.filter(s => !document.getElementById(s));
const missId = IDS.filter(s => !document.getElementById(s));

return JSON.stringify({
  vw: innerWidth, vh: innerHeight,
  rendered: !!$('section#hero'),
  docH: document.body.scrollHeight,
  missingSections: missSec,
  missingIds: missId,
  nest,
  hooks,
  overflowX: document.documentElement.scrollWidth > innerWidth + 1
    ? 'OVERFLOW ' + document.documentElement.scrollWidth : 'ok',
  overflowCulprits: over,
  smallText: small,
  lowContrast: lowContrast,
  tinyTouch: tiny
}, null, 1);
