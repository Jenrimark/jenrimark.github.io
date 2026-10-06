/** 组件拖拽布局：像手机桌面一样拖动 tile 交换位置，支持增删组件 */

const STORAGE_LAYOUT = 'view:layout';
const STORAGE_VISIBLE = 'view:visible-tiles';

interface TilePos {
  id: string;
  col: number;
  colSpan: number;
  row: number;
  rowSpan: number;
}

const ALL_TILES: TilePos[] = [
  { id: 'clock', col: 1, colSpan: 6, row: 1, rowSpan: 2 },
  { id: 'search', col: 7, colSpan: 6, row: 1, rowSpan: 2 },
  { id: 'links', col: 1, colSpan: 12, row: 3, rowSpan: 1 },
  { id: 'todo', col: 1, colSpan: 4, row: 4, rowSpan: 3 },
  { id: 'countdown', col: 5, colSpan: 4, row: 4, rowSpan: 3 },
  { id: 'weather', col: 9, colSpan: 4, row: 4, rowSpan: 3 },
];

const TILE_LABELS: Record<string, string> = {
  clock: '时钟',
  search: '搜索',
  links: '快捷链接',
  todo: '待办',
  countdown: '倒数日',
  weather: '天气',
};

/** 核心组件不能删除 */
const CORE_TILES = ['clock', 'search', 'links'];

function loadLayout(): TilePos[] {
  try {
    const raw = localStorage.getItem(STORAGE_LAYOUT);
    if (!raw) return ALL_TILES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ALL_TILES;
    return parsed;
  } catch {
    return ALL_TILES;
  }
}

function saveLayout(layout: TilePos[]) {
  try {
    localStorage.setItem(STORAGE_LAYOUT, JSON.stringify(layout));
  } catch { /* ignore */ }
}

function loadVisible(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_VISIBLE);
    if (!raw) return ALL_TILES.map(t => t.id);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ALL_TILES.map(t => t.id);
    return parsed;
  } catch {
    return ALL_TILES.map(t => t.id);
  }
}

function saveVisible(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_VISIBLE, JSON.stringify(ids));
  } catch { /* ignore */ }
}

let currentLayout = loadLayout();
let visibleTiles = loadVisible();
let editing = false;

function applyLayout() {
  currentLayout.forEach((pos) => {
    const el = document.querySelector(`[data-tile="${pos.id}"]`) as HTMLElement | null;
    if (!el) return;
    el.style.gridColumn = `${pos.col} / span ${pos.colSpan}`;
    el.style.gridRow = `${pos.row} / span ${pos.rowSpan}`;
    el.style.display = visibleTiles.includes(pos.id) ? '' : 'none';
  });
}

function setEditing(on: boolean) {
  editing = on;
  const grid = document.getElementById('view-grid');
  const btn = document.getElementById('view-layout-edit');
  if (grid) grid.classList.toggle('editing', on);
  if (btn) {
    btn.textContent = on ? '完成' : '编辑布局';
    btn.setAttribute('aria-expanded', String(on));
  }

  // 编辑模式下显示删除按钮
  document.querySelectorAll('.view-tile').forEach((el) => {
    const tile = el as HTMLElement;
    const id = tile.dataset.tile;
    if (!id) return;

    let removeBtn = tile.querySelector('.view-tile-remove') as HTMLElement | null;
    if (on) {
      if (!removeBtn) {
        removeBtn = document.createElement('button');
        removeBtn.className = 'view-tile-remove';
        removeBtn.textContent = '×';
        removeBtn.title = '移除组件';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeTile(id!);
        });
        tile.appendChild(removeBtn);
      }
      removeBtn.style.display = CORE_TILES.includes(id) ? 'none' : 'grid';
    } else if (removeBtn) {
      removeBtn.style.display = 'none';
    }
  });
}

function removeTile(id: string) {
  visibleTiles = visibleTiles.filter(t => t !== id);
  saveVisible(visibleTiles);
  applyLayout();
}

function addTile(id: string) {
  if (!visibleTiles.includes(id)) {
    visibleTiles.push(id);
    saveVisible(visibleTiles);
    applyLayout();
  }
}

export function initViewLayout() {
  const grid = document.getElementById('view-grid');
  if (!grid) return;

  applyLayout();

  // 编辑按钮
  const editBtn = document.getElementById('view-layout-edit');
  if (editBtn) {
    editBtn.addEventListener('click', () => setEditing(!editing));
  }

  // 拖拽逻辑
  let dragEl: HTMLElement | null = null;
  let dragStartX = 0;
  let dragStartY = 0;

  grid.addEventListener('mousedown', (e) => {
    if (!editing) return;
    if ((e.target as HTMLElement).closest('.view-tile-remove')) return;
    const target = (e.target as HTMLElement).closest('[data-tile]') as HTMLElement | null;
    if (!target) return;
    e.preventDefault();

    dragEl = target;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragEl.classList.add('dragging');
  });

  document.addEventListener('mousemove', (e) => {
    if (!editing || !dragEl) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    dragEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`;
    dragEl.style.zIndex = '100';
  });

  document.addEventListener('mouseup', (e) => {
    if (!editing || !dragEl) return;

    // 先清掉拖拽样式，否则 elementFromPoint 会拿到自己
    dragEl.style.transform = '';
    dragEl.style.zIndex = '';

    // 找到落点下面的 tile
    let targetTile: HTMLElement | null = null;
    const tiles = grid.querySelectorAll<HTMLElement>('[data-tile]');
    tiles.forEach((tile) => {
      const rect = tile.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        targetTile = tile;
      }
    });

    if (targetTile && targetTile !== dragEl) {
      const sourceId = dragEl.dataset.tile!;
      const targetId = targetTile.dataset.tile!;

      const sourcePos = currentLayout.find((p) => p.id === sourceId)!;
      const targetPos = currentLayout.find((p) => p.id === targetId)!;

      // 交换位置
      const tmpCol = sourcePos.col;
      const tmpRow = sourcePos.row;
      sourcePos.col = targetPos.col;
      sourcePos.row = targetPos.row;
      targetPos.col = tmpCol;
      targetPos.row = tmpRow;

      saveLayout(currentLayout);
      applyLayout();
    }

    dragEl.classList.remove('dragging');
    dragEl = null;
  });
}
