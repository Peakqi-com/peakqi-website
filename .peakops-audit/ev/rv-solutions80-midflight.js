// 同序列,但只等 900ms 就返回,讓 run.mjs 在平滑捲動仍在飛行時截圖(重現審查員時間點)
await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,200));
scrollTo(0,Math.round(0.80*(docH-innerHeight)));
await new Promise(r=>setTimeout(r,900));
const h3=[...document.querySelectorAll('h3')].find(h=>(h.textContent||'').includes('數據報表'));
const r=h3?h3.parentElement.getBoundingClientRect():null;
const op=h3?getComputedStyle(h3.parentElement).opacity:'?';
return JSON.stringify({y:Math.round(scrollY),card03top:r?Math.round(r.top):'?',op:op});
