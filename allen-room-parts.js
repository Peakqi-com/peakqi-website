// 產生檔,不要手改:python tools/gen-allen-room-assets.py
// 素材來自 assets/svg/test.svg —— 美術手工拆好的 40 個圖層。
// 每個元件的貼圖框 [x, y, w, h](1254×1254 座標)。雲的 x 可能是負的:
// 補全出來的部分落在畫布外,雲飄進來才看得到。
export const PART_BOX = {
  'poster': [903, 58, 206, 307],
  'left_plant': [207, 573, 177, 184],
  'screen': [0, 697, 185, 114],
  'red_button': [190, 738, 32, 32],
  'green_button': [205, 771, 32, 29],
  'mug': [967, 679, 111, 86],
  'wrench_left': [1078, 504, 48, 166],
  'wrench_right': [1129, 503, 52, 155],
  'screwdriver_left': [1183, 497, 41, 162],
  'screwdriver_right': [1225, 499, 29, 163],
  'lamp': [886, 548, 194, 195],
  'cloud_0': [-125, 137, 290, 98],
  'cloud_1': [121, 229, 297, 120],
  'cloud_2': [222, 412, 124, 59],
  'front_shelf': [1070, 216, 184, 203],
};

// 雲的可見範圍 = 天空那一層減掉城市。窗框與每一棟建築都會確實擋住雲。
export const SKY_MASK = [0, 63, 295, 592];

// 有分級圖的時段。白天就是原圖,所以它不會有 m/s 兩張。
export const GRADE_TIMES = ['day', 'dusk', 'night'];

// 有「關燈分級圖」的時段 —— 只有這幾個時段關燈會影響整個房間。
export const GRADE_OFF = ['night'];
