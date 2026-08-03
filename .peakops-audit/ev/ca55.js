await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const end=wrap.offsetHeight-innerHeight;
for(let i=1;i<=20;i++){scrollTo(0,end*0.97*i/20);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,900));
return 'y='+scrollY+'/'+Math.round(end);
