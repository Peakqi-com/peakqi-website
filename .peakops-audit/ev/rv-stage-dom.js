(()=>{const out=[];
const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
while(walk.nextNode()){
  const t=walk.currentNode.textContent.trim();
  if(t==='LINE'||t==='EXCEL'||t==='表單'||t==='接客'||t==='追客'||t==='CAPTURE'||t==='FOLLOW'){
    const el=walk.currentNode.parentElement;
    const r=el.getBoundingClientRect();
    if(r.width===0&&r.height===0)continue;
    let op=1,n=el;
    while(n&&n!==document.documentElement){op*=parseFloat(getComputedStyle(n).opacity||'1');n=n.parentElement;}
    out.push({txt:t,tag:el.tagName,cls:(el.className||'').toString().slice(0,50),vTop:Math.round(r.top),vLeft:Math.round(r.left),w:Math.round(r.width),effOp:+op.toFixed(3)});
  }
}
return JSON.stringify(out);})()
