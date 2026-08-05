// en-cases-probe.js — case-media.js t(zh,en) 化驗收探針
// 檢查:①zh/en 兩投影結構一致 ②en 投影可見欄位零 CJK ③名稱英譯與 content.js 既有 t() 英譯逐字一致
// 用法:node .peakops-audit/en-cases-probe.js(在 repo 根目錄)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function evalModule(file, mode) {
  let src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  src = src.replace("import { t } from './i18n.js';", mode === 'zh' ? 'const t=(zh,en)=>zh;' : 'const t=(zh,en)=>en;');
  src = src.replace(/export const /g, 'var ');
  src += ';({ F: FEATURED_MEDIA, W: WORKS_MEDIA, C: CAPABILITIES_NO_MEDIA })';
  return eval(src);
}
const CJK = /[　-〿㐀-鿿豈-﫿＀-￯]/;
const zh = evalModule('case-media.js', 'zh');
const en = evalModule('case-media.js', 'en');
let fail = 0;
const bad = (msg) => { fail++; console.log('FAIL:', msg); };

// ① 結構一致(slug/圖檔/尺寸不因語言而變)
const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (['name', 'industry', 'type', 'd', 'alt'].includes(k) ? undefined : v)));
if (JSON.stringify(strip(zh)) !== JSON.stringify(strip(en))) bad('zh/en 非文字欄位不一致(slug/src/w/h 應與語言無關)');

// ② en 投影可見欄位零 CJK
const walk = (o, p) => {
  if (typeof o === 'string') { if (CJK.test(o)) bad('EN 投影含 CJK @ ' + p + ' = ' + o); return; }
  if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => walk(v, p + '.' + k));
};
[...en.F, ...en.W, ...en.C].forEach((x, i) => ['name', 'industry', 'type', 'd'].forEach(k => x[k] && walk(x[k], 'item' + i + '.' + k)));
[...en.F, ...en.W].forEach((x, i) => { walk(x.cover.alt, 'item' + i + '.cover.alt'); (x.gallery || []).forEach((g, j) => walk(g.alt, 'item' + i + '.g' + j + '.alt')); });

// ③ 名稱英譯與 content.js 逐字一致:抽 content.js 全部 t('zh','en') 對照表
const content = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
const dict = {};
const re = /t\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g;
let m; while ((m = re.exec(content))) { if (!(m[1] in dict)) dict[m[1]] = m[2]; }
const pairs = [];
[...zh.F, ...zh.W].forEach((x, i) => pairs.push(['name', x.name, [...en.F, ...en.W][i].name]));
zh.C.forEach((x, i) => pairs.push(['cap.name', x.name, en.C[i].name]));
pairs.forEach(([k, zhV, enV]) => {
  if (dict[zhV] !== undefined && dict[zhV] !== enV) bad(k + ' 「' + zhV + '」英譯 "' + enV + '" ≠ content.js "' + dict[zhV] + '"');
});

console.log(fail === 0 ? 'PROBE PASS: F=' + zh.F.length + ' W=' + zh.W.length + ' C=' + zh.C.length + ',en 零 CJK,名稱英譯與 content.js 一致' : ('PROBE FAIL x' + fail));
process.exit(fail === 0 ? 0 : 1);
