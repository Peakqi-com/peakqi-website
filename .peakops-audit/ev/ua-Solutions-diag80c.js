await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,200));
scrollTo({top:12414,behavior:'instant'});
await new Promise(r=>setTimeout(r,1200));
const hits=[];
for(const el of document.querySelectorAll('div,section,article')){
  const t=(el.textContent||'').trim();
  if(t.includes('線上報價單')&&t.length<200){
    let n=el,chain=[];
    while(n&&n!==document.body){const cs=getComputedStyle(n);chain.push(n.tagName+':op='+cs.opacity+',vis='+cs.visibility+',tf='+(cs.transform==='none'?'-':cs.transform.slice(7,30)));n=n.parentElement;}
    const r=el.getBoundingClientRect();
    hits.push('CARD02 top='+Math.round(r.top)+' h='+Math.round(r.height)+' :: '+chain.join(' > '));
    break;
  }
}
return 'y='+scrollY+' | '+hits.join('');
