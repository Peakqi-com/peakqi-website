(()=>{const out=[];
document.querySelectorAll('*').forEach(el=>{
  const t=(el.textContent||'').trim();
  if(el.children.length<=3 && /^(LINE|EXCEL|表單)/.test(t) && t.length<20){
    const r=el.getBoundingClientRect();
    if(r.width>0&&r.height>0&&r.top>300&&r.top<700){
      let op=1,n=el;
      while(n&&n!==document.body){op*=parseFloat(getComputedStyle(n).opacity||'1');n=n.parentElement;}
      out.push({tag:el.tagName,cls:(el.className||'').toString().slice(0,40),txt:t.slice(0,12),top:Math.round(r.top),left:Math.round(r.left),effOpacity:op.toFixed(3)});
    }
  }
});
return JSON.stringify(out);})()
