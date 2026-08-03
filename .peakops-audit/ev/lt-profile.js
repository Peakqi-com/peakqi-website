await new Promise(r=>setTimeout(r,3500));
const doc=document.documentElement;
const H=()=>Math.max(doc.scrollHeight,document.body.scrollHeight);
const lts=[];
try{new PerformanceObserver(l=>{for(const e of l.getEntries())lts.push({y:Math.round(scrollY),ms:Math.round(e.duration)});}).observe({entryTypes:['longtask']});}catch(e){}
const vh=innerHeight, step=Math.floor(vh*0.8);
for(let y=0;;y+=step){
  scrollTo(0,y); await new Promise(r=>setTimeout(r,300));
  if(y>=H()-vh) break;
  if(y>250000) break;
}
await new Promise(r=>setTimeout(r,500));
// 以 10% 頁高為桶彙總
const docH=H(); const buckets={};
for(const t of lts){const b=Math.floor(t.y/docH*10);buckets[b]=(buckets[b]||0)+t.ms;}
return JSON.stringify({docH,screens:+(docH/vh).toFixed(1),ltCount:lts.length,
  ltTotal:lts.reduce((s,t)=>s+t.ms,0),
  byDecile:Object.fromEntries(Object.entries(buckets).map(([k,v])=>[k+'0%',v])),
  top5:lts.sort((a,b)=>b.ms-a.ms).slice(0,5)});
