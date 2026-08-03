await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,120));
const dh2=document.documentElement.scrollHeight;
scrollTo(0,Math.min(Math.round(dh2*0.45),dh2-innerHeight));
await new Promise(r=>setTimeout(r,1200));
const nav=document.querySelector('nav,header,[data-nav],.nav,.site-nav,#nav');
const info=n=>{if(!n)return 'none';const r=n.getBoundingClientRect();const cs=getComputedStyle(n);return JSON.stringify({tag:n.tagName,cls:String(n.className).slice(0,60),top:Math.round(r.top),h:Math.round(r.height),pos:cs.position,tf:cs.transform,vis:cs.visibility,op:cs.opacity,disp:cs.display});};
const a=info(nav);
scrollBy(0,-30);await new Promise(r=>setTimeout(r,1200));
const b=info(nav);
return 'y='+scrollY+' before='+a+' afterUp='+b;
