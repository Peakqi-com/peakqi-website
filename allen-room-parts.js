// 產生檔,不要手改:python tools/gen-allen-room-assets.py
// 每個會動元件的貼圖框 [x, y, w, h](原圖 1254×1254 座標)。
// 框比套件的 bbox 大一圈 —— 遮罩是用「原圖 vs 空房間」的差異算的,
// 會把物件的描邊與投影一起收進來,那些常常長到 bbox 外面。
export const PART_BOX = {
  'wrench_left': [1051, 477, 87, 199],
  'wrench_right': [1107, 478, 82, 196],
  'screwdriver_left': [1158, 477, 70, 196],
  'screwdriver_right': [1200, 477, 54, 195],
  'lamp': [860, 522, 178, 256],
  'mug': [940, 654, 152, 134],
  'left_plant': [181, 542, 206, 237],
  'shelf_plant': [911, 353, 118, 123],
  'red_button': [174, 720, 56, 57],
  'green_button': [187, 749, 60, 63],
  'poster': [879, 41, 241, 338],
  'screen': [0, 672, 211, 154],
  'cloud_0': [120, 232, 162, 114],
  'cloud_1': [0, 137, 135, 95],
  'cloud_2': [47, 395, 111, 79],
};

// 雲的可見範圍(= 原圖看得到天空的地方)。用它當遮罩,雲就不會飄到窗框上,
// 也不會蓋住城市 —— 雲在城市後面。
export const SKY_MASK = [0, 70, 279, 581];

// 有分級圖的時段。白天就是原圖(不需要分級圖),所以它只出現在關燈版。
export const GRADE_TIMES = ['day', 'dusk', 'night'];
