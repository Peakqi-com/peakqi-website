// 複驗:settle 1500ms 後量測「多個品牌、雙軌」文案與 canvas 的疊合
await new Promise(r=>setTimeout(r,1500));
for(let i=0;i<10;i++) await new Promise(r=>requestAnimationFrame(r));
const out={scrollY:Math.round(scrollY),vw:innerWidth,vh:innerHeight};
// 找含「多個品牌」的最內層元素
let hit=null;
for(const el of document.querySelectorAll('p,div,span,li,h1,h2,h3,h4')){
  const t=(el.textContent||'');
  if(t.includes('多個品牌')&&t.length<120){
    if(!hit||el.textContent.length<hit.textContent.length) hit=el;
  }
}
if(hit){
  const r=hit.getBoundingClientRect();
  const cs=getComputedStyle(hit);
  out.text=hit.textContent.trim().slice(0,60);
  out.rect={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};
  out.color=cs.color; out.opacity=cs.opacity; out.fontSize=cs.fontSize;
  // 祖先鏈 opacity 累積
  let op=1,n=hit; while(n&&n!==document.body){op*=parseFloat(getComputedStyle(n).opacity||'1');n=n.parentElement;}
  out.effOpacity=op.toFixed(2);
}
// canvas 位置
const cv=document.querySelector('canvas');
if(cv){
  const c=cv.getBoundingClientRect();
  out.canvas={x:Math.round(c.x),y:Math.round(c.y),w:Math.round(c.width),h:Math.round(c.height)};
  if(hit){
    const r=hit.getBoundingClientRect();
    const ox=Math.max(0,Math.min(r.right,c.right)-Math.max(r.left,c.left));
    const oy=Math.max(0,Math.min(r.bottom,c.bottom)-Math.max(r.top,c.top));
    out.overlapPx={w:Math.round(ox),h:Math.round(oy)};
  }
}
return JSON.stringify(out);
