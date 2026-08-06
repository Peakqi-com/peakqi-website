// Allen 美術模組產生器 ── 冪等,跑幾次結果都一樣
//   node tools/gen-allen-art.mjs
//
// 輸入:assets/svg/robot_action_pose_sheet_exact.svg
//       (Recraft 產的機器人向量原稿 + 五個姿勢的分解圖;五張姿勢各自內嵌了一份完全
//        相同的原稿,所以只取第一份就夠)
// 輸出:allen-art.js
//
// 這支做的三件事:
//   1. 從姿勢表裡把原稿那 194 條路徑挖出來(去掉重複的四份、去掉 C2PA metadata)
//   2. 依 PARTS 把每條路徑歸到九個剛體 + 臉部零件,包成 <g data-p="…">
//   3. 座標收到小數一位、色值換成色票代號(換配色才不必動路徑)
//
// 為什麼要有這支:美術如果重出一版原稿,把新檔放回 assets/svg/ 再跑一次就好,
// 不必有人手工搬 194 條路徑。PARTS 的索引則是照著原稿分解圖的九塊裁切框對出來的,
// 換原稿時要重新核對(核對方法:把每個部位塗不同顏色 render 一次,看有沒有零件跑錯家)。

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets/svg/robot_action_pose_sheet_exact.svg');
const OUT = path.join(ROOT, 'allen-art.js');

// ---- 部位歸屬:路徑索引照原稿的文件順序(0 起算) ----------------------------
const PARTS = {
  antenna: [181, 182, 183, 184],
  head: [39, 40, 44, 45, 46, 47, 48, 49, 50, 53, 55, 56, 57, 58, 59],
  'eye-l': [41, 42], 'pupil-l': [43],
  'eye-r': [51, 52], 'pupil-r': [54],
  mouth: [60],
  neck: [31, 32, 33, 34, 37, 38],
  torso: [1, 2, 3, 4, 5, 6, 7, 8, 35, 36],
  'arm-l': [15, 16, 17, 18, 19, 20, 21, 22, 23,
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
    136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156,
    188, 189, 91, 92, 93, 94, 95],
  'arm-r': [9, 10, 11, 12, 13, 14,
    124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135,
    157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169,
    174, 175, 176, 177, 178, 179, 180, 185, 186, 187, 190, 191, 192, 193,
    81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
  'leg-l': [24, 25, 26, 104, 105, 106, 107, 96, 99, 101, 102, 103],
  'leg-r': [27, 28, 29, 30, 108, 109, 110, 111, 170, 171, 172, 173],
  'foot-l': [72, 73, 74, 75, 76, 77, 78, 79, 80, 97, 98, 100],
  'foot-r': [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71],
};

// 第 0 條是「主墨線剪影」:一條路徑同時畫了軀幹、兩邊肩膀與髖部。它只有一個子路徑,
// 拆不開,所以每個會動的部位各拿一份被裁切過的複本,五份一起躺在所有色塊底下。
const INK = 0;
const INK_CLIP = {
  'arm-l': [0, 0, 700, 2304],
  'arm-r': [1098, 0, 694, 2304],
  torso: [700, 0, 398, 1338],
  'leg-l': [700, 1338, 198, 966],
  'leg-r': [898, 1338, 200, 966],
};

// 由後往前的疊圖順序。這一組能還原原稿的疊法(用 pixel diff 驗過)。
const ORDER = ['leg-l', 'leg-r', 'foot-l', 'foot-r', 'arm-l', 'arm-r', 'torso', 'neck', 'head'];

const SRC_COLORS = ['#D24245', '#A32526', '#4B1315', '#280B0D', '#B73438',
  '#0564B4', '#035096', '#081E3E', '#040E1C',
  '#1D131A', '#020202', 'white', '#C9C4C2', '#898988'];
const KEY = Object.fromEntries(SRC_COLORS.map((c, i) => [c, 'c' + i]));

// ---- 讀原稿 -----------------------------------------------------------------
const sheet = fs.readFileSync(SRC, 'utf8');
const embedded = sheet.match(/href="data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)"/);
if (!embedded) throw new Error('姿勢表裡找不到內嵌的原稿 SVG');
const pose = Buffer.from(embedded[1], 'base64').toString('utf8');
const open = pose.indexOf('<g id="robot-source">');
const close = pose.indexOf('</g>', open);
if (open < 0 || close < 0) throw new Error('原稿裡找不到 <g id="robot-source">');
const source = pose.slice(open, close + 4);

const paths = [...source.matchAll(/<path fill="([^"]+)" d="([^"]+)"\/>/g)]
  .map((m) => ({ fill: m[1], d: m[2] }));
if (paths.length !== 194) throw new Error(`原稿路徑數變了(${paths.length},預期 194)—— PARTS 的索引必須重新核對`);
for (const p of paths) if (!KEY[p.fill]) throw new Error('原稿出現新色值:' + p.fill);

// 歸屬檢查:一條都不能漏、一條都不能重複歸兩家
const seen = new Map();
for (const [part, list] of Object.entries(PARTS)) {
  for (const i of list) {
    if (seen.has(i)) throw new Error(`路徑 ${i} 同時被歸給 ${seen.get(i)} 與 ${part}`);
    seen.set(i, part);
  }
}
const missing = paths.map((_, i) => i).filter((i) => i !== INK && !seen.has(i));
if (missing.length) throw new Error('這些路徑沒有歸屬:' + missing.join(','));

// ---- 精度:1792 寬的畫布上,0.1 單位 ≈ 顯示 0.02px,肉眼看不見,檔案省下五分之一 ----
const rnd = (d) => d.replace(/-?\d+(?:\.\d+)?/g, (n) => {
  let s = String(Math.round(parseFloat(n) * 10) / 10);
  if (s.startsWith('0.')) s = s.slice(1);
  else if (s.startsWith('-0.')) s = '-' + s.slice(2);
  return s;
});

const paint = (list) => list
  .map((i) => `<path fill="\${C.${KEY[paths[i].fill]}}" d="${rnd(paths[i].d)}"/>`).join('');
const inkOf = (name) =>
  `<path fill="\${C.c9}" clip-path="url(#k${name}\${u})" d="${rnd(paths[INK].d)}"/>`;

// ---- 產出 -------------------------------------------------------------------
const out = [];
out.push(`// Allen 的美術素材:Recraft 生成的機器人向量原稿 + 原稿附的分解圖(九塊剛體)。
//
// 這個檔是產生出來的,不要手改:\`node tools/gen-allen-art.mjs\`。
// 來源 assets/svg/robot_action_pose_sheet_exact.svg,部位歸屬寫在那支產生器裡。
//
// 這一份只有「長什麼樣」與「關節在哪」,沒有任何動態邏輯 —— 動態全在 allen-bot.js。
// 194 條路徑逐條歸位到九個部位;座標保留原稿的 0 0 1792 2304,精度收到小數一位。
//
// 分解圖裡的第 0 條是「主墨線剪影」:一條路徑同時畫了軀幹、兩邊肩膀與髖部,無法拆
// 成子路徑,所以每個會動的部位各拿一份被裁切過的複本。原稿那份分解圖用 clipPath 就是
// 這個原因,這裡照著做,只是把它從 <use> 換成各部位自帶,少掉九次整隻機器人的重繪。
//
// 臉部另外拆出來:眼白 / 瞳孔 / 嘴,才能眨眼、追視線、換表情。

export const VIEWBOX = '0 0 1792 2304';

// 原稿配色(紅藍)。brand 是站上的橘藍 —— 換成 'brand' 即可,不動任何路徑。
const ORIGINAL = {`);
for (const c of SRC_COLORS) out.push(`  ${KEY[c]}: '${c}',`);
out.push(`};
const BRAND = {
  ...ORIGINAL,
  c0: '#FF6B2C', c1: '#C94E19', c2: '#7A2E0C', c3: '#4A1A06', c4: '#E0561F',
  c5: '#2E86D4', c6: '#0564B4', c7: '#08325C', c8: '#061C33',
};
export const PALETTES = { original: ORIGINAL, brand: BRAND };

// 關節錨點(原稿座標)。RIG 只從這裡讀,程式各處不再出現裸數字。
export const J = {
  neck:      [896, 662],
  antenna:   [896, 178],
  torso:     [896, 1290],
  shoulderL: [690, 805], shoulderR: [1105, 805],
  hipL:      [805, 1360], hipR:      [985, 1360],
  ankleL:    [772, 1962], ankleR:    [1024, 1962],
  eyeL:      [795, 405], eyeR:      [1000, 405], lensR: 103,
  pupilL:    [795, 411], pupilR:    [997, 411],
  mouth:     [896, 558],
  shadow:    [896, 2238], shadowRx: 430,
  bounds:    [438, 65, 1358, 2232],
};

// 嘴形。原稿那張嘴(m-rest)是填充的實心弧,靜止時就用它 —— 換表情才切到
// 描邊 / 張嘴,所以「不做表情的 Allen」和原稿逐像素相同。
export const MOUTH = {
  rest:  { rest: 1 },
  flat:  { line: 'M858,558 L934,558' },
  worry: { line: 'M858,572 Q896,544 934,572' },
  small: { line: 'M876,559 L916,559' },
  open:  { open: 'M846,540 Q896,528 946,540 Q942,604 896,604 Q850,604 846,540 Z' },
  laugh: { open: 'M840,536 Q896,522 952,536 Q948,610 896,610 Q844,610 840,536 Z',
           teeth: 'M848,541 Q896,530 944,541 L941,556 Q896,547 851,556 Z',
           tongue: 'M870,583 Q896,568 922,583 Q917,606 896,606 Q875,606 870,583 Z' },
  o:     { open: 'M896,530 C915,530 926,544 926,562 C926,581 915,594 896,594'
                + ' C877,594 866,581 866,562 C866,544 877,530 896,530 Z' },
};

/** 產生一隻 Allen 的 SVG 標記。uid 讓 clipPath 的 id 在同頁多隻時不互相蓋掉。 */
export function allenArt(uid, { palette = 'original', shadow = true } = {}) {
  const C = PALETTES[palette] || ORIGINAL;
  const u = uid;
  return \`
<svg viewBox="\${VIEWBOX}" aria-hidden="true" style="display:block;width:100%;height:100%;overflow:visible">
  <defs>`);
for (const [name, [x, y, w, h]] of Object.entries(INK_CLIP)) {
  out.push(`    <clipPath id="k${name}\${u}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`);
}
out.push(`  </defs>

  <ellipse data-p="shadow" cx="\${J.shadow[0]}" cy="\${J.shadow[1]}" rx="\${J.shadowRx}" ry="54" fill="\${C.c9}" opacity="\${shadow ? '.22' : '0'}"/>

  <!-- 主墨線剪影自成一層,永遠在所有色塊底下 —— 原稿就是這個疊法。每一份跟著
       自己的部位動,所以 RIG 設 transform 時要一起設到 ink-<部位>。 -->
  <g data-p="body">
  <g data-p="ink">`);
for (const name of Object.keys(INK_CLIP)) out.push(`    <g data-p="ink-${name}">${inkOf(name)}</g>`);
out.push('  </g>');
for (const name of ORDER) {
  if (name !== 'head') { out.push(`  <g data-p="${name}">${paint(PARTS[name])}</g>`); continue; }
  out.push('');
  out.push(`  <g data-p="head">${paint(PARTS.head)}`);
  out.push(`    <g data-p="eye-l">${paint(PARTS['eye-l'])}<g data-p="pupil-l">${paint(PARTS['pupil-l'])}</g></g>`);
  out.push(`    <g data-p="eye-r">${paint(PARTS['eye-r'])}<g data-p="pupil-r">${paint(PARTS['pupil-r'])}</g></g>`);
  out.push('    <g data-p="mouth">');
  out.push(`      <path data-p="m-rest" fill="\${C.c9}" d="${rnd(paths[60].d)}"/>`);
  out.push('      <path data-p="m-open" fill="${C.c9}" opacity="0" d="${MOUTH.open.open}"/>');
  out.push('      <path data-p="m-teeth" fill="${C.c11}" opacity="0" d="${MOUTH.laugh.teeth}"/>');
  out.push('      <path data-p="m-tongue" fill="${C.c2}" opacity="0" d="${MOUTH.laugh.tongue}"/>');
  out.push('      <path data-p="m-line" fill="none" opacity="0" stroke="${C.c9}" stroke-width="13" stroke-linecap="round" d="${MOUTH.flat.line}"/>');
  out.push('    </g>');
  out.push(`    <g data-p="antenna">${paint(PARTS.antenna)}</g>`);
  out.push('  </g>');
}
out.push(`  </g>
</svg>\`;
}
`);

const src = out.join('\n');
fs.writeFileSync(OUT, src);
const bytes = Buffer.byteLength(src);
console.log(`allen-art.js  ${bytes} bytes  (gzip ${zlib.gzipSync(src).length})  ${paths.length} 條路徑`);
