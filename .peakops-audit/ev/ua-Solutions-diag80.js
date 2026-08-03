await new Promise(r=>setTimeout(r,3500));
const docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,200));
scrollTo(0,Math.round(0.80*(docH-innerHeight)));
await new Promise(r=>setTimeout(r,1000));
const out=[];
const all=[...document.querySelectorAll('*')];
for(const el of all){
  const t=(el.textContent||'').trim();
  if((t.startsWith('02')||t.startsWith('03')||t.startsWith('01')) && t.length<120 && (t.includes('線上報價單')||t.includes('數據報表')||t.includes('AI'))){
    const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
    out.push(el.tagName+'.'+String(el.className).slice(0,40)+' top='+Math.round(r.top)+' h='+Math.round(r.height)+' op='+cs.opacity+' vis='+cs.visibility+' tf='+cs.transform.slice(0,40));
  }
}
return 'y='+scrollY+' | '+out.slice(0,8).join(' || ');
