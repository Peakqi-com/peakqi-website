// Allen 大頭貼互動舞台(About 團隊卡):四幕輪演的互動小劇場
//   幕一 Allen 本人 × 他的工作間(原稿那隻機器人與原稿那張背景,開場固定演這一幕)
//   act1 小啄木鳥 × 大頭貼機器人(點擊驅趕,趕走會再回來)
//   act2 心碎半身機器人 × 修補小燈泡(點燈泡快速縫補)
//   act3 全身音樂機器人(三種音樂三種舞步與想像場景;聲音一律使用者點了才播)
// 殼層職責:開場固定第一幕、四點切換、單一 rAF 供幕使用、WebAudio 閘門(手勢後才建立)。
// 各幕獨立檔案,export function createAct(stage, api) → { destroy() }。
import { createMotionContext } from './motion-kit.js';
import { t } from './i18n.js';

export function mountAllenAvatar() {
  const stage = document.querySelector('[data-allen-stage]');
  if (!stage) return { destroy() {} };
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // 降級:不動的 Allen 站在同一個工作間裡。以前這裡是留著卡內那隻靜態 SVG,
  // 但那已經不是 Allen 了 —— 關掉動畫應該只是不動,不該換一個角色。
  if (reduced) {
    let dead = false;
    stage.innerHTML = '<img src="/assets/allen/workshop.webp" alt="" aria-hidden="true"'
      + ' style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 62%">'
      // 和動態版同一層暗角,不然關掉動畫的人會拿到一張明顯更亮、更平的卡
      + '<div style="position:absolute;inset:0;pointer-events:none;background:'
      + 'radial-gradient(120% 95% at 50% 42%,transparent 55%,rgba(9,11,14,.30) 100%)"></div>'
      + '<div data-allen-still style="position:absolute;left:20%;bottom:2%;width:52%;height:66%"></div>';
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', t('Allen 的機器人站在他的工作間裡', "Allen's robot in his workshop"));
    // 天色照樣跟著訪客的時鐘走 —— 關掉動畫的意思是「不要動」,不是「永遠是白天」。
    // 分級圖疊在整疊最上面(工作間 + Allen 一起調),所以 stage 要自己是堆疊脈絡。
    stage.style.isolation = 'isolate';
    import('./allen-sky.js').then((sky) => {
      for (const [name, mode] of sky.gradeLayers(sky.pickTime())) {
        if (dead) return;
        const im = new Image();
        im.alt = '';
        im.setAttribute('aria-hidden', 'true');
        im.onload = () => { if (!dead) stage.appendChild(im); };
        // 和上面那張工作間同一個裁切方式,對位才會成立
        im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;'
          + `object-position:50% 62%;pointer-events:none;mix-blend-mode:${mode}`;
        im.src = sky.GRADE_BASE + name + '.webp';
      }
    }).catch(() => {});
    import('./allen-bot.js')
      .then((m) => { if (!dead) m.createAllenBot(stage.querySelector('[data-allen-still]'), { reduced: true }); })
      .catch(() => {});
    return { destroy() { dead = true; } };
  }

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

  const ACTS = ['./allen-workshop.js', './allen-act1.js', './allen-act2.js', './allen-act3.js'];
  let cur = -1, act = null, dead = false;
  const fallbackHtml = stage.innerHTML;   // 靜態機器人:載入失敗時還原

  // 切換點(右下四顆):目前幕亮橘。第一幕的背景是亮的,所以整組點加一層深色底,
  // 不然白邊的空心點在白牆上會直接消失。
  const dots = document.createElement('div');
  dots.setAttribute('aria-label', t('切換 Allen 的四個小劇場', "Switch Allen's four acts"));
  dots.style.cssText = 'position:absolute;right:8px;bottom:8px;display:flex;gap:10px;z-index:9;'
    + 'padding:6px 8px;border-radius:999px;background:rgba(9,11,14,.58);backdrop-filter:blur(2px)';
  // 點看起來是 14px,但用 ::after 把可點範圍撐到 24px(WCAG 2.2 的最小目標尺寸)。
  // 用 ::after 而不是 padding,是因為 padding 會把整條藥丸撐寬,在 260px 的卡上會
  // 壓到角色;負 inset 只長出去、不佔版面。gap 10 剛好讓相鄰的可點範圍相接不重疊。
  const css = document.createElement('style');
  css.textContent = '[data-allen-dot]{position:relative}'
    + '[data-allen-dot]::after{content:"";position:absolute;inset:-5px;border-radius:50%}';
  dots.appendChild(css);
  const dotEls = ACTS.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-allen-dot', '');
    b.setAttribute('aria-label', t('第 ' + (i + 1) + ' 幕', 'Act ' + (i + 1)));
    b.style.cssText = 'width:14px;height:14px;border-radius:50%;border:1.5px solid rgba(242,239,232,.72);background:transparent;padding:0;cursor:pointer';
    b.addEventListener('click', (ev) => { ev.stopPropagation(); show(i); });
    b.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    dots.appendChild(b);
    return b;
  });

  function paintDots() {
    dotEls.forEach((b, i) => {
      b.style.background = i === cur ? '#FF6B2C' : 'transparent';
      b.style.borderColor = i === cur ? '#FF6B2C' : 'rgba(242,239,232,.72)';
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
  // 開場固定第一幕(Allen 本人);?allenact=1..4 供驗收指定
  let first = 0;
  try {
    const q = parseInt(new URLSearchParams(location.search).get('allenact') || '', 10);
    if (q >= 1 && q <= ACTS.length) first = q - 1;
  } catch (e) {}
  show(first);

  return {
    destroy() {
      dead = true;
      if (act) { try { act.destroy(); } catch (e) {} act = null; }
      // 把舞台還原成掛載前的樣子,重新 mount 才不會疊出第二排切換點
      try { dots.remove(); } catch (e) {}
      stage.innerHTML = fallbackHtml;
      cur = -1;
      try { if (ac) ac.close(); } catch (e) {}
      ctx.destroy();
    }
  };
}
