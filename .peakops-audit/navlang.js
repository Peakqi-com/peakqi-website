// Phase 0 驗證:lang 屬性、hreflang 未輸出(EN_READY 空)、og:locale、切換鈕隱藏、無爆版
await new Promise((r) => setTimeout(r, 1800));
return JSON.stringify({
  lang: document.documentElement.lang,
  hreflang: document.querySelectorAll('link[hreflang]').length,
  ogLocale: (document.querySelector('meta[property="og:locale"]') || {}).content || null,
  canonical: (document.querySelector('link[rel="canonical"]') || {}).href || null,
  toggle: !!document.querySelector('a[aria-label="Switch language"]'),
  over: document.scrollingElement.scrollWidth - innerWidth
});
