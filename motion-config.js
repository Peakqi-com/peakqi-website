// PeakQi 集中動畫設定:tokens、斷點、距離、能力分級、feature flags
// 各頁專屬設定在 motion/<page>.motion.js(禁止把所有 trigger 集中一檔)
export const DUR = { fast: 160, base: 320, slow: 700, cinema: 1100 };
export const EASE = {
  out: 'cubic-bezier(0.16,1,0.3,1)',
  inout: 'cubic-bezier(0.65,0,0.35,1)',
  spring: 'cubic-bezier(0.34,1.56,0.64,1)'
};
export const ezOut = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
export const ezSmooth = (t) => { t = Math.min(Math.max(t, 0), 1); return t * t * (3 - 2 * t); };
export const SCROLL = {
  introVhMin: 80, introVhMax: 140,     // 頁面開場章節高度範圍
  heroPin: '360vh', flowPin: '265vh',  // 既有大場景(不動)
  chapterActivate: 0.4                 // 視窗高度 40% 線決定目前章節
};
export const BP = { mobile: 900, wide: 1200 };
export const COLORS = { ink: '#090B0E', ivory: '#F2EFE8', orange: '#FF6B2C', blue: '#3E9BFF', green: '#65E0BC' };

// 裝置能力分級:full(全動畫+WebGL)/ lite(2D 動畫,無 WebGL/cursor)/ static(reduced 或 save-data)
export function capabilityTier() {
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const save = !!(navigator.connection && navigator.connection.saveData);
  if (reduced || save) return 'static';
  const lowMem = !!(navigator.deviceMemory && navigator.deviceMemory < 4);
  const coarse = !(window.matchMedia && window.matchMedia('(pointer:fine)').matches);
  const narrow = (window.innerWidth || 0) < BP.mobile;
  if (lowMem || (coarse && narrow)) return 'lite';
  return 'full';
}
export const FLAGS = {
  webgl: true,        // gl-engine(自帶降級)
  cursor: true,       // micro-engine cursor follower
  rail: true,         // PageProgressRail
  pageIntro: false,   // 各頁 80–140vh 開場(下一批逐頁開啟)
  dividers: false     // CinematicDivider(下一批)
};
export const reducedVariant = {
  // reduced-motion 不是 duration=0:各元件的靜態替代策略
  pageIntro: 'static-title',   // 直接顯示標題+編號,不 pin
  maskReveal: 'visible',       // 圖片直接可見
  dataLine: 'complete',        // 線條顯示完成態
  parallax: 'none',
  rail: 'instant-jump'         // 跳轉用 behavior:auto
};
