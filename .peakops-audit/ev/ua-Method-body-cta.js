await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,document.documentElement.scrollHeight);await new Promise(r=>setTimeout(r,300));
const sec=[...document.querySelectorAll('section')].find(s=>s.getAttribute('data-screen-label')==='CTA');
const t=sec?sec.getBoundingClientRect().top+scrollY-80:document.documentElement.scrollHeight*0.72;
scrollTo(0,t);
await new Promise(r=>setTimeout(r,1000));
return 'y='+scrollY+' docH='+document.documentElement.scrollHeight;
