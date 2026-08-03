await new Promise(r=>setTimeout(r,3500));
scrollTo(0,11000);
await new Promise(r=>setTimeout(r,400));
let btn=null;
for(const el of document.querySelectorAll('a,button,div')){
  const t=(el.textContent||'').trim();
  if(t==='先看方案說明'){btn=el;}
}
for(let i=0;i<60;i++){
  scrollTo(0,scrollY+80);
  await new Promise(r=>setTimeout(r,60));
  if(btn){const r=btn.getBoundingClientRect(); if(r.bottom<innerHeight-80) break;}
}
await new Promise(r=>setTimeout(r,1200));
let card=null;
for(const el of document.querySelectorAll('div')){
  const t=(el.textContent||'').trim();
  if(t.includes('數據報表')&&t.length<200){card=el;}
}
const cr=card?card.getBoundingClientRect():null;
const co=card?getComputedStyle(card).opacity:'?';
const br=btn?btn.getBoundingClientRect():null;
return 'y='+scrollY+' card03top='+(cr?Math.round(cr.top):'?')+' card03h='+(cr?Math.round(cr.height):'?')+' op='+co+' btnTop='+(br?Math.round(br.top):'?');
