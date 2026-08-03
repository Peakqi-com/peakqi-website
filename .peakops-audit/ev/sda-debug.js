await new Promise(r=>setTimeout(r,3500));
const el=document.querySelector('[data-scrollhint]');
const out=[];
for(const y of [0,160,320,600,1200]){
  scrollTo(0,y); await new Promise(r=>setTimeout(r,350));
  const an=el.getAnimations()[0];
  out.push({y,op:getComputedStyle(el).opacity,
    prog:an&&an.effect?(an.effect.getComputedTiming().progress==null?null:+an.effect.getComputedTiming().progress.toFixed(3)):'noanim',
    play:an?an.playState:'none'});
}
scrollTo(0,0);
return JSON.stringify(out);
