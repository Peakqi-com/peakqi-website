// direct-contact 區:複製 Email 按鈕點擊後 label 應變「已複製 Email ✓」
const sec = document.getElementById('direct-contact');
if (!sec) return JSON.stringify({ fatal: 'no #direct-contact' });
sec.scrollIntoView();
await new Promise(r => setTimeout(r, 700));
const btn = sec.querySelector('button');
const before = btn.textContent.trim();
btn.click();
await new Promise(r => setTimeout(r, 500));
const after = btn.textContent.trim();
const sr = sec.getBoundingClientRect();
const footer = document.querySelector('footer') || sec.nextElementSibling;
return JSON.stringify({
  before, after, changed: before !== after,
  secBg: getComputedStyle(sec).backgroundColor,
  secBottom: Math.round(sr.bottom + scrollY),
  isLastBeforeFooter: !!(sec.nextElementSibling && sec.nextElementSibling.tagName.indexOf('DC-') === 0 || document.querySelector('footer')),
  scrollW: document.documentElement.scrollWidth, innerW: innerWidth
}, null, 1);
