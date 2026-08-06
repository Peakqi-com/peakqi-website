// 比對 sc-for 佔位數與真實筆數:第一次繪製用佔位、資料到齊後重繪,兩者不同高度就會位移
await new Promise((r)=>setTimeout(r,4200));
const out=[];
document.querySelectorAll('[data-screen-label], section[id]').forEach(()=>{});
// 直接量各個列表容器現在的子元素數,對照原始碼 hint 值需人工比對,這裡輸出實際數
const marks=[['#m-steps','六階段'],['#m-tl','時程'],['#m-risk','風險']];
marks.forEach(([sel,name])=>{const el=document.querySelector(sel);if(el)out.push({name,sel,kids:el.querySelectorAll(':scope > div > div, :scope > div').length,h:Math.round(el.getBoundingClientRect().height)})});
return JSON.stringify({page:location.pathname,out,bodyH:document.body.scrollHeight});
