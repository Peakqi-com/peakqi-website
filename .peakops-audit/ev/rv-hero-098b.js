await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
const F=0.98;
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
// 長 settle:最多 14s,要求連續 5 次(每秒一次)phase+active card+可見卡位置全都不變
const snap=()=>{
  const ph=document.querySelector('[data-cine-phase] span.active');
  const ac=document.querySelector('[data-cine-card].is-active');
  const cards=[...document.querySelectorAll('[data-cine-card]')];
  const vis=cards.filter(c=>{const r=c.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.height>0;})
    .map(c=>{const r=c.getBoundingClientRect();return (c.dataset.cineCard||'?')+'@'+Math.round(r.top);}).join(',');
  return (ph?ph.textContent.trim():'-')+' || act:'+(ac?(ac.dataset.cineCard||'?'):'-')+' || vis:'+vis;
};
const st=[];
for(let k=0;k<14;k++){
  await new Promise(r=>setTimeout(r,1000));
  st.push(snap());
  const n=st.length;
  if(n>=5&&st[n-1]===st[n-2]&&st[n-2]===st[n-3]&&st[n-3]===st[n-4]&&st[n-4]===st[n-5])break;
}
return JSON.stringify({y:scrollY,end:Math.round(end),polls:st.length,timeline:st},null,1);
