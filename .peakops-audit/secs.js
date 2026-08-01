await new Promise(r=>setTimeout(r,2800));
const rows=[...document.querySelectorAll('section')].map(s=>({
  id:s.id||s.getAttribute('data-screen-label')||'?',
  h:Math.round(s.offsetHeight), screens:+(s.offsetHeight/innerHeight).toFixed(1)
})).sort((a,b)=>b.h-a.h).slice(0,8);
return JSON.stringify(rows);
