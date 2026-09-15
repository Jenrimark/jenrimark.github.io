export const STORAGE_THEME = 'view:theme';

export type ViewThemeMode = 'light' | 'dark' | 'auto';

function resolveTheme(mode: ViewThemeMode): 'light' | 'dark' {
  if (mode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function loadThemeMode(): ViewThemeMode {
  const stored = localStorage.getItem(STORAGE_THEME);
  if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
  return 'auto';
}

function updateToggle(mode: ViewThemeMode) {
  const btn = document.getElementById('view-theme-toggle');
  if (!btn) return;

  const labels: Record<ViewThemeMode, string> = {
    light: '白天',
    dark: '黑夜',
    auto: '自动',
  };
  btn.setAttribute('aria-label', `主题：${labels[mode]}`);
  btn.setAttribute('title', `主题：${labels[mode]}（点击切换）`);
  btn.dataset.themeMode = mode;
}

export function applyViewTheme(mode?: ViewThemeMode) {
  const themeMode = mode ?? loadThemeMode();
  const resolved = resolveTheme(themeMode);
  document.documentElement.setAttribute('data-view-theme', resolved);
  document.documentElement.setAttribute('data-view-theme-mode', themeMode);
  updateToggle(themeMode);
}

export function initViewTheme() {
  applyViewTheme();

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    if (loadThemeMode() === 'auto') applyViewTheme('auto');
  });

  document.getElementById('view-theme-toggle')?.addEventListener('click', () => {
    const order: ViewThemeMode[] = ['auto', 'light', 'dark'];
    const current = loadThemeMode();
    const next = order[(order.indexOf(current) + 1) % order.length];
    localStorage.setItem(STORAGE_THEME, next);
    applyViewTheme(next);
  });
}
