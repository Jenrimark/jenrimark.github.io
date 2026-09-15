/** 示例书签树 — 未安装扩展时使用；结构与 Chrome bookmarks API 一致 */
export interface ViewBookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: ViewBookmarkNode[];
}

export const sampleBookmarkTree: ViewBookmarkNode[] = [
  {
    id: '1',
    title: '书签栏',
    children: [
      {
        id: '10',
        title: '开发',
        children: [
          { id: '101', title: 'GitHub', url: 'https://github.com/Jenrimark' },
          { id: '102', title: 'Astro Docs', url: 'https://docs.astro.build' },
          { id: '103', title: 'Vue.js', url: 'https://vuejs.org' },
        ],
      },
      {
        id: '11',
        title: '学习',
        children: [
          { id: '111', title: 'MDN', url: 'https://developer.mozilla.org' },
          { id: '112', title: 'LeetCode', url: 'https://leetcode.cn' },
        ],
      },
      {
        id: '12',
        title: '常用',
        children: [
          { id: '121', title: 'Gmail', url: 'https://mail.google.com' },
          { id: '122', title: 'Bilibili', url: 'https://www.bilibili.com' },
        ],
      },
    ],
  },
  {
    id: '2',
    title: '其他书签',
    children: [
      { id: '201', title: '个人站点', url: 'https://github.com/Jenrimark' },
    ],
  },
];
