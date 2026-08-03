await new Promise(r=>setTimeout(r,3000));
const div=document.querySelector('[data-divider="shutter"]');
if(!div) return JSON.stringify({err:'no shutter'});
const target=div.getBoundingClientRect().top+scrollY-300;
// 模擬真人平滑捲動:每 16ms 捲 60px
for(let y=0;y<target;y+=60){scrollTo(0,y);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
const L=div.querySelector('[data-shut-l]'),R=div.querySelector('[data-shut-r]'),lab=div.querySelector('[data-label]');
const rd=div.getBoundingClientRect();
return JSON.stringify({y:Math.round(scrollY),divTop:Math.round(rd.top),
  l:getComputedStyle(L).transform,r:getComputedStyle(R).transform,
  labOp:getComputedStyle(lab).opacity,
  lRect:{left:Math.round(L.getBoundingClientRect().left),right:Math.round(L.getBoundingClientRect().right)}});
