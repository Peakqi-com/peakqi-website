Strict-source package — 場景圖的元件拆解(奇鋒網站用)

原始說明(來源附的):
  上傳的 SVG 不是分層向量圖,裡面只有一張內嵌 PNG。所以這裡的元件是切出來的
  影像資產,背景底板是用局部像素修補重建的。

本 repo 做過的整理:
  刪掉 components_svg/、background_plate_strict.svg、robot_workshop_strict_split.svg、
  source_original.svg —— 它們是同一批 PNG 用 base64 包成 SVG 的複本(MD5 逐一比對相同),
  共 9.6MB 的重複資料,沒有任何程式讀它們。

實際會用到的:
  source_original_embedded.png   原始場景圖 1254×1254(建置的唯一輸入)
  components_png/<id>.png        22 個元件切片(含 alpha)
  manifest_strict.json           每個切片的 bbox
  background_plate_strict.png    來源附的修補底板 —— 保留供比對,但網站沒有用它
                                 (它把 22 個全挖掉再修補,洞洞板那塊變成一片咖啡色楔形)

網站的底板是自己重做的:python tools/gen-allen-room-assets.py
