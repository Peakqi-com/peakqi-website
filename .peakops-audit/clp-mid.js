scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
const wrap = document.querySelector('[data-hero-wrap]');
const base = Math.round(wrap.getBoundingClientRect().top + scrollY);
scrollTo(0, base + 40);
await new Promise(r => setTimeout(r, 260));
return 'mid y=' + scrollY + ' base=' + base;
