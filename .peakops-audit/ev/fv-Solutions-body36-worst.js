const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,Math.round(docH*0.36));
await new Promise(r=>setTimeout(r,1500));
// 把所有 pqWipe 元素凍結在循環 12%(右側尚未被漸層覆蓋的最壞相位)
let n=0;
for(const el of document.querySelectorAll('span')){
  const cs=getComputedStyle(el);
  if(cs.animationName&&cs.animationName.includes('pqWipe')){
    el.style.animation='pqWipe 3.6s ease-in-out infinite';
    el.style.animationDelay='-0.432s';
    el.style.animationPlayState='paused';
    n++;
  }
}
await new Promise(r=>setTimeout(r,300));
return 'y='+scrollY+' docH='+docH+' wipes_frozen='+n;
