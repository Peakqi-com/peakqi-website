await new Promise(r=>setTimeout(r,3000));
for(let y=0;y<30000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
const el=document.querySelector('#diagnostic [data-dmeter]');
scrollTo(0, el.getBoundingClientRect().top+scrollY-innerHeight*0.55);
await new Promise(r=>setTimeout(r,1400)); // 播放中途截圖(3.4s 時間軸)
return 'y='+scrollY;
