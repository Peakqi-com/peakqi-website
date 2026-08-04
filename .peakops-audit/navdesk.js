// 桌機 NAV:確認未被手機選單改動影響(下拉、hover 面板、按鈕都在)
const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
const links = document.querySelector('#pq-links');
const burger = document.querySelector('#pq-burger');
const dd = document.querySelector('.pq-dd');
const panel = document.querySelector('.pq-dd-panel');
const items = links ? Array.from(links.children).map(c => ({ tag: c.tagName, t: c.textContent.replace(/\s+/g,' ').trim().slice(0,14), r: R(c) })) : [];
return JSON.stringify({
  vw: innerWidth,
  linksVisible: links ? getComputedStyle(links).display : null,
  burgerDisplay: burger ? getComputedStyle(burger).display : null,
  ddPresent: !!dd, panelOpacity: panel ? getComputedStyle(panel).opacity : null,
  panelLinks: panel ? panel.querySelectorAll('a').length : 0,
  items,
  navH: R(document.querySelector('header'))
}, null, 1);
