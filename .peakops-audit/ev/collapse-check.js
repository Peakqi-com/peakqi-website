await new Promise(r=>setTimeout(r,3500));
const media=document.querySelector('[data-hero-media]');
const col=(()=>{let c=document.querySelector('[data-hero-copy]');
  if(c&&!c.querySelector(':scope > h1')){const i=[...c.children].find(x=>x.querySelector&&x.querySelector(':scope > h1'));if(i)c=i;}
  return c;})();
const out={rest:{copyH:Math.round(col.getBoundingClientRect().height)}};
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap.getBoundingClientRect().top+scrollY, end=wrap.offsetHeight-innerHeight;
for(let i=1;i<=14;i++){scrollTo(0,top+end*0.5*i/14);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,900));
const mr=media?media.getBoundingClientRect():null;
out.mid={compact:col.classList.contains('pq-hero-compact'),
  copyH:Math.round(col.getBoundingClientRect().height),
  band:mr?Math.round(Math.min(innerHeight,mr.bottom)-Math.max(0,mr.top)):null};
return JSON.stringify(out);
