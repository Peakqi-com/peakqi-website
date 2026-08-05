import { t } from '../i18n.js';
// 關於頁動畫設定(品牌與能力敘事)
export default {
  key: 'about',
  chapters: [
    { id: 'a-hero', label: t('我們是誰', 'Who we are') },
    { id: 'a-why', label: t('為什麼存在', 'Why we exist') },
    { id: 'a-principles', label: t('工作原則', 'Principles') },
    { id: 'a-method', label: t('如何合作', 'How we work') },
    { id: 'a-team', label: t('合作角色', 'Roles') },
    { id: 'a-spectrum', label: t('負責範圍', 'Scope') },
    { id: 'a-governance', label: t('治理原則', 'Governance') }
  ],
  intro: null,
  flags: { rail: true, pageIntro: false, dividers: false }
};
