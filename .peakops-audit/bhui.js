// 3D 導覽引導層驗收:章節讀取、進度更新、Skip、Overview 清單
await new Promise(r=>setTimeout(r,3000));
const ui=document.getElementById('pq-bh-ui');
const run=document.getElementById('pq-bh-runway');
if(!ui||!run) return JSON.stringify({err:'no ui/runway'});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const q=(s)=>ui.querySelector(s);
const top=run.getBoundingClientRect().top+scrollY, total=run.offsetHeight-innerHeight;
const at=async(p)=>{scrollTo(0,Math.round(top+p*total)); await sleep(900);
  return {p, idx:q('.bh-i').textContent, n:q('.bh-n').textContent, nm:q('.bh-nm').textContent.slice(0,18),
    bar:q('.bh-bar u').style.width, hudOn:ui.classList.contains('is-go')};};
const rows=[];
rows.push(await at(0.0));
for(const p of [0.05,0.2,0.4,0.6,0.8,0.97]) rows.push(await at(p));
// Overview 清單
q('.bh-ov').click(); await sleep(300);
const listOpen=!q('.bh-list').hidden, items=ui.querySelectorAll('.bh-list button').length;
const names=[...ui.querySelectorAll('.bh-list button span')].map(x=>x.textContent.slice(0,14));
q('.bh-ov').click(); await sleep(200);
// Skip
const before=scrollY; q('.bh-skip').click(); await sleep(1400);
const after=scrollY;
return JSON.stringify({章數:q('.bh-n').textContent, 清單項目:items, 清單開得起來:listOpen,
  章名:names, 進度取樣:rows, Skip前:Math.round(before), Skip後:Math.round(after),
  Skip有效:after>before+total*0.5, overflow:document.scrollingElement.scrollWidth-innerWidth});
