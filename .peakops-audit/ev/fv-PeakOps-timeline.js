await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
const tl=document.querySelector('[data-tline]');
if(!tl)return 'no tline';
const t=tl.getBoundingClientRect().top+scrollY;
scrollTo(0,t-180);
await new Promise(r=>setTimeout(r,1500));
const dots=[...document.querySelectorAll('[data-dot]')].map(d=>{const r=d.getBoundingClientRect();const cs=getComputedStyle(d);return Math.round(r.left)+','+Math.round(r.top)+',w'+Math.round(r.width)+',left:'+cs.left;});
const tr=tl.getBoundingClientRect();const tc=getComputedStyle(tl);
return 'y='+scrollY+' dots['+dots.join(' | ')+'] tline='+Math.round(tr.left)+','+Math.round(tr.top)+','+Math.round(tr.width)+'x'+Math.round(tr.height)+' bg:'+tc.backgroundColor;
