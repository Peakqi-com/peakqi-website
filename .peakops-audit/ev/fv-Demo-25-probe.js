await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):document.documentElement.scrollHeight*0.25;
for(let i=1;i<=16;i++){scrollTo(0,top+end*0.05*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
const R=e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)].join(',')};
const prog=[...document.querySelectorAll('span,div,p')].filter(e=>e.children.length===0&&/^\s*0\d\s*\/\s*04\s*$/.test(e.textContent));
const chips=[...document.querySelectorAll('button')].filter(b=>b.textContent.includes('LINE 客服')&&b.getBoundingClientRect().height>0);
let out='prog='+prog.map(e=>{const cs=getComputedStyle(e);return e.textContent.trim()+'['+R(e)+'] op:'+cs.opacity+' vis:'+cs.visibility}).join(' | ');
out+=' ;chipLINE='+chips.map(c=>'['+R(c)+']').join('|');
return 'y='+scrollY+' '+out;
