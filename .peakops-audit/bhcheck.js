// 品牌屋內嵌檢查:跑道高度、iframe 來源與語言、父頁捲動是否真的驅動 iframe 內部
const run = document.getElementById('pq-bh-runway');
const fr = document.getElementById('pq-bh-frame');
if (!run || !fr) return JSON.stringify({ err: 'no embed', run: !!run, fr: !!fr });
const top = run.getBoundingClientRect().top + scrollY;
const total = run.offsetHeight - innerHeight;
const read = () => { try { const w = fr.contentWindow; return { y: Math.round(w.scrollY), lang: w.document.documentElement.lang, sh: w.document.documentElement.scrollHeight }; } catch (e) { return { err: String(e).slice(0, 40) }; } };
scrollTo(0, Math.round(top + 0.15 * total));
await new Promise((r) => setTimeout(r, 1800));
const a = read();
scrollTo(0, Math.round(top + 0.65 * total));
await new Promise((r) => setTimeout(r, 1800));
const b = read();
return JSON.stringify({
  runwayVh: Math.round(run.offsetHeight / innerHeight * 100),
  src: (fr.getAttribute('src') || '').slice(-32),
  at15: a, at65: b,
  driven: !!(a.y != null && b.y != null && b.y > a.y),
  over: document.scrollingElement.scrollWidth - innerWidth
});
