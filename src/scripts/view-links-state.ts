/** 自定义快捷链接本地状态 — 增删 + 变更订阅，localStorage 持久化 */

import { STORAGE_LINKS, type ViewLink } from '../data/view-links';

let links: ViewLink[] = load();
const listeners = new Set<() => void>();

function isViewLink(value: unknown): value is ViewLink {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.title === 'string' && typeof v.url === 'string';
}

function load(): ViewLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_LINKS);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isViewLink);
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_LINKS, JSON.stringify(links));
  } catch {
    /* 配额不足时忽略：本次会话内仍可用，刷新后回退 */
  }
}

function emit() {
  listeners.forEach((fn) => fn());
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getLinks(): ViewLink[] {
  return links;
}

export function addLink(input: { title: string; url: string; icon?: string }): ViewLink {
  const link: ViewLink = {
    id: generateId(),
    title: input.title.trim(),
    url: input.url.trim(),
  };
  if (input.icon) link.icon = input.icon;
  links = [...links, link];
  persist();
  emit();
  return link;
}

export function removeLink(id: string): void {
  if (!links.some((l) => l.id === id)) return;
  links = links.filter((l) => l.id !== id);
  persist();
  emit();
}

export interface FlatLink {
  id: string;
  title: string;
  url: string;
}

/** 联想面板用：标题/URL 匹配，无关键词时按标题列出前若干条 */
export function searchLinks(query: string, limit = 12): FlatLink[] {
  const q = query.trim().toLowerCase();
  const items: FlatLink[] = links.map((l) => ({ id: l.id, title: l.title, url: l.url }));

  if (!q) {
    return [...items].sort((a, b) => a.title.localeCompare(b.title, 'zh-CN')).slice(0, limit);
  }

  return items
    .map((item) => {
      const title = item.title.toLowerCase();
      const url = item.url.toLowerCase();
      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 80;
      else if (title.includes(q)) score = 60;
      else if (url.includes(q)) score = 40;
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)
    .slice(0, limit);
}

export function onLinksChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
