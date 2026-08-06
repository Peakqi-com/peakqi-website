// 導覽列擠壓檢查:桌機選單各項是否互相重疊 / 超出容器 / 被 CTA 撞到
await new Promise((r) => setTimeout(r, 1400));
const nav = document.querySelector('header') || document.querySelector('nav');
if (!nav) return JSON.stringify({ err: 'no nav' });
const links = [...nav.querySelectorAll('a,button')].filter((el) => {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return r.width > 8 && r.height > 8 && cs.display !== 'none' && cs.visibility !== 'hidden';
}).map((el) => {
  const r = el.getBoundingClientRect();
  return { t: (el.textContent || '').trim().slice(0, 18), l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
}).sort((a, b) => a.l - b.l);

// 相鄰兩項的水平間隙(負值 = 重疊)
const gaps = [];
for (let i = 1; i < links.length; i++) gaps.push({ between: links[i - 1].t + ' | ' + links[i].t, gap: links[i].l - links[i - 1].r });

const nr = nav.getBoundingClientRect();
return JSON.stringify({
  vw: innerWidth,
  navH: Math.round(nr.height),
  items: links.length,
  first: links[0], last: links[links.length - 1],
  rightEdgeOver: Math.round(links[links.length - 1].r - innerWidth),
  minGap: gaps.length ? Math.min(...gaps.map((g) => g.gap)) : null,
  tightest: gaps.slice().sort((a, b) => a.gap - b.gap).slice(0, 3),
  pageOverflow: document.scrollingElement.scrollWidth - innerWidth
});
