import { t } from '../i18n.js';
// 案例與作品頁動畫設定(長篇)
export default {
  key: 'cases',
  chapters: [
    { id: 'wall', label: t('開場', 'Opening') },
    { id: 'stories', label: 'Featured' },
    { id: 'index', label: t('全部實績', 'All work') },
    { id: 'custom', label: t('客製系統', 'Custom builds') }
  ],
  intro: null,
  flags: { rail: true, pageIntro: false, dividers: false }
};
