await new Promise(r=>setTimeout(r,3500));
const LIMIT=+('360'); const out=[];
for(const e of document.querySelectorAll('body *')){
  const r=e.getBoundingClientRect();
  if(r.width<2||r.height<2)continue;
  if(r.right>LIMIT+1){
    if(out.some(o=>o.el&&o.el.contains(e)&&Math.abs(o.right-r.right)<3))continue;
    out.push({el:e,tag:e.tagName,id:e.id||'',cls:String(e.className).slice(0,50),
      t:((e.innerText||'').trim().replace(/\s+/g,' ')).slice(0,26),
      left:Math.round(r.left),right:Math.round(r.right),w:Math.round(r.width),h:Math.round(r.height)});
  }
}
out.sort((a,b)=>b.right-a.right);
return JSON.stringify({vw:innerWidth,n:out.length,offenders:out.slice(0,10).map(({el,...o})=>o)});
