await new Promise(r=>setTimeout(r,3000));
const el=[...document.querySelectorAll('span,div')].filter(e=>(e.innerText||'').trim()==='情境估算').pop();
if(!el) return JSON.stringify({err:'not found'});
const target=el.getBoundingClientRect().top+scrollY-300;
for(let y=0;y<target;y+=60){scrollTo(0,y);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1200));
const r=el.getBoundingClientRect();
return JSON.stringify({y:Math.round(scrollY),badge:{t:Math.round(r.top),l:Math.round(r.left),w:Math.round(r.width),h:Math.round(r.height)}});
