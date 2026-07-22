await new Promise(r=>setTimeout(r,2500));
// 找出「畫面上一整屏幾乎空白」的區段:抓每個 section 的可見文字量 vs 高度
const rows=[];
for (const sec of document.querySelectorAll('section[id]')) {
  const h=sec.offsetHeight;
  const txt=(sec.innerText||'').replace(/\s+/g,'').length;
  rows.push({id:sec.id, h, txt, ratio:+(txt/(h/1000)).toFixed(1)});
}
return JSON.stringify({
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  docH: document.body.scrollHeight,
  overflowX: document.documentElement.scrollWidth>innerWidth+1?'OVERFLOW':'ok',
  ctaCount: document.querySelectorAll('a[href="Demo.dc.html"]').length,
  sections: rows
},null,1);
