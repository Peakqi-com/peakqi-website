await new Promise(r=>setTimeout(r,3500));
const vw=innerWidth; const out=[];
for(const e of document.querySelectorAll('body *')){
  const r=e.getBoundingClientRect();
  if(r.width<2||r.height<2)continue;
  if(r.right>vw+1||r.left<-1){
    if(out.some(o=>o.el&&o.el.contains(e)))continue;
    out.push({el:e,tag:e.tagName,cls:String(e.className).slice(0,40),t:((e.innerText||'').trim().replace(/\s+/g,' ')).slice(0,24),
      left:Math.round(r.left),right:Math.round(r.right),w:Math.round(r.width)});
  }
}
return JSON.stringify({vw,offenders:out.slice(0,12).map(({el,...o})=>o)});
