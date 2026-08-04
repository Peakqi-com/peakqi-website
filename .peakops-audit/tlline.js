// 時程軸:[data-tline] 是一條 scaleX 的線,每個 [data-tstep] 上有一個 [data-dot]。
// 檢查兩件事:(1) 線頭走到哪 (2) 已經亮起的節點是否都在線的覆蓋範圍內、
// 且「最後一個亮起的節點」是否貼著線頭(這就是使用者說的「圓點要在線頭」)。
const P = parseFloat(new URLSearchParams(location.search).get('sp') || '0');
window.scrollTo(0, Math.round(P * (document.body.scrollHeight - window.innerHeight)));
await new Promise(r => setTimeout(r, 420));
// IntersectionObserver 的回呼是非同步的:瞬間跳到某個捲動位置時,引擎的可見性旗標
// 要幾百毫秒才會轉為 true。沉澱不夠久量到的會是「尚未開始更新」的舊狀態。
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 90; i++) await new Promise(r => requestAnimationFrame(r));
const F = (n) => +n.toFixed(1);
const out = [];
document.querySelectorAll('#pq-tl, #pq-tl2').forEach((tl) => {
  const line = tl.querySelector('[data-tline]');
  if (!line) return;
  const lr = line.getBoundingClientRect(), tr = tl.getBoundingClientRect();
  if (lr.width < 2 && lr.height < 2) return;
  // 只在時程軸真的進入畫面時才量,否則量到的是尚未開始的初始態
  if (tr.bottom < 0 || tr.top > innerHeight) return;
  const vertical = lr.height > lr.width;
  const steps = Array.from(tl.querySelectorAll('[data-tstep]'));
  const dots = steps.map(s => s.querySelector('[data-dot]')).filter(Boolean);
  if (!dots.length) return;
  // 線頭
  const headX = lr.right, headY = lr.bottom;
  const lit = [];
  dots.forEach((d, i) => {
    const dr = d.getBoundingClientRect();
    const cs = getComputedStyle(d);
    // 「亮起」= 被塗成品牌橘或收尾綠;未亮的初始色是 rgba(242,239,232,.25) /
    // rgba(9,11,14,.25),那也不是透明,不能只用「非透明」來判斷。
    const bg = cs.backgroundColor.replace(/\s/g, '');
    const on = /255,107,44/.test(bg) || /101,224,188/.test(bg);
    const cx = dr.left + dr.width / 2, cy = dr.top + dr.height / 2;
    // 節點是否落在線已覆蓋的範圍內
    const covered = vertical ? cy <= headY + 3 : cx <= headX + 3;
    lit.push({ i, on, cx: F(cx), cy: F(cy), covered });
  });
  const onDots = lit.filter(d => d.on);
  const last = onDots.length ? onDots[onDots.length - 1] : null;
  out.push({
    id: tl.id, vertical,
    lineW: F(lr.width), lineH: F(lr.height), trackW: F(tr.width),
    headX: F(headX), headY: F(headY),
    dots: lit.length, litCount: onDots.length,
    // 亮起卻在線的覆蓋範圍外 = 點跑到線前面(分家)
    litOutsideLine: onDots.filter(d => !d.covered).length,
    // 最後一個亮起的點與線頭的距離
    lastGap: last ? F(Math.abs((vertical ? last.cy : last.cx) - (vertical ? headY : headX))) : null,
    detail: lit
  });
});
return JSON.stringify({ url: location.pathname, sp: P, vw: innerWidth, count: out.length, tracks: out }, null, 1);
