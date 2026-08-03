await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,Math.round(docH*0.18));
await new Promise(r=>setTimeout(r,1500));
const R=e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)].join(',')};
const chips=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim().includes('客製流程')&&b.getBoundingClientRect().height>0);
let clip='';
if(chips[0]){let p=chips[0].parentElement;while(p&&p!==document.body){const cs=getComputedStyle(p);if(/(hidden|clip)/.test(cs.overflowY)){clip+=' clipAncestor['+R(p)+']';}p=p.parentElement;}}
return 'y='+scrollY+' docH='+docH+' chip客製='+chips.map(c=>'['+R(c)+'] op:'+getComputedStyle(c).opacity).join('|')+clip;
