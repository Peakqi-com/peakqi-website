await new Promise(r=>setTimeout(r,2000));
const $$=s=>[...document.querySelectorAll(s)];
const flowBtn=$$('#scene button').find(b=>b.textContent.includes('LINE 客服回覆'));
if(flowBtn) flowBtn.click();
await new Promise(r=>setTimeout(r,300));
const recBtn=$$('button').find(b=>b.textContent.includes('加入草稿')&&!b.textContent.includes('已加入'));
if(recBtn) recBtn.click();
await new Promise(r=>setTimeout(r,300));
const toolBtn=$$('button').find(b=>b.textContent.trim().endsWith('試算表'));
if(toolBtn) toolBtn.click();
const humanBtn=$$('button').find(b=>b.textContent.trim().endsWith('價格'));
if(humanBtn) humanBtn.click();
await new Promise(r=>setTimeout(r,300));
const added=$$('button').filter(b=>b.textContent.includes('已加入草稿')).length;
const body=document.body.innerText;
return JSON.stringify({
  heroScenes:$$('[data-hero-scene]').length,
  heroApi:window.__pqHero?{scenes:window.__pqHero.scenes,mode:window.__pqHero.mode}:null,
  flowSelected:!!flowBtn&&flowBtn.getAttribute('aria-pressed')==='true',
  recAppeared:!!recBtn, modAdded:added>0,
  toolSelected:!!toolBtn&&toolBtn.getAttribute('aria-pressed')==='true',
  humanSelected:!!humanBtn&&humanBtn.getAttribute('aria-pressed')==='true',
  claims:{s30:body.includes('30 秒'),day:body.includes('DAY 1'),draft:body.includes('導入草稿'),disclaimer:body.includes('不代表正式報價')},
  overflowX:document.documentElement.scrollWidth>innerWidth+1?'OVERFLOW '+document.documentElement.scrollWidth:'ok',
  docH:document.body.scrollHeight
},null,1);
