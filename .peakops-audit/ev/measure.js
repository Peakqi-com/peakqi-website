await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<15000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}
scrollTo(0,999999); await new Promise(r=>setTimeout(r,600));
const abs=e=>{const r=e.getBoundingClientRect();return {top:Math.round(r.top+scrollY),h:Math.round(r.height)};};
const faq=document.getElementById('p-faq');
const sum=[...document.querySelectorAll('span')].find(e=>e.textContent.trim()==='PRICE SUMMARY');
const foot=document.querySelector('footer')||[...document.querySelectorAll('a')].find(a=>a.textContent.includes('jacky@peakqi.com'));
const qs=[...document.querySelectorAll('details')].length;
return JSON.stringify({docH:document.documentElement.scrollHeight, maxY:Math.round(scrollY),
  faq:faq?abs(faq):null, sumBox:sum?abs(sum.parentElement):null, foot:foot?abs(foot):null, faqCount:qs,
  ofx:document.documentElement.scrollWidth-document.documentElement.clientWidth});
