// 接案頁互動驗收:點兩個模組 → 報價籃是否更新、送出連結是否帶上 ?need=、清空是否歸零
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const rows = () => Array.from(document.querySelectorAll('.s-row'));
const out = { rows: rows().length };
const r0 = rows()[0], r5 = rows()[5];
if (!r0 || !r5) return JSON.stringify({ fatal: 'no rows' });
r0.click(); await wait(220);
r5.click(); await wait(220);
out.pressed = rows().filter(b => b.getAttribute('aria-pressed') === 'true').length;
out.marks = rows().filter(b => (b.querySelector('.s-mark') || {}).textContent === '✓').length;
out.basketLines = document.querySelectorAll('.s-bline').length;
out.basketNames = Array.from(document.querySelectorAll('.s-bname')).map(e => e.textContent.trim());
const send = document.querySelector('a[data-track="studio_basket_send"]');
out.sendHref = send ? decodeURIComponent(send.getAttribute('href')) : null;
out.count = (document.querySelector('#s-basket span[style*="FF6B2C"]') || {}).textContent || null;
const clear = Array.from(document.querySelectorAll('#s-basket button')).pop();
if (clear) { clear.click(); await wait(220); }
out.afterClear = { pressed: rows().filter(b => b.getAttribute('aria-pressed') === 'true').length, lines: document.querySelectorAll('.s-bline').length };
// 清空後版面不可爆版(重繪路徑也要驗)
const de = document.scrollingElement || document.documentElement;
out.overflowX = de.scrollWidth - de.clientWidth;
return JSON.stringify(out, null, 1);
