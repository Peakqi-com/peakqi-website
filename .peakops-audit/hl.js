await new Promise((r)=>setTimeout(r,2000));
return JSON.stringify({
  canonical: (document.head.querySelector('link[rel="canonical"]')||{}).href,
  hreflang: [...document.head.querySelectorAll('link[hreflang]')].map(l=>l.getAttribute('hreflang')+'='+l.getAttribute('href')),
  ogUrl: (document.head.querySelector('meta[property="og:url"]')||{}).content
});
