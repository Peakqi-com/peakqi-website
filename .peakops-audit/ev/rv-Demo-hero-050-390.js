await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
const F=0.50;
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
// 量測:hero canvas 與 DOM 控制台卡片的位置,推算側標 x = cardLeft - 14
const out={y:scrollY,end,vw:innerWidth};
const cv=[...document.querySelectorAll('canvas')].map(c=>{const r=c.getBoundingClientRect();return{rect:[r.left,r.top,r.width,r.height].map(Math.round)};});
out.canvas=cv;
const card=[...document.querySelectorAll('*')].find(el=>{
  const t=(el.textContent||'').trim();
  return t.startsWith('第一階段導入草稿')&&el.children.length<=3;
});
let panel=card;
while(panel&&panel.parentElement){
  const r=panel.parentElement.getBoundingClientRect();
  if(r.width>innerWidth*0.98)break;
  panel=panel.parentElement;
  if(panel.getBoundingClientRect().width>innerWidth*0.7&&getComputedStyle(panel).backgroundColor!=='rgba(0, 0, 0, 0)')break;
}
if(panel){const r=panel.getBoundingClientRect();out.card=[r.left,r.top,r.width,r.height].map(Math.round);out.cardBg=getComputedStyle(panel).backgroundColor;}
return JSON.stringify(out);
