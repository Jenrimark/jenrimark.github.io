/** 双列联想：左列搜索候选，右列书签筛选 */

import { faviconSrcForRender, hydrateFaviconImages } from './favicon-cache';
import { getBookmarkTree, onBookmarksChange } from './view-bookmarks-state';
import { flattenAllBookmarks, searchBookmarks, type FlatBookmark } from './view-bookmark-search';

const STORAGE_RECENT = 'view:search-recent';
const MAX_RECENT = 8;
const DEBOUNCE_MS = 160;

interface InitOptions {
  input: HTMLInputElement;
  panel: HTMLElement;
  queryList: HTMLUListElement;
  bookmarkList: HTMLUListElement;
  isGoogle: () => boolean;
  onSubmit: (query: string) => void;
  dismissRoots?: HTMLElement[];
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function saveRecentQuery(query: string) {
  const q = query.trim();
  if (!q) return;
  const next = [q, ...loadRecent().filter((item) => item !== q)].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_RECENT, JSON.stringify(next));
}

function matchRecent(query: string): string[] {
  const q = query.trim().toLowerCase();
  const recent = loadRecent();
  if (!q) return recent;
  return recent.filter((item) => item.toLowerCase().includes(q));
}

function fetchGoogleSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return Promise.resolve([]);

  return new Promise((resolve) => {
    const cb = `_gsc_${Date.now().toString(36)}`;
    let script: HTMLScriptElement | null = null;

    const finish = (items: string[]) => {
      clearTimeout(timer);
      delete (window as unknown as Record<string, unknown>)[cb];
      script?.remove();
      resolve(items);
    };

    const timer = setTimeout(() => finish([]), 5000);

    (window as unknown as Record<string, unknown>)[cb] = (data: unknown) => {
      if (!Array.isArray(data) || !Array.isArray(data[1])) {
        finish([]);
        return;
      }
      const items = (data[1] as unknown[])
        .map((item) => (Array.isArray(item) ? String(item[0] ?? '') : String(item)))
        .filter(Boolean);
      finish(items);
    };

    script = document.createElement('script');
    script.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}&callback=${cb}`;
    script.onerror = () => finish([]);
    document.head.appendChild(script);
  });
}

type QueryItem = { text: string };

function mergeQuerySuggestions(recent: string[], google: string[]): QueryItem[] {
  const seen = new Set<string>();
  const out: QueryItem[] = [];
  for (const text of recent) {
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text });
    if (out.length >= 10) return out;
  }
  for (const text of google) {
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text });
    if (out.length >= 10) break;
  }
  return out;
}

type ActiveTarget =
  | { col: 'query'; index: number }
  | { col: 'bookmark'; index: number }
  | null;

export function initSearchAutocomplete({
  input,
  panel,
  queryList,
  bookmarkList,
  isGoogle,
  onSubmit,
  dismissRoots = [],
}: InitOptions) {
  let queryItems: QueryItem[] = [];
  let bookmarkItems: FlatBookmark[] = [];
  let active: ActiveTarget = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let requestId = 0;
  let skipSuggestOnNextFocus = false;

  const hide = () => {
    panel.hidden = true;
    queryList.innerHTML = '';
    bookmarkList.innerHTML = '';
    queryItems = [];
    bookmarkItems = [];
    active = null;
    input.setAttribute('aria-expanded', 'false');
  };

  const show = () => {
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  const pickQuery = (item: QueryItem | undefined) => {
    if (!item) return;
    input.value = item.text;
    hide();
    onSubmit(item.text);
  };

  const pickBookmark = (item: FlatBookmark | undefined) => {
    if (!item) return;
    hide();
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const bindQueryItems = () => {
    queryList.querySelectorAll<HTMLLIElement>('.view-suggest__item').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        pickQuery(queryItems[Number(el.dataset.index)]);
      });
    });
  };

  const bindBookmarkItems = () => {
    bookmarkList.querySelectorAll<HTMLLIElement>('.view-suggest__item--bookmark').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        pickBookmark(bookmarkItems[Number(el.dataset.index)]);
      });
    });
    hydrateFaviconImages(bookmarkList);
  };

  const highlight = () => {
    queryList.querySelectorAll<HTMLLIElement>('.view-suggest__item').forEach((el) => {
      const i = Number(el.dataset.index);
      const on = active?.col === 'query' && active.index === i;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', String(on));
    });
    bookmarkList.querySelectorAll<HTMLLIElement>('.view-suggest__item--bookmark').forEach((el) => {
      const i = Number(el.dataset.index);
      const on = active?.col === 'bookmark' && active.index === i;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', String(on));
    });

    const activeEl =
      active?.col === 'query'
        ? queryList.querySelector<HTMLElement>(`[data-index="${active.index}"]`)
        : active?.col === 'bookmark'
          ? bookmarkList.querySelector<HTMLElement>(`[data-index="${active.index}"]`)
          : null;
    activeEl?.scrollIntoView({ block: 'nearest' });
  };

  const render = () => {
    if (queryItems.length === 0 && bookmarkItems.length === 0) {
      hide();
      return;
    }

    queryList.innerHTML =
      queryItems.length === 0
        ? '<li class="view-suggest__empty">无搜索候选</li>'
        : queryItems
            .map(
              (item, i) =>
                `<li class="view-suggest__item" role="option" data-index="${i}">${escapeHtml(item.text)}</li>`,
            )
            .join('');

    bookmarkList.innerHTML =
      bookmarkItems.length === 0
        ? '<li class="view-suggest__empty">无匹配书签</li>'
        : bookmarkItems
            .map(
              (item, i) => `<li class="view-suggest__item view-suggest__item--bookmark" role="option" data-index="${i}">
          <img src="${escapeAttr(faviconSrcForRender(item.url))}" data-favicon data-favicon-state="pending" alt="" width="18" height="18" decoding="async" referrerpolicy="no-referrer" />
          <span class="view-suggest__bookmark-text">
            <span class="view-suggest__bookmark-title">${escapeHtml(item.title)}</span>
            ${item.folderPath ? `<span class="view-suggest__bookmark-path">${escapeHtml(item.folderPath)}</span>` : ''}
          </span>
        </li>`,
            )
            .join('');

    show();
    bindQueryItems();
    bindBookmarkItems();
    highlight();
  };

  const update = async () => {
    const query = input.value;
    const id = ++requestId;

    const recent = matchRecent(query);
    const google = isGoogle() && query.trim() ? await fetchGoogleSuggestions(query) : [];

    if (id !== requestId) return;

    queryItems = mergeQuerySuggestions(recent, google);

    const flat = flattenAllBookmarks(getBookmarkTree());
    bookmarkItems = searchBookmarks(flat, query);

    active = null;
    render();
  };

  onBookmarksChange(() => {
    if (!panel.hidden) void update();
  });

  input.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void update();
    }, DEBOUNCE_MS);
  });

  input.addEventListener('focus', () => {
    if (skipSuggestOnNextFocus) {
      skipSuggestOnNextFocus = false;
      return;
    }
    void update();
  });

  const colLength = (col: 'query' | 'bookmark') => (col === 'query' ? queryItems.length : bookmarkItems.length);

  input.addEventListener('keydown', (e) => {
    if (panel.hidden) return;

    const hasQuery = queryItems.length > 0;
    const hasBookmark = bookmarkItems.length > 0;
    if (!hasQuery && !hasBookmark) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      if (!hasQuery || !hasBookmark) return;
      e.preventDefault();
      if (e.key === 'ArrowRight') {
        active = hasBookmark ? { col: 'bookmark', index: active?.col === 'bookmark' ? active.index : 0 } : active;
      } else {
        active = hasQuery ? { col: 'query', index: active?.col === 'query' ? active.index : 0 } : active;
      }
      highlight();
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const col = active?.col ?? (hasQuery ? 'query' : 'bookmark');
      const len = colLength(col);
      if (len === 0) return;
      e.preventDefault();
      let index = active?.col === col ? active.index : -1;
      if (e.key === 'ArrowDown') {
        index = index < 0 ? 0 : Math.min(index + 1, len - 1);
      } else {
        index = index < 0 ? len - 1 : Math.max(index - 1, 0);
      }
      active = { col, index };
      highlight();
      return;
    }

    if (e.key === 'Enter' && active) {
      e.preventDefault();
      if (active.col === 'query') pickQuery(queryItems[active.index]);
      else pickBookmark(bookmarkItems[active.index]);
      return;
    }

    if (e.key === 'Escape') {
      hide();
    }
  });

  const isInsideDismissRoot = (node: Node) => dismissRoots.some((root) => root.contains(node));

  document.addEventListener('mousedown', (e) => {
    const target = e.target as Node;
    if (panel.hidden) return;
    if (input.contains(target) || panel.contains(target) || isInsideDismissRoot(target)) {
      return;
    }
    hide();
  });

  return {
    hide,
    skipNextFocusSuggest: () => {
      skipSuggestOnNextFocus = true;
      hide();
    },
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}
