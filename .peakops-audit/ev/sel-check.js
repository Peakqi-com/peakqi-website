await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<9000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
const sec=document.getElementById('p-selector');
scrollTo(0, sec.getBoundingClientRect().top+scrollY+innerHeight*0.6);
await new Promise(r=>setTimeout(r,900));
const stage=sec.querySelector('[data-stage]');
const r=stage.getBoundingClientRect();
const anims=[...document.querySelectorAll('#pq-console-mods .pq-ma')].map(a=>({
  ma:a.getAttribute('data-ma'), st:a.parentElement.getAttribute('data-state'),
  op:getComputedStyle(a).opacity}));
const note=[...stage.querySelectorAll('p')].some(p=>p.offsetHeight>0&&p.textContent.includes('切換方案'));
return JSON.stringify({stageTop:Math.round(r.top),stageBottom:Math.round(r.bottom),vh:innerHeight,
  fits:r.bottom<=innerHeight+4&&r.top>=64, anims, ofx:document.documentElement.scrollWidth-document.documentElement.clientWidth});
