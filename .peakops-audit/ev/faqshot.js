await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<12000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}
const el=[...document.querySelectorAll('span')].find(e=>e.textContent.trim()==='PRICE SUMMARY');
if(!el) return JSON.stringify({err:'no summary'});
el.scrollIntoView({block:'center'});
await new Promise(r=>setTimeout(r,700));
const box=el.parentElement.getBoundingClientRect();
return JSON.stringify({y:Math.round(scrollY),boxW:Math.round(box.width),boxRight:Math.round(box.right),vw:innerWidth});
