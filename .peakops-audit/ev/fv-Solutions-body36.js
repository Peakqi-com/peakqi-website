const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,Math.round(docH*0.36));
await new Promise(r=>setTimeout(r,1500));
return 'y='+scrollY+' docH='+docH;
