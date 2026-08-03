await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,120));
scrollTo(0,Math.max(0,docH*0.30-innerHeight/2));
await new Promise(r=>setTimeout(r,1000));
return 'y='+scrollY+' docH='+docH;
