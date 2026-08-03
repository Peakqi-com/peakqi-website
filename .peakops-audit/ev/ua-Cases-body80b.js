await new Promise(r=>setTimeout(r,2000));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,300));
scrollTo(0,Math.round(0.80*(docH-innerHeight)));
await new Promise(r=>setTimeout(r,1000));
const h=document.querySelector('header');
const r=h?h.getBoundingClientRect():null;
const cs=h?getComputedStyle(h):null;
const el=document.elementFromPoint(195,30);
return 'y='+scrollY+' hdr='+(r?('top='+Math.round(r.top)+' h='+Math.round(r.height)+' z='+cs.zIndex+' op='+cs.opacity+' bg='+cs.backgroundColor+' tf='+cs.transform):'none')+' at(195,30)='+(el?el.tagName+'.'+String(el.className).slice(0,40):'null');
