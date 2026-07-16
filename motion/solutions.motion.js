// 解決方案頁動畫設定(長篇產品敘事)
export default {
  key: 'solutions',
  chapters: [
    { id: 'overview', label: 'Overview' },
    { id: 'capture', label: 'Capture' },
    { id: 'follow', label: 'Follow' },
    { id: 'nurture', label: 'Nurture' },
    { id: 'modules', label: 'Modules' },
    { id: 'integration', label: 'Demo' }
  ],
  intro: null, // overview 場景由 solutions-engine 負責
  flags: { rail: true, pageIntro: false, dividers: false }
};
