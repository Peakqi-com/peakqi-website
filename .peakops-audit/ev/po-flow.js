await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<20000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
const h=[...document.querySelectorAll('h2')].find(x=>x.textContent.includes('到一段可追蹤的客戶流程'));
if(!h) return 'no h2';
scrollTo(0,h.getBoundingClientRect().top+scrollY+400);
await new Promise(r=>setTimeout(r,900));
return 'y='+scrollY;
