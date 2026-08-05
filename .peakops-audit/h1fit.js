// 量 h1 可用寬度與各行實際寬度(找出到底哪一行撐爆)
await new Promise((r) => setTimeout(r, 2200));
const h1 = document.querySelector('[data-hero] h1') || document.querySelector('h1');
const cs = getComputedStyle(h1);
const r = h1.getBoundingClientRect();
// 用 Range 逐段量:把 h1 內容依 <br> 切成行文字,個別量寬
const parts = h1.innerHTML.split(/<br\s*\/?>/i);
const probe = document.createElement('span');
probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:' + cs.font;
document.body.appendChild(probe);
const widths = parts.map((p) => { probe.innerHTML = p; return Math.round(probe.getBoundingClientRect().width); });
probe.remove();
return JSON.stringify({
  fontSize: cs.fontSize, boxW: Math.round(r.width),
  parentW: Math.round(h1.parentElement.getBoundingClientRect().width),
  lineWidths: widths,
  texts: parts.map((p) => p.replace(/<[^>]*>/g, '').trim().slice(0, 34))
});
