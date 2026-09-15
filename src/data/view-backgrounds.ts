/** /view/ 背景预设 — 把图片放到 public/view/backgrounds/ 后在这里登记 */

export interface ViewBackground {
  id: string;
  label: string;
  /** 相对站点根路径，如 /view/backgrounds/mountain.jpg */
  src: string | null;
}

export const viewBackgrounds: ViewBackground[] = [
  { id: 'default', label: '默认夜景', src: '/view/backgrounds/night-clouds.png' },
  // 在下面追加你的背景（文件放进 public/view/backgrounds/）
  // { id: 'mountain', label: '山景', src: '/view/backgrounds/mountain.jpg' },
  // { id: 'night', label: '夜景', src: '/view/backgrounds/night.webp' },
];

export const STORAGE_BG_ID = 'view:background-id';
export const STORAGE_BG_CUSTOM = 'view:background-custom';
export const STORAGE_BG_DIM = 'view:background-dim';
export const DEFAULT_BG_DIM = 0.15;
