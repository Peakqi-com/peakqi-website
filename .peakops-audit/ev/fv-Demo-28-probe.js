await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):document.documentElement.scrollHeight*0.25;
for(let i=1;i<=16;i++){scrollTo(0,top+end*0.75*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
const R=e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)].join(',')};
const st=[...document.querySelectorAll('[role="status"]')].filter(e=>e.getBoundingClientRect().height>0);
const out=st.map(e=>{const cs=getComputedStyle(e);const r=e.getBoundingClientRect();return '"'+e.textContent.trim()+'" ['+R(e)+'] h='+Math.round(r.height)+' ws='+cs.whiteSpace+' shrink='+cs.flexShrink}).join(' | ');
return 'y='+scrollY+' status='+out;
