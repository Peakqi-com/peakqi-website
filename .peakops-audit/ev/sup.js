await new Promise(r=>setTimeout(r,2500));
const el=document.querySelector('[data-scrollhint]');
return JSON.stringify({
  scrollTl:CSS.supports('animation-timeline: scroll()'),
  viewTl:CSS.supports('animation-timeline: view()'),
  anims:el?getComputedStyle(el).animationName+' / '+getComputedStyle(el).animationTimeline:'none',
  ua:navigator.userAgent.match(/Chrome\/[\d.]+/)[0]});
