await new Promise(r=>setTimeout(r,3000));
const el=document.querySelector('.pq-mos-grid');
for(let y=0;y<30000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}
el.scrollIntoView({block:'center'});
await new Promise(r=>setTimeout(r,900));
const t=el.querySelector('i').getBoundingClientRect();
return JSON.stringify({tileW:Math.round(t.width),tileH:Math.round(t.height),gridW:Math.round(el.getBoundingClientRect().width),vw:innerWidth});
