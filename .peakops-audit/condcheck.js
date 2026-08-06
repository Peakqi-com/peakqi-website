// 天象系統驗收:八種都畫得出來、都不同、標籤有更新、完成觀測會換一種
await new Promise(r=>setTimeout(r,2600));
const S=window.__pqSky; if(!S||!S.conds) return JSON.stringify({err:'no cond hook'});
const cv=document.querySelector('[data-blog-sky] canvas'); const g=cv.getContext('2d');
const label=()=>{const el=document.querySelector('[data-sky-cond]');return el?el.textContent.trim():null};
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const sig=()=>{const d=g.getImageData(0,0,cv.width,cv.height).data;
  let r=0,gg=0,b=0,n=0; for(let i=0;i<d.length;i+=200){r+=d[i];gg+=d[i+1];b+=d[i+2];n++;}
  return [Math.round(r/n),Math.round(gg/n),Math.round(b/n)];};
S.hush();
const list=S.conds(); const rows=[];
for(let i=0;i<list.length;i++){
  S.setCond(i); await sleep(3400);            // 等淡入 + 天體類先跑一趟
  rows.push({i, id:list[i], 標籤:label(), 色簽:sig()});
}
// 完成一次觀測是否換天象
S.setCond(0); await sleep(600);
const before=S.cond();
const r=cv.getBoundingClientRect();
const pts=[[0.62,0.22],[0.70,0.34],[0.78,0.24],[0.86,0.40],[0.72,0.52],[0.60,0.42]];
for(const [px,py] of pts){const o={clientX:r.left+r.width*px,clientY:r.top+r.height*py,bubbles:true,pointerId:3,isPrimary:true};
  cv.dispatchEvent(new PointerEvent('pointerdown',o));cv.dispatchEvent(new PointerEvent('pointerup',o));await sleep(220);}
await sleep(4200);                            // 等完成序列跑完並歸檔
const after=S.cond();
const uniq=new Set(rows.map(r=>r.色簽.join(','))).size;
return JSON.stringify({天象數:list.length, 各自不同的色簽:uniq, 明細:rows,
  完成觀測前:before, 完成觀測後:after, 有換天象:before!==after,
  overflow:document.scrollingElement.scrollWidth-innerWidth});
