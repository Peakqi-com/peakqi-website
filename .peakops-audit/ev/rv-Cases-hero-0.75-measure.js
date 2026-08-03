await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
for(let i=1;i<=16;i++){scrollTo(0,top+end*0.75*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
for(let i=0;i<30;i++) await new Promise(r=>requestAnimationFrame(r));
const R=e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)];};
const wall=document.querySelector('[data-shotwall]');
const shots=[...document.querySelectorAll('[data-shot]')].map(e=>({r:R(e),o:getComputedStyle(e).opacity})).filter(s=>+s.o>0.05&&s.r[1]<innerHeight&&s.r[3]>0);
const prog=document.querySelector('[data-hero-progress]');
const pill=document.querySelector('[data-demo-pill],[data-floating-demo]')||[...document.querySelectorAll('a,button,div')].find(e=>/用我的場景看/.test(e.textContent||'')&&e.getBoundingClientRect().height<120&&e.getBoundingClientRect().height>30);
return JSON.stringify({vw:innerWidth,vh:innerHeight,scene:wall&&wall.getAttribute('data-scene'),wall:wall?R(wall):null,shots:shots.map(s=>s.r),progress:prog?{r:R(prog),txt:(prog.textContent||'').trim().slice(0,30),display:getComputedStyle(prog).display}:null,pill:pill?R(pill):null},null,1);
