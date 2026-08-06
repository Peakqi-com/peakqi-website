// Solutions 桌機三處回報。重點:所有節點都在「量測當下」才查 ——
// #capture 捲動切 Tab 會 setState,DC 會重建 sc-for 區塊,先抓好的參照會變成孤兒節點,量到的是舊值。
await new Promise((r) => setTimeout(r, 2200));
const out = {};
const settle = (ms) => new Promise((r) => setTimeout(r, ms));
const Q = (s) => document.querySelector(s);
const QA = (s) => [...document.querySelectorAll(s)];
const vis = (el) => { const s = getComputedStyle(el); return +s.opacity > 0.5 && s.visibility !== 'hidden'; };

// ── ① capture:釘住時舞台有多少落在視窗外 ──
{
  const wrap = Q('#capture [data-wrap]');
  const top = wrap.getBoundingClientRect().top + scrollY;
  const span = Math.max(1, wrap.offsetHeight - innerHeight);
  scrollTo(0, Math.round(top + 0.5 * span));
  await settle(900);
  const sr = Q('#capture [data-stage]').getBoundingClientRect();
  const grid = Q('#pq-cap-grid');
  const chat = grid ? grid.firstElementChild.getBoundingClientRect() : null;
  out.capture = {
    vh: innerHeight, stageH: Math.round(sr.height), stageTop: Math.round(sr.top),
    stageOverflowsViewport: Math.round(sr.bottom - innerHeight),
    chatCutOffPx: chat ? Math.round(chat.bottom - innerHeight) : null
  };
}

// ── ② follow:卡片有沒有真的滑 ──
{
  const wrap = Q('#follow [data-wrap]');
  const pinned = !!(wrap && wrap.style.height);
  const src = pinned ? wrap : Q('#follow');
  const top = src.getBoundingClientRect().top + scrollY;
  const span = Math.max(1, src.offsetHeight - innerHeight);
  const samples = [];
  for (const p of [0.05, 0.3, 0.55, 0.8, 0.95]) {
    scrollTo(0, Math.round(top + p * span));
    await settle(700);
    const card = Q('#follow [data-fcard]');                   // 每次現查
    const cols = QA('#follow [data-fcol]');
    const lit = cols.findIndex((c) => /255,\s*107,\s*44|#ff6b2c/i.test(c.style.borderColor || ''));
    const tag = card && card.querySelector('[data-ftag]');
    samples.push({
      p, x: card ? Math.round(card.getBoundingClientRect().left - (cols[0] ? cols[0].getBoundingClientRect().left : 0)) : null,
      litCol: lit, tag: tag ? tag.textContent.trim().slice(0, 24) : null
    });
  }
  out.follow = {
    pinned, cols: QA('#follow [data-fcol]').length,
    samples,
    distinctX: [...new Set(samples.map((s) => s.x))].length,
    litSeq: samples.map((s) => s.litCol).join(','),
    movesAcross: [...new Set(samples.map((s) => s.x))].length >= 3
  };
}

// ── ③ modules 點擊 ──
{
  const wrap = Q('#modules [data-wrap]');
  const top = wrap.getBoundingClientRect().top + scrollY;
  const span = Math.max(1, wrap.offsetHeight - innerHeight);
  scrollTo(0, Math.round(top + 0.1 * span));
  await settle(900);
  const before = QA('#modules [data-sdet]').findIndex(vis);
  QA('#modules [data-smod]')[3].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await settle(500);
  const afterClick = QA('#modules [data-sdet]').findIndex(vis);
  await settle(900);
  const afterWait = QA('#modules [data-sdet]').findIndex(vis);
  const rowAria = QA('#modules [data-smod]').map((r) => r.getAttribute('aria-current')).join(',');
  out.modules = {
    visibleBefore: before, afterClickRow3: afterClick, afterWait,
    clickWorks: afterClick === 3, sticks: afterWait === 3, rowAria
  };
}
return JSON.stringify(out);
