await new Promise(r=>setTimeout(r,2600));
const out=[];
// 1) 客戶B/C 外漏:#pain 的 data-win 視差窗是否超出 section 邊界
const pain=document.getElementById('pain');
for (const p of [0.12,0.16,0.2]) {
  window.scrollTo({top:(document.body.scrollHeight-innerHeight)*p,behavior:'instant'});
  await new Promise(r=>setTimeout(r,120));
  for(let i=0;i<20;i++) await new Promise(r=>requestAnimationFrame(r));
  const rp=pain.getBoundingClientRect();
  const leaks=[...pain.querySelectorAll('[data-win]')].map(w=>{
    const r=w.getBoundingClientRect();
    return {t:(w.textContent||'').trim().slice(0,8), below:Math.round(r.bottom-rp.bottom), above:Math.round(rp.top-r.top)};
  }).filter(x=>x.below>4||x.above>4);
  if(leaks.length) out.push({p,leaks});
}
// 2) 表格:#pq-cmp-desk 內表格與容器
const cmp=document.getElementById('pq-cmp-desk');
const cmpInfo=cmp?{w:cmp.clientWidth, sw:cmp.scrollWidth, over:cmp.scrollWidth>cmp.clientWidth+2}:null;
return JSON.stringify({painLeaks:out, cmpInfo, vw:innerWidth,
  overflowX:document.documentElement.scrollWidth>innerWidth+1?'OVERFLOW':'ok'},null,1);
