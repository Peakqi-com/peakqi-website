await new Promise(r=>setTimeout(r,4500));
const w=document.querySelector('#wall');
return JSON.stringify({wallH:Math.round(w.getBoundingClientRect().height),
 shots:document.querySelectorAll('#wall [data-shot]').length,
 kids:w.querySelectorAll('*').length});
