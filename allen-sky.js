// 天色的共同定義:有哪幾個時段、現在算哪一個、分級圖放在哪。
//
// 動態版(allen-room.js)和 reduced-motion 版(allen-avatar.js)都從這裡拿 ——
// 同一個晚上兩邊該顯示同一種天色,這種事不能各寫一份。
//
// 分級圖怎麼來的、為什麼是 multiply + screen 兩層:見 tools/gen-allen-room-assets.py。

export const GRADE_BASE = '/assets/allen/room/grade/';

/** 順序就是戳窗戶的循環順序。白天是原圖本身,沒有分級圖(所以預設零額外請求)。 */
export const TIMES = ['day', 'dusk', 'night'];

/** 沒有指定的話,用訪客自己的時鐘決定開場是哪個時段。 */
export function clockTime(now = new Date()) {
  const h = now.getHours();
  if (h >= 20 || h < 6) return 'night';
  if (h >= 17) return 'dusk';
  return 'day';
}

/** 開場的時段:呼叫端指定 > 網址 ?allentime=(驗收用) > 訪客的時鐘。 */
export function pickTime(pref = null) {
  const q = (location.search.match(/[?&]allentime=(\w+)/) || [])[1];
  const t = pref || q;
  return TIMES.includes(t) ? t : clockTime();
}

/** 這個時段要載哪幾張。順序就是疊圖順序:multiply 全部先套完,screen 才提亮。 */
export function gradeLayers(time) {
  return time === 'day' ? [] : [[time + '-m', 'multiply'], [time + '-s', 'screen']];
}
