await new Promise(r=>setTimeout(r,3500));
for(let i=1;i<=30;i++){scrollTo(0,5400*i/30);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1100));
return 'y='+scrollY;
