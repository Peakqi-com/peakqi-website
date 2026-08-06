// 新文章草稿產生器
//   node tools/new-post.mjs <slug> "文章標題" [--en] [--date=YYYY-MM-DD]
// 例:
//   node tools/new-post.mjs line-inquiry-handoff "LINE 詢問接不住的三個斷點"
//   node tools/new-post.mjs line-inquiry-handoff "..." --en      ← 同時開英文稿
//
// 只產生 content/blog/ 底下的 .md 草稿。寫完內文後跑 node tools/build-blog.mjs 才會產生網頁。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'content', 'blog');

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const rest = args.filter((a) => !a.startsWith('--'));
const slug = (rest[0] || '').trim();
const title = (rest[1] || '').trim();
const withEn = flags.includes('--en');
const dateFlag = (flags.find((f) => f.startsWith('--date=')) || '').slice(7);

if (!slug || !title) {
  console.log('用法:node tools/new-post.mjs <slug> "文章標題" [--en] [--date=YYYY-MM-DD]');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.log('slug 只能用小寫英數與連字號(它會直接變成網址 /blog/<slug>)');
  process.exit(1);
}

const today = dateFlag || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) { console.log('--date 格式需為 YYYY-MM-DD'); process.exit(1); }

const skeleton = (lang) => `---
title: ${lang === 'zh' ? title : 'TODO: English title'}
summary: ${lang === 'zh' ? 'TODO:一句話說完這篇在講什麼(也會當成分享預覽的描述,60 字內)' : 'TODO: one sentence — also used as the share preview description, under 155 characters.'}
date: ${today}
tags: ai-adoption
cover:
coverAlt:
updated:
draft: true
---

${lang === 'zh' ? `## 先講結論

TODO

## 為什麼會這樣

TODO

## 可以怎麼做

TODO
` : `## The short version

TODO

## Why it happens

TODO

## What to do about it

TODO
`}`;

fs.mkdirSync(SRC, { recursive: true });
const made = [];
for (const lang of withEn ? ['zh', 'en'] : ['zh']) {
  const f = path.join(SRC, `${slug}.${lang}.md`);
  if (fs.existsSync(f)) { console.log(`已存在,略過:content/blog/${slug}.${lang}.md`); continue; }
  fs.writeFileSync(f, skeleton(lang), 'utf8');
  made.push(`content/blog/${slug}.${lang}.md`);
}

console.log('\n已建立:');
made.forEach((f) => console.log('  ' + f));
console.log(`
接下來:
  1. 編輯上面的檔案,寫完內文
  2. 把 front matter 的 draft: true 拿掉(留著就不會產出網頁)
  3. node tools/build-blog.mjs
  4. commit → push → 部署

標籤可用值見 tools/build-blog.mjs 的 TAGS;封面請放 /assets/blog/ 並用絕對路徑填 cover。
只寫中文完全可以 —— 沒有 ${slug}.en.md 就代表這篇沒有英文版,英文站不會列出、也不會產生死連結。
`);
