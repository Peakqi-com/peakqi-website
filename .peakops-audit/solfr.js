await new Promise((r)=>setTimeout(r,2200));
const w=document.querySelector('#follow [data-wrap]');
const top=w.getBoundingClientRect().top+scrollY, span=Math.max(1,w.offsetHeight-innerHeight);
scrollTo(0, Math.round(top+0.5*span));
await new Promise((r)=>setTimeout(r,1600));
return JSON.stringify({
  scrollChaptersRegistered: window.__scReg||0,
  registeredOn: window.__scEls||[],
  frameHits: window.__scHit||0, blockedByBoundary: window.__scBlock||0,
  fCB: window.__fCB||0
});
