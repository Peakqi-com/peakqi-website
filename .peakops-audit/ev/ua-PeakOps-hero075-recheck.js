await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]')||document.querySelector('#hero > div');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
const F=0.75;
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
// 量測:找出綠字狀態列與「產生報價單」藥丸的重疊情況
const els=[...document.querySelectorAll('*')].filter(e=>{
  const t=(e.textContent||'').trim();
  return (t==='AI 已回覆・時段已保留'||t.includes('產生報價單'))&&e.children.length<=2&&e.getBoundingClientRect().height>0;
});
const info=els.map(e=>{
  const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
  return {t:(e.textContent||'').trim().slice(0,20),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),op:cs.opacity,vis:cs.visibility};
});
return 'y='+scrollY+' end='+Math.round(end)+' | '+JSON.stringify(info);
