// 彩蛋洗牌袋實測:連開 18 次選單,記錄每次的 vN:eN;前 15 次應 15 齣不重複
const out = [];
const burger = Array.from(document.querySelectorAll('header button')).find((b) => b.getAttribute('aria-expanded') !== null) || document.querySelector('header button');
if (!burger) return JSON.stringify({ err: 'no burger' });
for (let i = 0; i < 18; i++) {
  burger.click();
  await new Promise((r) => setTimeout(r, 380));
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) { out.push('X'); continue; }
  const m = dlg.className.match(/pqm-v(\d+)/);
  const e2 = dlg.className.match(/pqm-e(\d+)/);
  out.push((m ? +m[1] : 0) + ':' + (e2 ? +e2[1] : 0));
  dlg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await new Promise((r) => setTimeout(r, 320));
  const still = document.querySelector('[role="dialog"]');
  if (still) {
    const btn = still.querySelector('button');
    if (btn) btn.click();
    await new Promise((r) => setTimeout(r, 320));
  }
}
const acts = out.map((s) => parseInt(s, 10) || 0);
const first15 = acts.slice(0, 15).filter((v) => v > 0);
return JSON.stringify({ seq: out, uniqueFirst15: new Set(first15).size, opened: acts.filter((v) => v > 0).length });
