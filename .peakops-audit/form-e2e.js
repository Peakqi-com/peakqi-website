await new Promise(r=>setTimeout(r,3000));
const setVal=(el,v)=>{ // React 受控欄位:要用原生 setter + input 事件,直接改 .value 不會進 state
  const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
};
const name=document.getElementById('pq-f-name');
const phone=document.getElementById('pq-f-phone');
const need=document.getElementById('pq-f-need');
if(!name||!phone) return JSON.stringify({err:'欄位不存在'});
setVal(name,'測試B-網站表單實測');
setVal(phone,'0900000002');
if(need) setVal(need,'這筆是無頭瀏覽器從正式站表單送出的——中文若正常,訪客路徑完全沒問題,可刪除。');
await new Promise(r=>setTimeout(r,400));
const btn=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('送出導入草稿'));
if(!btn) return JSON.stringify({err:'找不到送出鈕'});
btn.click();
// 等成功狀態
let done=false, msg='';
for(let i=0;i<40;i++){
  await new Promise(r=>setTimeout(r,250));
  const t=document.body.innerText;
  if(t.includes('導入草稿已送出')){done=true;break;}
  const st=[...document.querySelectorAll('[role="status"]')].map(x=>x.textContent.trim()).filter(Boolean);
  msg=st.join(' | ');
}
return JSON.stringify({submitted:done, statusMsg:msg});
