// 方案價格頁動畫設定
export default {
  key: 'pricing',
  chapters: [
    { id: 'p-hero', label: '三方案' },
    { id: 'p-selector', label: '方案選擇' },
    { id: 'p-compare', label: '比較' },
    { id: 'p-usage', label: 'AI 使用量' },
    { id: 'p-custom', label: '客製報價' },
    { id: 'p-timeline', label: '上線流程' },
    { id: 'p-faq', label: 'FAQ' }
  ],
  intro: null,
  // rail 圓點導航在本頁像簡報,改用頁內文字錨點(模板裡的 #pq-anchors)
  flags: { rail: false, pageIntro: false, dividers: false }
};
