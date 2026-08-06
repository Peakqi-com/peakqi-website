await new Promise((r)=>setTimeout(r,2600));
const sec=document.querySelector('#capture');
const w=sec.querySelector('[data-wrap]'), st=sec.querySelector('[data-stage]');
const pinned=getComputedStyle(st).position==='sticky';
const top=w.getBoundingClientRect().top+scrollY, span=Math.max(1,w.offsetHeight-innerHeight);
scrollTo(0, Math.round(top+(pinned?0.5:0.35)*span)); await new Promise((r)=>setTimeout(r,1100));
const g=document.querySelector('#pq-cap-grid'), L=g.firstElementChild, R=g.children[1];
const cut=(el)=>el.scrollHeight-el.clientHeight;
return JSON.stringify({vh:innerHeight, pinned, capfit:sec.hasAttribute('data-capfit'),
 leftCut:cut(L), rightCut:cut(R),
 leftBottomOver:Math.round(L.getBoundingClientRect().bottom-innerHeight),
 rightBottomOver:Math.round(R.getBoundingClientRect().bottom-innerHeight),
 pageOverflow: document.scrollingElement.scrollWidth-innerWidth});
