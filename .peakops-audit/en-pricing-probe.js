// EN Pricing 頁(/en/Pricing.dc.html)驗收 probe — 搭配 .peakops-audit/run.mjs
// 用法:node .peakops-audit/run.mjs "http://127.0.0.1:8000/en/Pricing.dc.html#pqf=0.5" out.png 390 844 0 .peakops-audit/en-pricing-probe.js
//   #pqf=<0..1>   = hero 收合進度(照 ua-*-hero probe 的捲法)
//   #pqtest=sel   = 額外跑 #p-selector 互動(點 A/C 分頁驗證模組數與標題,結束切回 B)
// 檢查:DC 渲染、hero API、爆版、可見 CJK 殘留(含共用 Nav/Footer)、aria CJK、內容契約、選擇器互動。
await new Promise(r => setTimeout(r, 2500));
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// hero 進度捲動(hash 觸發)
const mHash = location.hash.match(/pqf=([\d.]+)/);
if (mHash) {
  const f = Math.min(1, Math.max(0, parseFloat(mHash[1])));
  const wrap = $('[data-hero-wrap]');
  const top = wrap ? wrap.getBoundingClientRect().top + scrollY : 0;
  const end = wrap ? Math.max(wrap.offsetHeight - innerHeight, innerHeight) : innerHeight;
  for (let i = 1; i <= 16; i++) { scrollTo(0, top + end * f * i / 16); await new Promise(r => requestAnimationFrame(r)); }
  await new Promise(r => setTimeout(r, 900));
}

// 可見性判定(sc-if 未掛載、display:none、helmet/script/style 都不算)
const visible = el => {
  if (!el.isConnected) return false;
  for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  }
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};
const CJK = /[㐀-鿿豈-﫿　-〿！-～]/;

// 1) 可見文字 CJK 殘留(全頁,含 Nav/Footer)
const cjkText = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const t = node.textContent;
  if (!t || !CJK.test(t)) continue;
  const el = node.parentElement;
  if (!el || ['SCRIPT', 'STYLE', 'HELMET', 'NOSCRIPT'].includes(el.tagName)) continue;
  if (!visible(el)) continue;
  cjkText.push((el.tagName + (el.id ? '#' + el.id : '')) + ' "' + t.trim().slice(0, 24) + '"');
  if (cjkText.length > 12) break;
}

// 2) aria/alt/title 屬性 CJK(已知:motion-kit 共用檔另計)
const cjkAria = [];
for (const el of document.querySelectorAll('[aria-label],[alt],[title]')) {
  for (const a of ['aria-label', 'alt', 'title']) {
    const v = el.getAttribute(a);
    if (v && CJK.test(v)) { cjkAria.push(a + '="' + v.slice(0, 22) + '"'); }
  }
  if (cjkAria.length > 10) break;
}

// 3) 爆版 owcheck
const over = [];
if (document.documentElement.scrollWidth > innerWidth + 1) {
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)) {
      over.push(el.tagName + (el.id ? '#' + el.id : '') + '|' + Math.round(r.left) + '~' + Math.round(r.right));
      if (over.length > 8) break;
    }
  }
}

// 4) hero 垂直裁切
const heroClipY = (() => {
  const st = $('[data-hero-stage]'); const copy = $('[data-hero-copy]');
  if (!st || !copy) return null;
  return Math.round(copy.getBoundingClientRect().bottom - st.getBoundingClientRect().bottom);
})();

// 5) 內容契約:三機架、六模組磚、四比較列、五時程格、四 STEP、九題 FAQ(content.js 綁定是否成功)
const counts = {
  rackCards: $$('#p-hero-racks [data-rack]').length,
  consoleMods: $$('#pq-console-mods > div').length,
  planTabs: $$('#p-selector [role="tab"]').length,
  needChips: $$('#p-selector [role="group"] button').length,
  cmpRowsDesk: $$('#p-cmp-desk [data-crow]').length,
  cmpCardsMob: $$('#p-cmp-mob > div').length,
  tlSteps: $$('#pq-tl2 [data-tstep]').length,
  riskSteps: $$('#p-risk [style*="letter-spacing"]').filter(el => /^STEP \d/.test(el.textContent)).length,
  faqItems: $$('#p-faq details').length,
  pvPlans: $$('#p-faq [data-pvsum] [data-pvname]').length,
  footerRendered: !!$('footer') || !!$('[data-footer]')
};

// 6) 選擇器互動(#pqtest=sel):點 C → 模組全亮、標題換名;點 A → 只亮 1;結束切回 B
let selTest = null;
if (/pqtest=sel/.test(location.hash)) {
  const tabs = $$('#p-selector [role="tab"]');
  const litCount = () => $$('#pq-console-mods > div').filter(el => ['on', 'new'].includes(el.getAttribute('data-state'))).length;
  const header = () => ($('#p-selector [style*="letter-spacing"][style*=".12em"]') || {}).textContent || '';
  const snap = async (i) => {
    tabs[i].click();
    await new Promise(r => setTimeout(r, 700));
    return { tab: tabs[i].textContent.trim(), lit: litCount(), header: header().trim().slice(0, 48) };
  };
  if (tabs.length === 3) {
    const c = await snap(2);
    const a = await snap(0);
    const b = await snap(1); // 切回預設 B,截圖狀態一致
    selTest = { c, a, b, pass: c.lit === 6 && a.lit === 1 && b.lit === 3 };
  } else selTest = { error: 'tabs=' + tabs.length };
}

return JSON.stringify({
  vw: innerWidth, vh: innerHeight, y: Math.round(scrollY),
  htmlLang: document.documentElement.lang,
  title: document.title.slice(0, 64),
  rendered: !!$('section#p-hero'),
  heroApi: window.__pqHero ? { scenes: window.__pqHero.scenes, mode: window.__pqHero.mode, ok: window.__pqHero.ok } : null,
  heroClipY,
  counts,
  selTest,
  docH: document.body.scrollHeight,
  overflowX: document.documentElement.scrollWidth > innerWidth + 1 ? 'OVERFLOW ' + document.documentElement.scrollWidth : 'ok',
  overflowCulprits: over,
  cjkVisibleText: cjkText,
  cjkAria: cjkAria
}, null, 1);
