await new Promise(r=>setTimeout(r,2500));
return JSON.stringify({y:scrollY, manual:history.scrollRestoration,
  rendered:document.body.innerText.length>500,
  overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth});
