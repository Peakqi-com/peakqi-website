// 全站唯一的品牌 Entity 與 JSON-LD 建構器 ── 瀏覽器(seo.js)與 Node 建置工具共用。
// 原則:
//  1. Organization 只有一個 @id(https://www.peakqi.com/#organization),所有 Service/Product
//     一律用 provider/publisher 指回這個 @id,搜尋引擎與生成式 AI 才拼得出「同一家公司」。
//  2. 不放無法驗證的資訊:沒有授權的評價、沒簽約的合作、查不到的地址一律不寫
//     (待補項以 TODO_REQUIRES_APPROVAL 註記,由 PeakQi 提供後再加)。
//  3. 不放固定價格:全站採「依需求報價」,JSON-LD 與畫面必須一致。
// 不 import i18n(瀏覽器端 i18n 依賴 location,Node 沒有)── lang 一律由呼叫端傳入。
export const SITE = 'https://www.peakqi.com';
export const ORG_ID = SITE + '/#organization';
export const WEBSITE_ID = SITE + '/#website';

// 核心品牌描述(全站統一版本,改這裡=全站一起改)
export const BRAND_DESC = {
  zh: 'PeakQi 是台灣中小企業 AI 營運自動化與系統整合團隊,協助服務業把 LINE/官網詢問、CRM 跟進、報價、行銷與專案管理串成保留人工審核的工作流程;標準模組最快 10 個工作天上線。',
  en: 'PeakQi is a Taiwan-based AI operations automation and systems integration team for SMBs. We connect LINE and website inquiries, CRM follow-up, quoting, marketing and project management into one workflow that keeps human review in the loop — standard modules go live in as little as 10 working days.'
};

// Entity 關係(消歧義):
//  奇鋒國際有限公司(PeakQi)= 公司與服務團隊
//  Peak Ops = 核心 AI 營運平台(產品)
//  AI Wedding Pro / AI Interior Pro / 冒泡 = 垂直產業解決方案(各自獨立官網)
export function orgJsonLd(lang) {
  const en = lang === 'en';
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: '奇鋒國際有限公司',
    alternateName: ['PeakQi', 'PeakQi International'],
    url: SITE + '/',
    logo: { '@type': 'ImageObject', url: SITE + '/apple-touch-icon.png', width: 180, height: 180 },
    image: SITE + '/og.png',
    description: en ? BRAND_DESC.en : BRAND_DESC.zh,
    email: 'jacky@peakqi.com',
    telephone: '+886-2-6609-3699',
    areaServed: { '@type': 'Country', name: 'Taiwan' },
    knowsLanguage: ['zh-Hant', 'en'],
    // TODO_REQUIRES_APPROVAL: 公司登記地址(address)、台北市電腦公會會員頁、
    // LinkedIn 公司頁等外部檔案連結,待 PeakQi 提供可驗證網址後加入 sameAs。
    sameAs: [
      'https://github.com/Peakqi-com',
      'https://lin.ee/saa67pr'
    ],
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'jacky@peakqi.com',
      telephone: '+886-2-6609-3699',
      availableLanguage: ['zh-Hant', 'en'],
      areaServed: 'TW'
    }]
  };
}

export function webSiteJsonLd(lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'PeakQi 奇鋒國際',
    url: SITE + '/',
    inLanguage: lang === 'en' ? 'en' : 'zh-Hant-TW',
    publisher: { '@id': ORG_ID }
  };
}

// 核心服務(全站共用):AI 營運自動化與系統整合。依需求報價 → 不輸出 Offer 價格。
export function serviceJsonLd(lang) {
  const en = lang === 'en';
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': SITE + '/#service',
    name: en ? 'AI operations automation & systems integration' : 'AI 營運自動化與系統整合',
    serviceType: en
      ? 'AI customer intake, LINE AI support, CRM follow-up, quoting, marketing content and project management integration'
      : 'AI 接客、LINE AI 客服、CRM 跟進、報價、行銷內容與專案管理整合',
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Taiwan' },
    audience: { '@type': 'BusinessAudience', name: en ? 'Taiwan SMBs and service businesses' : '台灣中小企業與服務業' },
    description: en ? BRAND_DESC.en : BRAND_DESC.zh
  };
}

// Peak Ops = 核心 AI 營運平台(產品實體,與 Service 分開)
export function peakOpsJsonLd(lang) {
  const en = lang === 'en';
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': SITE + '/peakops#software',
    name: 'Peak Ops',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE + (en ? '/en/peakops' : '/peakops'),
    description: en
      ? 'Peak Ops is PeakQi’s AI operations platform for Taiwan SMBs: AI intake, CRM, marketing drafts, quotes, project management and analytics in one modular system with human review kept in the loop.'
      : 'Peak Ops 是 PeakQi 的核心 AI 營運平台:AI 接客、CRM、行銷草稿、報價、專案管理與數據儀表板,模組化導入、保留人工審核。',
    provider: { '@id': ORG_ID },
    // 依需求報價:刻意不放 offers 固定價格,JSON-LD 與畫面一致。
    inLanguage: en ? 'en' : 'zh-Hant-TW'
  };
}

export function breadcrumbJsonLd(items) {
  // items: [{ name, url }]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: it.url
    }))
  };
}

export function webPageJsonLd(lang, { url, name, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    name,
    description,
    inLanguage: lang === 'en' ? 'en' : 'zh-Hant-TW',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID }
  };
}
