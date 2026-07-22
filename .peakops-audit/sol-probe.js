await new Promise(r=>setTimeout(r,1800));
const secs=[...document.querySelectorAll('section[id],section[data-screen-label]')].map(x=>x.id||x.getAttribute('data-screen-label'));
const claims=['30 秒','喚回率','3 倍','25%','漏掉'].map(k=>[k,(document.body.innerText||'').includes(k)]);
const scenes=document.querySelectorAll('[data-hero-scene]').length;
const ftag=document.querySelectorAll('[data-ftag]').length;
const ctas=[...document.querySelectorAll('a')].map(a=>a.textContent.trim()).filter(t=>/跑一次|案例|評估|Demo/.test(t));
return JSON.stringify({
  secs, scenes, ftag,
  heroApi: window.__pqHero?{scenes:window.__pqHero.scenes,mode:window.__pqHero.mode}:null,
  claims:Object.fromEntries(claims),
  ctaSet:[...new Set(ctas)],
  overflowX:document.documentElement.scrollWidth>innerWidth+1?'OVERFLOW '+document.documentElement.scrollWidth:'ok',
  docH:document.body.scrollHeight
},null,1);
