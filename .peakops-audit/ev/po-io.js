await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<22000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
const el=[...document.querySelectorAll('span')].find(x=>(x.textContent||'').includes('INPUT'));
if(!el) return 'notfound';
scrollTo(0, el.getBoundingClientRect().top+scrollY-260);
await new Promise(r=>setTimeout(r,900));
return 'y='+scrollY;
