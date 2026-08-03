await new Promise(r=>setTimeout(r,3500));
const doc=document.documentElement;
for(let y=0;y<doc.scrollHeight;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,doc.scrollHeight*0.30);
await new Promise(r=>setTimeout(r,1500));
return 'y='+scrollY+' docH='+doc.scrollHeight;
