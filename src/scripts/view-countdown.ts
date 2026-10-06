/** 倒数日小组件 */

const STORAGE_COUNTDOWN = 'view:countdowns';

interface Countdown {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

function load(): Countdown[] {
  try {
    const raw = localStorage.getItem(STORAGE_COUNTDOWN);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((c) => c && typeof c.name === 'string' && typeof c.date === 'string');
  } catch {
    return [];
  }
}

function persist(items: Countdown[]) {
  try {
    localStorage.setItem(STORAGE_COUNTDOWN, JSON.stringify(items));
  } catch { /* ignore */ }
}

let items = load();

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function render() {
  const list = document.getElementById('view-countdown-list');
  if (!list) return;

  // 过滤掉过去的，按天数升序
  const valid = items
    .map((c) => ({ ...c, days: daysUntil(c.date) }))
    .filter((c) => c.days >= 0)
    .sort((a, b) => a.days - b.days);

  if (valid.length === 0) {
    list.innerHTML = '<li style="color:var(--view-text-muted);font-size:0.82rem;padding:0.3rem 0;">还没有倒数日</li>';
    return;
  }

  list.innerHTML = valid
    .map(
      (c) => `
      <li class="view-countdown-item" data-id="${c.id}">
        <span>${escapeHtml(c.name)}</span>
        <span class="view-countdown-item__days">${c.days} <small>天</small></span>
      </li>`
    )
    .join('');
}

export function initViewCountdown() {
  const list = document.getElementById('view-countdown-list');
  const addBtn = document.getElementById('view-countdown-add');
  if (!list || !addBtn) return;

  render();

  addBtn.addEventListener('click', () => {
    const name = prompt('倒数日名称（如：国庆假期）：');
    if (!name) return;
    const dateStr = prompt('日期（YYYY-MM-DD）：');
    if (!dateStr) return;
    // 简单校验
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      alert('日期格式不对，请用 YYYY-MM-DD');
      return;
    }
    items = [...items, { id: generateId(), name: name.trim(), date: dateStr }];
    persist(items);
    render();
  });

  // 点击删除（长按或右键先不做，先简单点：点 item 删除）
  list.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.view-countdown-item');
    if (!item) return;
    const id = item.dataset.id;
    if (id && confirm('删除这个倒数日？')) {
      items = items.filter((c) => c.id !== id);
      persist(items);
      render();
    }
  });
}
