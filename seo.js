// SEO/head 注入(六頁共用):canonical、OG/Twitter、favicon、schema(Org/Service/WebSite/Breadcrumb)
// 部署時把 SITE 換成正式網域;各 .dc.html 對應正式路由。
// i18n(Phase 0):/en/ 頁自動吃 EN canonical/og:locale;hreflang 對只在
// 「該頁英文版存在」(i18n.EN_READY)時輸出,英文版逐頁上線逐頁生效。
import { LANG, EN_READY } from './i18n.js';
// 主機必須與各頁 canonical、sitemap.xml 完全一致(都是 www)。
// 三者不同源時 Google 會整組忽略 hreflang,雙語版本就配不起來。
const SITE = 'https://www.peakqi.com';
const ROUTES = {
  home: { path: '/', file: '/', name: '首頁', nameEn: 'Home' },
  solutions: { path: '/solutions', file: '/solutions', name: '解決方案', nameEn: 'Solutions' },
  cases: { path: '/cases', file: '/cases', name: '案例與作品', nameEn: 'Case Studies' },
  pricing: { path: '/pricing', file: '/pricing', name: '方案說明', nameEn: 'Pricing' },
  about: { path: '/about', file: '/about', name: '關於 PeakQi', nameEn: 'About PeakQi' },
  method: { path: '/method', file: '/method', name: '導入方法', nameEn: 'How We Deliver' },
  peakops: { path: '/peakops', file: '/peakops', name: 'Peak Ops', nameEn: 'Peak Ops' },
  demo: { path: '/demo', file: '/demo', name: '預約 Demo', nameEn: 'Book a Demo' },
  studio: { path: '/studio', file: '/studio', name: '接案', nameEn: 'Studio' }
};
const enPath = (p) => (p === '/' ? '/en' : '/en' + p);
function el(tag, attrs) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
}
function upsertMeta(sel, attrs) {
  let n = document.head.querySelector(sel);
  if (!n) { n = el('meta', attrs); document.head.appendChild(n); }
  else Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
}
export function applySEO(key) {
  const r = ROUTES[key] || ROUTES.home;
  const en = LANG === 'en';
  const url = SITE + (en ? enPath(r.path) : r.path);
  const title = document.title || 'PeakQi 奇鋒國際';
  const descEl = document.head.querySelector('meta[name="description"]');
  const desc = descEl ? descEl.getAttribute('content') : '';
  if (!document.head.querySelector('link[rel="canonical"]')) document.head.appendChild(el('link', { rel: 'canonical', href: url }));
  // hreflang 對(含 x-default=中文):英文版存在才輸出
  if ((en || EN_READY.indexOf(r.path) >= 0) && !document.head.querySelector('link[hreflang]')) {
    document.head.appendChild(el('link', { rel: 'alternate', hreflang: 'zh-Hant', href: SITE + r.path }));
    document.head.appendChild(el('link', { rel: 'alternate', hreflang: 'en', href: SITE + enPath(r.path) }));
    document.head.appendChild(el('link', { rel: 'alternate', hreflang: 'x-default', href: SITE + r.path }));
  }
  if (!document.head.querySelector('link[rel="icon"]')) document.head.appendChild(el('link', { rel: 'icon', type: 'image/png', href: 'assets/favicon.png' }));
  if (!document.head.querySelector('link[rel="apple-touch-icon"]')) document.head.appendChild(el('link', { rel: 'apple-touch-icon', href: 'assets/favicon.png' }));
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: LANG === 'en' ? 'PeakQi International' : '奇鋒國際 PeakQi' });
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: LANG === 'en' ? 'en_US' : 'zh_TW' });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: desc });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: SITE + '/assets/og-image.png' });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: desc });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: SITE + '/assets/og-image.png' });
  if (!document.getElementById('pq-ld-core')) {
    const org = {
      '@context': 'https://schema.org', '@type': 'Organization',
      name: LANG === 'en' ? 'PeakQi International Ltd.' : '奇鋒國際有限公司',
      alternateName: LANG === 'en' ? '奇鋒國際有限公司' : 'PeakQi', url: SITE,
      logo: SITE + '/assets/favicon.png', email: 'jacky@peakqi.com', telephone: '+886-2-6609-3699',
      areaServed: 'TW'
    };
    const site = {
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: 'PeakQi 奇鋒國際', url: SITE, inLanguage: LANG === 'en' ? 'en' : 'zh-TW'
    };
    const service = {
      '@context': 'https://schema.org', '@type': 'Service',
      name: LANG === 'en' ? 'AI operations platform' : 'AI 整合營運系統',
      provider: { '@type': 'Organization', name: LANG === 'en' ? 'PeakQi International' : '奇鋒國際 PeakQi' },
      areaServed: 'TW',
      description: LANG === 'en'
        ? 'An operations platform for Taiwan SMBs that unifies AI intake, LINE AI support, CRM, marketing content, quotes and project management — live in as little as 10 working days.'
        : '為台灣中小企業整合 AI 接客、LINE AI 客服、CRM、行銷內容、報價與專案管理的營運系統,最快 10 個工作天上線。',
      offers: [
        { '@type': 'Offer', name: 'AI 接客方案', priceCurrency: 'TWD', price: '39000' },
        { '@type': 'Offer', name: 'AI 業務助理', priceCurrency: 'TWD', price: '78000' },
        { '@type': 'Offer', name: 'AI 營運平台', priceCurrency: 'TWD', price: '128000' }
      ]
    };
    const crumbs = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: LANG === 'en' ? 'Home' : '首頁', item: SITE + (LANG === 'en' ? '/en' : '/') },
        ...(key !== 'home' ? [{ '@type': 'ListItem', position: 2, name: LANG === 'en' ? (r.nameEn || r.name) : r.name, item: url }] : [])
      ]
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json'; s.id = 'pq-ld-core';
    s.textContent = JSON.stringify([org, site, service, crumbs]);
    document.head.appendChild(s);
  }
}
