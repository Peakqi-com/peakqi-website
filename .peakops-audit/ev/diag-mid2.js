await new Promise(r=>setTimeout(r,3500));
for(let i=1;i<=34;i++){scrollTo(0,5900*i/34);await new Promise(r=>requestAnimationFrame(r));}
await new Promise(r=>setTimeout(r,1000));
return 'y='+scrollY;
