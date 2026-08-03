await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH*0.90);
await new Promise(r=>setTimeout(r,1500));
const dots=[...document.querySelectorAll('[data-dot]')].map(d=>{const r=d.getBoundingClientRect();return Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.width);});
const tl=document.querySelector('[data-tline]');
const tr=tl?tl.getBoundingClientRect():null;
return 'y='+scrollY+' docH='+docH+' dots['+dots.join(' | ')+'] tline='+(tr?Math.round(tr.left)+','+Math.round(tr.top)+','+Math.round(tr.width)+'x'+Math.round(tr.height):'none');
