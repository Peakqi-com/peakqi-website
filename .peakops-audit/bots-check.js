await new Promise(r=>setTimeout(r,2500));
const team=document.getElementById('a-team');
if(!team) return JSON.stringify({err:'no a-team'});
team.scrollIntoView();
await new Promise(r=>setTimeout(r,1200));
const bots=[...document.querySelectorAll('.pq-bot')];
const eye=document.querySelector('.pq-bot1 .b-eye');
const anims=bots.map(b=>{
  const head=b.querySelector('.b-head');
  return head?getComputedStyle(head).animationName:'none';
});
// 眼鏡驗證:bot1/bot2 有鏡框(stroke 圓/方),bot3 沒有
const b1glass=document.querySelectorAll('.pq-bot1 circle[stroke="#F2EFE8"]').length;
const b2glass=document.querySelectorAll('.pq-bot2 rect[stroke="#F2EFE8"]').length;
const b3glass=document.querySelectorAll('.pq-bot3 [stroke="#F2EFE8"][fill="none"]').length;
const doc=document.documentElement;
return JSON.stringify({bobAnims:anims,
  blink:eye?getComputedStyle(eye).animationName:'no-eye',
  glasses:{jacky:b1glass,allen:b2glass,tz:b3glass},
  cursor:getComputedStyle(document.querySelector('.pq-bot3 .b-cur')).animationName,
  overflowX:doc.scrollWidth-doc.clientWidth});
