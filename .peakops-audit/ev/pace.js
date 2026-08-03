await new Promise(r=>setTimeout(r,3500));
// 平滑捲到第 3 個場景中段與 study-02 中段,確認畫面正常(非跳轉)
const stops=[0.10,0.36];
const doc=document.documentElement;
const out=[];
for(const f of stops){
  const target=Math.floor((doc.scrollHeight-innerHeight)*f);
  const from=scrollY;
  for(let y=from;y<target;y+=90){scrollTo(0,y);await new Promise(r=>requestAnimationFrame(r));}
  scrollTo(0,target);
  await new Promise(r=>setTimeout(r,900));
  out.push({f,y:Math.round(scrollY)});
}
return JSON.stringify(out);
