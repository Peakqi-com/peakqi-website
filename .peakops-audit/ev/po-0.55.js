await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]')||document.querySelector('section > div');
const end=Math.max(wrap.offsetHeight-innerHeight, innerHeight*2);
const f=+('0.55');
for(let i=1;i<=16;i++){scrollTo(0,end*f*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,900));
return 'y='+scrollY;
