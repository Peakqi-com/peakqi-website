// 「半完成畫面」量測(修正版)
//
// 上一版把「刻意待命」的字卡也算進去了 —— 那些是 opacity:0 + blur(5px) 的關閉態,
// 不是半完成。正確的定義是「可見、但卡在中間」:
//   A. 半透明文字:opacity 落在 0.12~0.88(看得到,但沒到位)
//   B. 糊掉的可見文字:opacity > 0.5 且 blur > 0.6px
//   C. 半開的遮罩/藍圖層:opacity 落在 0.12~0.88
// 每個取樣點都等 900ms —— 時間驅動的 CSS 轉場早結束了,還留在中間的一定是
// scrub 驅動(直接綁捲動進度),那才是「停在哪就卡在哪」的元凶。
await new Promise((r) => setTimeout(r, 3200));
const hero = document.getElementById('hero');
if (!hero) return JSON.stringify({ err: 'no #hero' });
const wrap = hero.querySelector('[data-wrap]') || hero;
const top = wrap.getBoundingClientRect().top + scrollY;
const span = Math.max(1, wrap.offsetHeight - innerHeight);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const op = (el) => +(+getComputedStyle(el).opacity).toFixed(3);
const blurOf = (el) => {
  const m = /blur\(([\d.]+)px\)/.exec(getComputedStyle(el).filter || '');
  return m ? +m[1] : 0;
};
const mid = (o) => o > 0.12 && o < 0.88;

const OVERLAY = [['paper', '.pq-cine-paper'], ['studytitle', '.pq-cine-studytitle'], ['annot', '.pq-cine-annot']];

const rows = [];
const N = 40;
for (let i = 0; i <= N; i++) {
  const p = i / N;
  scrollTo(0, Math.round(top + p * span));
  await sleep(900);

  const texts = [...hero.querySelectorAll('.pq-cine-card, .pq-cine-intro, .pq-cine-vcard')];
  let halfText = 0, blurText = 0, shown = 0;
  for (const el of texts) {
    const o = op(el);
    if (o >= 0.88) shown++;
    if (mid(o)) halfText++;
    else if (o > 0.5 && blurOf(el) > 0.6) blurText++;
  }
  const ov = {};
  let halfOv = 0;
  for (const [name, sel] of OVERLAY) {
    const el = hero.querySelector(sel);
    if (!el) continue;
    const o = op(el);
    ov[name] = o;
    if (mid(o)) halfOv++;
  }
  const bad = halfText + blurText + halfOv;
  rows.push({ p: +p.toFixed(3), 半透明文字: halfText, 可見但糊: blurText, 半開遮罩: halfOv, 完整文字: shown, ov, bad });
}

const badRows = rows.filter((r) => r.bad > 0);
const twoText = rows.filter((r) => r.半透明文字 >= 2);
return JSON.stringify({
  取樣點: rows.length,
  半完成點數: badRows.length,
  安定比例: +(1 - badRows.length / rows.length).toFixed(3),
  兩段文字同時半透明: twoText.map((r) => r.p),
  明細: badRows.map((r) => ({ p: r.p, 半字: r.半透明文字, 糊字: r.可見但糊, 半罩: r.半開遮罩, ov: r.ov }))
});
