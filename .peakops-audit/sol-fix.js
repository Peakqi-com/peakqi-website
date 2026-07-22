await new Promise(r=>setTimeout(r,2200));
// 1) 接客區:左右欄是否超出 section / 視窗
const cap=document.getElementById('capture');
const grid=document.getElementById('pq-cap-grid');
const rg=grid.getBoundingClientRect(), rc=cap.getBoundingClientRect();
// 2) 追客:王小姐卡(data-fcard)是否壓到第一欄的標題
const card=document.querySelector('[data-fcard]');
const col=document.querySelector('[data-fcol]');
let overlap=null;
if(card&&col){
  const rcard=card.getBoundingClientRect();
  const lbl=col.querySelector('span');
  const rlbl=lbl.getBoundingClientRect();
  overlap=Math.round(rcard.bottom-rlbl.top);
}
return JSON.stringify({vw:innerWidth,
  capGridBottomVsSection:Math.round(rg.bottom-rc.bottom),
  gridOverflowX:rg.right>innerWidth+1?'OVER':'ok',
  fcardOverLabel:overlap,
  overflowX:document.documentElement.scrollWidth>innerWidth+1?'OVERFLOW':'ok'});
