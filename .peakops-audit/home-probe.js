await new Promise(r=>setTimeout(r,2600));
const bt=document.getElementById('pq-backtop');
window.scrollTo({top:innerHeight*2,behavior:'instant'});
await new Promise(r=>setTimeout(r,300));
const on=bt?getComputedStyle(bt).display:null;
window.scrollTo({top:0,behavior:'instant'});
await new Promise(r=>setTimeout(r,300));
const off=bt?getComputedStyle(bt).display:null;
return JSON.stringify({afterScroll:on, backAtTop:off});
