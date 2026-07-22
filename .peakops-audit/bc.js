await new Promise(r=>setTimeout(r,2200));
const a=[...document.querySelectorAll('a')].find(x=>x.textContent.trim()==='首頁');
if(!a) return JSON.stringify({err:'no crumb'});
const p=a.parentElement;
const sp=[...p.children].filter(c=>c.tagName==='SPAN').pop();
const ra=a.getBoundingClientRect(), rs=sp?sp.getBoundingClientRect():null;
return JSON.stringify({parentTag:p.tagName, aH:Math.round(ra.height),
  delta:rs?Math.round((ra.top+ra.height/2)-(rs.top+rs.height/2)):null,
  align:getComputedStyle(p).alignItems,
  overflowX:document.documentElement.scrollWidth>innerWidth+1?'OVERFLOW':'ok'});
