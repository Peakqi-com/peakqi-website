await new Promise(r=>setTimeout(r,3000));
scrollTo(0,999999); await new Promise(r=>setTimeout(r,600));
const links=[...document.querySelectorAll('a[href*="lin.ee"]')].map(a=>({t:(a.innerText||'').trim().slice(0,14),h:Math.round(a.getBoundingClientRect().height)}));
const qr=document.querySelector('img[src*="line-qr"]');
const priv=[...document.querySelectorAll('a[href*="Privacy"]')].length;
return JSON.stringify({lineLinks:links,qr:qr?(qr.complete&&qr.naturalWidth>0?'loaded':'broken'):null,privacyLinks:priv,
  rendered:document.body.innerText.length>300,ofx:document.documentElement.scrollWidth-document.documentElement.clientWidth});
