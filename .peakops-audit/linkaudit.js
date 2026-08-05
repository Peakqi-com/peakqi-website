// 連結語言稽核:EN 頁的站內連結必須都帶 /en 前綴;zh 頁不得有 /en。含手機選單(需開啟)。
await new Promise((r) => setTimeout(r, 2200));
const isEn = document.documentElement.lang === 'en';
const bad = [];
const seen = new Set();
const check = (a, where) => {
  const h = a.getAttribute('href') || '';
  if (!h || h.charAt(0) !== '/') return;            // 錨點/外部/mailto/tel 不管
  if (a.getAttribute('aria-label') === 'Switch language') return;   // 語言切換鈕本來就指向另一語言
  const key = where + h;
  if (seen.has(key)) return;
  seen.add(key);
  const enPrefixed = /^\/en(\/|$)/.test(h);
  if (isEn && !enPrefixed) bad.push({ where, href: h, text: (a.textContent || '').trim().slice(0, 24) });
  if (!isEn && enPrefixed) bad.push({ where, href: h, text: (a.textContent || '').trim().slice(0, 24) });
};
document.querySelectorAll('header a, nav a').forEach((a) => check(a, 'navbar'));
document.querySelectorAll('footer a').forEach((a) => check(a, 'footer'));
document.querySelectorAll('a').forEach((a) => check(a, 'page'));
// 開手機選單(sc-if:未開不存在)
const burger = document.querySelector('#pq-burger');
let menuN = 0;
if (burger) {
  burger.click();
  await new Promise((r) => setTimeout(r, 800));
  const dlg = document.querySelector('[role="dialog"]');
  if (dlg) {
    const grp = Array.from(dlg.querySelectorAll('button')).find((b) => /Products|產品/.test(b.textContent || ''));
    if (grp) { grp.click(); await new Promise((r) => setTimeout(r, 600)); }
    const as = dlg.querySelectorAll('a');
    menuN = as.length;
    as.forEach((a) => check(a, 'menu'));
  }
}
return JSON.stringify({ lang: document.documentElement.lang, menuLinks: menuN, badCount: bad.length, bad: bad.slice(0, 14) });
