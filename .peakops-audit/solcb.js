await new Promise((r)=>setTimeout(r,2000));
const w=document.querySelector('#follow [data-wrap]');
const top=w.getBoundingClientRect().top+scrollY, span=Math.max(1,w.offsetHeight-innerHeight);
scrollTo(0, Math.round(top+0.5*span));
await new Promise((r)=>setTimeout(r,1400));
const r1=w.getBoundingClientRect();
const m=document.querySelector('#modules [data-wrap]');
const mt=m.getBoundingClientRect().top+scrollY, ms=Math.max(1,m.offsetHeight-innerHeight);
scrollTo(0, Math.round(mt+0.4*ms));
await new Promise((r)=>setTimeout(r,1400));
return JSON.stringify({
  followCallbacks: window.__fCB||0, followP: window.__fP,
  modulesCallbacks: window.__mCB||0,
  followWrapH: w.offsetHeight, followRectTopAtMid: Math.round(r1.top), vh: innerHeight
});
