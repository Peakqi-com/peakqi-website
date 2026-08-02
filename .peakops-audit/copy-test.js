await new Promise(r=>setTimeout(r,2600));
// 攔截 fetch 讓本機也能進成功頁(local 沒有 /api)
const of=window.fetch; window.fetch=(u,o2)=>String(u).includes('/api/submit')?Promise.resolve(new Response('{"ok":true}',{status:200})):of(u,o2);
const setVal=(el,v)=>{const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);
  el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
setVal(document.getElementById('pq-f-name'),'測試');
setVal(document.getElementById('pq-f-phone'),'0911222333');
[...document.querySelectorAll('button')].find(b=>b.textContent.includes('送出導入草稿')).click();
let ok=false;
for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,250));
  if(document.body.innerText.includes('導入草稿已送出')){ok=true;break;}}
if(!ok) return JSON.stringify({err:'沒進成功頁'});
const btn=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('複製需求內容'));
if(!btn) return JSON.stringify({err:'找不到複製鈕'});
btn.click();
await new Promise(r=>setTimeout(r,500));
const after=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('已複製'));
const mail=[...document.querySelectorAll('a')].find(x=>x.textContent.includes('用郵件軟體開啟'));
return JSON.stringify({success:true, copyFeedback:!!after, mailtoSecondary:!!mail,
  hrefLen:mail?(mail.getAttribute('href')||'').length:0});
