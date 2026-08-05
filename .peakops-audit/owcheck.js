// 整頁爆版檢查:scrollWidth vs 視窗,並揪出最寬的三個元素
await new Promise((r) => setTimeout(r, 800));
const doc = document.scrollingElement;
const over = doc.scrollWidth - innerWidth;
const wide = [];
if (over > 1) {
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > innerWidth + 1 && wide.length < 3) wide.push((el.className || el.tagName).toString().slice(0, 50) + ' w' + Math.round(r.width));
  });
}
return JSON.stringify({ vw: innerWidth, scrollW: doc.scrollWidth, over, wide });
