await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,120));
scrollTo(0,Math.min(Math.round(docH*0.35),docH-innerHeight));
await new Promise(r=>setTimeout(r,1500));
const g=document.getElementById('a-msteps');
const cs=g?getComputedStyle(g).gridTemplateColumns:'none';
const c=g?g.querySelector('[data-mstep]'):null;
const rect=g?g.getBoundingClientRect():null;
return 'y='+scrollY+' docH='+docH+' cols=['+cs+'] cardW='+(c?Math.round(c.getBoundingClientRect().width):-1)+' gridTop='+(rect?Math.round(rect.top):'NA');
