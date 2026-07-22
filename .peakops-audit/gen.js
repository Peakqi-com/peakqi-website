await new Promise(r=>setTimeout(r,1200));
return JSON.stringify({
  rendered: document.querySelectorAll('section').length,
  docH: document.body.scrollHeight,
  overflowX: document.documentElement.scrollWidth > innerWidth+1 ? 'OVERFLOW '+document.documentElement.scrollWidth : 'ok',
  bodyText: (document.body.innerText||'').length
});
