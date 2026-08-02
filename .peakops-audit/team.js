await new Promise(r=>setTimeout(r,2600));
const t=document.getElementById('a-team');
if(t) t.scrollIntoView();
await new Promise(r=>setTimeout(r,600));
const names=[...t.querySelectorAll('span')].map(x=>x.textContent.trim()).filter(x=>/Jacky|Allen|TZ/.test(x));
const svgs=t.querySelectorAll('svg').length;
return JSON.stringify({names, svgs, overflowX:document.documentElement.scrollWidth>innerWidth+1?'OVERFLOW':'ok'});
