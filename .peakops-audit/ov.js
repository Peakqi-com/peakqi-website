await new Promise(r=>setTimeout(r,1800));
const out=[];
const doc=document.documentElement;
// 全頁溢位偵測:逐元素找超出視窗的,並記錄其祖先鏈裡最上層的溢位源
if (doc.scrollWidth > innerWidth+1) {
  const seen=new Set();
  for (const el of document.querySelectorAll('body *')) {
    const r=el.getBoundingClientRect();
    if (r.width===0) continue;
    if (r.right > innerWidth+2 || r.left < -2) {
      // 只記「父元素沒有溢位」的最上層源頭
      const pr=el.parentElement?el.parentElement.getBoundingClientRect():null;
      if (pr && (pr.right>innerWidth+2 || pr.left<-2)) continue;
      const sec=el.closest('section');
      const key=(sec?sec.id||sec.getAttribute('data-screen-label'):'-')+'|'+el.tagName+'|'+Math.round(r.width);
      if (seen.has(key)) continue; seen.add(key);
      out.push({sec:sec?(sec.id||sec.getAttribute('data-screen-label')):'-',tag:el.tagName+(el.id?'#'+el.id:''),
        w:Math.round(r.width),l:Math.round(r.left),rr:Math.round(r.right),
        cls:(el.getAttribute('style')||'').slice(0,110),
        txt:(el.textContent||'').trim().slice(0,25)});
      if(out.length>14) break;
    }
  }
}
return JSON.stringify({vw:innerWidth,sw:doc.scrollWidth,over:doc.scrollWidth>innerWidth+1,docH:document.body.scrollHeight,culprits:out},null,1);
