await new Promise(r=>setTimeout(r,2000));
const run=document.getElementById('pq-bh-runway');
const fr=document.getElementById('pq-bh-frame');
const top=run.getBoundingClientRect().top+scrollY;
window.scrollTo({top:top+(run.offsetHeight-innerHeight)*0.5,behavior:'instant'});
await new Promise(r=>setTimeout(r,3500));
for(let i=0;i<60;i++) await new Promise(r=>requestAnimationFrame(r));
let canvas=false, sec=null;
try{
  const d=fr.contentDocument;
  const st=d&&d.querySelector('three-d-stage');
  canvas=!!(st&&st.shadowRoot&&st.shadowRoot.querySelector('canvas'));
  sec=d?(d.querySelector('#secHead .no')||{}).textContent:null;
}catch(e){}
return JSON.stringify({runwayH:run.offsetHeight, screens:+(run.offsetHeight/innerHeight).toFixed(1), canvas, sec});
