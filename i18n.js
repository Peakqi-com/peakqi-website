// i18n 底座(Phase 0)──中英雙版網站的共用地基
// 架構:雙路徑靜態雙版。中文=現有路徑;英文=同構的 /en/ 前綴(每頁一個實體英文頁,SEO 完整)。
// 語言判定只看網址,不自動跳轉(Accept-Language 自動跳轉對 SEO 有害);偏好記在 localStorage 供切換鈕顯示提示用。
//
// 引擎/canvas 取字介面:t('中文', 'English')──Phase 1 逐引擎把寫死的中文改包 t()。
// 頁面 markup 不走 t():英文頁是獨立檔案,直接寫英文(版型可各自微調,不受字典鉗制)。
export const LANG = /^\/en(\/|$)/i.test(location.pathname) ? 'en' : 'zh';
export const t = (zh, en) => (LANG === 'en' ? en : zh);

// 已上線英文版的頁面(中文 clean path)。Phase 2 每完成一頁加一筆,
// 語言切換鈕只在「對應英文版存在」的頁面現身──不會把使用者切去 404。
export const EN_READY = ['/', '/about', '/solutions', '/method'];

// 路徑正規化:本機 /About.dc.html 與正式 /about 都收斂成 clean path
const norm = (p) => {
  let q = p.replace(/\.dc\.html$/i, '').toLowerCase();
  if (q.endsWith('/home')) q = q.slice(0, -5);
  if (q === '' || q === '/en') q = q + '/';
  return q || '/';
};
export function zhPath() {
  const p = norm(location.pathname);
  return LANG === 'en' ? (p.replace(/^\/en/, '') || '/') : p;
}
// 目前頁的「另一語言」網址(切換鈕 href)
export function altUrl() {
  const zh = zhPath();
  const qs = location.search || '';
  return (LANG === 'en' ? zh : (zh === '/' ? '/en/' : '/en' + zh)) + qs;
}
export function hasEn() { return LANG === 'en' || EN_READY.indexOf(zhPath()) >= 0; }

try { document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-Hant-TW'; } catch (e) {}
try { localStorage.setItem('pqLang', LANG); } catch (e) {}
