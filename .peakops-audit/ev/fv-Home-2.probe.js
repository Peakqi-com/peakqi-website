await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):document.documentElement.scrollHeight*0.25;
for(let i=1;i<=16;i++){scrollTo(0,top+end*0.25*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
const h1=document.querySelector('h1');
let h1Info='no-h1';
if(h1){const r=h1.getBoundingClientRect();h1Info=`h1 x=${Math.round(r.left)}-${Math.round(r.right)} y=${Math.round(r.top)}-${Math.round(r.bottom)}`;}
const gl=document.getElementById('pq-hero-gl');
let glInfo='no-gl';
if(gl){const r=gl.getBoundingClientRect();const cs=getComputedStyle(gl);glInfo=`gl x=${Math.round(r.left)}-${Math.round(r.right)} y=${Math.round(r.top)}-${Math.round(r.bottom)} tf=${cs.transform}`;}
return 'y='+scrollY+' | '+h1Info+' | '+glInfo;
