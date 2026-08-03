await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<25000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
const idx=document.getElementById('index');
idx.scrollIntoView(); await new Promise(r=>setTimeout(r,900));
return JSON.stringify({rendered:idx.innerText.length>200, h:Math.round(idx.getBoundingClientRect().height),
  ofx:document.documentElement.scrollWidth-document.documentElement.clientWidth});
