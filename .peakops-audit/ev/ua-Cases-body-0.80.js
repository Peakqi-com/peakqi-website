await new Promise(r=>setTimeout(r,2000));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,300));
scrollTo(0,Math.round(0.80*(docH-innerHeight)));
await new Promise(r=>setTimeout(r,1000));
return 'y='+scrollY+' docH='+docH;
