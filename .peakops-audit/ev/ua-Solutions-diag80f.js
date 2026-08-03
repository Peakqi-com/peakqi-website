await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,300));
for(let y=scrollY;y>13400;y-=120){scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}
for(let i=0;i<14;i++){scrollTo(0,scrollY-80);await new Promise(r=>setTimeout(r,70));}
scrollTo(0,12380);
await new Promise(r=>setTimeout(r,1200));
let card=null;
for(const el of document.querySelectorAll('div')){
  const t=(el.textContent||'').trim();
  if(t.includes('數據報表')&&t.length<200){card=el;}
}
const cr=card?card.getBoundingClientRect():null;
const co=card?getComputedStyle(card).opacity:'?';
return 'y='+scrollY+' card03top='+(cr?Math.round(cr.top):'?')+' op='+co;
