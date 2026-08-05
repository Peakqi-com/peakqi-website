import { t } from '../i18n.js';
// 首頁動畫設定(Hero/四大場景由既有引擎負責;第二輪場景由 home2-engine 負責)
export default {
  key: 'home',
  chapters: [
    { id: 'hero', label: t('開場', 'Opening') },
    { id: 'diagnostic', label: t('流程診斷', 'Diagnostic') },
    { id: 'flow', label: t('接客三步', 'Three steps') },
    { id: 'liveops', label: t('營運控制台', 'Ops console') },
    { id: 'relay', label: t('資料接力', 'Data relay') },
    { id: 'cases', label: t('實際案例', 'Real cases') },
    { id: 'pricing', label: t('方案說明', 'Pricing') },
    { id: 'demo-cta', label: t('預約 Demo', 'Book a demo') }
  ],
  intro: null,
  flags: { rail: true, pageIntro: false, dividers: true }
};
