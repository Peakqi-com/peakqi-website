await new Promise(r=>setTimeout(r,2600));
// 填最少必填 → 送出 → 進成功頁
const setVal=(el,v)=>{const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);
  el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
setVal(document.getElementById('pq-f-name'),'測試');
setVal(document.getElementById('pq-f-phone'),'0911');
[...document.querySelectorAll('button')].find(b=>b.textContent.includes('送出導入草稿')).click();
let ok=false;
for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,250));
  if(document.body.innerText.includes('導入草稿已送出')){ok=true;break;}}
if(!ok) return JSON.stringify({err:'沒進成功頁'});
const a=[...document.querySelectorAll('a')].find(x=>x.textContent.includes('同步用 Email'));
if(!a) return JSON.stringify({err:'找不到按鈕'});
const r=a.getBoundingClientRect();
a.scrollIntoView({block:'center'});
await new Promise(r2=>setTimeout(r2,300));
const r2=a.getBoundingClientRect();
const hit=document.elementFromPoint(r2.left+r2.width/2, r2.top+r2.height/2);
return JSON.stringify({
  hrefLen:(a.getAttribute('href')||'').length,
  hrefHead:(a.getAttribute('href')||'').slice(0,40),
  pointerEvents:getComputedStyle(a).pointerEvents,
  hitIsButton: hit===a||a.contains(hit),
  hitTag: hit?hit.tagName+(hit.id?'#'+hit.id:''):null,
  hitText:(hit&&hit.textContent||'').trim().slice(0,20)
});
