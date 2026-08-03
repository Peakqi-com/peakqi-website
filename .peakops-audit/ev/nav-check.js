await new Promise(r=>setTimeout(r,3000));
const hdr=document.querySelector('header');
const at=y=>{const r=hdr.getBoundingClientRect();return Math.round(r.top)+'/'+Math.round(r.bottom);};
const out={h0:at(0)};
for(const y of [400,1200,3000]){
  scrollTo(0,y); await new Promise(r=>setTimeout(r,400));
  out['y'+y]=at(y);
}
// nav 底緣(~68px)下方壓到什麼:取 68px 線上的元素
scrollTo(0,1200); await new Promise(r=>setTimeout(r,400));
const el=document.elementFromPoint(innerWidth/2, hdr.getBoundingClientRect().bottom+4);
out.under=(el?el.tagName+':'+((el.innerText||'').trim().slice(0,16)):'?');
return JSON.stringify(out);
