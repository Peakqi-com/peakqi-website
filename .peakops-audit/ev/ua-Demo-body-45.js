await new Promise(r=>setTimeout(r,3500));
let docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));docH=document.documentElement.scrollHeight;}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,120));
const P=0.45;
const target=Math.round(P*(document.documentElement.scrollHeight-innerHeight));
scrollTo(0,target);
await new Promise(r=>setTimeout(r,1000));
return 'y='+scrollY+' docH='+document.documentElement.scrollHeight;
