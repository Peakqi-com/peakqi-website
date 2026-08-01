await new Promise(r=>setTimeout(r,2600));
return JSON.stringify({docH:document.body.scrollHeight, vh:innerHeight,
  screens:+(document.body.scrollHeight/innerHeight).toFixed(1)});
