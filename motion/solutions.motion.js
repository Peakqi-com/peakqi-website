// 解決方案頁動畫設定(長篇產品敘事)
export default {
  key: 'solutions',
  chapters: [
    { id: 'overview', label: 'Overview' },
    { id: 'capture', label: '接客 Capture' },
    { id: 'follow', label: '追客 Follow' },
    { id: 'nurture', label: '養客 Nurture' },
    { id: 'modules', label: '六模組' },
    { id: 'integration', label: 'Demo' }
  ],
  intro: null, // overview 場景由 solutions-engine 負責
  flags: { rail: true, pageIntro: false, dividers: false }
};
