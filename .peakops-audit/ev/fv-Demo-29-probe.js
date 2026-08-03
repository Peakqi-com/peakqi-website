await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,Math.round(docH*0.45));
await new Promise(r=>setTimeout(r,1500));
const R=e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)].join(',')};
const grid=document.querySelector('#pq-ind-grid2');
let out='no-grid';
if(grid){const cs=getComputedStyle(grid);out='cols='+cs.gridTemplateColumns+' rect['+R(grid)+'] children='+[...grid.children].map(c=>'['+R(c)+']').join('|');}
return 'y='+scrollY+' docH='+docH+' '+out;
