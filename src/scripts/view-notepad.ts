/** 记事本小组件：本地保存 + 打开/另存电脑文件 */

const STORAGE_NOTEPAD = 'view:notepad';

function load(): string {
  try {
    return localStorage.getItem(STORAGE_NOTEPAD) ?? '';
  } catch {
    return '';
  }
}

function persist(text: string) {
  try {
    localStorage.setItem(STORAGE_NOTEPAD, text);
  } catch { /* ignore */ }
}

export function initViewNotepad() {
  const content = document.getElementById('view-notepad-content') as HTMLTextAreaElement | null;
  const saveBtn = document.getElementById('view-notepad-save');
  const openBtn = document.getElementById('view-notepad-open');
  const exportBtn = document.getElementById('view-notepad-export');
  const fileInput = document.getElementById('view-notepad-file') as HTMLInputElement | null;
  if (!content) return;

  let dirty = false;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const flash = (msg: string) => {
    if (!saveBtn) return;
    const prev = saveBtn.textContent;
    saveBtn.textContent = msg;
    saveBtn.classList.add('is-flash');
    setTimeout(() => {
      saveBtn.textContent = prev;
      saveBtn.classList.remove('is-flash');
    }, 900);
  };

  const save = (silent = false) => {
    persist(content.value);
    dirty = false;
    if (!silent) flash('已存');
  };

  // 载入本地内容
  content.value = load();

  // 输入即自动保存（含回车换行）
  content.addEventListener('input', () => {
    dirty = true;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => save(true), 400);
  });

  // 快捷键：Ctrl/Cmd+S 保存，Ctrl/Cmd+Enter 保存
  // 撤销/重做（Ctrl/Cmd+Z / Shift+Z）用浏览器原生，这里不拦截
  content.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === 's' || key === 'enter') {
      e.preventDefault();
      save();
      return;
    }
    // z / y 让原生 undo/redo 生效，input 事件会触发自动保存
  });

  saveBtn?.addEventListener('click', () => save());

  // 打开本地文件
  openBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    if (dirty && !confirm('当前内容尚未显式保存，打开文件将覆盖，继续？')) return;
    const reader = new FileReader();
    reader.onload = () => {
      content.value = typeof reader.result === 'string' ? reader.result : '';
      save(true);
      flash('已载入');
    };
    reader.onerror = () => alert('读取文件失败');
    reader.readAsText(file, 'utf-8');
  });

  // 另存为本地文件
  exportBtn?.addEventListener('click', () => {
    const blob = new Blob([content.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `记事本-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    save(true);
    flash('已导出');
  });

  // 离开页面前尽量落盘
  window.addEventListener('beforeunload', () => {
    if (dirty) persist(content.value);
  });
}
