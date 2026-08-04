await new Promise(r => setTimeout(r, 1200));
const b = document.getElementById('pq-burger');
if (b) b.click();
await new Promise(r => setTimeout(r, 700));
const items = Array.from(document.querySelectorAll('[role="dialog"] nav > *')).map(el =>
  (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 22));
return JSON.stringify({ count: items.length, items });
