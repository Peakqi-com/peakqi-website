# 表單收件設定(api/submit.js)

前端送出 → `/api/submit` → 寫到你設定的出口(可同時多個)。
在 **Vercel → 專案 → Settings → Environment Variables** 設定,重新部署後生效。
任一出口設好後,把 `content.js` 的 `submitConfig.endpoint` 改成 `'/api/submit'`(跟 Claude 說一聲即可)。

## 出口 A:Google 試算表(最好管理,建議)

1. 建一個 Google 試算表,第一列標題依序填:
   `時間 | 姓名 | 公司 | 產業 | 想改善的流程 | 目前工具 | 已加入能力 | 人工確認 | 電話 | Email | LINE | 聯絡時間 | 補充說明 | 狀態`
2. 擴充功能 → Apps Script,貼上:

```js
function doPost(e) {
  var p = JSON.parse(e.postData.contents);
  SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].appendRow([
    p.ts, p.name, p.company, p.industry, p.scenes, p.tools, p.mods,
    p.human, p.phone, p.email, p.line, p.time, p.need, "待聯絡"
  ]);
  return ContentService.createTextOutput("ok");
}
```

3. 部署 → 新增部署作業 → 類型「網路應用程式」→ 執行身分「我」→
   存取權「任何人」→ 部署,複製網址(`https://script.google.com/macros/s/…/exec`)
4. Vercel 環境變數:`SHEET_WEBHOOK_URL` = 那個網址

之後每筆需求自動多一列,你在「狀態」欄自己改 待聯絡/洽談中/成交。

## 出口 B:Email 即時通知(Resend)

1. https://resend.com 註冊(免費 100 封/天)→ API Keys 建一把
2. Vercel 環境變數:`RESEND_API_KEY` = 該 key
3. (可選)`NOTIFY_TO` 改收件人(預設 jacky@peakqi.com)
4. (正式)Resend 驗證 peakqi.com 網域後,設 `NOTIFY_FROM` = `PeakQi 表單 <form@peakqi.com>`;
   驗證前寄件人是 onboarding@resend.dev,只能寄到你註冊 Resend 的信箱

## 出口 C:Notion 資料庫(想用看板管理選這個)

1. https://www.notion.so/my-integrations 建 integration,拿 token(`secret_` 開頭)
2. 在 Notion 建一個資料庫,欄位名稱**完全照這份**:
   `姓名`(標題)、`狀態`(選項:待聯絡/洽談中/成交)、`產業`、`想改善的流程`、
   `目前工具`、`已加入能力`、`人工確認`、`電話`、`Email`(Email 型別)、
   `LINE`、`聯絡時間`、`補充說明`(文字)、`送出時間`(日期)
3. 資料庫頁面右上「⋯」→ 連結(Connections)→ 加入你的 integration
4. Vercel 環境變數:`NOTION_TOKEN` 與 `NOTION_DB_ID`(資料庫網址裡 32 碼那段)

## 建議組合

**A(試算表當名單資產)+ B(信箱即時通知)**:名單有家、來單有提醒。

## 行為說明

- 多個出口同時設定 → 每筆都寫全部;至少一個成功就回 200
- 一個都沒設 → 回 503,前端顯示錯誤並提示改用 Email/電話(不會假裝成功吞名單)
- 伺服端重複驗證:姓名必填、電話/Email/LINE 至少一項、全欄位長度上限
