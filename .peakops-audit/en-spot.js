// en-spot(Phase 1)i18n 快速自測:不開 /en/(靜態雙路徑尚未產出英文頁,直開會 404)。
// 驗證三件事:1) /i18n.js 可載入且 t 存在;2) 中文站 t(zh,en) 回傳 zh(零迴歸前提);
// 3) hero-scenes.js 掛上 i18n 後仍可載入、六個 painter 齊全。EN 視覺驗證屬 Phase 2。
const m = await import('/i18n.js');
const hs = await import('/hero-scenes.js');
const painters = Object.keys(hs.painters || {});
const out = {
  tExists: typeof m.t === 'function',
  lang: m.LANG,
  zhRoundtrip: m.t('中文', 'english'),          // 中文站必須回 '中文'
  enWouldBe: m.LANG === 'zh' ? '(en path not loaded — expected)' : m.t('中文', 'english'),
  painters,
  ok: typeof m.t === 'function' && m.LANG === 'zh' && m.t('中文', 'english') === '中文' && painters.length === 6
};
return JSON.stringify(out);
