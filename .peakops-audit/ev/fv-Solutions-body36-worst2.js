const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,Math.round(docH*0.36));
await new Promise(r=>setTimeout(r,1500));
// 真正重啟動畫並凍結在循環 12%:先 none + reflow,再帶負 delay 重設並暫停
let n=0,cp='';
for(const el of document.querySelectorAll('span')){
  const cs=getComputedStyle(el);
  if(cs.animationName&&cs.animationName.includes('pqWipe')){
    el.style.animation='none';
    void el.offsetWidth;
    el.style.animation='pqWipe 3.6s ease-in-out infinite';
    el.style.animationDelay='-0.432s';
    el.style.animationPlayState='paused';
    cp=getComputedStyle(el).clipPath;
    n++;
  }
}
await new Promise(r=>setTimeout(r,300));
return 'y='+scrollY+' wipes='+n+' clip='+cp;
