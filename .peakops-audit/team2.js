await new Promise(r=>setTimeout(r,2600));
const t=document.getElementById('a-team');
window.scrollTo({top:t.getBoundingClientRect().top+scrollY-70,behavior:'instant'});
await new Promise(r=>setTimeout(r,500));
return JSON.stringify({y:Math.round(scrollY)});
