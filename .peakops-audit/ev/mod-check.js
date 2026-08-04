await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<20000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
const el=[...document.querySelectorAll('[data-smod] span')].find(x=>x.textContent.trim()==='行銷');
if(!el) return 'notfound';
el.scrollIntoView({block:'center'}); await new Promise(r=>setTimeout(r,700));
const r=el.getBoundingClientRect();
return JSON.stringify({w:Math.round(r.width),h:Math.round(r.height),oneLine:r.height<28});
