// 部落格驗收:水平爆版、元素級溢出、連結語言、卡片/篩選是否真的接上
await new Promise((r) => setTimeout(r, 1600));
const de = document.scrollingElement;
const vw = innerWidth;
const lang = document.documentElement.lang;
const isEn = /^en/.test(lang);

// 1) 任何元素右緣超出視窗(逐一列出兇手,不只看 scrollWidth)
const bleed = [];
document.querySelectorAll('main *, header *, footer *').forEach((el) => {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return;
  const over = Math.round(r.right - vw);
  if (over > 1 && getComputedStyle(el).position !== 'fixed') {
    bleed.push({ t: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0], over });
  }
});

// 2) 內部可捲區塊(表格/程式碼)不算爆版,但要確認它們真的能捲
const scrollables = [...document.querySelectorAll('.pb-tablewrap,.pb-code')].map((el) => ({
  cls: el.className, canScroll: el.scrollWidth > el.clientWidth,
  overflowX: getComputedStyle(el).overflowX
}));

// 3) 連結語言:英文頁不該出現沒有 /en 前綴的站內連結(外部與錨點除外)
const wrongLang = [...document.querySelectorAll('a[href^="/"]')]
  .map((a) => a.getAttribute('href'))
  .filter((h) => (isEn ? h.indexOf('/en/') !== 0 : h.indexOf('/en/') === 0))
  .filter((h) => !/^\/(favicon|apple-touch|assets|og\.png)/.test(h));

// 4) 列表頁:卡片數、篩選鈕、點一下第一個標籤看有沒有真的篩
const cards = [...document.querySelectorAll('.bl-card')];
const chips = [...document.querySelectorAll('.bl-chip')];
let filterWorks = null;
if (chips.length > 1 && cards.length) {
  chips[1].click();
  await new Promise((r) => setTimeout(r, 120));
  const shown = cards.filter((c) => !c.hidden).length;
  chips[0].click();
  await new Promise((r) => setTimeout(r, 120));
  const back = cards.filter((c) => !c.hidden).length;
  filterWorks = { afterTagClick: shown, afterAll: back, ok: shown <= cards.length && back === cards.length };
}

// 5) 文章頁:標題與內文關鍵元素
const h1 = document.querySelector('h1');
const h1cs = h1 ? getComputedStyle(h1) : null;
const article = document.querySelector('.pb-body');

// 6) 圖片是否真的載得到
const imgs = [...document.querySelectorAll('img')];
const brokenImgs = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src'));

return JSON.stringify({
  lang,
  pageOverflowPx: de.scrollWidth - vw,
  bleed: bleed.slice(0, 8),
  scrollables,
  wrongLangLinks: wrongLang.slice(0, 10),
  cards: cards.length,
  chips: chips.map((c) => c.textContent.trim()),
  filterWorks,
  h1: h1 ? { text: h1.textContent.trim().slice(0, 40), lines: Math.round(h1.getBoundingClientRect().height / parseFloat(h1cs.lineHeight)), fontSize: h1cs.fontSize } : null,
  articleBlocks: article ? { p: article.querySelectorAll('p').length, h2: article.querySelectorAll('h2').length, table: article.querySelectorAll('table').length, pre: article.querySelectorAll('pre').length } : null,
  imgs: imgs.length, brokenImgs,
  hreflang: [...document.head.querySelectorAll('link[hreflang]')].map((l) => l.getAttribute('hreflang') + '=' + l.getAttribute('href')),
  langSwitch: (() => { const a = [...document.querySelectorAll('a')].find((x) => /^(EN|中文)$/.test(x.textContent.trim())); return a ? a.textContent.trim() + '→' + a.getAttribute('href') : null; })()
});
