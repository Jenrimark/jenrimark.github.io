/** 书签 favicon 本地缓存 — 按域名记住可用的图标 URL；失败自动重试 */

const STORAGE_KEY = 'view:favicon-cache-v2';
const LEGACY_KEY = 'view:favicon-cache-v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 240;
const RETRY_DELAYS_MS = [2000, 5000];

interface CacheEntry {
  src: string;
  at: number;
}

type CacheStore = Record<string, CacheEntry>;

const memory = new Map<string, string>();
let retryTimers: ReturnType<typeof setTimeout>[] = [];

function hostFromUrl(pageUrl: string): string | null {
  try {
    return new URL(pageUrl).hostname;
  } catch {
    return null;
  }
}

function hostVariants(host: string): string[] {
  const out: string[] = [host];
  if (host.startsWith('www.')) out.push(host.slice(4));

  const parts = host.split('.');
  if (parts.length > 2) {
    out.push(parts.slice(-2).join('.'));
  }
  return [...new Set(out)];
}

function faviconProviders(host: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const add = (url: string) => {
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  };

  for (const h of hostVariants(host)) {
    add(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=32`);
    add(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=64`);
    add(`https://icons.duckduckgo.com/ip3/${h}.ico`);
    add(`https://favicon.yandex.net/favicon/v2/${encodeURIComponent(h)}?size=32`);
    add(`https://${h}/favicon.ico`);
  }

  return urls;
}

function loadStore(): CacheStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CacheStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: CacheStore) {
  const now = Date.now();
  const entries = Object.entries(store).filter(
    ([, e]) => now - e.at < MAX_AGE_MS && e.src && !e.src.includes('favicon.svg'),
  );
  entries.sort((a, b) => b[1].at - a[1].at);
  const pruned = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    const half = Object.fromEntries(entries.slice(0, Math.floor(MAX_ENTRIES / 2)));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
    } catch {
      /* ignore quota */
    }
  }
}

function persist(host: string, src: string) {
  if (!src || src.includes('favicon.svg')) return;
  memory.set(host, src);
  const store = loadStore();
  store[host] = { src, at: Date.now() };
  saveStore(store);
}

function invalidateCache(host: string) {
  memory.delete(host);
  const store = loadStore();
  delete store[host];
  saveStore(store);
}

function purgeLegacyCache() {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

purgeLegacyCache();

/** 同步读取缓存 */
export function getCachedFavicon(pageUrl: string): string | null {
  const host = hostFromUrl(pageUrl);
  if (!host) return null;

  if (memory.has(host)) return memory.get(host)!;

  const entry = loadStore()[host];
  if (!entry || Date.now() - entry.at >= MAX_AGE_MS) return null;

  memory.set(host, entry.src);
  return entry.src;
}

export function faviconSrcForRender(pageUrl: string): string {
  const host = hostFromUrl(pageUrl);
  if (!host) return faviconProviders('localhost')[0];

  return getCachedFavicon(pageUrl) ?? faviconProviders(host)[0];
}

function applySrc(img: HTMLImageElement, src: string) {
  if (img.getAttribute('src') !== src) img.setAttribute('src', src);
}

function markFaviconState(img: HTMLImageElement, state: 'pending' | 'ok' | 'failed') {
  img.dataset.faviconState = state;
}

function clearRetryTimers() {
  retryTimers.forEach(clearTimeout);
  retryTimers = [];
}

function tryProviders(
  img: HTMLImageElement,
  host: string,
  candidates: string[],
  startIndex: number,
  onAllFailed: () => void,
) {
  let index = startIndex;

  const tryNext = () => {
    if (index >= candidates.length) {
      onAllFailed();
      return;
    }

    const src = candidates[index];
    index += 1;

    img.onload = () => {
      img.onload = null;
      img.onerror = null;
      persist(host, src);
      markFaviconState(img, 'ok');
    };

    img.onerror = () => {
      img.onload = null;
      img.onerror = null;
      tryNext();
    };

    applySrc(img, src);
  };

  tryNext();
}

function loadFaviconForCard(card: HTMLAnchorElement, options: { skipCache?: boolean; staggerMs?: number } = {}) {
  const { skipCache = false, staggerMs = 0 } = options;

  const run = () => {
    const img = card.querySelector<HTMLImageElement>('img[data-favicon]');
    if (!img) return;

    const pageUrl = card.href;
    const host = hostFromUrl(pageUrl);
    if (!host) return;

    markFaviconState(img, 'pending');
    img.onload = null;
    img.onerror = null;

    const candidates = faviconProviders(host);
    const cached = skipCache ? null : getCachedFavicon(pageUrl);

    const failAll = () => markFaviconState(img, 'failed');

    if (cached) {
      img.onload = () => {
        img.onload = null;
        img.onerror = null;
        markFaviconState(img, 'ok');
      };
      img.onerror = () => {
        img.onload = null;
        img.onerror = null;
        invalidateCache(host);
        tryProviders(img, host, candidates, 0, failAll);
      };
      applySrc(img, cached);
      return;
    }

    tryProviders(img, host, candidates, 0, failAll);
  };

  if (staggerMs > 0) {
    setTimeout(run, staggerMs);
  } else {
    run();
  }
}

function retryFailedFavicons(container: HTMLElement) {
  container.querySelectorAll<HTMLAnchorElement>('a.view-bookmark-card').forEach((card) => {
    const img = card.querySelector<HTMLImageElement>('img[data-favicon]');
    if (!img || img.dataset.faviconState !== 'failed') return;
    loadFaviconForCard(card, { skipCache: true });
  });
}

/** 渲染后加载图标；刷新页面会重新走一遍；失败项延迟自动重试 */
export function hydrateFaviconImages(container: HTMLElement) {
  clearRetryTimers();

  const cards = [...container.querySelectorAll<HTMLAnchorElement>('a.view-bookmark-card')];
  cards.forEach((card, index) => {
    const pageUrl = card.href;
    const hasCache = Boolean(getCachedFavicon(pageUrl));
    loadFaviconForCard(card, {
      skipCache: false,
      staggerMs: hasCache ? 0 : Math.floor(index / 6) * 80,
    });
  });

  for (const delay of RETRY_DELAYS_MS) {
    retryTimers.push(
      setTimeout(() => {
        retryFailedFavicons(container);
      }, delay),
    );
  }
}

/** 页面可见时补拉仍失败的图标（切回标签页 / 刷新后） */
export function initFaviconRetryOnVisible(container: HTMLElement) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      retryFailedFavicons(container);
    }
  });
}
