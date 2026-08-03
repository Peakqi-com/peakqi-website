await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
for(let i=1;i<=16;i++){scrollTo(0,top+end*0.75*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
for(let i=0;i<30;i++) await new Promise(r=>requestAnimationFrame(r));
const idx=[...document.querySelectorAll('*')].filter(e=>/04\s*\/\s*05/.test(e.textContent||'')&&e.children.length===0).map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,cls:e.className,rect:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]};});
const thumbs=[...document.querySelectorAll('img')].map(e=>{const r=e.getBoundingClientRect();return r.width>20&&r.height>20&&r.top<innerHeight&&r.bottom>0?[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]:null;}).filter(Boolean);
return JSON.stringify({y:scrollY,end:Math.round(end),vh:innerHeight,counter:idx,visibleThumbs:thumbs});
