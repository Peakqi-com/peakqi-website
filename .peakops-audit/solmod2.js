await new Promise(r => setTimeout(r, 1500));
const mod = document.querySelector('#modules');
mod.scrollIntoView(); await new Promise(r => setTimeout(r, 800));
const dets = Array.from(document.querySelectorAll('#modules [data-sdet]'));
const rows = document.querySelectorAll('#modules [data-smod]');
const listBox = rows[0].parentElement;
const de = document.scrollingElement || document.documentElement;
const vis = dets.filter(d => d.offsetHeight > 40).length;
const order = dets.map(d => Math.round(d.getBoundingClientRect().y));
return JSON.stringify({ vw: innerWidth, visibleDets: vis, order,
  ascending: order.every((y, i) => !i || y > order[i - 1]),
  listNoPointer: getComputedStyle(listBox).pointerEvents === 'none',
  overflowX: de.scrollWidth - de.clientWidth }, null, 1);
