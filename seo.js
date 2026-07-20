// SEO/head 注入(六頁共用):canonical、OG/Twitter、favicon、schema(Org/Service/WebSite/Breadcrumb)
// 部署時把 SITE 換成正式網域;各 .dc.html 對應正式路由。
const SITE = 'https://peakqi.com';
const ROUTES = {
  home: { path: '/', file: 'Home.dc.html', name: '首頁' },
  solutions: { path: '/solutions', file: 'Solutions.dc.html', name: '解決方案' },
  cases: { path: '/cases', file: 'Cases.dc.html', name: '案例與作品' },
  pricing: { path: '/pricing', file: 'Pricing.dc.html', name: '方案價格' },
  about: { path: '/about', file: 'About.dc.html', name: '關於 PeakQi' },
  demo: { path: '/demo', file: 'Demo.dc.html', name: '預約 Demo' }
};
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
  const url = SITE + r.path;
  const title = document.title || 'PeakQi 奇鋒國際';
  const descEl = document.head.querySelector('meta[name="description"]');
  const desc = descEl ? descEl.getAttribute('content') : '';
  if (!document.head.querySelector('link[rel="canonical"]')) document.head.appendChild(el('link', { rel: 'canonical', href: url }));
  if (!document.head.querySelector('link[rel="icon"]')) document.head.appendChild(el('link', { rel: 'icon', type: 'image/png', href: 'assets/favicon.png' }));
  if (!document.head.querySelector('link[rel="apple-touch-icon"]')) document.head.appendChild(el('link', { rel: 'apple-touch-icon', href: 'assets/favicon.png' }));
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: '奇鋒國際 PeakQi' });
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'zh_TW' });
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
      name: '奇鋒國際有限公司', alternateName: 'PeakQi', url: SITE,
      logo: SITE + '/assets/favicon.png', email: 'jacky@peakqi.com', telephone: '+886-2-6609-3699',
      areaServed: 'TW'
    };
    const site = {
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: 'PeakQi 奇鋒國際', url: SITE, inLanguage: 'zh-TW'
    };
    const service = {
      '@context': 'https://schema.org', '@type': 'Service',
      name: 'AI 整合營運系統', provider: { '@type': 'Organization', name: '奇鋒國際 PeakQi' },
      areaServed: 'TW',
      description: '為台灣中小企業整合 AI 接客、LINE AI 客服、CRM、行銷內容、報價與專案管理的營運系統,最快 10 個工作天上線。',
      offers: [
        { '@type': 'Offer', name: 'AI 接客方案', priceCurrency: 'TWD', price: '39000' },
        { '@type': 'Offer', name: 'AI 業務助理', priceCurrency: 'TWD', price: '78000' },
        { '@type': 'Offer', name: 'AI 營運平台', priceCurrency: 'TWD', price: '128000' }
      ]
    };
    const crumbs = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首頁', item: SITE + '/' },
        ...(key !== 'home' ? [{ '@type': 'ListItem', position: 2, name: r.name, item: url }] : [])
      ]
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json'; s.id = 'pq-ld-core';
    s.textContent = JSON.stringify([org, site, service, crumbs]);
    document.head.appendChild(s);
  }
}
