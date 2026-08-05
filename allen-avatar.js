// Allen 大頭貼互動舞台(About 團隊卡):三幕輪演的互動小劇場
//   act1 小啄木鳥 × 大頭貼機器人(點擊驅趕,趕走會再回來)
//   act2 心碎半身機器人 × 修補小燈泡(點燈泡快速縫補)
//   act3 全身音樂機器人(三種音樂三種舞步與想像場景;聲音一律使用者點了才播)
// 殼層職責:隨機開幕(均等權重)、三點切換、單一 rAF 供幕使用、WebAudio 閘門(手勢後才建立)。
// 各幕獨立檔案 allen-act1/2/3.js,export function createAct(stage, api) → { destroy() }。
import { createMotionContext } from './motion-kit.js';
import { t } from './i18n.js';

export function mountAllenAvatar() {
  const stage = document.querySelector('[data-allen-stage]');
  if (!stage) return { destroy() {} };
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduced) return { destroy() {} };   // 降級:保留卡內靜態機器人
  const ctx = createMotionContext('allen-avatar');
  const frameCbs = new Set();
  ctx.onFrame((now) => { frameCbs.forEach((cb) => { try { cb(now / 1000); } catch (e) {} }); });

  // WebAudio:預設無聲;只有使用者手勢的呼叫才會建立/恢復
  let ac = null;
  const audio = {
    ensure() {
      try {
        if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === 'suspended') ac.resume();
        return ac;
      } catch (e) { return null; }
    },
    get ctx() { return ac; }
  };

  const api = {
    audio,
    raf(cb) { frameCbs.add(cb); return () => frameCbs.delete(cb); },
    rand: Math.random
  };

  const ACTS = ['./allen-act1.js', './allen-act2.js', './allen-act3.js'];
  let cur = -1, act = null, dead = false;
  const fallbackHtml = stage.innerHTML;   // 靜態機器人:載入失敗時還原

  // 切換點(右下三顆):目前幕亮橘
  const dots = document.createElement('div');
  dots.setAttribute('aria-label', t('切換 Allen 的三個小劇場', "Switch Allen's three acts"));
  dots.style.cssText = 'position:absolute;right:10px;bottom:10px;display:flex;gap:8px;z-index:9';
  const dotEls = ACTS.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', t('第 ' + (i + 1) + ' 幕', 'Act ' + (i + 1)));
    b.style.cssText = 'width:14px;height:14px;border-radius:50%;border:1.5px solid rgba(242,239,232,.55);background:transparent;padding:0;cursor:pointer';
    b.addEventListener('click', (ev) => { ev.stopPropagation(); show(i); });
    dots.appendChild(b);
    return b;
  });

  function paintDots() {
    dotEls.forEach((b, i) => {
      b.style.background = i === cur ? '#FF6B2C' : 'transparent';
      b.style.borderColor = i === cur ? '#FF6B2C' : 'rgba(242,239,232,.55)';
    });
  }
  function show(i) {
    if (dead || i === cur) return;
    if (act) { try { act.destroy(); } catch (e) {} act = null; }
    frameCbs.clear();
    cur = i;
    paintDots();
    stage.innerHTML = '';
    stage.appendChild(dots);
    import(ACTS[i])
      .then((m) => {
        if (dead || cur !== i) return;
        act = m.createAct(stage, api);
      })
      .catch(() => { if (!dead && cur === i) { stage.innerHTML = fallbackHtml; stage.appendChild(dots); } });
  }
  // 隨機開幕(均等);?allenact=1..3 供驗收指定
  let first = Math.floor(Math.random() * ACTS.length);
  try {
    const q = parseInt(new URLSearchParams(location.search).get('allenact') || '', 10);
    if (q >= 1 && q <= ACTS.length) first = q - 1;
  } catch (e) {}
  show(first);

  return {
    destroy() {
      dead = true;
      if (act) { try { act.destroy(); } catch (e) {} }
      try { if (ac) ac.close(); } catch (e) {}
      ctx.destroy();
    }
  };
}
