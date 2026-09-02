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
  {"slug":"ai-automation-cost-and-timeline","date":"2026-09-02","tags":["ai-adoption","automation"],"hasEn":false,"zh":{"title":"中小企業導入 AI 自動化要多少錢、多久上線?費用結構完整拆解","summary":"不給一個假裝精確的總價,而是把導入費、月費、使用量費三塊拆開,說明每一塊由什麼決定、時程怎麼估,以及哪些情況會變貴。","mins":4}},
  {"slug":"how-to-choose-ai-automation-partner","date":"2026-09-02","tags":["ai-adoption","automation"],"hasEn":false,"zh":{"title":"台灣中小企業 AI 自動化公司怎麼選:六個問題先問清楚","summary":"選 AI 自動化廠商,重點不是功能清單,而是流程、資料、人工審核與退場條件。這篇整理六個簽約前該問的問題與一張比較表。","mins":4}},
  {"slug":"line-ai-support-crm-integration","date":"2026-09-02","tags":["automation","customer-ops"],"hasEn":false,"zh":{"title":"LINE AI 客服怎麼串接 CRM?從接住詢問到自動建檔的完整流程","summary":"LINE 官方帳號接上 AI 只解決一半問題——回完的對話沒有進 CRM,追客還是靠人腦。這篇拆解串接的四個環節、常見斷點與導入步驟。","mins":4}},
  {"slug":"built-a-website-with-claude-code","date":"2026-08-08","tags":["build-notes","ai-adoption"],"cover":"/assets/blog/tower.webp","hasEn":true,"zh":{"title":"十年沒寫程式,我用 Claude Code 蓋了一個網站","summary":"我會寫程式,但十年沒動過;我做動畫,但不會製作素材。16 個工作天、414 個提交,一個人從零做出中英雙語 32 頁的公司官網。這是完整的工作記錄——包含卡住的那一天、丟掉的東西,以及一個我沒想到的解法。","mins":11},"en":{"title":"I hadn't written code in ten years. I built a website with Claude Code.","summary":"I can write code, but I hadn't in ten years. I work in animation, but I can't produce assets. 414 commits across 16 working days, one person, a 32-page bilingual company site. This is the working record — including the day I got stuck, what I threw away, and one solution I didn't see coming.","mins":11}}
];

// 給頁面用的小工具:取最新 n 篇(英文站自動只取有英文版的)
export function latest(n, lang) {
  const list = lang === 'en' ? POSTS.filter((p) => p.hasEn) : POSTS;
  return list.slice(0, n || 3);
}
