await document.fonts.ready;
await new Promise(r=>setTimeout(r,1200));
return 'fonts ready';
