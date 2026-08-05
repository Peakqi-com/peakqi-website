// PeakOps hero:捲到跑道內指定進度(跑道 = 360vh 的 heroWrap = #chaos 內第一個 relative 高容器)
const hp = parseFloat(new URLSearchParams(location.search).get('hp') || '0');
const wrap = Array.from(document.querySelectorAll('div')).find(d => (d.getAttribute('style') || '').replace(/\s/g, '').includes('height:360vh'));
if (!wrap) return JSON.stringify({ fatal: 'no wrap' });
const vh = window.innerHeight || 1;
const absTop = wrap.getBoundingClientRect().top + window.scrollY;
window.scrollTo(0, Math.round(absTop + hp * Math.max(1, wrap.offsetHeight - vh)));
await new Promise(r => setTimeout(r, 1300));
for (let i = 0; i < 50; i++) await new Promise(r => requestAnimationFrame(r));
return JSON.stringify({ hp, y: window.scrollY }, null, 1);
