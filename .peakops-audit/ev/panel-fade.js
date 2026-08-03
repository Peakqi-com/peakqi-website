await new Promise(r=>setTimeout(r,3000));
const sec=document.getElementById('liveops');
const start=sec.getBoundingClientRect().top+scrollY-200;
// 找 pin 範圍:往下平滑捲 6000px,每 3 幀取樣面板透明度
const panels=[...document.querySelectorAll('[data-live-panel]')];
let worst=[],frames=0,badFrames=0;
for(let y=start;y<start+6000;y+=48){
  scrollTo(0,y);
  await new Promise(r=>requestAnimationFrame(r));
  frames++;
  const ops=panels.map(p=>parseFloat(getComputedStyle(p).opacity));
  const vis=ops.filter(o=>o>=0.35);
  if(vis.length>=2){badFrames++;
    if(worst.length<6)worst.push({y:Math.round(y-start),ops:ops.map(o=>+o.toFixed(2))});}
}
return JSON.stringify({frames,badFrames,pct:+(badFrames/frames*100).toFixed(1),worst});
