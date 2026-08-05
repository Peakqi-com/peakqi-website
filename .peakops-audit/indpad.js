const s = document.querySelector('#a-ind-strip');
s.scrollIntoView({ block: 'center' });
await new Promise((r) => setTimeout(r, 600));
const cs = getComputedStyle(s);
const c0 = s.querySelector('.pq-ind');
return JSON.stringify({
  padL: cs.paddingLeft, padR: cs.paddingRight, display: cs.display,
  stripX: Math.round(s.getBoundingClientRect().left),
  card0X: Math.round(c0.getBoundingClientRect().left),
  scrollLeft: s.scrollLeft, cardW: Math.round(c0.getBoundingClientRect().width),
  metaH: Math.round(s.querySelector('.pq-ind-meta').getBoundingClientRect().height)
});
