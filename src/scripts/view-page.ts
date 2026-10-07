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
import { initViewClock } from './view-clock';
import { initViewWeather } from './view-weather';
import { initViewQuote } from './view-quote';
import { initViewTodo } from './view-todo';
import { initViewCountdown } from './view-countdown';
import { initViewLayout } from './view-layout';

function getEngine(id: SearchEngineId) {
  return searchEngines.find((e) => e.id === id) ?? searchEngines[0];
}

function loadEngineId(): SearchEngineId {
  // 每次刷新都默认谷歌，不记住上次选择
  return defaultSearchEngineId;
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

/** 渲染链接为图标 tile 网格 */
function renderLinks(container: HTMLElement, links: ViewLink[]) {
  const addBtnHtml = `
    <button type="button" id="view-link-add" class="view-icon-grid__add" aria-expanded="false" aria-controls="view-links-panel" title="添加快捷链接">
      <span class="view-icon-grid__add-icon">+</span>
      <span class="view-icon-grid__add-label"></span>
    </button>`;

  if (links.length === 0) {
    container.innerHTML = `
      <div style="flex:1; text-align:center; padding:1rem; color:var(--view-text-muted); font-size:0.875rem;">
        还没有快捷链接 · 点右侧 + 添加
      </div>${addBtnHtml}`;
    return;
  }

  const tiles = links
    .map((link) => {
      const customIcon = Boolean(link.icon);
      const iconSrc = link.icon ?? faviconSrcForRender(link.url);
      const faviconAttrs = customIcon ? '' : ' data-favicon data-favicon-state="pending"';
      return `
      <div class="view-icon-tile" data-id="${escapeAttr(link.id)}">
        <a class="view-icon-tile__link" href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">
          <div class="view-icon-tile__icon">
            <img src="${escapeAttr(iconSrc)}"${faviconAttrs} alt="" width="28" height="28" decoding="async" referrerpolicy="no-referrer" />
          </div>
          <span class="view-icon-tile__label">${escapeHtml(link.title)}</span>
        </a>
        <button type="button" class="view-icon-tile__remove" data-remove-id="${escapeAttr(link.id)}" aria-label="删除 ${escapeAttr(link.title)}" title="删除">×</button>
      </div>`;
    })
    .join('');

  container.innerHTML = tiles + addBtnHtml;

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
  const panel = document.getElementById('view-links-panel');
  const overlay = document.getElementById('view-links-overlay');
  const form = document.getElementById('view-link-form') as HTMLFormElement | null;
  const titleInput = document.getElementById('view-link-title') as HTMLInputElement | null;
  const urlInput = document.getElementById('view-link-url') as HTMLInputElement | null;
  const errorEl = document.getElementById('view-link-error');
  const iconPreview = document.getElementById('view-link-icon-preview') as HTMLImageElement | null;
  const iconText = document.getElementById('view-link-icon-text');
  const iconConfirm = document.getElementById('view-link-icon-confirm') as HTMLButtonElement | null;
  const iconUpload = document.getElementById('view-link-icon-upload') as HTMLButtonElement | null;
  const iconReset = document.getElementById('view-link-icon-reset') as HTMLButtonElement | null;
  const iconFile = document.getElementById('view-link-icon-file') as HTMLInputElement | null;
  const cancelBtn = document.getElementById('view-link-cancel');
  if (!container || !panel || !form || !urlInput || !errorEl) return;

  let pendingIcon: string | null = null;
  /** 用户点击"使用此图标"确认后的自动抓取图标（提交时固化到链接） */
  let confirmedIcon: string | null = null;
  /** 递增令牌：URL 变化后丢弃在途的头像确认结果 */
  let resolveToken = 0;

  const refresh = () => {
    renderLinks(container, getLinks());
    bindFaviconRetry(container);
  };

  const previewAutoIcon = () => {
    if (!iconPreview || !iconText || !iconConfirm) return;
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
      if (iconConfirm) iconConfirm.hidden = true;
    };
    iconText.textContent = `自动捕捉：${new URL(normalized).hostname}`;
    iconConfirm.hidden = false;
    iconConfirm.disabled = false;
    iconConfirm.textContent = '使用此图标';
    // 存在固定图标（上传 / 已确认）时才提供"恢复自动"
    if (iconReset) iconReset.hidden = !(pendingIcon || confirmedIcon);
  };

  const previewIcon = () => {
    if (!iconPreview || !iconText || !iconConfirm) return;
    if (pendingIcon) {
      iconPreview.src = pendingIcon;
      iconPreview.hidden = false;
      iconPreview.onerror = null;
      iconText.textContent = '已使用上传的自定义图标';
      if (iconReset) iconReset.hidden = false;
      iconConfirm.hidden = true;
      return;
    }
    if (confirmedIcon) {
      iconPreview.src = confirmedIcon;
      iconPreview.hidden = false;
      iconPreview.onerror = null;
      iconText.textContent = '已确认网站图标';
      if (iconReset) iconReset.hidden = false;
      iconConfirm.hidden = true;
      return;
    }
    iconPreview.hidden = true;
    iconPreview.removeAttribute('src');
    iconPreview.onerror = null;
    iconText.textContent = '自动捕捉网站图标';
    if (iconReset) iconReset.hidden = true;
    iconConfirm.hidden = true;
    iconConfirm.disabled = false;
    iconConfirm.textContent = '使用此图标';
  };

  /** 点击"使用此图标"：加载验证自动抓取的图标，确认后固化到链接 */
  const confirmAutoIcon = () => {
    if (!iconPreview || !iconText || !iconConfirm) return;
    const normalized = normalizeUrl(urlInput.value);
    if (!normalized) return;
    const src = faviconSrcForRender(normalized);
    const token = ++resolveToken;
    iconConfirm.disabled = true;
    iconConfirm.textContent = '获取中…';
    const probe = new Image();
    probe.onload = () => {
      if (token !== resolveToken || panel.hidden) return; // URL 已变化或面板已关闭，丢弃过期结果
      confirmedIcon = src;
      errorEl.hidden = true;
      previewIcon();
    };
    probe.onerror = () => {
      if (token !== resolveToken || panel.hidden) return;
      iconConfirm.disabled = false;
      iconConfirm.textContent = '使用此图标';
      iconText.textContent = '自动图标获取失败';
      errorEl.textContent = '自动图标获取失败，可上传图片或稍后重试。';
      errorEl.hidden = false;
    };
    probe.src = src;
  };

  const resetForm = () => {
    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';
    errorEl.hidden = true;
    pendingIcon = null;
    confirmedIcon = null;
    resolveToken += 1;
    previewIcon();
  };

  const open = () => {
    panel.hidden = false;
    if (overlay) overlay.hidden = false;
    document.getElementById('view-link-add')?.setAttribute('aria-expanded', 'true');
    titleInput?.focus();
  };

  const close = () => {
    panel.hidden = true;
    if (overlay) overlay.hidden = true;
    document.getElementById('view-link-add')?.setAttribute('aria-expanded', 'false');
  };

  overlay?.addEventListener('click', close);

  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('#view-link-add')) return;
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
    // 实时判断，避免依赖 init 时可能尚不存在的 addBtn 元素
    const inAddBtn = target instanceof Element && target.closest('#view-link-add') !== null;
    if (!panel.contains(target) && !inAddBtn) close();
  });

  urlInput.addEventListener('input', () => {
    errorEl.hidden = true;
    resolveToken += 1;
    if (pendingIcon) return;
    if (confirmedIcon) {
      // URL 已变化，之前确认的图标不再适用于新网址，回到"待确认"状态
      confirmedIcon = null;
    }
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
    addLink({ title, url, icon: pendingIcon ?? confirmedIcon ?? undefined });
    resetForm();
    close();
    refresh();
  });

  iconConfirm?.addEventListener('click', confirmAutoIcon);

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
    confirmedIcon = null;
    errorEl.hidden = true;
    previewAutoIcon();
  });

  container.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('.view-icon-tile__remove');
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
  initViewClock();
  initSearch();
  initLinks();
  initKeyboard();
  initViewBackground();
  void initViewWeather();
  void initViewQuote();
  initViewTodo();
  initViewCountdown();
  initViewLayout();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewPage);
  } else {
    initViewPage();
  }
}
