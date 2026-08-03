await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<=+('5170')+2000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}
scrollTo(0,+('5170'));
await new Promise(r=>setTimeout(r,700));
return 'y='+scrollY;
