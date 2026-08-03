await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<30000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}
const els=[...document.querySelectorAll('body *')].filter(e=>(e.innerText||'').trim()==='王小姐・LINE');
if(!els.length) return JSON.stringify({err:'not found'});
const e=els[0];
e.scrollIntoView({block:'center'});
await new Promise(r=>setTimeout(r,900));
const r=e.getBoundingClientRect();
// 順便量它和誰重疊
const others=[...document.querySelectorAll('body *')].filter(o=>{
  if(o===e||o.contains(e)||e.contains(o))return false;
  const ro=o.getBoundingClientRect();
  if(ro.width<8||ro.height<8)return false;
  if(!(o.innerText||'').trim())return false;
  const w=Math.min(r.right,ro.right)-Math.max(r.left,ro.left);
  const h=Math.min(r.bottom,ro.bottom)-Math.max(r.top,ro.top);
  return w>4&&h>4;
}).slice(0,6).map(o=>((o.innerText||'').trim().replace(/\s+/g,' ')).slice(0,20));
return JSON.stringify({y:Math.round(scrollY),rect:{t:Math.round(r.top),l:Math.round(r.left),w:Math.round(r.width),h:Math.round(r.height)},overlapNow:others});
