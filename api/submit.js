// 預約/導入草稿表單收件端點(Vercel Serverless Function,零依賴)
// 前端:Demo.dc.html 的 _send() 會 POST JSON 到 content.js submitConfig.endpoint。
// 啟用方式:
//   1) Vercel 專案 Settings → Environment Variables 加 RESEND_API_KEY(resend.com 免費申請)
//   2) content.js 把 submitConfig.endpoint 改成 '/api/submit'
//   3) (正式)在 Resend 驗證 peakqi.com 網域後,把 NOTIFY_FROM 改成 form@peakqi.com
// 未設定 RESEND_API_KEY 時回 503,前端會走錯誤路徑(顯示改用 Email/電話),不會假裝成功。

const MAX = { name: 80, company: 120, industry: 40, phone: 40, email: 120, line: 80,
  scenes: 400, tools: 300, mods: 300, human: 300, need: 3000, time: 40, source: 60 };

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_TO || 'jacky@peakqi.com';
  const from = process.env.NOTIFY_FROM || 'PeakQi 網站表單 <onboarding@resend.dev>';
  if (!key) { res.status(503).json({ ok: false, error: 'not-configured' }); return; }

  let p = req.body;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = null; } }
  if (!p || typeof p !== 'object') { res.status(400).json({ ok: false, error: 'bad-json' }); return; }

  // 與前端同一套規則:至少一種聯絡方式;全部欄位裁長度防灌爆
  const s = {};
  for (const k of Object.keys(MAX)) s[k] = String(p[k] || '').slice(0, MAX[k]).trim();
  if (!s.name) { res.status(400).json({ ok: false, error: 'name' }); return; }
  if (!s.phone && !s.email && !s.line) { res.status(400).json({ ok: false, error: 'contact' }); return; }

  const esc = (v) => v.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const row = (label, v) => v ? '<tr><td style="padding:6px 12px 6px 0;color:#666;white-space:nowrap;vertical-align:top">' + label + '</td><td style="padding:6px 0">' + esc(v) + '</td></tr>' : '';
  const html = '<h2 style="margin:0 0 4px">網站導入需求 — ' + esc(s.name) + (s.company ? '(' + esc(s.company) + ')' : '') + '</h2>'
    + '<p style="color:#888;margin:0 0 16px">' + esc(s.source) + ' ・ ' + new Date().toISOString() + '</p>'
    + '<table style="font:14px/1.6 sans-serif;border-collapse:collapse">'
    + row('產業', s.industry) + row('想改善的流程', s.scenes) + row('目前工具', s.tools)
    + row('已加入草稿的能力', s.mods) + row('人工確認邊界', s.human)
    + row('電話', s.phone) + row('Email', s.email) + row('LINE ID', s.line)
    + row('希望聯絡時間', s.time)
    + '</table>'
    + (s.need ? '<h3 style="margin:18px 0 6px">補充說明</h3><p style="font:14px/1.7 sans-serif;white-space:pre-wrap">' + esc(s.need) + '</p>' : '');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [to],
        reply_to: s.email || undefined,
        subject: '【導入需求】' + s.name + (s.company ? ' — ' + s.company : '') + (s.industry ? '(' + s.industry + ')' : ''),
        html
      })
    });
    if (!r.ok) { res.status(502).json({ ok: false, error: 'mail-' + r.status }); return; }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ ok: false, error: 'mail-network' });
  }
};
