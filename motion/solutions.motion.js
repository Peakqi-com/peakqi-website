// 解決方案頁動畫設定(長篇產品敘事)
export default {
  key: 'solutions',
  chapters: [
    { id: 'overview', label: 'Overview' },
    { id: 'capture', label: 'Capture' },
    { id: 'follow', label: 'Follow' },
    { id: 'nurture', label: 'Nurture' },
    { id: 'sol-division', label: '分工' },
    { id: 'modules', label: 'Modules' },
    { id: 'sol-tools', label: '整合' },
    { id: 'integration', label: '營運視圖' },
    { id: 'sol-fit', label: '適合誰' }
  ],
  intro: null, // overview 場景由 solutions-engine 負責
  flags: { rail: true, pageIntro: false, dividers: false }
};
