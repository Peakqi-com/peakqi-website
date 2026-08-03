await new Promise(r=>setTimeout(r,3500));
for(let i=1;i<=6;i++){scrollTo(0,60*i);await new Promise(r=>requestAnimationFrame(r));}
scrollTo(0,360);
await new Promise(r=>setTimeout(r,800));
return 'y='+scrollY;
