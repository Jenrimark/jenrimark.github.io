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
  { id: 'ipinfo', col: 9, colSpan: 4, row: 4, rowSpan: 3 },
  { id: 'music', col: 1, colSpan: 4, row: 7, rowSpan: 3 },
  { id: 'translate', col: 5, colSpan: 4, row: 7, rowSpan: 3 },
  { id: 'qrcode', col: 9, colSpan: 4, row: 7, rowSpan: 3 },
];

const TILE_LABELS: Record<string, string> = {
  clock: '时钟',
  search: '搜索',
  links: '快捷链接',
  todo: '待办',
  countdown: '记事本',
  music: '音乐播放器',
  ipinfo: 'IP信息',
  translate: '快捷翻译',
  qrcode: '二维码生成',
};

/** 核心组件不能删除 */
const CORE_TILES = ['clock', 'search', 'links'];

function loadLayout(): TilePos[] {
  try {
    const raw = localStorage.getItem(STORAGE_LAYOUT);
    // 跟 ALL_TILES 合并：已保存的用保存的 col/row，未保存的用默认值；colSpan/rowSpan 永远用 ALL_TILES 的固定值
    const saved: any[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(saved)) return ALL_TILES.map(t => ({ ...t }));
    return ALL_TILES.map((def) => {
      const s = saved.find((p) => p.id === def.id);
      return {
        ...def,
        col: s && typeof s.col === 'number' ? s.col : def.col,
        row: s && typeof s.row === 'number' ? s.row : def.row,
      };
    });
  } catch {
    return ALL_TILES.map(t => ({ ...t }));
  }
}

function saveLayout(layout: TilePos[]) {
  try {
    localStorage.setItem(STORAGE_LAYOUT, JSON.stringify(layout));
  } catch { /* ignore */ }
}

/** 默认显示的组件（新组件默认隐藏，用户手动添加） */
const DEFAULT_VISIBLE = ['clock', 'search', 'links', 'todo', 'countdown', 'ipinfo'];
const NEW_WIDGETS = ['music', 'ipinfo', 'translate', 'qrcode'];

function loadVisible(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_VISIBLE);
    if (!raw) return [...DEFAULT_VISIBLE];
    let parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_VISIBLE];
    // 过滤掉已从 ALL_TILES 中删除的组件
    const validIds = ALL_TILES.map(t => t.id);
    parsed = parsed.filter((id: string) => validIds.includes(id));
    // 确保默认组件不丢失（如果本地配置里缺了默认组件，自动补上）
    DEFAULT_VISIBLE.forEach((id) => {
      if (!parsed.includes(id)) parsed.push(id);
    });
    // 一次性迁移：移除默认误加的新组件
    const migrated = localStorage.getItem('view:visible-migrated');
    if (!migrated && NEW_WIDGETS.some(w => parsed.includes(w))) {
      parsed = parsed.filter((id: string) => !NEW_WIDGETS.includes(id));
      DEFAULT_VISIBLE.forEach((id) => {
        if (!parsed.includes(id)) parsed.push(id);
      });
      localStorage.setItem(STORAGE_VISIBLE, JSON.stringify(parsed));
      localStorage.setItem('view:visible-migrated', '1');
    }
    return parsed;
  } catch {
    return [...DEFAULT_VISIBLE];
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
  const isMobile = window.innerWidth <= 900;
  let mobileRow = 1;
  currentLayout.forEach((pos) => {
    const el = document.querySelector(`[data-tile="${pos.id}"]`) as HTMLElement | null;
    if (!el) return;
    const visible = visibleTiles.includes(pos.id);
    if (isMobile) {
      el.style.gridColumn = '1 / -1';
      if (visible) {
        el.style.gridRow = `${mobileRow} / span 1`;
        mobileRow++;
      } else {
        el.style.gridRow = '';
      }
    } else {
      el.style.gridColumn = `${pos.col} / span ${pos.colSpan}`;
      el.style.gridRow = `${pos.row} / span ${pos.rowSpan}`;
    }
    el.style.display = visible ? '' : 'none';
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

  // 编辑模式下创建/移除删除按钮
  if (on) {
    refreshRemoveButtons();
  } else {
    document.querySelectorAll('.view-tile-remove').forEach(btn => btn.remove());
  }

  // 编辑模式下显示组件列表面板
  const panel = document.getElementById('view-layout-panel');
  const list = document.getElementById('view-layout-panel-list');
  if (panel && list) {
    panel.hidden = !on;
    if (on) {
      renderLayoutPanel();
    }
  }
}

function renderLayoutPanel() {
  const list = document.getElementById('view-layout-panel-list');
  if (!list) return;
  // 显示可添加的组件（不在 visibleTiles 里的非核心组件）
  const addable = ALL_TILES.filter(
    pos => !CORE_TILES.includes(pos.id) && !visibleTiles.includes(pos.id)
  );
  if (addable.length === 0) {
    list.innerHTML = '<li class="view-layout-panel__empty">所有组件已添加</li>';
    return;
  }
  list.innerHTML = addable
    .map(pos => `
      <li class="view-layout-panel__item view-layout-panel__item--addable" onclick="window.__viewAddTile('${pos.id}')">
        <span class="view-layout-panel__item-name">+ ${TILE_LABELS[pos.id] ?? pos.id}</span>
      </li>
    `)
    .join('');
}

function refreshRemoveButtons() {
  document.querySelectorAll('.view-tile').forEach(el => {
    const tile = el as HTMLElement;
    const tileId = tile.dataset.tile;
    if (!tileId || CORE_TILES.includes(tileId)) return;
    if (tile.style.display === 'none') return;
    let removeBtn = tile.querySelector('.view-tile-remove') as HTMLElement | null;
    if (!removeBtn) {
      removeBtn = document.createElement('button');
      removeBtn.className = 'view-tile-remove';
      removeBtn.textContent = '×';
      removeBtn.title = '移除组件';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeTile(tileId);
        renderLayoutPanel();
      });
      tile.appendChild(removeBtn);
    }
  });
}

function forceGridReflow() {
  const grid = document.getElementById('view-grid');
  if (!grid) return;
  grid.style.display = 'none';
  void grid.offsetHeight;
  grid.style.display = '';
}

function removeTile(id: string) {
  visibleTiles = visibleTiles.filter(t => t !== id);
  saveVisible(visibleTiles);
  applyLayout();
  forceGridReflow();
}

function addTile(id: string) {
  if (!visibleTiles.includes(id)) {
    visibleTiles.push(id);
    saveVisible(visibleTiles);
    applyLayout();
    forceGridReflow();
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

  // 挂全局函数，供面板 onclick 调用
  (window as any).__viewAddTile = (id: string) => {
    addTile(id);
    renderLayoutPanel();
    refreshRemoveButtons();
  };

  // 拖拽逻辑（简单稳定版：transform 平移原组件 + 目标高亮）
  let dragEl: HTMLElement | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let hoverTile: HTMLElement | null = null;

  grid.addEventListener('mousedown', (e) => {
    if (!editing) return;
    if ((e.target as HTMLElement).closest('.view-tile-remove')) return;
    const target = (e.target as HTMLElement).closest('[data-tile]') as HTMLElement | null;
    if (!target) return;
    if (CORE_TILES.includes(target.dataset.tile || '')) return;
    e.preventDefault();
    dragEl = target;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragEl.classList.add('dragging');
    dragEl.style.zIndex = '100';
  });

  document.addEventListener('mousemove', (e) => {
    if (!editing || !dragEl) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    dragEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`;

    let targetTile: HTMLElement | null = null;
    const tiles = grid.querySelectorAll<HTMLElement>('[data-tile]');
    for (const tile of Array.from(tiles)) {
      if (tile === dragEl) continue;
      if (tile.style.display === 'none') continue;
      const rect = tile.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        targetTile = tile;
      }
    }

    if (hoverTile && hoverTile !== targetTile) hoverTile.classList.remove('drag-hover');
    if (targetTile && !CORE_TILES.includes(targetTile.dataset.tile || '')) {
      targetTile.classList.add('drag-hover');
      hoverTile = targetTile;
    } else {
      hoverTile = null;
    }
  });

  document.addEventListener('mouseup', () => {
    if (!editing || !dragEl) return;
    dragEl.style.transform = '';
    dragEl.style.zIndex = '';

    if (hoverTile && hoverTile !== dragEl) {
      const sourceId = dragEl.dataset.tile!;
      const targetId = hoverTile.dataset.tile!;
      const sourcePos = currentLayout.find((p) => p.id === sourceId)!;
      const targetPos = currentLayout.find((p) => p.id === targetId)!;
      const tmpCol = sourcePos.col;
      const tmpRow = sourcePos.row;
      sourcePos.col = targetPos.col;
      sourcePos.row = targetPos.row;
      targetPos.col = tmpCol;
      targetPos.row = tmpRow;
      const sourceIdx = currentLayout.findIndex((p) => p.id === sourceId);
      const targetIdx = currentLayout.findIndex((p) => p.id === targetId);
      if (sourceIdx !== -1 && targetIdx !== -1) {
        [currentLayout[sourceIdx], currentLayout[targetIdx]] = [currentLayout[targetIdx], currentLayout[sourceIdx]];
      }
      saveLayout(currentLayout);
      applyLayout();
    }

    if (hoverTile) { hoverTile.classList.remove('drag-hover'); hoverTile = null; }
    dragEl.classList.remove('dragging');
    dragEl = null;
  });
}
