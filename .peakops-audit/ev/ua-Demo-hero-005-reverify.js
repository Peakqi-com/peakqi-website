await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
const F=0.05;
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
// 量測「01 / 04」進度標籤與「LINE 客服」晶片的重疊
const out={y:scrollY,end};
const all=[...document.querySelectorAll('*')];
const leaf=el=>el.children.length===0;
const prog=all.filter(el=>leaf(el)&&/^0?1\s*\/\s*0?4$/.test((el.textContent||'').trim()));
const chip=all.filter(el=>{
  const t=(el.textContent||'').trim();
  return t==='LINE 客服';
});
const info=el=>{const r=el.getBoundingClientRect();const cs=getComputedStyle(el);
  return{tag:el.tagName,cls:String(el.className).slice(0,70),
    rect:[r.left,r.top,r.width,r.height].map(n=>Math.round(n)),
    op:cs.opacity,vis:cs.visibility,pos:cs.position,z:cs.zIndex};};
out.prog=prog.map(info);
out.chip=chip.map(info);
// 進度頁腳容器(含橘線)也量一下:找 prog 的父層
if(prog[0]){let p=prog[0].parentElement;const chain=[];for(let i=0;i<3&&p;i++){chain.push(info(p));p=p.parentElement;}out.progParents=chain;}
return JSON.stringify(out);
