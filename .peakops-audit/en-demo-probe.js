// /en/Demo 驗收探針:主內容零殘留中文(Nav 語言切換鈕「中文」除外)、
// hero 四任務結構健在、#draft 未選→已選兩態(點產業+流程晶片)、摘要組字為英文句、
// 表單欄位與 DIRECT CONTACT 存在。搭配 goto.js / owcheck.js 使用。
await new Promise(r => setTimeout(r, 900));
const cjk = /[一-鿿]/;
const leakScan = () => {
  const out = [];
  document.querySelectorAll('section, footer').forEach(sec => {
    sec.querySelectorAll('*').forEach(el => {
      if (el.children.length) return;
      const t = (el.textContent || '').trim();
      if (t && cjk.test(t) && out.length < 8) {
        const inNav = el.closest('header, nav[aria-label="main"], #pq-nav');
        out.push((inNav ? 'NAV:' : '') + t.slice(0, 30));
      }
    });
  });
  return out;
};
const q = s => !!document.querySelector(s);
const txt = s => ((document.querySelector(s) || {}).textContent || '').trim();

// —— 未選態 ——
const statusEl = document.querySelector('#draft [role="status"]');
const before = {
  status: statusEl ? statusEl.textContent.trim() : '',
  placeholder: /Inquiry in → Need triage/.test(txt('#draft')),
  summaryToPick: /Industry: To pick/.test(txt('#draft'))
};

// —— 點晶片:第一個產業 + 第一個流程 ——
const indBtn = document.querySelector('#draft [role="group"][aria-label^="Pick your industry"] button');
const flowBtn = document.querySelector('#draft [role="group"][aria-label^="The flow that hurts"] button');
if (indBtn) indBtn.click();
await new Promise(r => setTimeout(r, 250));
if (flowBtn) flowBtn.click();
await new Promise(r => setTimeout(r, 450));
const draftTxt = txt('#draft');
const after = {
  status: statusEl ? statusEl.textContent.trim() : '',
  indPressed: !!document.querySelector('#draft [role="group"][aria-label^="Pick your industry"] button[aria-pressed="true"]'),
  flowPressed: !!document.querySelector('#draft [role="group"][aria-label^="The flow that hurts"] button[aria-pressed="true"]'),
  summaryEn: /Industry: Weddings/.test(draftTxt) && /Flow: LINE support/.test(draftTxt),
  caseLine: /Similar scenario:/.test(draftTxt) ? (draftTxt.match(/Similar scenario:\s*([^\n]{0,50})/) || [])[1] : '(no case line)',
  chipsEn: /Likely to show:/.test(draftTxt),
  needValue: (document.getElementById('pq-f-need') || {}).value || ''
};

const h1 = txt('#d-hero h1');
return JSON.stringify({
  lang: document.documentElement.lang,
  h1ok: /Phase-1 draft/.test(h1),
  heroScenes: document.querySelectorAll('[data-hero="demo"] [data-hero-scene]').length,
  heroCanvas: q('[data-hero="demo"] [data-hero-canvas]'),
  before, after,
  needIsEnglish: !!after.needValue && !cjk.test(after.needValue),
  form: {
    name: q('#pq-f-name'), phone: q('#pq-f-phone'), email: q('#pq-f-email'), line: q('#pq-f-line'), need: q('#pq-f-need'),
    submitLabel: ([...document.querySelectorAll('#pq-demo-grid button')].map(b => b.textContent.trim()).find(t2 => /Send the rollout draft/.test(t2)) || '(missing)')
  },
  directContact: /Rather skip the form\?/.test(txt('#direct-contact')),
  footer: q('footer'),
  cjkLeaks: leakScan()
});
