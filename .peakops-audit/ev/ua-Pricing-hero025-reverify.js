await new Promise(r=>setTimeout(r,3500));
const F=0.25;
const wrap=document.querySelector('[data-hero-wrap]');
const top=wrap?wrap.getBoundingClientRect().top+scrollY:0;
const end=wrap?Math.max(wrap.offsetHeight-innerHeight,innerHeight):Math.min(3000,document.documentElement.scrollHeight*0.25);
for(let i=1;i<=16;i++){scrollTo(0,top+end*F*i/16);await new Promise(r=>requestAnimationFrame(r));}
// settle 1500ms(>1200ms)排除過場瞬間
await new Promise(r=>setTimeout(r,1500));
// 從 hero canvas 讀像素:找第三張卡(藍色)右邊框垂直線,再檢查其右側是否有藍色晶片像素
const cv=document.querySelector('[data-hero-stage] canvas')||document.querySelector('canvas');
let info='no-canvas';
if(cv){
  const oc=document.createElement('canvas');oc.width=cv.width;oc.height=cv.height;
  const g=oc.getContext('2d');g.drawImage(cv,0,0);
  const im=g.getImageData(0,0,oc.width,oc.height).data;
  const W=oc.width,H=oc.height;
  const isBlue=(x,y)=>{const i=(y*W+x)*4;const r=im[i],gg=im[i+1],b=im[i+2];return b>90&&b>r+30&&b>gg+20;};
  // 逐欄計數藍色像素;長垂直藍線 = 卡片左/右邊框(晶片邊僅 ~20px 高,不會過門檻)
  const colCnt=new Array(W).fill(0);
  for(let x=Math.floor(W*0.4);x<W;x++){let c=0;for(let y=0;y<H;y++)if(isBlue(x,y))c++;colCnt[x]=c;}
  const best=Math.max(...colCnt);
  let borderX=-1;
  for(let x=W-1;x>=0;x--){if(colCnt[x]>=best*0.6&&colCnt[x]>H*0.04){borderX=x;break;}} // 最右側的長藍線=第三卡右邊框
  // 邊框右側(+3px 起)是否還有藍色像素(晶片戳出);逐列記錄最大突出量
  let overMax=0,overRows=[];
  for(let y=0;y<H;y++){
    let rowMax=0;
    for(let x=borderX+3;x<Math.min(W,borderX+40);x++)if(isBlue(x,y))rowMax=x-borderX;
    if(rowMax>0){if(rowMax>overMax)overMax=rowMax;if(overRows.length<15)overRows.push(y+':'+rowMax);}
  }
  info=JSON.stringify({W,H,best,borderX,overhangPx:overMax,rows:overRows});
}
return 'y='+scrollY+' | '+info;
