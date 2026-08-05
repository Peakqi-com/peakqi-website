// 圖片健康檢查:蒐集 <img> 與 background-image 的 URL,實際 fetch 驗狀態
await new Promise((r) => setTimeout(r, 3000));
const urls = new Map();   // url -> where
const add = (u, where) => {
  if (!u || u.startsWith('data:')) return;
  try { u = new URL(u, location.href).href; } catch (e) { return; }
  if (!urls.has(u)) urls.set(u, where);
};
document.querySelectorAll('img').forEach((im) => add(im.currentSrc || im.src, 'img'));
document.querySelectorAll('body *').forEach((el) => {
  const bg = getComputedStyle(el).backgroundImage;
  if (!bg || bg === 'none') return;
  const m = bg.match(/url\(["']?([^"')]+)["']?\)/g) || [];
  m.forEach((one) => {
    const u = one.replace(/url\(["']?/, '').replace(/["']?\)$/, '');
    add(u, 'bg:' + (el.className || el.tagName).toString().slice(0, 24));
  });
});
const list = Array.from(urls.entries());
const bad = [];
for (const [u, where] of list) {
  try {
    const r = await fetch(u, { method: 'GET' });
    if (!r.ok) bad.push({ u: u.slice(-58), where, st: r.status });
  } catch (e) { bad.push({ u: u.slice(-58), where, st: 'ERR' }); }
}
return JSON.stringify({ lang: document.documentElement.lang, total: list.length, badCount: bad.length, bad: bad.slice(0, 12) });
