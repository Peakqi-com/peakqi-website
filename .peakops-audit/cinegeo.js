// 量引擎穩定後 cine 元素的真實幾何,作為「第一次繪製就該長這樣」的依據
await new Promise((r)=>setTimeout(r,5000));
const hero=document.getElementById('hero');
const pick=(sel)=>{const el=document.querySelector(sel);if(!el)return null;const c=getComputedStyle(el);const r=el.getBoundingClientRect();
 return {pos:c.position,top:c.top,left:c.left,right:c.right,bottom:c.bottom,width:c.width,w:Math.round(r.width),h:Math.round(r.height),tf:c.transform.slice(0,40),op:c.opacity,mx:c.marginLeft+'/'+c.marginRight};};
return JSON.stringify({
  vw:innerWidth, cineOn:hero&&hero.classList.contains('pq-cine-on'),
  stageH:getComputedStyle(document.querySelector('.pq-cine-stage')).height,
  intro:pick('.pq-cine-intro'),
  cardL:pick('.pq-cine-card[data-align="left"]'),
  cardR:pick('.pq-cine-card[data-align="right"]'),
  svg:document.querySelector('#pq-hero-svg')?getComputedStyle(document.querySelector('#pq-hero-svg')).display:null
});
