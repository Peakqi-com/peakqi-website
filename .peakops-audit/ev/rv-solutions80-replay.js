// 複驗:重放審查員 ua-Solutions-body-0.80.js 的捲動序列,settle 拉長到 1600ms,含 y 軌跡與卡片診斷
await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,200));
scrollTo(0,Math.round(0.80*(docH-innerHeight)));
const yTrace=[];
for(let i=0;i<16;i++){await new Promise(r=>setTimeout(r,100));yTrace.push(Math.round(scrollY));}
const out={docH0:docH,docH1:document.documentElement.scrollHeight,y:Math.round(scrollY),yTrace};
const h3s=[...document.querySelectorAll('h3')];
const pick=t=>h3s.find(h=>(h.textContent||'').includes(t));
for(const p of [['card02','線上報價單'],['card03','數據報表']]){
  const name=p[0], h=pick(p[1]); if(!h){out[name]='NOT FOUND';continue;}
  const card=h.parentElement, r=card.getBoundingClientRect();
  let chain=[],e=card;
  while(e&&e!==document.documentElement){
    const cs=getComputedStyle(e);
    if(cs.opacity!=='1'||cs.visibility!=='visible'||cs.display==='none'||cs.transform!=='none'||cs.clipPath!=='none'||cs.filter!=='none')
      chain.push(e.tagName+(e.id?'#'+e.id:'')+' o:'+cs.opacity+' v:'+cs.visibility+' d:'+cs.display+' tf:'+cs.transform.slice(0,40)+' cp:'+cs.clipPath.slice(0,26));
    e=e.parentElement;
  }
  out[name]={top:Math.round(r.top),h:Math.round(r.height),chain:chain};
  if(r.top<innerHeight&&r.bottom>0){
    const el=document.elementFromPoint(195,Math.max(1,Math.min(innerHeight-1,Math.round(r.top+r.height/2))));
    out[name].hit=el?el.tagName+':'+(el.textContent||'').trim().slice(0,12):'null';
  }
}
return JSON.stringify(out);
