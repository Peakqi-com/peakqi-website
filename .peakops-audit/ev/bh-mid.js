await new Promise(r=>setTimeout(r,3000));
const run=document.getElementById('pq-bh-runway');
const top=run.getBoundingClientRect().top+scrollY;
for(let y=0;y<top+2000;y+=800){scrollTo(0,y);await new Promise(r=>setTimeout(r,150));}
scrollTo(0,top+1800); await new Promise(r=>setTimeout(r,2500));
return 'y='+scrollY;
