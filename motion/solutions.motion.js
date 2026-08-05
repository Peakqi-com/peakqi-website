import { t } from '../i18n.js';
// 解決方案頁動畫設定(長篇產品敘事)
export default {
  key: 'solutions',
  chapters: [
    { id: 'overview', label: 'Overview' },
    { id: 'capture', label: 'Capture' },
    { id: 'follow', label: 'Follow' },
    { id: 'nurture', label: 'Nurture' },
    { id: 'sol-division', label: t('分工', 'Split of work') },
    { id: 'modules', label: 'Modules' },
    { id: 'sol-tools', label: t('整合', 'Integration') },
    { id: 'integration', label: t('營運視圖', 'Ops view') },
    { id: 'sol-fit', label: t('適合誰', 'Who it fits') }
  ],
  intro: null, // overview 場景由 solutions-engine 負責
  flags: { rail: true, pageIntro: false, dividers: false }
};
