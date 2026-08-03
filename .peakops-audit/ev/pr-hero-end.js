await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap.getBoundingClientRect().top+scrollY;
const end=wrap.offsetHeight-innerHeight;
for(let i=1;i<=18;i++){scrollTo(0,top+end*0.995*i/18);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,900));
return 'y='+scrollY;
