await new Promise(r=>setTimeout(r,3000));
// 先掃到底讓頁面高度穩定,再回到目標位置
for(let y=0;y<20000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,7027);
await new Promise(r=>setTimeout(r,700));
return 'y='+scrollY+' docH='+document.documentElement.scrollHeight;
