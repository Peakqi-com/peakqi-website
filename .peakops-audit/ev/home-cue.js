await new Promise(r=>setTimeout(r,3500));
const cue=document.querySelector('.pq-cine-scrollcue');
const op0=getComputedStyle(cue).opacity;
scrollTo(0,450); await new Promise(r=>setTimeout(r,500));
const op1=getComputedStyle(cue).opacity;
return JSON.stringify({op0,op1});
