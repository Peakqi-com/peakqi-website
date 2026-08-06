// 「半完成畫面」量測:沿首頁分鏡逐格停下並等它安定,記錄有多少元素卡在中間態。
// 中間態定義:opacity 落在 0.12~0.88,或 blur > 0.6px。
// 每個取樣點都等 900ms —— 時間驅動的 CSS 轉場早就結束了,還留在中間的一定是
// scrub 驅動(直接綁捲動進度)的,那才是「停在哪裡就卡在哪裡」的元凶。
await new Promise((r) => setTimeout(r, 3200));
const hero = document.getElementById('hero');
if (!hero) return JSON.stringify({ err: 'no #hero' });
const wrap = hero.querySelector('[data-wrap]') || hero;
const top = wrap.getBoundingClientRect().top + scrollY;
const span = Math.max(1, wrap.offsetHeight - innerHeight);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const blurOf = (el) => {
  const f = getComputedStyle(el).filter || '';
  const m = /blur\(([\d.]+)px\)/.exec(f);
  return m ? +m[1] : 0;
};
const half = (o) => o > 0.12 && o < 0.88;

const WATCH = [
  ['paper', '.pq-cine-paper'],
  ['studytitle', '.pq-cine-studytitle'],
  ['annot', '.pq-cine-annot'],
  ['study', '.pq-study']
];

const rows = [];
const N = 34;
for (let i = 0; i <= N; i++) {
  const p = i / N;
  scrollTo(0, Math.round(top + p * span));
  await sleep(900);                                  // 等時間型轉場結束
  const cards = [...hero.querySelectorAll('.pq-cine-card, .pq-cine-intro')];
  const cardOps = cards.map((c) => +(+getComputedStyle(c).opacity).toFixed(2));
  const cardBlur = cards.map(blurOf);
  const halfCards = cardOps.filter(half).length;
  const blurCards = cardBlur.filter((b) => b > 0.6).length;
  const others = {};
  let halfOther = 0;
  for (const [name, sel] of WATCH) {
    const el = hero.querySelector(sel);
    if (!el) continue;
    const o = +(+getComputedStyle(el).opacity).toFixed(2);
    others[name] = o;
    if (half(o)) halfOther++;
  }
  rows.push({
    p: +p.toFixed(3),
    半透明字卡: halfCards,
    模糊字卡: blurCards,
    其他半透明: halfOther,
    others,
    可見字卡: cardOps.filter((o) => o >= 0.88).length
  });
}

const bad = rows.filter((r) => r.半透明字卡 >= 1 || r.模糊字卡 >= 1 || r.其他半透明 >= 1);
const worst = rows.filter((r) => r.半透明字卡 >= 2);
return JSON.stringify({
  取樣點: rows.length,
  半完成點數: bad.length,
  半完成比例: +(bad.length / rows.length).toFixed(3),
  安定比例: +(1 - bad.length / rows.length).toFixed(3),
  兩張字卡同時半透明: worst.map((r) => r.p),
  明細: bad.map((r) => ({ p: r.p, 卡: r.半透明字卡, 糊: r.模糊字卡, 他: r.其他半透明, o: r.others }))
});
