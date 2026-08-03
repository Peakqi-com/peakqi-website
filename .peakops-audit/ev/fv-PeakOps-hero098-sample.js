await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]')||document.querySelector('#hero > div');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):document.documentElement.scrollHeight*0.25;
for(let i=1;i<=16;i++){scrollTo(0,top+end*0.98*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1800));
try{
const cv=document.querySelector('#hero canvas');
const ctx=cv.getContext('2d');
const dpr=cv.width/cv.clientWidth;
const pts=[[215,640],[258,635],[300,640],[338,650],[80,640],[195,250],[300,320]];
const out=pts.map(p=>{const d=ctx.getImageData(Math.round(p[0]*dpr),Math.round(p[1]*dpr),1,1).data;return p[0]+','+p[1]+':rgb('+d[0]+','+d[1]+','+d[2]+')';});
return 'y='+scrollY+' '+out.join(' | ');
}catch(e){return 'y='+scrollY+' sampleErr:'+e.message;}
