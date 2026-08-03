await new Promise(r=>setTimeout(r,2000));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,300));
scrollTo(0,Math.round(0.80*(docH-innerHeight)));
await new Promise(r=>setTimeout(r,1500));
const hdr=document.querySelector('header, nav, .nav, #nav, [class*="nav"]');
const info={y:scrollY,docH};
if(hdr){
  const cs=getComputedStyle(hdr), r=hdr.getBoundingClientRect();
  info.tag=hdr.tagName+'.'+hdr.className;
  info.rect=Math.round(r.top)+','+Math.round(r.bottom)+',h'+Math.round(r.height);
  info.pos=cs.position; info.op=cs.opacity; info.vis=cs.visibility;
  info.disp=cs.display; info.tf=cs.transform; info.z=cs.zIndex;
  const top=document.elementFromPoint(innerWidth/2, 30);
  info.atTop30=top?top.tagName+'.'+String(top.className).slice(0,30):'?';
  info.hdrContains=hdr.contains(top);
}else{info.tag='NO HEADER FOUND';}
return JSON.stringify(info);
