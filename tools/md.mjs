// 極簡 Markdown 子集轉 HTML ── 零依賴、只在本機跑(產出物 commit 進 repo,線上仍是純靜態)
// 支援:## / ### 標題、段落、清單、有序清單、引言、圍欄程式碼、表格、圖片、水平線、
//      行內 **粗體** *斜體* `程式碼` [連結](url) ![圖](src)
// 刻意不支援:巢狀清單、腳註、HTML 屬性白名單 ── 部落格文章用不到,少一分維護成本。
// 逸出策略:一律先 escape 全文再套語法,作者無法注入 HTML;要嵌入原生標記請整段以 < 開頭(passthrough)。

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);

// 只允許安全協定,擋掉 javascript: / data: 這類 href
const SAFE = /^(https?:\/\/|\/|#|mailto:|tel:)/i;
const safeHref = (h) => (SAFE.test(h) ? h : '');

export function parseFrontMatter(src) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  m[1].split(/\r?\n/).forEach((line) => {
    if (!line.trim() || /^\s*#/.test(line)) return;
    const i = line.indexOf(':');
    if (i < 0) return;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    meta[k] = v;
  });
  return { meta, body: src.slice(m[0].length) };
}

// 圖片/連結/粗體/斜體。傳入「已逸出」的文字。
function marks(s) {
  // 圖片要先於連結,否則 ![a](b) 的 [a](b) 會先被連結規則吃掉
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
    const u = safeHref(src);
    return u ? `<img src="${u}" alt="${alt}" loading="lazy" decoding="async">` : alt;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, href) => {
    const u = safeHref(href);
    if (!u) return txt;
    const ext = /^https?:\/\//i.test(u);
    return `<a href="${u}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${txt}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}

// 行內語法:用反引號切段,奇數段是程式碼(只逸出、不套語法),偶數段才跑其餘規則。
// 不使用佔位字元,從根本避免佔位符和內文撞在一起。
function inline(raw) {
  const parts = String(raw).split('`');
  // 反引號沒有成對(段數為偶)→ 整段當純文字,不要吃掉半個句子
  if (parts.length % 2 === 0) return marks(esc(raw));
  return parts.map((seg, i) => (i % 2 ? '<code>' + esc(seg) + '</code>' : marks(esc(seg)))).join('');
}

const isBlank = (l) => !l.trim();

export function mdToHtml(body) {
  const lines = String(body).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const takeWhile = (fn) => { const buf = []; while (i < lines.length && fn(lines[i])) buf.push(lines[i++]); return buf; };

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }

    // 圍欄程式碼:內容原樣逸出,不套任何行內語法
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      i++;
      const buf = takeWhile((l) => !/^```/.test(l));
      if (i < lines.length) i++;                       // 吃掉收尾的 ```
      out.push('<pre class="pb-code"' + (lang ? ` data-lang="${esc(lang)}"` : '') + `><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // 原生 HTML 段落 passthrough(整段以 < 開頭)── 內嵌 iframe/自訂區塊的逃生口
    if (/^</.test(line)) { out.push(takeWhile((l) => !isBlank(l)).join('\n')); continue; }

    // 水平線
    if (/^(---|\*\*\*|___)\s*$/.test(line)) { out.push('<hr class="pb-hr">'); i++; continue; }

    // 標題:文章大標由 front matter 提供,內文只用 ## / ###
    const h = /^(#{2,4})\s+(.*)$/.exec(line);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2].trim())}</h${h[1].length}>`); i++; continue; }

    // 引言
    if (/^>\s?/.test(line)) {
      const buf = takeWhile((l) => /^>\s?/.test(l)).map((l) => l.replace(/^>\s?/, ''));
      out.push(`<blockquote class="pb-quote">${inline(buf.join(' '))}</blockquote>`);
      continue;
    }

    // 表格:| a | b | 後面必須緊跟一列分隔線
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const cells = (l) => l.replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
      const head = cells(lines[i]);
      i += 2;
      const rows = takeWhile((l) => /^\|/.test(l)).map(cells);
      out.push('<div class="pb-tablewrap"><table class="pb-table"><thead><tr>' +
        head.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>');
      continue;
    }

    // 有序清單
    if (/^\d+[.)]\s+/.test(line)) {
      const buf = takeWhile((l) => /^\d+[.)]\s+/.test(l)).map((l) => l.replace(/^\d+[.)]\s+/, ''));
      out.push('<ol class="pb-list">' + buf.map((b) => `<li>${inline(b)}</li>`).join('') + '</ol>');
      continue;
    }

    // 無序清單
    if (/^[-*+]\s+/.test(line)) {
      const buf = takeWhile((l) => /^[-*+]\s+/.test(l)).map((l) => l.replace(/^[-*+]\s+/, ''));
      out.push('<ul class="pb-list">' + buf.map((b) => `<li>${inline(b)}</li>`).join('') + '</ul>');
      continue;
    }

    // 段落:連續非空行合併成一段
    const buf = takeWhile((l) => !isBlank(l) && !/^(```|>|#{2,4}\s|[-*+]\s|\d+[.)]\s|\||<)/.test(l));
    if (!buf.length) { i++; continue; }
    const text = buf.join(' ').trim();
    // 整段只有一張圖 → 轉成 figure(圖說取 alt),文章裡的圖才有正確語意與間距
    const only = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(text);
    if (only && safeHref(only[2])) {
      out.push(`<figure class="pb-fig"><img src="${safeHref(only[2])}" alt="${esc(only[1])}" loading="lazy" decoding="async">` +
        (only[1] ? `<figcaption>${esc(only[1])}</figcaption>` : '') + '</figure>');
    } else {
      out.push(`<p>${inline(text)}</p>`);
    }
  }
  return out.join('\n');
}

// 閱讀時間:中文按字數、西文按詞數,兩者相加後無條件進位(最少 1 分鐘)
const CJK = /[一-鿿㐀-䶿　-〿＀-￯]/g;
export function readMins(body, lang) {
  const plain = String(body).replace(/```[\s\S]*?```/g, ' ').replace(/[#>*`|_-]/g, ' ');
  const cjk = (plain.match(CJK) || []).length;
  const words = (plain.replace(CJK, ' ').match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;
  return Math.max(1, Math.ceil(cjk / 380 + words / (lang === 'en' ? 220 : 200)));
}

// 從產出的 HTML 取第一段當摘要(front matter 沒填 summary 時的備援)
export function autoSummary(html, max) {
  const p = /<p>([\s\S]*?)<\/p>/.exec(html);
  const txt = (p ? p[1] : '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  return txt.length > max ? txt.slice(0, max - 1) + '…' : txt;
}
