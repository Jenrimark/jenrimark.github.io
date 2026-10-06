/** 待办清单小组件 */

const STORAGE_TODO = 'view:todos';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

function load(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_TODO);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((t) => t && typeof t.text === 'string');
  } catch {
    return [];
  }
}

function persist(todos: Todo[]) {
  try {
    localStorage.setItem(STORAGE_TODO, JSON.stringify(todos));
  } catch { /* ignore */ }
}

let todos = load();

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function render() {
  const list = document.getElementById('view-todo-list');
  if (!list) return;

  if (todos.length === 0) {
    list.innerHTML = '<li style="color:var(--view-text-muted);font-size:0.82rem;padding:0.3rem 0;">暂无待办</li>';
    return;
  }

  list.innerHTML = todos
    .map(
      (t) => `
      <li class="view-todo-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <input type="checkbox" ${t.done ? 'checked' : ''} data-toggle="${t.id}">
        <span>${escapeHtml(t.text)}</span>
        <button type="button" class="view-todo-item__remove" data-remove="${t.id}" aria-label="删除">×</button>
      </li>`
    )
    .join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function addTodo(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  // 新待办插到最前面
  todos = [{ id: generateId(), text: trimmed, done: false }, ...todos];
  persist(todos);
  render();
}

function toggleTodo(id: string) {
  todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  persist(todos);
  render();
}

function removeTodo(id: string) {
  todos = todos.filter((t) => t.id !== id);
  persist(todos);
  render();
}

export function initViewTodo() {
  const list = document.getElementById('view-todo-list');
  const form = document.getElementById('view-todo-form') as HTMLFormElement | null;
  const input = document.getElementById('view-todo-input') as HTMLInputElement | null;
  const addBtn = document.getElementById('view-todo-add');
  if (!list || !form || !input || !addBtn) return;

  render();

  // 点加号显示输入框
  addBtn.addEventListener('click', () => {
    form.hidden = false;
    input.focus();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo(input.value);
    input.value = '';
    form.hidden = true;
    addBtn.focus();
  });

  // 按 Esc 隐藏输入框
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      form.hidden = true;
      input.value = '';
    }
  });

  list.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const toggleBtn = target.closest('[data-toggle]') as HTMLElement | null;
    const removeBtn = target.closest('[data-remove]') as HTMLElement | null;
    if (toggleBtn) toggleTodo(toggleBtn.dataset.toggle!);
    if (removeBtn) removeTodo(removeBtn.dataset.remove!);
  });
}
