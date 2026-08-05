import { t } from '../i18n.js';
// 導入方法頁動畫設定
export default {
  key: 'method',
  chapters: [
    { id: 'm-hero', label: t('開場', 'Opening') },
    { id: 'm-steps', label: t('六階段', 'Six stages') },
    { id: 'm-timeline', label: t('時程', 'Timeline') },
    { id: 'm-risk', label: t('低風險', 'Lower risk') }
  ],
  intro: null,
  flags: { rail: true, pageIntro: false, dividers: false }
};
