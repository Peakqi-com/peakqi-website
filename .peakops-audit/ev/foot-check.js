await new Promise(r=>setTimeout(r,3000));
scrollTo(0,999999); await new Promise(r=>setTimeout(r,800));
scrollTo(0,999999); await new Promise(r=>setTimeout(r,400));
const out=[];
for(const a of document.querySelectorAll('a[href]')){
  const t=(a.innerText||'').trim();
  if(!/jacky@peakqi|6609-3699|^peakqi\.com$|預約 AI 導入評估 →/.test(t))continue;
  const r=a.getBoundingClientRect();
  out.push({t:t.slice(0,20),h:Math.round(r.height)});
}
return JSON.stringify({links:out,ofx:document.documentElement.scrollWidth-document.documentElement.clientWidth});
