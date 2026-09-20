import {
  searchEngines,
  defaultSearchEngineId,
  STORAGE_ENGINE,
  type SearchEngineId,
} from '../data/view-search';
import { MAX_ICON_SIZE, type ViewLink } from '../data/view-links';
import { faviconSrcForRender, hydrateFaviconImages, initFaviconRetryOnVisible } from './favicon-cache';
import { initSearchAutocomplete, saveRecentQuery } from './view-autocomplete';
import { getLinks, addLink, removeLink } from './view-links-state';
import { initViewBackground } from './view-background';
import { initViewTheme } from './view-theme';

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

/** 补全协议并校验，仅接受 http/https；无效返回 null */
function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    return normalizeUrl(`https://${value}`);
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
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

function renderLinks(container: HTMLElement, links: ViewLink[]) {
  if (links.length === 0) {
    container.innerHTML =
      '<p class="view-empty view-glass view-glass--soft view-glass--card view-glass--dashed">还没有快捷链接 · 点右上角「添加快捷链接」开始 DIY</p>';
    return;
  }

  container.innerHTML = `<div class="view-link-grid">
    ${links
      .map((link) => {
        const customIcon = Boolean(link.icon);
        const iconSrc = link.icon ?? faviconSrcForRender(link.url);
        const faviconAttrs = customIcon ? '' : ' data-favicon data-favicon-state="pending"';
        return `
      <div class="view-link-card view-glass view-glass--soft view-glass--card">
        <a class="view-link-card__link" href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">
          <img src="${escapeAttr(iconSrc)}"${faviconAttrs} alt="" width="20" height="20" decoding="async" referrerpolicy="no-referrer" />
          <span>${escapeHtml(link.title)}</span>
        </a>
        <button type="button" class="view-link-card__remove" data-remove-id="${escapeAttr(link.id)}" aria-label="删除 ${escapeAttr(link.title)}" title="删除">×</button>
      </div>`;
      })
      .join('')}
  </div>`;

  hydrateFaviconImages(container);
}

let faviconRetryBound = false;

function bindFaviconRetry(container: HTMLElement) {
  if (faviconRetryBound) return;
  faviconRetryBound = true;
  initFaviconRetryOnVisible(container);
}

function initLinks() {
  const container = document.getElementById('view-bookmarks');
  const statusEl = document.getElementById('view-status');
  const addBtn = document.getElementById('view-link-add');
  const panel = document.getElementById('view-links-panel');
  const form = document.getElementById('view-link-form') as HTMLFormElement | null;
  const titleInput = document.getElementById('view-link-title') as HTMLInputElement | null;
  const urlInput = document.getElementById('view-link-url') as HTMLInputElement | null;
  const errorEl = document.getElementById('view-link-error');
  const iconPreview = document.getElementById('view-link-icon-preview') as HTMLImageElement | null;
  const iconText = document.getElementById('view-link-icon-text');
  const iconUpload = document.getElementById('view-link-icon-upload') as HTMLButtonElement | null;
  const iconReset = document.getElementById('view-link-icon-reset') as HTMLButtonElement | null;
  const iconFile = document.getElementById('view-link-icon-file') as HTMLInputElement | null;
  const cancelBtn = document.getElementById('view-link-cancel');
  if (!container || !addBtn || !panel || !form || !urlInput || !errorEl) return;

  let pendingIcon: string | null = null;

  const refresh = () => {
    renderLinks(container, getLinks());
    bindFaviconRetry(container);
    if (statusEl) {
      const n = getLinks().length;
      statusEl.textContent = n === 0 ? '还没有快捷链接' : `共 ${n} 个快捷链接 · 保存在本机`;
    }
  };

  const previewAutoIcon = () => {
    if (!iconPreview || !iconText) return;
    const normalized = normalizeUrl(urlInput.value);
    if (!normalized) {
      previewIcon();
      return;
    }
    iconPreview.src = faviconSrcForRender(normalized);
    iconPreview.hidden = false;
    iconPreview.onerror = () => {
      iconPreview.hidden = true;
      iconPreview.onerror = null;
    };
    iconText.textContent = `自动捕捉：${new URL(normalized).hostname}`;
  };

  const previewIcon = () => {
    if (!iconPreview || !iconText) return;
    if (pendingIcon) {
      iconPreview.src = pendingIcon;
      iconPreview.hidden = false;
      iconPreview.onerror = null;
      iconText.textContent = '已使用上传的自定义图标';
      if (iconReset) iconReset.hidden = false;
      return;
    }
    iconPreview.hidden = true;
    iconPreview.removeAttribute('src');
    iconPreview.onerror = null;
    iconText.textContent = '自动捕捉网站图标';
    if (iconReset) iconReset.hidden = true;
  };

  const resetForm = () => {
    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';
    errorEl.hidden = true;
    pendingIcon = null;
    previewIcon();
  };

  const open = () => {
    panel.hidden = false;
    addBtn.setAttribute('aria-expanded', 'true');
    titleInput?.focus();
  };

  const close = () => {
    panel.hidden = true;
    addBtn.setAttribute('aria-expanded', 'false');
  };

  addBtn.addEventListener('click', () => {
    if (panel.hidden) {
      resetForm();
      open();
    } else {
      close();
    }
  });

  cancelBtn?.addEventListener('click', () => {
    resetForm();
    close();
  });

  document.addEventListener('click', (e) => {
    if (panel.hidden) return;
    const target = e.target as Node;
    if (!panel.contains(target) && !addBtn.contains(target)) close();
  });

  urlInput.addEventListener('input', () => {
    errorEl.hidden = true;
    if (pendingIcon) return;
    previewAutoIcon();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = normalizeUrl(urlInput.value);
    if (!url) {
      errorEl.textContent = '网址无效，请检查（支持 http/https，可省略协议）。';
      errorEl.hidden = false;
      urlInput.focus();
      return;
    }
    let title = titleInput?.value.trim() ?? '';
    if (!title) {
      try {
        title = new URL(url).hostname;
      } catch {
        title = url;
      }
    }
    addLink({ title, url, icon: pendingIcon ?? undefined });
    resetForm();
    close();
    refresh();
  });

  iconUpload?.addEventListener('click', () => iconFile?.click());

  iconFile?.addEventListener('change', () => {
    const file = iconFile.files?.[0];
    iconFile.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      errorEl.textContent = '请选择图片文件。';
      errorEl.hidden = false;
      return;
    }
    if (file.size > MAX_ICON_SIZE) {
      errorEl.textContent = '图标请小于 1MB。';
      errorEl.hidden = false;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingIcon = reader.result as string;
      errorEl.hidden = true;
      previewIcon();
    };
    reader.onerror = () => {
      errorEl.textContent = '读取图片失败，请换一张试试。';
      errorEl.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  iconReset?.addEventListener('click', () => {
    pendingIcon = null;
    errorEl.hidden = true;
    previewAutoIcon();
  });

  container.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('.view-link-card__remove');
    if (!btn) return;
    const id = btn.dataset.removeId;
    if (!id) return;
    removeLink(id);
    refresh();
  });

  refresh();
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
  initLinks();
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
