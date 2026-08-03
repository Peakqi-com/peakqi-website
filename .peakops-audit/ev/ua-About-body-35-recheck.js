await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,120));
scrollTo(0,Math.min(Math.round(docH*0.35),docH-innerHeight));
await new Promise(r=>setTimeout(r,1500));
// 量測 STEP 卡實際寬度與網格欄數
const cards=[...document.querySelectorAll('*')].filter(el=>{
  const t=el.textContent||'';
  return /^STEP\s*0[1-6]/.test(t.trim()) && el.children.length>0 && el.getBoundingClientRect().width<300 && el.getBoundingClientRect().width>50;
});
const info=cards.slice(0,6).map(el=>{const r=el.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)+'@'+Math.round(r.left);});
const grid=cards[0]?cards[0].parentElement:null;
const gs=grid?getComputedStyle(grid).gridTemplateColumns:'n/a';
return 'y='+scrollY+' docH='+docH+' cards='+cards.length+' sizes=['+info.join(',')+'] gridCols='+gs;
