await new Promise((r)=>setTimeout(r,2000));
const mk = (el) => new Promise((res)=>{
  const o = new IntersectionObserver((es)=>{ res({inter: es[0].isIntersecting, ratio: +es[0].intersectionRatio.toFixed(3)}); o.disconnect(); }, {rootMargin:'160px'});
  o.observe(el);
  setTimeout(()=>{ try{o.disconnect();}catch(e){} res({inter:'TIMEOUT'}); }, 2500);
});
const out={};
for (const id of ['capture','follow','nurture','modules']) {
  const w = document.querySelector('#'+id+' [data-wrap]');
  if (!w) { out[id]={err:'no wrap'}; continue; }
  const top=w.getBoundingClientRect().top+scrollY, span=Math.max(1,w.offsetHeight-innerHeight);
  scrollTo(0, Math.round(top+0.5*span));
  await new Promise((r)=>setTimeout(r,900));
  out[id] = { ...(await mk(w)), h: w.offsetHeight, connected: w.isConnected, styleH: w.style.height };
}
out.counters = { fCB: window.__fCB||0, mCB: window.__mCB||0 };
return JSON.stringify(out);
