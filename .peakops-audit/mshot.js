await new Promise(r=>setTimeout(r,2400));
const wrap=document.querySelector('[data-hero-wrap]');
const total=wrap.offsetHeight-innerHeight;
const P=parseFloat(new URLSearchParams(location.hash.slice(1)).get('p')||'0');
window.scrollTo({top:wrap.getBoundingClientRect().top+scrollY+total*P,behavior:'instant'});
await new Promise(r=>setTimeout(r,250));
for(let i=0;i<50;i++) await new Promise(r=>requestAnimationFrame(r));
return JSON.stringify({p:P});
