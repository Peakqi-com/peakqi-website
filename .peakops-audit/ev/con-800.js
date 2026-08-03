await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<14500;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}
scrollTo(0,12566+800);
await new Promise(r=>setTimeout(r,900));
return 'y='+scrollY;
