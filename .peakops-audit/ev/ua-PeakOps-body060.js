await new Promise(r=>setTimeout(r,3500));
const docH=()=>document.documentElement.scrollHeight;
for(let y=0;y<docH();y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH());await new Promise(r=>setTimeout(r,120));
const P=0.60;
scrollTo(0,Math.round(P*(docH()-innerHeight)));
await new Promise(r=>setTimeout(r,1000));
return 'y='+scrollY+' docH='+docH();
