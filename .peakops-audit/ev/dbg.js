await new Promise(r=>setTimeout(r,3500));
for(let y=0;y<40000;y+=1600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}
return JSON.stringify({diag:!!document.getElementById('diagnostic'),
  meters:document.querySelectorAll('[data-dmeter]').length,
  docH:document.documentElement.scrollHeight});
