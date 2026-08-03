await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
const F=0.25;
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
// 量測釘底進度標籤與灰字說明的重疊
const out={y:scrollY,end};
const all=[...document.querySelectorAll('*')];
const prog=all.filter(el=>{
  const t=(el.textContent||'').trim();
  return /^0?2\s*\/\s*0?4$/.test(t)&&el.children.length===0;
});
const hint=all.filter(el=>{
  const t=(el.textContent||'').trim();
  return t.includes('選擇產業與流程後')&&el.children.length===0;
});
out.prog=prog.map(el=>{const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return{tag:el.tagName,cls:String(el.className).slice(0,60),rect:[r.left,r.top,r.width,r.height].map(Math.round),op:cs.opacity,vis:cs.visibility,pos:cs.position};});
out.hint=hint.map(el=>{const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return{tag:el.tagName,cls:String(el.className).slice(0,60),rect:[r.left,r.top,r.width,r.height].map(Math.round),op:cs.opacity,vis:cs.visibility};});
return JSON.stringify(out);
