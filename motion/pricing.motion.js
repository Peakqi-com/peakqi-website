import { t } from '../i18n.js';
// 方案價格頁動畫設定
export default {
  key: 'pricing',
  chapters: [
    { id: 'p-hero', label: t('三方案', 'Three plans') },
    { id: 'p-selector', label: t('方案選擇', 'Choose a plan') },
    { id: 'p-compare', label: t('比較', 'Compare') },
    { id: 'p-usage', label: t('AI 使用量', 'AI usage') },
    { id: 'p-custom', label: t('客製報價', 'Custom quote') },
    { id: 'p-timeline', label: t('上線流程', 'Launch') },
    { id: 'p-faq', label: 'FAQ' }
  ],
  intro: null,
  // rail 圓點導航在本頁像簡報,改用頁內文字錨點(模板裡的 #pq-anchors)
  flags: { rail: false, pageIntro: false, dividers: false }
};
