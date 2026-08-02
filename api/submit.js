// 預約/導入草稿表單收件端點(Vercel Serverless Function,零依賴)
// 前端:Demo.dc.html 的 _send() POST JSON 到 content.js submitConfig.endpoint('/api/submit')。
//
// 三個收件出口,設了哪個環境變數就寫哪個(可同時多個;至少一個成功就算成功):
//   RESEND_API_KEY                 → 寄摘要信到 NOTIFY_TO(預設 jacky@peakqi.com)
//   SHEET_WEBHOOK_URL              → POST 到 Google Apps Script 網路應用程式,寫進你的試算表
//   NOTION_TOKEN + NOTION_DB_ID    → 在你的 Notion 資料庫新增一列(可做看板:待聯絡/洽談中/成交)
// 一個都沒設 → 回 503,前端走錯誤路徑提示改用 Email/電話,不會假裝成功吞名單。
// 設定步驟見 FORM-SETUP.md。

const MAX = { name: 80, company: 120, industry: 40, phone: 40, email: 120, line: 80,
  scenes: 400, tools: 300, mods: 300, human: 300, need: 3000, time: 40, source: 60 };

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const env = process.env;
  const sinks = {
    mail: !!env.RESEND_API_KEY,
    sheet: !!env.SHEET_WEBHOOK_URL,
    notion: !!(env.NOTION_TOKEN && env.NOTION_DB_ID)
  };
  if (!sinks.mail && !sinks.sheet && !sinks.notion) {
    res.status(503).json({ ok: false, error: 'not-configured' }); return;
  }

  let p = req.body;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = null; } }
  if (!p || typeof p !== 'object') { res.status(400).json({ ok: false, error: 'bad-json' }); return; }

  const s = {};
  for (const k of Object.keys(MAX)) s[k] = String(p[k] || '').slice(0, MAX[k]).trim();
  if (!s.name) { res.status(400).json({ ok: false, error: 'name' }); return; }
  if (!s.phone && !s.email && !s.line) { res.status(400).json({ ok: false, error: 'contact' }); return; }
  const when = new Date().toISOString();

  const jobs = [];

  // ── 出口 1:Email(Resend)
  if (sinks.mail) {
    const to = env.NOTIFY_TO || 'jacky@peakqi.com';
    const from = env.NOTIFY_FROM || 'PeakQi 網站表單 <onboarding@resend.dev>';
    const esc = (v) => v.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    const row = (label, v) => v ? '<tr><td style="padding:6px 12px 6px 0;color:#666;white-space:nowrap;vertical-align:top">' + label + '</td><td style="padding:6px 0">' + esc(v) + '</td></tr>' : '';
    const html = '<h2 style="margin:0 0 4px">網站導入需求 — ' + esc(s.name) + (s.company ? '(' + esc(s.company) + ')' : '') + '</h2>'
      + '<p style="color:#888;margin:0 0 16px">' + esc(s.source) + ' ・ ' + when + '</p>'
      + '<table style="font:14px/1.6 sans-serif;border-collapse:collapse">'
      + row('產業', s.industry) + row('想改善的流程', s.scenes) + row('目前工具', s.tools)
      + row('已加入草稿的能力', s.mods) + row('人工確認邊界', s.human)
      + row('電話', s.phone) + row('Email', s.email) + row('LINE ID', s.line)
      + row('希望聯絡時間', s.time) + '</table>'
      + (s.need ? '<h3 style="margin:18px 0 6px">補充說明</h3><p style="font:14px/1.7 sans-serif;white-space:pre-wrap">' + esc(s.need) + '</p>' : '');
    jobs.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [to], reply_to: s.email || undefined,
        subject: '【導入需求】' + s.name + (s.company ? ' — ' + s.company : '') + (s.industry ? '(' + s.industry + ')' : ''),
        html
      })
    }).then(r => ({ sink: 'mail', ok: r.ok })).catch(() => ({ sink: 'mail', ok: false })));
  }

  // ── 出口 2:Google 試算表(Apps Script Web App;腳本見 FORM-SETUP.md)
  if (sinks.sheet) {
    jobs.push(fetch(env.SHEET_WEBHOOK_URL, {
      method: 'POST',
      // text/plain 避開 Apps Script 對 JSON 的 CORS 預檢;Apps Script 完成後會 302 → follow
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...s, ts: when }),
      redirect: 'follow'
    }).then(async (r) => {
      // 診斷:Apps Script 權限沒開「任何人」時會 302 到 Google 登入頁(狀態碼卻是 200),
      // 必須用最終網址與內文判斷,不能只看 r.ok
      const finalUrl = r.url || '';
      const text = (await r.text().catch(() => '')).slice(0, 120);
      const loginWall = finalUrl.includes('accounts.google.com') || text.includes('accounts.google.com');
      return { sink: 'sheet', ok: r.ok && !loginWall,
        status: r.status, loginWall, hint: text.replace(/\s+/g, ' ').slice(0, 80) };
    }).catch((e) => ({ sink: 'sheet', ok: false, hint: String(e && e.message).slice(0, 80) })));
  }

  // ── 出口 3:Notion 資料庫(欄位名固定,建庫規格見 FORM-SETUP.md)
  if (sinks.notion) {
    const rt = (v) => ({ rich_text: [{ text: { content: v || '' } }] });
    jobs.push(fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.NOTION_TOKEN,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: env.NOTION_DB_ID },
        properties: {
          '姓名': { title: [{ text: { content: s.name + (s.company ? '(' + s.company + ')' : '') } }] },
          '狀態': { select: { name: '待聯絡' } },
          '產業': rt(s.industry),
          '想改善的流程': rt(s.scenes),
          '目前工具': rt(s.tools),
          '已加入能力': rt(s.mods),
          '人工確認': rt(s.human),
          '電話': rt(s.phone),
          'Email': s.email ? { email: s.email } : rt(''),
          'LINE': rt(s.line),
          '聯絡時間': rt(s.time),
          '補充說明': rt(s.need.slice(0, 1900)),
          '送出時間': { date: { start: when } }
        }
      })
    }).then(r => ({ sink: 'notion', ok: r.ok })).catch(() => ({ sink: 'notion', ok: false })));
  }

  const results = await Promise.all(jobs);
  const anyOk = results.some(r => r.ok);
  if (anyOk) res.status(200).json({ ok: true, sinks: results });
  else res.status(502).json({ ok: false, error: 'all-sinks-failed', sinks: results });
};
