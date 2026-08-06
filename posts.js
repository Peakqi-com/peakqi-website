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
  {"slug":"inquiry-handoff-gaps","date":"2026-08-06","tags":["ai-adoption","customer-ops"],"hasEn":true,"zh":{"title":"詢問接不住,通常不是因為回覆太慢","summary":"客戶流失的位置多半不在第一則回覆,而在回覆之後的交接。這篇拆解三個常見斷點,以及該先自動化哪一段。","mins":3},"en":{"title":"Losing inquiries is rarely a response-time problem","summary":"Customers usually slip away after the first reply, not before it. Here are the three handoff gaps we keep finding, and which one to automate first.","mins":3}},
  {"slug":"five-questions-before-adopting-ai","date":"2026-08-04","tags":["ai-adoption","automation"],"hasEn":false,"zh":{"title":"導入 AI 之前,先問清楚的五件事","summary":"導入卡住的原因,通常在簽約前就決定了。這五個問題如果談的時候沒有答案,上線之後會加倍還。","mins":2}}
];

// 給頁面用的小工具:取最新 n 篇(英文站自動只取有英文版的)
export function latest(n, lang) {
  const list = lang === 'en' ? POSTS.filter((p) => p.hasEn) : POSTS;
  return list.slice(0, n || 3);
}
