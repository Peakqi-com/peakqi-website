await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):document.documentElement.scrollHeight*0.25;
for(let i=1;i<=16;i++){scrollTo(0,top+end*0.98*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
const R=e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)].join(',')};
const chips=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim().includes('客製流程')&&b.getBoundingClientRect().height>0);
let clip='';
if(chips[0]){let p=chips[0].parentElement;while(p&&p!==document.body){const cs=getComputedStyle(p);if(/(hidden|clip)/.test(cs.overflowY)){clip+=' clipAncestor['+R(p)+']';}p=p.parentElement;}}
return 'y='+scrollY+' chip客製='+chips.map(c=>'['+R(c)+'] op:'+getComputedStyle(c).opacity).join('|')+clip;
