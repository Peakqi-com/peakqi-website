// 複驗 probe:run.mjs 已捲到 P 並等 200ms+60rAF,這裡再 settle 1400ms+30rAF(合計 >1.6s)
await new Promise(r=>setTimeout(r,1400));
for(let i=0;i<30;i++) await new Promise(r=>requestAnimationFrame(r));
const out={y:Math.round(scrollY), target:Math.round(0.80*(document.body.scrollHeight-innerHeight)), sh:document.body.scrollHeight, ih:innerHeight};
const h3s=[...document.querySelectorAll('h3')];
const pick=t=>h3s.find(h=>(h.textContent||'').includes(t));
const info=(name,t)=>{
  const h=pick(t); if(!h){out[name]='NOT FOUND';return;}
  const card=h.parentElement;
  const r=card.getBoundingClientRect();
  let chain=[], e=card;
  while(e && e!==document.documentElement){
    const cs=getComputedStyle(e);
    if(cs.opacity!=='1'||cs.visibility!=='visible'||cs.display==='none'||cs.transform!=='none'||cs.clipPath!=='none'||cs.filter!=='none')
      chain.push(e.tagName+(e.id?'#'+e.id:'')+' o:'+cs.opacity+' v:'+cs.visibility+' d:'+cs.display+' tf:'+cs.transform.slice(0,42)+' cp:'+cs.clipPath.slice(0,28)+' f:'+cs.filter.slice(0,24));
    e=e.parentElement;
  }
  out[name]={rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)],chain};
  if(r.top<innerHeight&&r.bottom>0){
    const el=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)), Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)));
    out[name].hit=el?el.tagName+':'+(el.textContent||'').trim().slice(0,14):'null';
  }
};
info('card02','線上報價單');
info('card03','數據報表');
return JSON.stringify(out);
