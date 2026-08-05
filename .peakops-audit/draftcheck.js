// Demo #draft 抽驗:點兩顆晶片後量 面板底 vs 下一段頂,以及超寬
const draft = document.querySelector('#draft');
if (!draft) return JSON.stringify({ err: 'no #draft' });
draft.scrollIntoView();
await new Promise((r) => setTimeout(r, 900));
const btns = Array.from(draft.querySelectorAll('button'));
if (btns[1]) btns[1].click();
await new Promise((r) => setTimeout(r, 400));
const btns2 = Array.from(draft.querySelectorAll('button'));
const later = btns2.find((b) => /LINE|名單|報價/.test(b.textContent));
if (later) later.click();
await new Promise((r) => setTimeout(r, 700));
let nxt = draft.nextElementSibling;
while (nxt && !nxt.offsetHeight) nxt = nxt.nextElementSibling;
const db = draft.getBoundingClientRect().bottom;
const panel = draft.querySelectorAll('div');
const gap = nxt ? Math.round(nxt.getBoundingClientRect().top - db) : null;
return JSON.stringify({
  vw: innerWidth, over: document.scrollingElement.scrollWidth - innerWidth,
  draftH: Math.round(draft.getBoundingClientRect().height),
  nextSection: nxt ? (nxt.id || nxt.tagName) : null, gapToNext: gap,
  status: (draft.textContent.match(/尚未開始|草稿成形|組裝中/) || [''])[0]
});
