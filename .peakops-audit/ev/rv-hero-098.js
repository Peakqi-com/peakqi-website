await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
const F=0.98;
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
// settle 遠超過 1200ms,並輪詢 phase 標記直到穩定(排除阻尼追趕中的過場狀態)
const st=[];
for(let k=0;k<10;k++){
  await new Promise(r=>setTimeout(r,600));
  const ph=document.querySelector('[data-cine-phase] span.active');
  const card=document.querySelector('[data-cine-card].is-active');
  st.push((ph?ph.textContent.trim():'-')+' | '+(card?(card.textContent.trim().slice(0,14)):'no-card'));
  if(st.length>=3&&st[st.length-1]===st[st.length-2]&&st[st.length-2]===st[st.length-3])break;
}
return JSON.stringify({y:scrollY,end:Math.round(end),settledMs:600*st.length,timeline:st});
