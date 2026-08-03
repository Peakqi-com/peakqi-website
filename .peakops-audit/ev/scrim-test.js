await new Promise(r=>setTimeout(r,3500));
for(let i=1;i<=6;i++){scrollTo(0,60*i);await new Promise(r=>requestAnimationFrame(r));}
scrollTo(0,360); await new Promise(r=>setTimeout(r,800));
const scrim=document.querySelector('[data-ascrim]');
const lab=[...document.querySelectorAll('[data-aclust]')].find(e=>e.textContent.includes('商務'));
const sr=scrim.getBoundingClientRect(), lr=lab.getBoundingClientRect();
return JSON.stringify({
  scrimCS:getComputedStyle(scrim).background.slice(0,60),
  scrimZ:getComputedStyle(scrim).zIndex, wallZ:getComputedStyle(document.querySelector('[data-ashotwall]')).zIndex,
  labOp:getComputedStyle(lab).opacity, labZ:getComputedStyle(lab).zIndex,
  labInScrim: lr.top>=sr.top&&lr.bottom<=sr.bottom,
  scrimH:Math.round(sr.height), stageH:Math.round(document.querySelector('[data-hero-stage]').getBoundingClientRect().height)});
