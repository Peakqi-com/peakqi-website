await new Promise(r=>setTimeout(r,3500));
let docH=document.documentElement.scrollHeight;
for(let y=0;y<docH;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));docH=document.documentElement.scrollHeight;}
scrollTo(0,docH);await new Promise(r=>setTimeout(r,120));
const P=0.18;
const target=Math.round(P*(document.documentElement.scrollHeight-innerHeight));
scrollTo(0,target);
await new Promise(r=>setTimeout(r,1500));
for(let i=0;i<30;i++) await new Promise(r=>requestAnimationFrame(r));
// 診斷:找出「客製流程」晶片與深色面板底緣的幾何關係
const chips=[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&e.textContent.trim()==='客製流程');
let info='';
for(const c of chips){
  const r=c.getBoundingClientRect();
  if(r.height>0&&r.bottom>-50&&r.top<innerHeight+50){
    const cs=getComputedStyle(c);
    info+=' chip[top='+Math.round(r.top)+',bottom='+Math.round(r.bottom)+',h='+Math.round(r.height)+',op='+cs.opacity+']';
    // 找遮住它的祖先(overflow hidden / clip)
    let p=c.parentElement;
    while(p&&p!==document.body){
      const pr=p.getBoundingClientRect();const pcs=getComputedStyle(p);
      if((pcs.overflow!=='visible'||pcs.overflowY!=='visible'||pcs.clipPath!=='none')&&pr.bottom<r.bottom){
        info+=' clipBy<'+p.tagName+'.'+String(p.className).slice(0,40)+' bottom='+Math.round(pr.bottom)+' ovf='+pcs.overflowY+' clip='+pcs.clipPath.slice(0,30)+'>';
      }
      p=p.parentElement;
    }
  }
}
return 'y='+scrollY+' docH='+document.documentElement.scrollHeight+' innerH='+innerHeight+info;
