await new Promise(r=>setTimeout(r,3500));
const out=[];
for(const f of [0.25,0.5,0.95]){
  for(let i=1;i<=14;i++){scrollTo(0,2300*f*i/14);await new Promise(r=>requestAnimationFrame(r));}
  await new Promise(r=>setTimeout(r,800));
  out.push({f,y:scrollY});
}
return JSON.stringify(out);
