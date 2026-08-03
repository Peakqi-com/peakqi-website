await new Promise(r=>setTimeout(r,3500));
for(let i=1;i<=20;i++){scrollTo(0,2300*i/20);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1000));
const cv=document.querySelector('section canvas');
const t5=[...document.querySelectorAll('div')].find(d=>d.style&&d.style.zIndex==='4'&&(d.innerText||'').includes('FROM CHAOS TO CONTROL'));
return JSON.stringify({y:scrollY,cvOp:cv?getComputedStyle(cv).opacity:'?',t5op:t5?getComputedStyle(t5).opacity:'?'});
