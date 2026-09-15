import {
  searchEngines,
  defaultSearchEngineId,
  STORAGE_ENGINE,
  STORAGE_FOLDERS,
  type SearchEngineId,
} from '../data/view-search';
import { sampleBookmarkTree, type ViewBookmarkNode } from '../data/view-bookmarks.sample';
import { faviconSrcForRender, hydrateFaviconImages, initFaviconRetryOnVisible } from './favicon-cache';
import { initSearchAutocomplete, saveRecentQuery } from './view-autocomplete';
import { updateBookmarks } from './view-bookmarks-state';
import { initViewBackground } from './view-background';
import { initViewTheme } from './view-theme';

const MSG_SOURCE_PAGE = 'jenrimark-view';
const MSG_SOURCE_EXT = 'jenrimark-view-ext';

interface BookmarkLink {
  id: string;
  title: string;
  url: string;
}

interface BookmarkSection {
  folderId: string;
  folderTitle: string;
  links: BookmarkLink[];
}

function getEngine(id: SearchEngineId) {
  return searchEngines.find((e) => e.id === id) ?? searchEngines[0];
}

function loadEngineId(): SearchEngineId {
  const stored = localStorage.getItem(STORAGE_ENGINE);
  if (stored && searchEngines.some((e) => e.id === stored)) {
    return stored as SearchEngineId;
  }
  return defaultSearchEngineId;
}

/** `null` = 从未保存过，默认全选；`Set` 为空 = 用户点了全不选 */
function loadFolderFilter(): Set<string> | null {
  try {
    const raw = localStorage.getItem(STORAGE_FOLDERS);
    if (raw === null) return null;
    const ids = JSON.parse(raw) as string[];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return null;
  }
}

function resolveFolderFilter(filter: Set<string> | null, folderIds: string[]): Set<string> {
  if (filter === null) return new Set(folderIds);
  return pruneFolderFilter(filter, folderIds);
}

function saveFolderFilter(ids: Set<string>) {
  localStorage.setItem(STORAGE_FOLDERS, JSON.stringify([...ids]));
}

/** 去掉已不存在的文件夹 id，避免换设备/同步后筛选失效 */
function pruneFolderFilter(filter: Set<string>, folderIds: string[]): Set<string> {
  if (filter.size === 0) return filter;
  const valid = new Set(folderIds);
  const next = new Set<string>();
  for (const id of filter) {
    if (valid.has(id)) next.add(id);
  }
  return next;
}

function isFolderNode(node: ViewBookmarkNode): boolean {
  return Boolean(node.children?.length) && !node.url;
}

function collectFolders(nodes: ViewBookmarkNode[], path: string[] = []): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const node of nodes) {
    if (!isFolderNode(node)) continue;
    const label = [...path, node.title].join(' / ');
    out.push({ id: node.id, label });
    if (node.children) {
      out.push(...collectFolders(node.children, [...path, node.title]));
    }
  }
  return out;
}

function folderSelected(folderId: string, filter: Set<string>): boolean {
  return filter.has(folderId);
}

function extractSections(
  nodes: ViewBookmarkNode[],
  filter: Set<string>,
  parentPath: string[] = [],
): BookmarkSection[] {
  const sections: BookmarkSection[] = [];

  for (const node of nodes) {
    if (node.url) continue;

    if (isFolderNode(node)) {
      const links: BookmarkLink[] = [];
      const walk = (children: ViewBookmarkNode[]) => {
        for (const child of children) {
          if (child.url) {
            links.push({ id: child.id, title: child.title, url: child.url });
          } else if (child.children) {
            walk(child.children);
          }
        }
      };

      if (folderSelected(node.id, filter) && node.children) {
        walk(node.children);
        if (links.length > 0) {
          sections.push({
            folderId: node.id,
            folderTitle: [...parentPath, node.title].join(' / '),
            links,
          });
        }
      }

      if (node.children) {
        sections.push(...extractSections(node.children, filter, [...parentPath, node.title]));
      }
    }
  }

  return sections;
}

function updateClock(el: HTMLElement) {
  const now = new Date();
  const date = now.toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  el.textContent = `${date} · ${time}`;
}

function renderBookmarks(sections: BookmarkSection[], container: HTMLElement, noneSelected: boolean) {
  if (sections.length === 0) {
    container.innerHTML = noneSelected
      ? ''
      : '<p class="view-empty view-glass view-glass--soft view-glass--card view-glass--dashed">没有匹配的书签。试试调整文件夹筛选，或安装扩展同步浏览器书签。</p>';
    return;
  }

  container.innerHTML = sections
    .map(
      (section) => `
    <section class="view-bookmark-section" data-folder-id="${section.folderId}">
      <h3 class="view-bookmark-section__title">${escapeHtml(section.folderTitle)}</h3>
      <div class="view-bookmark-grid">
        ${section.links
          .map(
            (link) => `
          <a class="view-bookmark-card view-glass view-glass--soft view-glass--card" href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">
            <img src="${escapeAttr(faviconSrcForRender(link.url))}" data-favicon data-favicon-state="pending" alt="" width="20" height="20" decoding="async" referrerpolicy="no-referrer" />
            <span>${escapeHtml(link.title)}</span>
          </a>
        `,
          )
          .join('')}
      </div>
    </section>
  `,
    )
    .join('');

  hydrateFaviconImages(container);
}

let faviconRetryBound = false;

function bindFaviconRetry(container: HTMLElement) {
  if (faviconRetryBound) return;
  faviconRetryBound = true;
  initFaviconRetryOnVisible(container);
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

function initSearch() {
  const form = document.getElementById('view-search-form') as HTMLFormElement | null;
  const input = document.getElementById('view-search-input') as HTMLInputElement | null;
  const clearBtn = document.getElementById('view-search-clear') as HTMLButtonElement | null;
  const suggestPanel = document.getElementById('view-suggest');
  const suggestQuery = document.getElementById('view-suggest-query') as HTMLUListElement | null;
  const suggestBookmarks = document.getElementById('view-suggest-bookmarks') as HTMLUListElement | null;
  const enginesEl = document.getElementById('view-engines');
  if (!form || !input || !enginesEl || !suggestPanel || !suggestQuery || !suggestBookmarks) {
    return;
  }

  let engineId = loadEngineId();

  const submitQuery = (q: string) => {
    const query = q.trim();
    if (!query) return;
    saveRecentQuery(query);
    window.location.href = getEngine(engineId).buildUrl(query);
  };

  const applyEngine = () => {
    const engine = getEngine(engineId);
    input.placeholder = engine.placeholder;
    enginesEl.querySelectorAll<HTMLButtonElement>('.view-engine').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.engine === engineId));
    });
    localStorage.setItem(STORAGE_ENGINE, engineId);
  };

  const syncClearBtn = () => {
    if (!clearBtn) return;
    clearBtn.hidden = !input.value;
  };

  const autocomplete = initSearchAutocomplete({
    input,
    panel: suggestPanel,
    queryList: suggestQuery,
    bookmarkList: suggestBookmarks,
    isGoogle: () => engineId === 'google',
    onSubmit: submitQuery,
    dismissRoots: [enginesEl, form],
  });

  enginesEl.querySelectorAll<HTMLButtonElement>('.view-engine').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.engine as SearchEngineId | undefined;
      if (!id || !searchEngines.some((e) => e.id === id)) return;
      engineId = id;
      applyEngine();
      autocomplete.skipNextFocusSuggest();
      input.focus();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitQuery(input.value);
  });

  form.addEventListener('mousedown', (e) => {
    const target = e.target as Node;
    if (target === input) return;
    if (target instanceof Element && target.closest('button')) return;
    e.preventDefault();
    input.focus();
  });

  input.addEventListener('input', syncClearBtn);

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    syncClearBtn();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  });

  applyEngine();
  syncClearBtn();
  autocomplete.skipNextFocusSuggest();
  input.focus();
}

function initClock() {
  const el = document.getElementById('view-clock');
  if (!el) return;
  updateClock(el);
  setInterval(() => updateClock(el), 30_000);
}

function initBookmarks() {
  const container = document.getElementById('view-bookmarks');
  const folderPanel = document.getElementById('view-folder-panel');
  const folderList = document.getElementById('view-folder-list');
  const folderToggle = document.getElementById('view-folder-toggle');
  const folderSelectAll = document.getElementById('view-folder-select-all');
  const folderClear = document.getElementById('view-folder-clear');
  const statusEl = document.getElementById('view-status');
  if (!container || !folderPanel || !folderList) return;

  let tree: ViewBookmarkNode[] = sampleBookmarkTree;
  let filter: Set<string> | null = loadFolderFilter();
  let fromExtension = false;

  const refresh = () => {
    const folders = collectFolders(tree);
    const folderIds = folders.map((f) => f.id);
    const activeFilter = resolveFolderFilter(filter, folderIds);
    renderFolderList(folderList, folders, activeFilter);
    const sections = extractSections(tree, activeFilter);
    const noneSelected = filter !== null && activeFilter.size === 0;
    renderBookmarks(sections, container, noneSelected);
    bindFaviconRetry(container);
    updateBookmarks(tree, activeFilter);
  };

  const toggleFolder = (folderId: string) => {
    const folderIds = collectFolders(tree).map((f) => f.id);
    if (folderIds.length === 0) return;

    const active = resolveFolderFilter(filter, folderIds);
    const next = new Set(active);
    if (next.has(folderId)) {
      next.delete(folderId);
    } else {
      next.add(folderId);
    }
    filter = next;
    saveFolderFilter(filter);
    refresh();
  };

  folderList.addEventListener('click', (e) => {
    const chip = (e.target as Element).closest<HTMLButtonElement>('.view-folder-chip');
    const folderId = chip?.dataset.folderId;
    if (!folderId) return;
    toggleFolder(folderId);
  });

  const extBanner = document.getElementById('view-ext-banner');

  const setStatus = (live: boolean) => {
    if (!statusEl) return;
    if (live) {
      statusEl.textContent = '已连接浏览器扩展 · 显示真实书签';
      statusEl.classList.add('view-status--live');
      extBanner?.classList.add('is-connected');
    } else {
      statusEl.textContent = '示例书签 · 安装扩展后将自动同步浏览器书签';
      statusEl.classList.remove('view-status--live');
      extBanner?.classList.remove('is-connected');
    }
  };

  folderToggle?.addEventListener('click', () => {
    const open = folderPanel.classList.toggle('is-open');
    folderToggle.setAttribute('aria-expanded', String(open));
  });

  folderSelectAll?.addEventListener('click', () => {
    const folderIds = collectFolders(tree).map((f) => f.id);
    filter = new Set(folderIds);
    saveFolderFilter(filter);
    refresh();
  });

  folderClear?.addEventListener('click', () => {
    filter = new Set();
    saveFolderFilter(filter);
    refresh();
  });

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.source !== MSG_SOURCE_EXT) return;
    if (data.type === 'BOOKMARKS' && Array.isArray(data.tree)) {
      tree = data.tree as ViewBookmarkNode[];
      fromExtension = true;
      setStatus(true);
      refresh();
    }
  });

  window.postMessage({ source: MSG_SOURCE_PAGE, type: 'REQUEST_BOOKMARKS' }, '*');
  setStatus(fromExtension);
  refresh();

  // 扩展未响应时保持示例数据
  setTimeout(() => {
    if (!fromExtension) setStatus(false);
  }, 800);
}

function renderFolderList(
  el: HTMLElement,
  folders: { id: string; label: string }[],
  filter: Set<string>,
) {
  if (folders.length === 0) {
    el.innerHTML = '<p class="view-folder-panel__empty">暂无文件夹</p>';
    return;
  }

  el.innerHTML = folders
    .map((f) => {
      const pressed = filter.has(f.id);
      return `
    <button
      type="button"
      class="view-folder-chip"
      data-folder-id="${escapeAttr(f.id)}"
      aria-pressed="${pressed ? 'true' : 'false'}"
    >${escapeHtml(f.label)}</button>
  `;
    })
    .join('');
}

function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      (document.getElementById('view-search-input') as HTMLInputElement | null)?.focus();
    }
  });
}

export function initViewPage() {
  initViewTheme();
  initClock();
  initSearch();
  initBookmarks();
  initKeyboard();
  initViewBackground();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewPage);
  } else {
    initViewPage();
  }
}
