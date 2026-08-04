for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.9)) {
  scrollTo(0, y); await new Promise(r => requestAnimationFrame(r));
}
scrollTo(0, 0);
await new Promise(r => setTimeout(r, 800));
const L = el => el ? Math.round(el.getBoundingClientRect().left) : null;
const flow = document.querySelector('#flow');
const pain = document.querySelector('#pain');
return JSON.stringify({
  vw: innerWidth,
  pain: {
    wrap: L(pain.querySelector('div[style*="max-width"]')),
    eyebrowNum: L(pain.querySelector('span')),
    h2: L(pain.querySelector('h2')),
    firstCard: L(pain.querySelector('div[style*="border"]'))
  },
  flow: {
    wrap: L(flow.querySelector('div[style*="max-width"]')),
    eyebrowNum: L(flow.querySelector('span')),
    h2: L(flow.querySelector('h2')),
    rail: L(flow.querySelector('[data-rail]')),
    railRow: L(flow.querySelector('[data-rail]') ? flow.querySelector('[data-rail]').parentElement : null),
    deck: L(flow.querySelector('[data-deck]')),
    layer0: L(flow.querySelector('[data-layer="0"]')),
    layer0Inner: L(flow.querySelector('[data-layer="0"] h3'))
  }
}, null, 1);
