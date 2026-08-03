await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<18000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}
const el=document.getElementById('p-faq');
scrollTo(0, el.getBoundingClientRect().top+scrollY+el.offsetHeight*0.25);
await new Promise(r=>setTimeout(r,900));
return 'y='+scrollY;
