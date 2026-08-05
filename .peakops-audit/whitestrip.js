// 找出白色帶:掃 hero 之後、brandhouse 之前的水平帶,取樣背景
const bh = document.querySelector('#brandhouse');
bh.scrollIntoView(); window.scrollBy(0, -300);
await new Promise(r => setTimeout(r, 900));
const de = document.scrollingElement || document.documentElement;
const bhTop = bh.getBoundingClientRect().top;
const prev = bh.previousElementSibling;
const pr = prev.getBoundingClientRect();
const gap = bhTop - pr.bottom;
const cs = (el) => { const c = getComputedStyle(el); return { bg: c.backgroundColor, mt: c.marginTop, mb: c.marginBottom, pt: c.paddingTop, pb: c.paddingBottom }; };
return JSON.stringify({
  prevTag: prev.tagName + (prev.id ? '#' + prev.id : ''), prevBottom: Math.round(pr.bottom), bhTop: Math.round(bhTop),
  gapPx: Math.round(gap),
  prevCS: cs(prev), bhCS: cs(bh),
  bodyBg: getComputedStyle(document.body).backgroundColor
}, null, 1);
