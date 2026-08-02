await new Promise(r=>setTimeout(r,3000));
const body=document.body.innerText;
const chip=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='婚禮婚慶');
if(chip) chip.click();
await new Promise(r=>setTimeout(r,500));
const find=t=>{const el=[...document.querySelectorAll('span')].find(x=>x.textContent.trim()===t);
  if(!el) return 'no-el';
  let p=el; while(p&&p!==document.body){const cs=getComputedStyle(p);
    if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0) return 'hidden@'+p.tagName;
    p=p.parentElement;}
  const r=el.getBoundingClientRect();
  return 'visible y='+Math.round(r.top);};
return JSON.stringify({
  rendered: body.includes('選出現在最卡的流程'),
  flow:find('02 最卡的流程'),
  sum:find('草稿摘要'),
  hasCase: body.includes('相似場景')});
