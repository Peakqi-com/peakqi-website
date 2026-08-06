await new Promise((r)=>setTimeout(r,2000));
const w=document.querySelector('#capture [data-wrap]');
const top=w.getBoundingClientRect().top+scrollY, span=Math.max(1,w.offsetHeight-innerHeight);
scrollTo(0, Math.round(top+0.5*span)); await new Promise((r)=>setTimeout(r,1000));
const g=document.querySelector('#pq-cap-grid'), L=g.firstElementChild, R=g.children[1];
const inner=(el)=>({h:Math.round(el.getBoundingClientRect().height), scrollH:el.scrollHeight, cut:el.scrollHeight-el.clientHeight});
return JSON.stringify({vh:innerHeight, stageBottomOver:Math.round(document.querySelector('#capture [data-stage]').getBoundingClientRect().bottom-innerHeight),
 gridH:Math.round(g.getBoundingClientRect().height), left:inner(L), right:inner(R),
 leftBottomOver:Math.round(L.getBoundingClientRect().bottom-innerHeight), rightBottomOver:Math.round(R.getBoundingClientRect().bottom-innerHeight)});
