await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<12000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}
scrollTo(0,6948+1700);
await new Promise(r=>setTimeout(r,700));
return 'y='+Math.round(scrollY);
