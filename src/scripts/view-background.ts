import {
  viewBackgrounds,
  STORAGE_BG_ID,
  STORAGE_BG_CUSTOM,
  STORAGE_BG_DIM,
  DEFAULT_BG_DIM,
} from '../data/view-backgrounds';

function removeBgBootStyle() {
  document.getElementById('view-bg-boot')?.remove();
}

function resolveBgSrc(bgId: string): string | null {
  if (bgId === 'custom') return loadCustomSrc();
  const preset = viewBackgrounds.find((b) => b.id === bgId);
  return preset?.src ?? null;
}

function getLayers() {
  return {
    body: document.body,
    bg: document.getElementById('view-bg'),
    dim: document.getElementById('view-bg-dim'),
  };
}

function loadBgId(): string {
  return localStorage.getItem(STORAGE_BG_ID) ?? 'default';
}

function loadCustomSrc(): string | null {
  return localStorage.getItem(STORAGE_BG_CUSTOM);
}

function loadDim(): number {
  const raw = localStorage.getItem(STORAGE_BG_DIM);
  const n = raw ? Number(raw) : DEFAULT_BG_DIM;
  return Number.isFinite(n) ? Math.min(0.85, Math.max(0, n)) : DEFAULT_BG_DIM;
}

function applyDimOverlay(dim: HTMLElement, value: number, hasPhoto: boolean) {
  if (!hasPhoto || value <= 0) {
    dim.hidden = true;
    dim.style.opacity = '0';
    return;
  }
  dim.hidden = false;
  dim.style.opacity = String(value);
}

function updateDimLabel(value: number) {
  const label = document.getElementById('view-bg-dim-value');
  if (label) label.textContent = `${Math.round(value * 100)}%`;
}

export function applyViewBackground(id?: string) {
  const { body, bg, dim } = getLayers();
  if (!bg || !dim) return;

  const bgId = id ?? loadBgId();
  const src = resolveBgSrc(bgId);
  const dimValue = loadDim();
  const hasPhoto = Boolean(src);

  applyDimOverlay(dim, dimValue, hasPhoto);
  updateDimLabel(dimValue);

  if (!src) {
    body.classList.remove('view-body--photo');
    bg.style.backgroundImage = '';
    bg.classList.add('view-bg--default');
    removeBgBootStyle();
    return;
  }

  body.classList.add('view-body--photo');
  bg.classList.remove('view-bg--default');
  bg.style.backgroundImage = `url("${src.replace(/"/g, '\\"')}")`;
  removeBgBootStyle();
}

function saveSelection(id: string) {
  localStorage.setItem(STORAGE_BG_ID, id);
  applyViewBackground(id);
  syncPanelUI();
}

function syncPanelUI() {
  const customSrc = loadCustomSrc();
  const preview = document.getElementById('view-bg-dropzone-preview');
  const icon = document.getElementById('view-bg-dropzone-icon');
  const text = document.getElementById('view-bg-dropzone-text');
  const clearBtn = document.getElementById('view-bg-clear-custom');
  const dropzone = document.getElementById('view-bg-dropzone');

  if (customSrc && preview && icon && text) {
    preview.style.backgroundImage = `url("${customSrc.replace(/"/g, '\\"')}")`;
    preview.hidden = false;
    icon.hidden = true;
    text.textContent = '点击更换图片';
    dropzone?.classList.add('has-image');
  } else if (preview && icon && text) {
    preview.hidden = true;
    preview.style.backgroundImage = '';
    icon.hidden = false;
    text.textContent = '点击或拖入图片';
    dropzone?.classList.remove('has-image');
  }

  if (clearBtn) clearBtn.hidden = !customSrc;

  const dimWrap = document.getElementById('view-bg-dim-wrap');
  const slider = document.getElementById('view-bg-dim') as HTMLInputElement | null;
  const dimVal = loadDim();
  if (dimWrap) dimWrap.hidden = !customSrc;
  if (slider) slider.value = String(dimVal);
  updateDimLabel(dimVal);
}

async function handleImageFile(file: File) {
  if (!file.type.startsWith('image/')) return;
  if (file.size > 4 * 1024 * 1024) {
    alert('图片请小于 4MB，过大可能无法保存。');
    return;
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  localStorage.setItem(STORAGE_BG_CUSTOM, dataUrl);
  saveSelection('custom');
}

export function initViewBackground() {
  const toggle = document.getElementById('view-bg-toggle');
  const panel = document.getElementById('view-bg-panel');
  const upload = document.getElementById('view-bg-upload') as HTMLInputElement | null;
  const dropzone = document.getElementById('view-bg-dropzone');
  const defaultBtn = document.getElementById('view-bg-default-btn');
  const clearBtn = document.getElementById('view-bg-clear-custom');
  const dimSlider = document.getElementById('view-bg-dim') as HTMLInputElement | null;

  applyViewBackground();
  removeBgBootStyle();
  syncPanelUI();

  const openUpload = () => upload?.click();

  toggle?.addEventListener('click', () => {
    if (!panel) return;
    const open = panel.hasAttribute('hidden');
    if (open) {
      panel.removeAttribute('hidden');
      syncPanelUI();
    } else {
      panel.setAttribute('hidden', '');
    }
    toggle.setAttribute('aria-expanded', String(open));
  });

  dropzone?.addEventListener('click', openUpload);

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('is-dragover');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) void handleImageFile(file).catch(() => alert('读取图片失败，请换一张试试。'));
  });

  defaultBtn?.addEventListener('click', () => saveSelection('default'));

  clearBtn?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_BG_CUSTOM);
    if (loadBgId() === 'custom') saveSelection('default');
    else syncPanelUI();
  });

  dimSlider?.addEventListener('input', () => {
    const value = Number(dimSlider.value);
    localStorage.setItem(STORAGE_BG_DIM, String(value));
    updateDimLabel(value);
    applyViewBackground();
  });

  upload?.addEventListener('change', () => {
    const file = upload.files?.[0];
    upload.value = '';
    if (file) void handleImageFile(file).catch(() => alert('读取图片失败，请换一张试试。'));
  });

  document.addEventListener('click', (e) => {
    if (!panel || panel.hasAttribute('hidden')) return;
    const target = e.target as Node;
    if (!panel.contains(target) && !toggle?.contains(target)) {
      panel.setAttribute('hidden', '');
      toggle?.setAttribute('aria-expanded', 'false');
    }
  });
}
