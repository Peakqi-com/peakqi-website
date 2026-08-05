// 標題體檢:每個 h1/h2/h3 的實際行數、孤字行、以及是否仍以 px 標示字級
// 回報三類問題:(1) 行數過多(桌機>2、手機>3) (2) 孤字行(一行只有 1-2 個字)
// (3) 字級仍是 px(要求 rem/clamp)
const P = parseFloat(new URLSearchParams(location.search).get('sp') || '0');
window.scrollTo(0, Math.round(P * (document.body.scrollHeight - window.innerHeight)));
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r));
const mobile = innerWidth < 900;
const out = [];
document.querySelectorAll('h1,h2,h3').forEach((h) => {
  const cs = getComputedStyle(h);
  if (cs.display === 'none' || cs.visibility === 'hidden') return;
  let eff = 1, an = h;
  while (an && an !== document.body) { eff *= +getComputedStyle(an).opacity; an = an.parentElement; }
  if (eff < 0.3) return;
  const r = h.getBoundingClientRect();
  if (r.width < 10 || r.height < 8) return;
  // 用 Range 逐字取 rect,依行高分桶算實際行
  const rg = document.createRange();
  rg.selectNodeContents(h);
  const rects = Array.from(rg.getClientRects()).filter(x => x.width > 1 && x.height > 4);
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
  const rows = [];
  rects.sort((a, b) => a.top - b.top).forEach((x) => {
    const row = rows.find(rw => Math.abs(rw.top - x.top) < lh * 0.55);
    if (row) { row.w += x.width; row.right = Math.max(row.right, x.right); row.left = Math.min(row.left, x.left); }
    else rows.push({ top: x.top, w: x.width, left: x.left, right: x.right });
  });
  const txt = (h.textContent || '').replace(/\s+/g, ' ').trim();
  const fsPx = parseFloat(cs.fontSize);
  const charW = fsPx * 0.96;   // 全形字寬近似
  const orphan = rows.length > 1 && rows[rows.length - 1].w < charW * 2.4;
  // 檢查來源字級標示(inline style 或 font 縮寫)
  const inlineFont = (h.getAttribute('style') || '');
  const pxDeclared = /(?:font|font-size)\s*:[^;]*?(?<![\w.])\d+(?:\.\d+)?px/.test(inlineFont) && !/clamp|rem/.test(inlineFont);
  const tooMany = mobile ? rows.length > 3 : rows.length > 2;
  if (tooMany || orphan || pxDeclared) {
    out.push({
      tag: h.tagName, txt: txt.slice(0, 30), chars: txt.length,
      lines: rows.length, fsPx: +fsPx.toFixed(1),
      orphan, tooMany, pxDeclared,
      style: inlineFont.slice(0, 80)
    });
  }
});
const de = document.scrollingElement || document.documentElement;
return JSON.stringify({
  url: location.pathname, sp: P, vw: innerWidth,
  overflowX: de.scrollWidth - de.clientWidth,
  problems: out.length, list: out.slice(0, 16)
}, null, 1);
