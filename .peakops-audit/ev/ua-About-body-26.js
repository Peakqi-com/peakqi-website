await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,120));
const dh2=document.documentElement.scrollHeight;
scrollTo(0,Math.min(Math.round(dh2*0.26),dh2-innerHeight));
await new Promise(r=>setTimeout(r,1000));
return 'y='+scrollY+' docH='+dh2+' ih='+innerHeight;
