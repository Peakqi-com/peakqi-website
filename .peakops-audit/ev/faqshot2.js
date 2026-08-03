await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<12000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}
const sec=document.getElementById('p-faq');
scrollTo(0, sec.getBoundingClientRect().top + scrollY + 40);
await new Promise(r=>setTimeout(r,700));
return 'y='+Math.round(scrollY);
