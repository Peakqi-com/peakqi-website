// 逐個標題量「實際視覺行」:用 Range 取每一行的 client rect,
// 再和 <br> 分段數比對 —— 視覺行數 > 分段數 = 發生了自然換行(可能出現孤字行)。
const out = [];
// 讓 content-visibility 的區塊完成排版
for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.8)) {
  scrollTo(0, y); await new Promise(r => requestAnimationFrame(r));
}
scrollTo(0, 0);
await new Promise(r => setTimeout(r, 700));

document.querySelectorAll('h1,h2').forEach((h) => {
  const cs = getComputedStyle(h);
  if (cs.display === 'none' || cs.visibility === 'hidden') return;
  const txt = h.textContent.replace(/\s+/g, ' ').trim();
  if (!txt) return;
  const segs = h.innerHTML.split(/<br\s*\/?>/i).length;   // 作者刻意的行數
  // 逐行 rect
  const rects = [];
  const walk = (node) => {
    if (node.nodeType === 3 && node.textContent.trim()) {
      const r = document.createRange();
      r.selectNodeContents(node);
      Array.from(r.getClientRects()).forEach(x => { if (x.width > 1 && x.height > 1) rects.push({ top: Math.round(x.top), w: Math.round(x.width), txt: node.textContent }); });
    } else if (node.nodeType === 1) node.childNodes.forEach(walk);
  };
  h.childNodes.forEach(walk);
  // 依 top 分行
  const lines = [];
  rects.forEach(r => {
    const L = lines.find(l => Math.abs(l.top - r.top) < 6);
    if (L) { L.w += r.w; } else lines.push({ top: r.top, w: r.w });
  });
  lines.sort((a, b) => a.top - b.top);
  if (!lines.length) return;
  const ws = lines.map(l => l.w);
  const mx = Math.max(...ws), mn = Math.min(...ws);
  // 孤字行 = 某一行明顯比最寬那行短很多(整段被擠出一小截字尾)
  out.push({
    lines: lines.length, segs,
    ratio: +(mn / mx).toFixed(2),
    widths: ws,
    box: Math.round(h.getBoundingClientRect().width),
    txt: txt.slice(0, 46)
  });
});
return JSON.stringify(out.filter(o => o.lines > 1 && o.ratio < 0.34), null, 0);
