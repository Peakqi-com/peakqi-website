// 首頁動畫設定(Hero/四大場景由既有引擎負責;第二輪場景由 home2-engine 負責)
export default {
  key: 'home',
  chapters: [
    { id: 'hero', label: '開場' },
    { id: 'diagnostic', label: '流程診斷' },
    { id: 'flow', label: '接客三步' },
    { id: 'liveops', label: '營運控制台' },
    { id: 'relay', label: '資料接力' },
    { id: 'cases', label: '實際案例' },
    { id: 'pricing', label: '方案說明' },
    { id: 'demo-cta', label: '預約 Demo' }
  ],
  intro: null,
  flags: { rail: true, pageIntro: false, dividers: true }
};
