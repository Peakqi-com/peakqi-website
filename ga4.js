// GA4 接線 ── analytics.js 的 sink 實作(唯一對外量測出口)
//
// analytics.js 定義了事件介面但 sink 一直是 null,事件只進 window.__pqEvents
// 這個記憶體陣列,關掉分頁就沒了 ── 等於全站沒有對外量測。本檔把那個 sink 接到 GA4。
//
// 設定:只有下面這一個常數。留空 = 完全不載入 gtag,站上零影響(不發任何請求、
// 不寫任何 cookie),所以沒填 ID 也可以安全上線。
//
// ⚠ 隱私:GA4 會寫第一方 cookie(_ga)。analytics.js 原本的註解寫的是
//    「不綁平台、無未經同意的追蹤」—— 接上 GA4 之後這句不再成立。
//    若日後有歐盟/英國訪客,需要另外做同意橫幅並在同意前以
//    gtag('consent','default',{analytics_storage:'denied'}) 擋住。本檔尚未實作。
//
// 載入方式:
//   一般頁面 ── support.js 檔尾 dynamic import(全站每頁都載 support.js)
//   案例永久頁 ── tools/gen-cases.mjs 產生的 <script type="module" src="/ga4.js">
// 兩邊都靠本檔匯入即自動初始化,重複載入有旗標擋住。

export const GA4_ID = ''; // 例:'G-XXXXXXXXXX'

let started = false;

function loadGtag(id) {
  window.dataLayer = window.dataLayer || [];
  // gtag 必須用 arguments 原樣推進 dataLayer,不能改寫成陣列展開
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id); // 預設即送出 page_view

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
}

// analytics.js 的事件物件帶 type/ts,GA4 的參數另有規則:
// 名稱限英數底線、值過長會被靜默丟棄(上限 100 字元),所以這裡統一收斂。
function toGa4(name, data) {
  const params = {};
  for (const k of Object.keys(data || {})) {
    if (k === 'type' || k === 'ts') continue;
    const v = data[k];
    params[k] = typeof v === 'number' ? v : String(v).slice(0, 100);
  }
  try { window.gtag('event', name, params); } catch (e) {}
}

export async function init() {
  if (started || !GA4_ID) return false;
  started = true;
  loadGtag(GA4_ID);

  const a = await import('/analytics.js');
  a.setSink(toGa4);

  // sink 掛上之前就已經觸發的事件(頁面早期的 hero/nav 點擊)還留在 __pqEvents,
  // 補送一次;掛上之後的事件走 sink,不會重覆。
  for (const e of (window.__pqEvents || [])) toGa4(e.type, e);
  return true;
}

init().catch(() => {});
