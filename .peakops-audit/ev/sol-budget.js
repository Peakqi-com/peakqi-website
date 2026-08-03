await new Promise(r=>setTimeout(r,3500));
const stage=document.querySelector('[data-hero-stage]');
const media=document.querySelector('[data-hero-media]');
const copy=document.querySelector('[data-hero-copy]');
const sr=stage.getBoundingClientRect(), mr=media.getBoundingClientRect(), cr=copy.getBoundingClientRect();
// 捲進 hero 中段看場景
for(let i=1;i<=12;i++){scrollTo(0,900*i/12);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,800));
const mr2=media.getBoundingClientRect();
return JSON.stringify({vh:innerHeight,stageH:Math.round(sr.height),copyB:Math.round(cr.bottom),
  mediaTop0:Math.round(mr.top),mediaH:Math.round(mr.height),
  mediaTopMid:Math.round(mr2.top),visibleBand:Math.round(Math.min(innerHeight,mr2.bottom)-Math.max(0,mr2.top))});
