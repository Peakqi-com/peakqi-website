// 複驗:捲到 hero 進度 0.25,settle 1500ms 後量測 canvas 上 PROBLEM LIST 卡框線 vs 文字右緣
const wrap = document.querySelector('#m-hero [data-hero-wrap]');
const vh = innerHeight;
const top = wrap.getBoundingClientRect().top + scrollY;
const target = Math.round(top + 0.25 * Math.max(1, wrap.offsetHeight - vh));
scrollTo(0, target);
await new Promise(r=>setTimeout(r,1500));
for(let i=0;i<10;i++) await new Promise(r=>requestAnimationFrame(r));
const cv = document.querySelector('#m-hero [data-hero-canvas]');
const cr = cv.getBoundingClientRect();
const g2 = cv.getContext('2d');
const dpr = cv.width / cr.width;
// 掃描:找標題列(卡片標題那行)— 先找橘色框線最右直線,再找該列文字最右亮像素
const img = g2.getImageData(0, 0, cv.width, cv.height);
const D = img.data, W2 = cv.width, H2 = cv.height;
const isOrange = (r,g3,b,a)=> a>60 && r>140 && g3>40 && g3<140 && b<90 && r>g3+50;
const isText = (r,g3,b,a)=> a>60 && r>110 && g3>110 && b>105 && Math.abs(r-g3)<45;
// 找所有橘色近垂直邊線的 x(連續>=30px 的直線)
const colHits = new Array(W2).fill(0);
for(let x=0;x<W2;x++){
  for(let y=0;y<H2;y++){
    const i4=(y*W2+x)*4;
    if(isOrange(D[i4],D[i4+1],D[i4+2],D[i4+3])) colHits[x]++;
  }
}
const borders=[];
for(let x=0;x<W2;x++) if(colHits[x]>=30*dpr) borders.push(x);
// 對每個右側框線候選,量右邊 40px 內是否有文字像素
const out={y:scrollY, target, wrapTop:Math.round(top), wrapH:wrap.offsetHeight, vh, dpr, cw:W2, ch:H2, borders:borders.map(b=>Math.round(b/dpr))};
// 找每一列文字最右 x,回報超過最右框線的列
if(borders.length){
  const rb = borders[borders.length-1];
  const over=[];
  for(let y=0;y<H2;y++){
    let mx=-1;
    for(let x=W2-1;x>rb;x--){
      const i4=(y*W2+x)*4;
      if(isText(D[i4],D[i4+1],D[i4+2],D[i4+3])){mx=x;break;}
    }
    if(mx>rb+2*dpr) over.push([Math.round(y/dpr), Math.round(mx/dpr)]);
  }
  out.rightBorder=Math.round(rb/dpr);
  out.overflowRows=over.length;
  out.overSample=over.slice(0,6).concat(over.slice(-6));
}
return JSON.stringify(out);
