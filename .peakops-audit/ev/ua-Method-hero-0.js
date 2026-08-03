await new Promise(r=>setTimeout(r,3500));
scrollTo(0,0);
await new Promise(r=>setTimeout(r,1000));
const h1=document.querySelector('#m-hero h1');
const p=h1?h1.nextElementSibling:null;
const s=h1?getComputedStyle(h1):null;
return 'y='+scrollY+' h1vis='+(s?s.opacity+'/'+s.display+'/'+s.visibility:'none')+' h1rect='+(h1?JSON.stringify(h1.getBoundingClientRect()):'x');
