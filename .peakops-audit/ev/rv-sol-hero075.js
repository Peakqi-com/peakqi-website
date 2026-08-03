await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
for(let i=1;i<=16;i++){scrollTo(0,top+end*0.75*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1600));
for(let i=0;i<10;i++) await new Promise(r=>requestAnimationFrame(r));
return 'y='+scrollY+' docH='+document.documentElement.scrollHeight+' end='+end;
