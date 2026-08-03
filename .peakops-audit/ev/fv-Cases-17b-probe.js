await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):document.documentElement.scrollHeight*0.25;
const F=0.98;
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
const wall=document.querySelector('[data-shotwall]');
const shots=wall?Array.from(wall.querySelectorAll('[data-shot]')):[];
const ops=shots.map(s=>getComputedStyle(s).opacity).join(',');
const scene=wall?wall.getAttribute('data-scene'):'-';
let counter=null;
document.querySelectorAll('*').forEach(el=>{
  if(el.children.length===0&&/^0\d\s*\/\s*0\d$/.test((el.textContent||'').trim())){counter=el;}
});
let cInfo='-';
if(counter){const r=counter.getBoundingClientRect();const cs=getComputedStyle(counter);
  cInfo=Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.right)+','+Math.round(r.bottom)+' op='+cs.opacity+' z='+cs.zIndex;}
let pill=null;
document.querySelectorAll('a,button,div').forEach(el=>{
  const t=(el.textContent||'');
  if(t.indexOf('用我的場景看 Demo')>=0&&el.getBoundingClientRect().height<120&&el.getBoundingClientRect().height>30)pill=pill||el;
});
let pInfo='-';
if(pill){const r=pill.getBoundingClientRect();pInfo=Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.right)+','+Math.round(r.bottom);}
return 'y='+scrollY+' scene='+scene+' shotOps=['+ops+'] counter='+cInfo+' pill='+pInfo;
