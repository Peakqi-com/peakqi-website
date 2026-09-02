// 本機預覽伺服器 ── 會實際套用 vercel.json 的 redirects / rewrites,
// 所以 /blog/<slug> 這種乾淨網址在本機就跟正式站一樣走得通(直接開檔案是驗不出路由問題的)。
//   node tools/serve.mjs [port]
// 只在本機開發用,不影響部署(線上仍是純靜態 + Vercel 路由)。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +(process.argv[2] || 8000);
// --no-rules:純靜態模式(不套 redirects/rewrites)── tools/prerender.mjs 用它直接載模板原始檔
const NO_RULES = process.argv.includes('--no-rules');
const cfg = NO_RULES ? { redirects: [], rewrites: [] } : JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.mp4': 'video/mp4', '.webm': 'video/webm'
};

// vercel 的 :param 轉正則。同一段內 :slug 後面接字面值時要用非貪婪,才吃得到 /blog/x.dc.html
function toRe(src) {
  const names = [];
  const body = src.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([A-Za-z0-9_]+)(\*)?/g, (_, n, star) => {
      names.push(n);
      return star ? '(.*)' : '([^/]+?)';
    });
  return { re: new RegExp('^' + body + '$'), names };
}
const compile = (list) => (list || []).map((r) => ({ ...r, ...toRe(r.source) }));
const REDIRECTS = compile(cfg.redirects);
const REWRITES = compile(cfg.rewrites);

function apply(rules, pathname, searchParams) {
  for (const r of rules) {
    const m = r.re.exec(pathname);
    if (!m) continue;
    // vercel 的 has 條件(僅支援 query 型,夠本站用):全部符合才算命中
    if (r.has && !r.has.every((h) => h.type === 'query' && searchParams &&
      (h.value == null ? searchParams.has(h.key) : searchParams.get(h.key) === h.value))) continue;
    let dest = r.destination;
    r.names.forEach((n, i) => { dest = dest.split(':' + n).join(m[i + 1]); });
    return dest;
  }
  return null;
}

const exists = (p) => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } };

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(u.pathname);

  // 1) redirects
  const red = apply(REDIRECTS, pathname, u.searchParams);
  if (red) { res.writeHead(308, { Location: red + (u.search || '') }); return res.end(); }

  // 2) 檔案系統(Vercel 的順序:redirects → 靜態檔 → rewrites)
  const direct = path.join(ROOT, pathname.replace(/^\/+/, ''));
  let file = exists(direct) ? direct : null;

  // 3) rewrites
  if (!file) {
    const rw = apply(REWRITES, pathname);
    if (rw) { const p = path.join(ROOT, rw.replace(/^\/+/, '')); if (exists(p)) file = p; }
  }

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('404 ' + pathname);
  }
  // 目錄穿越保護:解析後必須仍在專案目錄內
  if (!path.resolve(file).startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }

  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`本機預覽:http://localhost:${PORT}/blog  (Ctrl+C 結束)`));
