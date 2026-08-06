await new Promise(r=>setTimeout(r,2600));
const S=window.__pqSky; if(!S) return JSON.stringify({err:'no hook'});
S.hush(); await new Promise(r=>setTimeout(r,600));
const cv=document.querySelector('[data-blog-sky] canvas');
const g=cv.getContext('2d'); const r=cv.getBoundingClientRect();
const box=(cx,cy,s)=>{const d=g.getImageData(Math.max(0,cx-s),Math.max(0,cy-s),s*2,s*2).data;
  let o=0,b=0; for(let i=0;i<d.length;i+=4){ if(d[i]>150&&d[i+1]>55&&d[i+1]<165&&d[i+2]<110)o++; if(d[i]+d[i+1]+d[i+2]>300)b++; } return {o,b};};
const px=Math.round(cv.width*0.42), py=Math.round(cv.height*0.34);
const before=box(px,py,140);
cv.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+r.width*0.42,clientY:r.top+r.height*0.34,bubbles:true,pointerId:1,isPrimary:true}));
await new Promise(r=>setTimeout(r,1300));
const after=box(px,py,140);
cv.dispatchEvent(new PointerEvent('pointerleave',{bubbles:true,pointerId:1,isPrimary:true}));
await new Promise(r=>setTimeout(r,1300));
const gone=box(px,py,140);
return JSON.stringify({指標前:before,指標上:after,離開後:gone,
  目鏡圈有出現:after.o>before.o+20, 離開後有收:gone.o<after.o*0.6});
