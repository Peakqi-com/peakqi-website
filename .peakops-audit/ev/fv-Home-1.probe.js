await new Promise(r=>setTimeout(r,3500));
const docH0=document.documentElement.scrollHeight;
for(let y=0;y<docH0;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
const docH=document.documentElement.scrollHeight;
scrollTo(0,Math.round(docH*0.55));
await new Promise(r=>setTimeout(r,1500));
const bt=document.getElementById('pq-backtop');
let btInfo='no-backtop';
if(bt){const r=bt.getBoundingClientRect();const cs=getComputedStyle(bt);btInfo=`bt x=${Math.round(r.left)}-${Math.round(r.right)} y=${Math.round(r.top)}-${Math.round(r.bottom)} disp=${cs.display} op=${cs.opacity}`;}
const hs=[...document.querySelectorAll('h2,h3')].map(h=>{const r=h.getBoundingClientRect();return {t:(h.textContent||'').slice(0,12),x:Math.round(r.left),y:Math.round(r.top),b:Math.round(r.bottom)};}).filter(o=>o.y<innerHeight&&o.b>0);
return 'y='+scrollY+' docH='+docH+' | '+btInfo+' | headsInView='+JSON.stringify(hs);
