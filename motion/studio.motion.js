import { t } from '../i18n.js';
// 接案頁動畫設定(章節導覽 rail)
export default {
  key: 'studio',
  chapters: [
    { id: 's-hero', label: t('開場', 'Opening') },
    { id: 's-rack', label: t('接案與價格', 'Rates') },
    { id: 's-directions', label: t('能接什麼', 'What we take') },
    { id: 's-caps', label: t('核心能力', 'Capabilities') },
    { id: 's-work', label: t('實績', 'Work') },
    { id: 's-runway', label: t('合作流程', 'Process') }
  ],
  intro: null,
  flags: { rail: true, pageIntro: false, dividers: false }
};
