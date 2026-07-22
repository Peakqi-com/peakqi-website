await new Promise(r=>setTimeout(r,1500));
const rows=[];
const seen=new Set();
for (const el of document.querySelectorAll('h1,h2,h3,p,span,li,a')) {
  let t=''; for (const c of el.childNodes) if (c.nodeType===3) t+=c.textContent.trim();
  if (t.length<3) continue;
  const cs=getComputedStyle(el);
  if (cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<0.3) continue;
  let sec=el.closest('section'); sec=sec?(sec.id||'?'):'nav/foot';
  const fs=parseFloat(cs.fontSize), w=cs.fontWeight;
  const tag=el.tagName;
  let cls='';
  if (tag==='H1') cls='h1'; else if (tag==='H2') cls='h2'; else if (tag==='H3') cls='h3';
  else if (+w>=700 && fs>=18) cls='cardTitle'; else if (fs>=15.5) cls='body'; else cls='aux';
  const lim={h1:[64,999],h2:[48,999],h3:[22,999],cardTitle:[22,999],body:[17,999],aux:[14,999]}[cls];
  const min = innerWidth<900 ? {h1:40,h2:32,h3:20,cardTitle:20,body:16,aux:14}[cls] : lim[0];
  if (fs+0.5 < min) {
    const k=sec+'|'+cls+'|'+fs+'|'+t.slice(0,10);
    if (seen.has(k)) continue; seen.add(k);
    rows.push({sec,cls,fs:+fs.toFixed(1),need:min,txt:t.slice(0,20)});
  }
}
const agg={};
for (const r of rows){ const k=r.sec+' / '+r.cls; (agg[k]=agg[k]||[]).push(r.fs+'→'+r.need+' "'+r.txt+'"'); }
return JSON.stringify({vw:innerWidth, violations:rows.length, byGroup:Object.fromEntries(Object.entries(agg).map(([k,v])=>[k,v.slice(0,3)]))},null,1);
