await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]')||document.querySelector('section > div');
const top=wrap.getBoundingClientRect().top+scrollY;
const end=Math.max(wrap.offsetHeight-innerHeight, innerHeight);
const f=+('0.3');
for(let i=1;i<=16;i++){scrollTo(0,top+end*f*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,900));
return 'y='+scrollY;
