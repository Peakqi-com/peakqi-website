// 找出 start() 的六段在哪裡斷掉:每段都會留下「只有 JS 會寫」的行內樣式/屬性,逐一查證
await new Promise((r) => setTimeout(r, 2400));
const has = (sel, prop) => {
  const el = document.querySelector(sel);
  return el ? !!(el.style[prop] && el.style[prop] !== '') : null;
};
const attr = (sel, a) => { const el = document.querySelector(sel); return el ? el.getAttribute(a) : null; };

// 先捲過整頁,讓各段的 IO / ScrollChapter 都有機會跑到
const H = document.body.scrollHeight;
for (const k of [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) { scrollTo(0, Math.round(H * k)); await new Promise((r) => setTimeout(r, 420)); }
await new Promise((r) => setTimeout(r, 600));

return JSON.stringify({
  // ① overview():StickyProductStage 會寫 wrap 高度
  overview_pinned: has('#overview [data-wrap]', 'height'),
  overview_layerTf: has('#overview [data-slayer]', 'transform'),
  // ② capture():pin 會寫 wrap 高度
  capture_pinned: has('#capture [data-wrap]', 'height'),
  // ③ follow():pin 寫高度 + callback 寫 transform
  follow_pinned: has('#follow [data-wrap]', 'height'),
  follow_cardTf: has('#follow [data-fcard]', 'transform'),
  follow_cardTransition: has('#follow [data-fcard]', 'transition'),
  // ④ nurture():callback 寫 opacity
  nurture_pinned: has('#nurture [data-wrap]', 'height'),
  nurture_planeOpacity: has('#nurture [data-nplane]', 'opacity'),
  // ⑤ modules():setActive(0,false) 一定會寫 borderColor 與 aria-current
  modules_pinned: has('#modules [data-wrap]', 'height'),
  modules_rowBorder: has('#modules [data-smod]', 'borderColor'),
  modules_ariaCurrent: attr('#modules [data-smod]', 'aria-current'),
  modules_detOpacity: has('#modules [data-sdet]', 'opacity'),
  // ⑥ integration():會先把 chips 壓成 opacity 0 再進場
  integration_chipOpacity: has('#integration [data-ichip]', 'opacity'),
  integration_chipTransition: has('#integration [data-ichip]', 'transition')
});
