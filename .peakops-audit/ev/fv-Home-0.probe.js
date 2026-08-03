await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):document.documentElement.scrollHeight*0.25;
for(let i=1;i<=16;i++){scrollTo(0,top+end*0.98*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
const bt=document.getElementById('pq-backtop');
let btInfo='no-backtop';
if(bt){const r=bt.getBoundingClientRect();const cs=getComputedStyle(bt);btInfo=`bt x=${Math.round(r.left)}-${Math.round(r.right)} y=${Math.round(r.top)}-${Math.round(r.bottom)} disp=${cs.display} op=${cs.opacity}`;}
const hs=[...document.querySelectorAll('h2')].map(h=>{const r=h.getBoundingClientRect();return {t:(h.textContent||'').slice(0,12),x:Math.round(r.left),y:Math.round(r.top),b:Math.round(r.bottom)};}).filter(o=>o.y<innerHeight&&o.b>0);
return 'y='+scrollY+' | '+btInfo+' | h2InView='+JSON.stringify(hs);
