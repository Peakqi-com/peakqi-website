const de = document.scrollingElement || document.documentElement;
window.scrollTo(0, Math.round(0.6 * (de.scrollHeight - innerHeight)));
await new Promise(r => setTimeout(r, 1200));
for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
const headers = document.querySelectorAll('header').length;
const burgers = document.querySelectorAll('#pq-burger').length;
// 所有固定在右下區的元素
const fixedBR = [];
document.querySelectorAll('body *').forEach(el => {
  const c = getComputedStyle(el);
  if (c.position !== 'fixed') return;
  const r = el.getBoundingClientRect();
  if (r.top > innerHeight * 0.6 && r.right > innerWidth * 0.5 && r.width > 10) {
    fixedBR.push({ tag: el.tagName + (el.id ? '#' + el.id : ''), cls: (el.className || '').toString().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y) });
  }
});
// Nav 的 sc-if 容器狀態:找包含 ctaHref 的連結
const line = document.querySelector('a[href*="lin.ee"]');
return JSON.stringify({
  url: location.pathname, headers, burgers,
  lineLink: !!line,
  lineLinkVisible: !!(line && line.offsetWidth),
  lineLinkStyle: line ? (getComputedStyle(line).display + '/' + getComputedStyle(line.parentElement).display) : null,
  fixedBottomRight: fixedBR.slice(0, 8)
}, null, 1);
