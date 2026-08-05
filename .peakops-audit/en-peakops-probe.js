await new Promise(r=>setTimeout(r,1800));
// en/PeakOps 驗收探針:段落齊全、零爆版、可見 CJK 殘留(Nav 語言鈕「中文」除外)
const secs=[...document.querySelectorAll('section[id],section[data-screen-label]')].map(x=>x.id||x.getAttribute('data-screen-label'));
const cjkRe=/[㐀-鿿豈-﫿]/;
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
const leaks=[];const seen=new Set();
while(walker.nextNode()){
  const n=walker.currentNode,t=(n.textContent||'').trim();
  if(!t||!cjkRe.test(t))continue;
  const el=n.parentElement;if(!el)continue;
  if(el.closest('script,style,noscript,[aria-hidden="true"]'))continue;
  const cs=getComputedStyle(el);
  if(cs.display==='none'||cs.visibility==='hidden')continue;
  const r=el.getBoundingClientRect();
  if(r.width===0&&r.height===0)continue;
  if(el.closest('nav')&&/^中文$/.test(t))continue; // Nav 語言切換鈕
  const key=t.slice(0,40);if(seen.has(key))continue;seen.add(key);
  leaks.push({t:key,tag:el.tagName,sec:(el.closest('section[id]')||{}).id||'-'});
}
const ctas=[...new Set([...document.querySelectorAll('a')].map(a=>a.textContent.trim()).filter(t=>/workflow|cases|demo/i.test(t)))];
const lossVals=[...document.querySelectorAll('[data-lossv]')].map(e=>e.getAttribute('data-t'));
return JSON.stringify({
  lang:document.documentElement.lang,
  title:document.title.slice(0,60),
  secs,
  heroBlocks:['t1','t2','t3','t4','t5'].length,
  overflowX:document.documentElement.scrollWidth>innerWidth+1?'OVERFLOW '+document.documentElement.scrollWidth+' vs '+innerWidth:'ok',
  docH:document.body.scrollHeight,
  cjkLeaks:leaks.length,
  cjkSample:leaks.slice(0,12),
  ctaSet:ctas,
  lossVals
},null,1);
