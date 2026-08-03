await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):document.documentElement.scrollHeight*0.25;
for(let i=1;i<=16;i++){scrollTo(0,top+end*0.98*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
const bt=document.getElementById('pq-backtop');
const b=bt.getBoundingClientRect();
const hits=[];
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
let n;
while(n=walker.nextNode()){
  const el=n.parentElement;if(!el)continue;
  const cs=getComputedStyle(el);
  if(cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)===0)continue;
  const er=el.getBoundingClientRect();
  if(er.bottom<b.top-4||er.top>b.bottom+4||er.right<b.left-4||er.left>b.right+4)continue;
  const txt=n.textContent;
  for(let i=0;i<txt.length;i++){
    if(/\s/.test(txt[i]))continue;
    const rg=document.createRange();rg.setStart(n,i);rg.setEnd(n,i+1);
    for(const cr of rg.getClientRects()){
      const ox=Math.min(cr.right,b.right)-Math.max(cr.left,b.left);
      const oy=Math.min(cr.bottom,b.bottom)-Math.max(cr.top,b.top);
      if(ox>0&&oy>0)hits.push({ch:txt[i],x:Math.round(cr.left)+'-'+Math.round(cr.right),y:Math.round(cr.top)+'-'+Math.round(cr.bottom),ox:Math.round(ox),oy:Math.round(oy)});
    }
  }
}
return 'y='+scrollY+' bt='+Math.round(b.left)+','+Math.round(b.top)+','+Math.round(b.right)+','+Math.round(b.bottom)+' rectHits='+JSON.stringify(hits.slice(0,20));
