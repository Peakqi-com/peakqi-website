// 浮動 LINE 列驗收:先捲到「過門檻且不在沉浸區塊」讓它出現,再捲進沉浸區塊看是否淡出,最後捲出來看是否淡回
await new Promise((r)=>setTimeout(r,2200));
const settle=(ms)=>new Promise(r=>setTimeout(r,ms));
const de=document.scrollingElement, H=Math.max(1,de.scrollHeight-innerHeight);
const op=()=>{const w=document.querySelector('[data-sticky-cta]');return w?+(+getComputedStyle(w).opacity).toFixed(2):null;};
const cover=()=>{let c=0;for(const e of document.querySelectorAll('[data-immersive]')){const r=e.getBoundingClientRect();c=Math.max(c,(Math.min(r.bottom,innerHeight)-Math.max(r.top,0))/innerHeight);}return +c.toFixed(2)};
// 掃描整頁,找出「有出現(op!=null)且 cover<0.2」與「cover>0.8」兩種取樣點
let shown=null, hidden=null;
for(let i=1;i<=20;i++){
  scrollTo(0,Math.round(H*i/20)); await settle(420);
  const c=cover(), o=op();
  if(c>=0.8 && o!==null && hidden===null) hidden={c,o};
  if(c<=0.2 && o!==null && o>0.5 && shown===null) shown={c,o};
}
const w=document.querySelector('[data-sticky-cta]');
const a=w&&w.querySelector('a'), b=w&&w.querySelector('button');
return JSON.stringify({
  immCount:document.querySelectorAll('[data-immersive]').length,
  非沉浸處顯示:shown, 沉浸處:hidden,
  pill:a?Math.round(a.getBoundingClientRect().height):null,
  close:b?[Math.round(b.getBoundingClientRect().width),Math.round(b.getBoundingClientRect().height)]:null,
  oneCapsule:!!(a&&b&&a.parentElement===b.parentElement),
  floatCount:document.querySelectorAll('[data-sticky-cta]').length,
  pageOverflow:de.scrollWidth-innerWidth
});
