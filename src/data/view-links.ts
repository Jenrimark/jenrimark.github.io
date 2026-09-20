/** 自定义快捷链接 — 数据模型与存储常量 */
export interface ViewLink {
  id: string;
  title: string;
  url: string;
  /** 自定义图标（dataURL）；缺省时自动捕捉网站 favicon */
  icon?: string;
}

export const STORAGE_LINKS = 'view:links';

/** 手动上传图标的体积上限（dataURL 存入 localStorage，过大易超配额） */
export const MAX_ICON_SIZE = 1024 * 1024;
