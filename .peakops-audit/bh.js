await new Promise(r => setTimeout(r, 2500));
scrollTo(0, 0);
await new Promise(r => setTimeout(r, 1500));
const h = document.getElementById('secHead');
return JSON.stringify({ display: h ? getComputedStyle(h).display : 'missing',
  text: h ? (h.textContent || '').trim() : '' });
