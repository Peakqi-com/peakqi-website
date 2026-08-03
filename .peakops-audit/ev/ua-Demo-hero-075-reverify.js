await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
const F=0.75;
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
// 量測「尚未開始」徽章:行數、寬度、是否折行
const out={y:scrollY,end,badges:[]};
const els=[...document.querySelectorAll('*')].filter(el=>{
  const t=(el.textContent||'').trim();
  return t==='尚未開始'&&el.children.length===0;
});
for(const el of els){
  const r=el.getBoundingClientRect();
  if(r.width===0&&r.height===0)continue;
  const cs=getComputedStyle(el);
  const range=document.createRange();range.selectNodeContents(el);
  const rects=[...range.getClientRects()].map(q=>[q.left,q.top,q.width,q.height].map(Math.round));
  out.badges.push({tag:el.tagName,cls:String(el.className).slice(0,80),
    rect:[r.left,r.top,r.width,r.height].map(Math.round),
    lineRects:rects,lines:rects.length,
    ws:cs.whiteSpace,fs:cs.fontSize,lh:cs.lineHeight,op:cs.opacity,vis:cs.visibility,
    inViewport:r.bottom>0&&r.top<innerHeight});
}
return JSON.stringify(out);
