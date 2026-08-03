await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
const F=0.25;
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
for(let i=0;i<30;i++) await new Promise(r=>requestAnimationFrame(r));
const host=document.querySelector('[data-hero-progress]');
const out={y:scrollY,innerH:innerHeight};
if(host){
  const cs=getComputedStyle(host);
  const r=host.getBoundingClientRect();
  out.host={top:Math.round(r.top),bottom:Math.round(r.bottom),display:cs.display,opacity:cs.opacity,visible:cs.visibility};
  const n=host.querySelector('span');
  if(n){const nr=n.getBoundingClientRect();out.counter={text:n.textContent,top:Math.round(nr.top),bottom:Math.round(nr.bottom),h:Math.round(nr.height),opacity:getComputedStyle(n).opacity};
    out.cutBy=Math.round(nr.bottom-innerHeight);}
}
const stg=document.querySelector('[data-hero-wrap] [data-scrim]');
return JSON.stringify(out);
