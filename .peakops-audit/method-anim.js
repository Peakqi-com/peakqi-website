await new Promise(r=>setTimeout(r,2600));
const cv=document.querySelector('[data-hero-canvas]');
const out={heroApi:window.__pqHero?{key:window.__pqHero.key,scenes:window.__pqHero.scenes,mode:window.__pqHero.mode,ok:window.__pqHero.ok}:null,
  canvasOpacity:cv?getComputedStyle(cv).opacity:null,
  overflowX:document.documentElement.scrollWidth>innerWidth+1?'OVERFLOW':'ok'};
// 捲到第三幕確認字卡切換
const wrap=document.querySelector('[data-hero-wrap]');
const total=wrap.offsetHeight-innerHeight;
window.scrollTo({top:wrap.getBoundingClientRect().top+scrollY+total*0.62,behavior:'instant'});
await new Promise(r=>setTimeout(r,300));
for(let i=0;i<40;i++) await new Promise(r=>requestAnimationFrame(r));
const act=[...document.querySelectorAll('[data-hero-scene]')].find(el=>+getComputedStyle(el).opacity>0.5);
out.activeScene=act?act.getAttribute('data-hero-scene'):null;
out.wrapH=wrap.offsetHeight; out.docH=document.body.scrollHeight;
return JSON.stringify(out,null,1);
