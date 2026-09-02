// SEO/head 注入(執行期補位):canonical、OG/Twitter、favicon、hreflang、JSON-LD。
// JSON-LD 一律來自 seo-schema.js(唯一品牌 Entity 來源;Node 建置工具用同一份)。
// 建置後的頁面(tools/prerender.mjs)已把同一組標記靜態寫進 head ── 這裡每一步都先檢查
// 「已存在就不再注入」,所以預渲染頁上等於 no-op,未預渲染頁仍有完整補位。
import { LANG, EN_READY } from './i18n.js';
import { SITE, orgJsonLd, webSiteJsonLd, serviceJsonLd, breadcrumbJsonLd } from './seo-schema.js';
// 主機必須與各頁 canonical、sitemap.xml 完全一致(都是 www)。
// 三者不同源時 Google 會整組忽略 hreflang,雙語版本就配不起來。
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
    const crumbs = breadcrumbJsonLd([
      { name: LANG === 'en' ? 'Home' : '首頁', url: SITE + (LANG === 'en' ? '/en' : '/') },
      ...(key !== 'home' ? [{ name: LANG === 'en' ? (r.nameEn || r.name) : r.name, url }] : [])
    ]);
    const s = document.createElement('script');
    s.type = 'application/ld+json'; s.id = 'pq-ld-core';
    s.textContent = JSON.stringify([orgJsonLd(LANG), webSiteJsonLd(LANG), serviceJsonLd(LANG), crumbs]);
    document.head.appendChild(s);
  }
}
