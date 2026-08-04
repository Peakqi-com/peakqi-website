// 錨點跳轉:目標標題是否被固定 NAV 蓋住
const links = Array.from(document.querySelectorAll('a[href^="#"]')).filter(a => {
  const id = a.getAttribute('href').slice(1);
  return id && document.getElementById(id);
});
const header = document.querySelector('header');
const navH = header ? header.getBoundingClientRect().height : 0;
const out = [];
for (const a of links.slice(0, 6)) {
  const id = a.getAttribute('href').slice(1);
  const target = document.getElementById(id);
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 120));
  target.scrollIntoView();
  await new Promise(r => setTimeout(r, 260));
  for (let i = 0; i < 10; i++) await new Promise(r => requestAnimationFrame(r));
  const r = target.getBoundingClientRect();
  // 目標段落內第一個標題
  const h = target.querySelector('h1,h2,h3') || target;
  const hr = h.getBoundingClientRect();
  out.push({
    id, targetTop: Math.round(r.top), headingTop: Math.round(hr.top),
    headingText: (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18),
    hiddenUnderNav: hr.top < navH - 2
  });
}
return JSON.stringify({
  url: location.pathname, navH: Math.round(navH),
  scrollPaddingTop: getComputedStyle(document.documentElement).scrollPaddingTop,
  checked: out.length, bad: out.filter(o => o.hiddenUnderNav).length, out
}, null, 1);
