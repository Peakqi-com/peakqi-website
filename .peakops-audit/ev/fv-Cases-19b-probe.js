await new Promise(r=>setTimeout(r,3500));
const doc=document.documentElement;
for(let y=0;y<doc.scrollHeight;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
const fr=document.getElementById('pq-bh-frame');
if(!fr) return 'no iframe';
let run=fr.parentElement;
while(run&&run.offsetHeight<innerHeight*2) run=run.parentElement;
const top=run.getBoundingClientRect().top+scrollY;
const H=Math.max(run.offsetHeight-innerHeight,1);
let found='',hit=-1;
for(let f=0.01;f<=0.6;f+=0.01){
  scrollTo(0,top+H*f);
  await new Promise(r=>setTimeout(r,90));
  const no=fr.contentDocument&&fr.contentDocument.querySelector('#secHead .no');
  found=no?no.textContent.trim():'';
  if(found.indexOf('01')===0){hit=f;break;}
}
if(hit>0){scrollTo(0,top+H*(hit+0.03));}
await new Promise(r=>setTimeout(r,2000));
const no2=fr.contentDocument.querySelector('#secHead .no');
const sub=fr.contentDocument.querySelector('#secHead .sub');
const cs=sub?getComputedStyle(sub):null;
const head=fr.contentDocument.getElementById('secHead');
const hs=head?getComputedStyle(head):null;
return 'y='+scrollY+' sec='+(no2?no2.textContent.trim():found)
 +' subColor='+(cs?cs.color:'-')
 +' headBg='+(hs?hs.backgroundImage.slice(0,80):'-')
 +' headShadow='+(hs?hs.textShadow:'-');
