// 自動產生 ── 請勿手改。改內容請編輯 content/blog/*.md 後執行:node tools/build-blog.mjs
// 文章索引(新→舊)。hasEn=false 代表這篇只有中文版:英文列表不列出、不輸出 hreflang。
export const TAGS = {
  "ai-adoption": {"zh":"AI 導入","en":"AI adoption"},
  "automation": {"zh":"流程自動化","en":"Automation"},
  "customer-ops": {"zh":"客戶經營","en":"Customer ops"},
  "industry": {"zh":"產業觀察","en":"Industry"},
  "build-notes": {"zh":"製作筆記","en":"Build notes"}
};

export const POSTS = [
  {"slug":"built-a-website-with-claude-code","date":"2026-08-08","tags":["build-notes","ai-adoption"],"cover":"/assets/blog/tower.webp","hasEn":true,"zh":{"title":"我不會寫程式,我用 Claude Code 蓋了一個網站","summary":"2026 年 7 月 16 日到 8 月 8 日,16 個工作天、414 個提交,一個人從零做出中英雙語 32 頁的公司官網。這是完整的工作記錄——包含卡住的那一天、丟掉的東西,以及一個我沒想到的解法。","mins":9},"en":{"title":"I can't code. I built a website with Claude Code.","summary":"414 commits across 16 working days, July 16 to August 8, 2026. One person, a 32-page bilingual company site, built from nothing. This is the working record — including the day I got stuck, what I threw away, and one solution I didn't see coming.","mins":9}}
];

// 給頁面用的小工具:取最新 n 篇(英文站自動只取有英文版的)
export function latest(n, lang) {
  const list = lang === 'en' ? POSTS.filter((p) => p.hasEn) : POSTS;
  return list.slice(0, n || 3);
}
