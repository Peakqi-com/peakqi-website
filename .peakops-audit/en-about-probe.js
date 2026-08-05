// /en/About 驗收探針:主內容不得殘留中文(Nav 的「中文」語言切換鈕除外)、
// 關鍵英文標記存在、hero/團隊/色卡結構健在。搭配 goto.js / owcheck.js 使用。
await new Promise(r => setTimeout(r, 800));
const cjk = /[一-鿿]/;
const leaks = [];
document.querySelectorAll('section, footer').forEach(sec => {
  sec.querySelectorAll('*').forEach(el => {
    if (el.children.length) return;
    const t = (el.textContent || '').trim();
    if (t && cjk.test(t) && leaks.length < 8) {
      const inNav = el.closest('header, nav[aria-label="main"], #pq-nav');
      leaks.push((inNav ? 'NAV:' : '') + t.slice(0, 30));
    }
  });
});
const q = s => !!document.querySelector(s);
const h1 = (document.querySelector('#a-hero h1') || {}).textContent || '';
return JSON.stringify({
  lang: document.documentElement.lang,
  h1ok: /Not which AI/.test(h1),
  heroStage: q('[data-hero="about"] [data-hero-stage]'),
  allenStage: q('[data-allen-stage]'),
  indCards: document.querySelectorAll('#a-ind-strip .pq-ind').length,
  msteps: document.querySelectorAll('#a-msteps [data-mstep]').length,
  teamTitles: [...document.querySelectorAll('#a-team .pq-bot')].length,
  cjkLeaks: leaks
});
