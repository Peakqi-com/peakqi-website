await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,document.documentElement.scrollHeight);
await new Promise(r=>setTimeout(r,1000));
scrollTo(0,document.documentElement.scrollHeight);
await new Promise(r=>setTimeout(r,500));
return 'y='+scrollY+' docH='+document.documentElement.scrollHeight;
