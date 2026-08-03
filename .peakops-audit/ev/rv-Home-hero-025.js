await new Promise(r=>setTimeout(r,3500));
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
const F=0.25;
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1500));
const h1=document.querySelector('h1');
let h1r=null,line1EndX=null;
if(h1){
  const rects=[...h1.getClientRects()];
  h1r=h1.getBoundingClientRect();
  const rng=document.createRange();rng.selectNodeContents(h1);
  const lr=[...rng.getClientRects()];
  if(lr.length){const first=lr[0];line1EndX=Math.round(first.right)+','+Math.round(first.top)+','+Math.round(first.bottom);}
}
const media=document.querySelector('[data-hero-wrap] img,[data-hero-wrap] canvas,[data-hero-wrap] video,.hero-media img,.hero-visual img');
const mr=media?media.getBoundingClientRect():null;
return 'y='+scrollY+' end='+Math.round(end)
 +' h1='+(h1r?[Math.round(h1r.left),Math.round(h1r.top),Math.round(h1r.right),Math.round(h1r.bottom)].join(','):'none')
 +' line1(right,top,bottom)='+line1EndX
 +' media='+(mr?media.tagName+':'+[Math.round(mr.left),Math.round(mr.top),Math.round(mr.right),Math.round(mr.bottom)].join(','):'none');
