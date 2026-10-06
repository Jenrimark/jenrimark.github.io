/** /view/ 搜索引擎配置 */
export type SearchEngineId = 'google' | 'baidu' | 'bing' | 'chatgpt' | 'doubao' | 'deepseek';

export interface SearchEngine {
  id: SearchEngineId;
  label: string;
  default?: boolean;
  placeholder: string;
  buildUrl: (query: string) => string;
}

export const searchEngines: SearchEngine[] = [
  {
    id: 'google',
    label: 'Google',
    default: true,
    placeholder: '在 Google 中搜索…',
    buildUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'baidu',
    label: '百度',
    placeholder: '在百度中搜索…',
    buildUrl: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
  },
  {
    id: 'bing',
    label: 'Bing',
    placeholder: '在 Bing 中搜索…',
    buildUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    placeholder: '向 ChatGPT 提问…',
    buildUrl: (q) => `https://chatgpt.com/?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'doubao',
    label: '豆包',
    placeholder: '向豆包提问…',
    buildUrl: (q) => `https://www.doubao.com/chat/?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    placeholder: '向 DeepSeek 提问…',
    buildUrl: (q) => `https://chat.deepseek.com/?q=${encodeURIComponent(q)}`,
  },
];

export const defaultSearchEngineId: SearchEngineId =
  searchEngines.find((e) => e.default)?.id ?? 'google';

export const STORAGE_ENGINE = 'view:search-engine';
export const STORAGE_FOLDERS = 'view:folder-ids';
