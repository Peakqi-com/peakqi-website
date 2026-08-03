await new Promise(r=>setTimeout(r,3500));
const doc=document.documentElement;
for(let y=0;y<doc.scrollHeight;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
const run=document.getElementById('pq-bh-runway');
const fr=document.getElementById('pq-bh-frame');
if(!run||!fr) return 'no runway/iframe';
const top=run.getBoundingClientRect().top+scrollY;
const H=Math.max(run.offsetHeight-innerHeight,1);
scrollTo(0,top+H*0.06);
for(let i=0;i<40;i++){
  const no=fr.contentDocument&&fr.contentDocument.querySelector('#secHead .no');
  if(no&&no.textContent.trim()) break;
  await new Promise(r=>setTimeout(r,250));
}
let found='',hit=-1;
for(let f=0.01;f<=0.35;f+=0.01){
  scrollTo(0,top+H*f);
  await new Promise(r=>setTimeout(r,180));
  const no=fr.contentDocument.querySelector('#secHead .no');
  found=no?no.textContent.trim():'';
  if(found.indexOf('01')===0){hit=f;break;}
}
if(hit>0) scrollTo(0,top+H*(hit+0.02));
await new Promise(r=>setTimeout(r,2000));
const no2=fr.contentDocument.querySelector('#secHead .no');
return 'y='+scrollY+' sec='+(no2?no2.textContent.trim():'('+found+')')+' hit='+hit;
