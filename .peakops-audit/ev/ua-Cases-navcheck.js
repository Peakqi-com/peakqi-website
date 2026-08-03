await new Promise(r=>setTimeout(r,2000));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,300));
scrollTo(0,Math.round(0.80*(docH-innerHeight)));
await new Promise(r=>setTimeout(r,1000));
const navs=[...document.querySelectorAll('nav,header,[class*="nav"],[id*="nav"]')].slice(0,8).map(n=>{
  const r=n.getBoundingClientRect(),cs=getComputedStyle(n);
  return (n.tagName+'.'+(n.className||'').toString().slice(0,30))+' pos='+cs.position+' top='+Math.round(r.top)+' h='+Math.round(r.height)+' disp='+cs.display+' vis='+cs.visibility+' op='+cs.opacity+' tf='+cs.transform.slice(0,40);
});
return 'y='+scrollY+'\n'+navs.join('\n');
