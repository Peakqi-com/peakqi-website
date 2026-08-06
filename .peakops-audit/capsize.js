await new Promise((r)=>setTimeout(r,2200));
const st=document.querySelector('#capture [data-stage]');
const inner=st.firstElementChild;
const rows=[...inner.children].map(el=>({
  tag: el.tagName.toLowerCase()+(el.id?('#'+el.id):''),
  h: Math.round(el.getBoundingClientRect().height),
  mt: getComputedStyle(el).marginTop
}));
const cs=getComputedStyle(st);
const grid=document.querySelector('#pq-cap-grid');
const chat=grid.firstElementChild, right=grid.children[1];
const chatKids=[...chat.children].map(el=>({h:Math.round(el.getBoundingClientRect().height),minH:getComputedStyle(el).minHeight}));
return JSON.stringify({
  vh: innerHeight, avail: innerHeight-68,
  stageH: Math.round(st.getBoundingClientRect().height),
  padTop: cs.paddingTop, padBottom: cs.paddingBottom,
  rows,
  gridH: Math.round(grid.getBoundingClientRect().height),
  chatH: Math.round(chat.getBoundingClientRect().height), rightH: Math.round(right.getBoundingClientRect().height),
  chatKids,
  h2Font: getComputedStyle(inner.querySelector('h2')).fontSize
});
