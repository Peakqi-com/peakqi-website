// 色卡牆:漂移有動、卷軸隱藏、meta 兩行置中
const s = document.querySelector('#a-ind-strip');
s.scrollIntoView({ block: 'center' });
await new Promise((r) => setTimeout(r, 4500));
const meta = s.querySelector('.pq-ind-meta');
const tt = meta.querySelector('.tt');
const em = meta.querySelector('em');
return JSON.stringify({
  scrollLeft: Math.round(s.scrollLeft),
  sbWidth: getComputedStyle(s).scrollbarWidth || 'n/a',
  metaDir: getComputedStyle(meta).flexDirection,
  ttCenterX: tt ? Math.round(tt.getBoundingClientRect().left + tt.getBoundingClientRect().width / 2 - meta.getBoundingClientRect().left - meta.getBoundingClientRect().width / 2) : null,
  emCenterX: em ? Math.round(em.getBoundingClientRect().left + em.getBoundingClientRect().width / 2 - meta.getBoundingClientRect().left - meta.getBoundingClientRect().width / 2) : null
});
