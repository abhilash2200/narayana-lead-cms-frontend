import {
  ColumnConfig,
  DEFAULT_COL_WIDTHS,
  DEFAULT_LEAD_COLUMNS,
} from '../models/lead-columns.config';

export class LeadColumnManager {
  private readonly STORAGE_KEY = 'leads_column_prefs';
  private readonly WIDTHS_STORAGE_KEY = 'leads_column_widths';

  columns: ColumnConfig[] = DEFAULT_LEAD_COLUMNS.map((c) => ({ ...c }));
  colWidths: Record<string, number> = { ...DEFAULT_COL_WIDTHS };
  colVisibility: Record<string, boolean> = {};
  visibleColumns: ColumnConfig[] = [];
  visibleColumnCount = 0;

  draggedColIndex: number | null = null;
  dragOverColIndex: number | null = null;

  private resizingColKey: string | null = null;
  private startX = 0;
  private startWidth = 0;

  constructor() {
    this.loadColumnPrefs();
    this.loadColWidths();
    this.updateColumnCache();
  }

  updateColumnCache(): void {
    const map: Record<string, boolean> = {};
    const visible: ColumnConfig[] = [];
    for (const col of this.columns) {
      map[col.key] = col.visible;
      if (col.visible) visible.push(col);
    }
    this.colVisibility = map;
    this.visibleColumns = visible;
    this.visibleColumnCount = visible.length;
  }

  toggleColumn(key: string): void {
    const col = this.columns.find((c) => c.key === key);
    if (col) {
      col.visible = !col.visible;
      this.saveColumnPrefs();
      this.updateColumnCache();
    }
  }

  toggleAllColumns(visible: boolean): void {
    for (const col of this.columns) {
      if (col.optional) {
        col.visible = visible;
      }
    }
    this.saveColumnPrefs();
    this.updateColumnCache();
  }

  moveColumn(index: number, direction: 'up' | 'down'): boolean {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= this.columns.length) return false;

    const item = this.columns.splice(index, 1)[0];
    this.columns.splice(targetIndex, 0, item);

    this.saveColumnPrefs();
    this.updateColumnCache();
    return true;
  }

  resetColumnOrder(): void {
    this.columns = DEFAULT_LEAD_COLUMNS.map((c) => ({ ...c }));
    this.saveColumnPrefs();
    this.updateColumnCache();
  }

  handleDrop(targetIndex: number): boolean {
    if (this.draggedColIndex === null || this.draggedColIndex === targetIndex) {
      this.draggedColIndex = null;
      this.dragOverColIndex = null;
      return false;
    }

    const item = this.columns.splice(this.draggedColIndex, 1)[0];
    this.columns.splice(targetIndex, 0, item);

    this.draggedColIndex = null;
    this.dragOverColIndex = null;

    this.saveColumnPrefs();
    this.updateColumnCache();
    return true;
  }

  startResize(
    event: MouseEvent,
    colKey: string,
    onResizeUpdate: () => void
  ): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingColKey = colKey;
    this.startX = event.clientX;
    this.startWidth = this.colWidths[colKey] || 100;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.resizingColKey) return;
      const delta = moveEvent.clientX - this.startX;
      const newWidth = Math.max(50, this.startWidth + delta);
      this.colWidths[this.resizingColKey] = newWidth;
      onResizeUpdate();
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (this.resizingColKey) {
        this.saveColWidths();
        this.resizingColKey = null;
        onResizeUpdate();
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  resetColWidths(): void {
    this.colWidths = { ...DEFAULT_COL_WIDTHS };
    try {
      localStorage.removeItem(this.WIDTHS_STORAGE_KEY);
    } catch {}
  }

  loadColumnPrefs(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.order)) {
          const map = new Map(DEFAULT_LEAD_COLUMNS.map((c) => [c.key, { ...c }]));
          const reordered: ColumnConfig[] = [];

          if (!parsed.order.includes('sno') && map.has('sno')) {
            const snoCol = map.get('sno')!;
            if (parsed.visibility && parsed.visibility['sno'] !== undefined) {
              snoCol.visible = Boolean(parsed.visibility['sno']);
            }
            reordered.push(snoCol);
            map.delete('sno');
          }

          for (const key of parsed.order) {
            const col = map.get(key);
            if (col) {
              if (parsed.visibility && parsed.visibility[key] !== undefined) {
                col.visible = Boolean(parsed.visibility[key]);
              }
              reordered.push(col);
              map.delete(key);
            }
          }
          for (const col of map.values()) {
            if (parsed.visibility && parsed.visibility[col.key] !== undefined) {
              col.visible = Boolean(parsed.visibility[col.key]);
            }
            reordered.push(col);
          }
          this.columns = reordered;
        } else if (parsed && typeof parsed === 'object') {
          this.columns = DEFAULT_LEAD_COLUMNS.map((c) => ({
            ...c,
            visible: parsed[c.key] !== undefined ? Boolean(parsed[c.key]) : c.visible,
          }));
        }
      }
    } catch {}
  }

  saveColumnPrefs(): void {
    try {
      const prefs = {
        order: this.columns.map((c) => c.key),
        visibility: this.columns.reduce(
          (acc, c) => {
            acc[c.key] = c.visible;
            return acc;
          },
          {} as Record<string, boolean>
        ),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }

  loadColWidths(): void {
    try {
      const saved = localStorage.getItem(this.WIDTHS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          this.colWidths = { ...DEFAULT_COL_WIDTHS, ...parsed };
        }
      }
    } catch {}
  }

  saveColWidths(): void {
    try {
      localStorage.setItem(this.WIDTHS_STORAGE_KEY, JSON.stringify(this.colWidths));
    } catch {}
  }
}
