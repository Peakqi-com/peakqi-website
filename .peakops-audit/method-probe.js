await new Promise(r=>setTimeout(r,1500));
const secs=[...document.querySelectorAll('section[id],section[data-screen-label]')].map(s=>s.id||s.getAttribute('data-screen-label'));
const steps=document.querySelectorAll('#m-grid > div').length;
const tl=document.querySelectorAll('#m-tl > div').length;
const risks=[...document.querySelectorAll('#m-risk h3')].map(h=>h.textContent);
const navMethod=[...document.querySelectorAll('header a')].find(a=>a.textContent.trim()==='導入方法');
const footLinks=[...document.querySelectorAll('footer a')].map(a=>a.textContent.trim()).filter(Boolean);
return JSON.stringify({
  title:document.title, secs, steps, tl, risks,
  navMethodHref:navMethod?navMethod.getAttribute('href'):null,
  footLinks,
  overflowX:document.documentElement.scrollWidth>innerWidth+1?'OVERFLOW':'ok',
  docH:document.body.scrollHeight
},null,1);
