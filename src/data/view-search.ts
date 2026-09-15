/** /view/ 搜索引擎配置 */
export type SearchEngineId = 'google' | 'baidu' | 'bing' | 'chatgpt' | 'gemini';

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
    id: 'gemini',
    label: 'Gemini',
    placeholder: '在 Gemini 中提问…',
    buildUrl: (q) => `https://gemini.google.com/app?q=${encodeURIComponent(q)}`,
  },
];

export const defaultSearchEngineId: SearchEngineId =
  searchEngines.find((e) => e.default)?.id ?? 'google';

export const STORAGE_ENGINE = 'view:search-engine';
export const STORAGE_FOLDERS = 'view:folder-ids';
