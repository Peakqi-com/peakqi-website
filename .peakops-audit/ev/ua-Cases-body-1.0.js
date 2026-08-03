await new Promise(r=>setTimeout(r,2000));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,document.documentElement.scrollHeight);
await new Promise(r=>setTimeout(r,1000));
const d2=document.documentElement.scrollHeight;
return 'y='+scrollY+' docH0='+docH+' docH1='+d2;
