await new Promise(r=>setTimeout(r,5000));
const h=document.querySelector('[data-scrollhint]')||document.querySelector('[data-sh-arrow]')?.closest('span')?.parentElement;
const el=document.querySelector('[data-scrollhint]');
const info=el?{
  vis:!!(el.offsetWidth&&el.offsetHeight),
  top:Math.round(el.getBoundingClientRect().top),
  fs:getComputedStyle(el.querySelector('span')).fontSize,
  op0:getComputedStyle(el).opacity
}:null;
scrollTo(0,420); await new Promise(r=>setTimeout(r,500));
const op1=el?getComputedStyle(el).opacity:null;
scrollTo(0,0); await new Promise(r=>setTimeout(r,300));
return JSON.stringify({hint:info,opAfterScroll:op1,
  arrowAnim:document.querySelector('[data-sh-arrow]')?getComputedStyle(document.querySelector('[data-sh-arrow]')).animationName:'none',
  ofx:document.documentElement.scrollWidth-document.documentElement.clientWidth});
