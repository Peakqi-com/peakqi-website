// PeakQi Hero 影格序列設定(單一來源)
// 有正式影格素材時:把 enabled 改為 true,並將影格放進對應資料夾。
// 命名規則:{path}{prefix}{編號(pad 位數,從 0001 起)}.{ext}
// 例:sequence/desktop/frame_0001.webp
export const sequenceManifest = {
  enabled: false,
  tiers: {
    desktop: { minWidth: 1100, path: 'sequence/desktop/', prefix: 'frame_', pad: 4, ext: 'webp', frameCount: 120, width: 1600, height: 900 },
    tablet: { minWidth: 700, path: 'sequence/tablet/', prefix: 'frame_', pad: 4, ext: 'webp', frameCount: 80, width: 1280, height: 720 },
    mobile: { minWidth: 0, path: 'sequence/mobile/', prefix: 'frame_', pad: 4, ext: 'webp', frameCount: 48, width: 828, height: 1200 }
  }
};
