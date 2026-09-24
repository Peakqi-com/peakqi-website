// 自動產生 ── 請勿手改。改內容請編輯 content/blog/*.md 後執行:node tools/build-blog.mjs
// 文章索引(新→舊)。hasEn=false 代表這篇只有中文版:英文列表不列出、不輸出 hreflang。
export const TAGS = {
  "ai-adoption": {"zh":"AI 導入","en":"AI adoption"},
  "automation": {"zh":"流程自動化","en":"Automation"},
  "customer-ops": {"zh":"客戶經營","en":"Customer ops"},
  "industry": {"zh":"產業觀察","en":"Industry"},
  "build-notes": {"zh":"製作筆記","en":"Build notes"},
  "news": {"zh":"公司動態","en":"News"}
};

export const POSTS = [
  {"slug":"ntpc-ai-hackathon-2026-land-appraisal-win","date":"2026-09-24","tags":["news","ai-adoption"],"cover":"/assets/blog/ntpc-ai-hackathon-2026.webp","hasEn":true,"zh":{"title":"特別報導:「AI城市起風」拿下新北市 AI 智慧城市黑客松地政局組優勝,這支隊伍來自奇鋒國際","summary":"新北市首屆 AI 黑客松 71 組取 5 組優勝,奇鋒國際團隊以隊名「AI城市起風」拿下地政局組優勝。做了什麼、守了哪些原則。","mins":10},"en":{"title":"Special report: PeakQi's team AI城市起風 wins the Land Office track at New Taipei's AI Smart City Hackathon","summary":"71 teams, 5 winners at New Taipei's first AI hackathon. PeakQi's team, entered as AI城市起風, won the Land Office track. What we built, and the rules we kept.","mins":10}},
  {"slug":"ai-crm-vs-traditional-crm","date":"2026-09-24","tags":["ai-adoption","customer-ops"],"cover":"/assets/blog/ai-crm-vs-traditional-crm.webp","hasEn":true,"zh":{"title":"AI CRM 跟傳統 CRM 差在哪?一張表看懂,再決定要不要換","summary":"傳統 CRM 等你填;AI CRM 把對話變成客戶卡、把下一步排出來。一張比較表,加上什麼情況傳統 CRM 其實就夠。","mins":7},"en":{"title":"AI CRM vs traditional CRM: the real difference, in one table","summary":"A traditional CRM stores what you type; an AI CRM turns conversations into records and schedules the next step. One table, plus when the old CRM is enough.","mins":7}},
  {"slug":"n8n-vs-saas-vs-custom-ai-platform","date":"2026-09-24","tags":["ai-adoption","automation"],"cover":"/assets/blog/n8n-vs-saas-vs-custom-ai-platform.webp","hasEn":true,"zh":{"title":"n8n、套裝 SaaS、客製 AI 平台怎麼選?先問「壞掉的時候誰修」","summary":"三條路都能把 AI 接進流程,差別在誰負責讓它持續運作。從維運、資料、改動成本與轉真人機制比較,並說明各自適合誰。","mins":7},"en":{"title":"n8n, packaged SaaS or a custom AI platform? Ask first: who fixes it when it breaks","summary":"All three can wire AI into a process; the difference is who keeps it running. Compared on operations, data, cost of change and human handoff.","mins":8}},
  {"slug":"ai-automation-cost-and-timeline","date":"2026-09-02","tags":["ai-adoption","automation"],"cover":"/assets/blog/ai-automation-cost-and-timeline.webp","hasEn":true,"zh":{"title":"中小企業導入 AI 自動化要多少錢、多久上線?費用結構完整拆解","summary":"不給一個假裝精確的總價,而是把導入費、月費、使用量費三塊拆開,說明每一塊由什麼決定、時程怎麼估,以及哪些情況會變貴。","mins":4},"en":{"title":"What AI automation costs a small business, and how long it takes to launch","summary":"Setup fee, monthly fee and usage cost, broken apart: what drives each one, how to estimate the timeline, and what makes a project more expensive.","mins":4}},
  {"slug":"how-to-choose-ai-automation-partner","date":"2026-09-02","tags":["ai-adoption","automation"],"cover":"/assets/blog/how-to-choose-ai-automation-partner.webp","hasEn":true,"zh":{"title":"台灣中小企業 AI 自動化公司怎麼選:六個問題先問清楚","summary":"選 AI 自動化廠商,重點不是功能清單,而是流程、資料、人工審核與退場條件。這篇整理六個簽約前該問的問題與一張比較表。","mins":4},"en":{"title":"How to choose an AI automation partner in Taiwan: six questions to ask first","summary":"Choosing an AI automation vendor isn't about the feature list — it's process, data, human review and exit terms. Six questions to ask before signing.","mins":5}},
  {"slug":"line-ai-support-crm-integration","date":"2026-09-02","tags":["automation","customer-ops"],"cover":"/assets/blog/line-ai-support-crm-integration.webp","hasEn":true,"zh":{"title":"LINE AI 客服怎麼串接 CRM?從接住詢問到自動建檔的完整流程","summary":"LINE 官方帳號接上 AI 只解決一半問題——回完的對話沒有進 CRM,追客還是靠人腦。這篇拆解串接的四個環節、常見斷點與導入步驟。","mins":4},"en":{"title":"Connecting LINE AI support to your CRM: from first enquiry to an automatic record","summary":"AI on a LINE Official Account solves half the problem: if the chat never reaches your CRM, follow-up still runs on memory. Four links, four breaks.","mins":5}},
  {"slug":"built-a-website-with-claude-code","date":"2026-08-08","tags":["build-notes","ai-adoption"],"cover":"/assets/blog/tower.webp","hasEn":true,"zh":{"title":"十年沒寫程式,我用 Claude Code 蓋了一個網站","summary":"我會寫程式,但十年沒動過;我做動畫,但不會製作素材。16 個工作天、414 個提交,一個人從零做出中英雙語 32 頁的公司官網。這是完整的工作記錄——包含卡住的那一天、丟掉的東西,以及一個我沒想到的解法。","mins":11},"en":{"title":"I hadn't written code in ten years. I built a website with Claude Code.","summary":"I can write code, but I hadn't in ten years. I work in animation, but I can't produce assets. 414 commits across 16 working days, one person, a 32-page bilingual company site. This is the working record — including the day I got stuck, what I threw away, and one solution I didn't see coming.","mins":11}}
];

// 給頁面用的小工具:取最新 n 篇(英文站自動只取有英文版的)
export function latest(n, lang) {
  const list = lang === 'en' ? POSTS.filter((p) => p.hasEn) : POSTS;
  return list.slice(0, n || 3);
}
