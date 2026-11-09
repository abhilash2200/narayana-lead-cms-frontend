import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { Subject, Subscription, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs/operators';

import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';
import { DateRangePickerComponent } from '../../components/date-range-picker/date-range-picker.component';
import {
  LeadFilterOptions,
  LeadItem,
  LeadMeta,
  LeadModule,
  LeadQueryParams,
  LeadService,
} from '../../services/lead.service';
import { ColumnConfig } from './models/lead-analysis.model';

export type { ColumnConfig };

export interface BackendLeadFilters {
  otp_validation: string;
  city: string;
  branch: string;
  class: string;
  board: string;
  class_category: string;
  reservation_type: string;
  redirect_from: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  [key: string]: string;
}

export interface DynamicFilterOptionGroup {
  key: string;
  label: string;
  options: string[];
}

@Component({
  selector: 'app-leads',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TopbarComponent,
    SidebarComponent,
    DateRangePickerComponent,
  ],
  templateUrl: './leads.component.html',
})
export class LeadsComponent implements OnInit, OnDestroy {
  private readonly leadService = inject(LeadService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly cdr = inject(ChangeDetectorRef);

  private routeSub?: Subscription;
  private fetchSub?: Subscription;
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;
  private excludeSearchSubject = new Subject<string>();
  private excludeSearchSub?: Subscription;
  private exactDuplicateSubject = new Subject<void>();
  private exactDuplicateSub?: Subscription;
  private dateSubject = new Subject<void>();
  private dateSub?: Subscription;
  private readonly fetchTrigger$ = new Subject<Record<string, unknown>>();
  private pageCache = new Map<string, { leads: LeadItem[]; meta: LeadMeta }>();
  private currentCacheKey = '';

  readonly skeletonRows = Array(10).fill(0);

  // Lead modules
  modules: LeadModule[] = [];
  selectedModuleKey = '';
  isLoadingModules = false;

  // Leads data
  leads: LeadItem[] = [];
  meta: LeadMeta = { page: 1, per_page: 25, total: 0, filtered: 0, total_pages: 1 };
  isLoadingLeads = false;
  loadError = '';

  // Query & Filter state
  searchTerm = '';
  excludeSearchTerm = '';
  exactName = '';
  exactPhone = '';
  dateFrom = '';
  dateTo = '';
  perPage = 25;
  currentPage = 1;
  isExporting = false;

  // Columns & dropdown
  isColumnsDropdownOpen = false;
  private readonly STORAGE_KEY = 'leads_column_prefs';
  private readonly WIDTHS_STORAGE_KEY = 'leads_column_widths';

  // Backend Filter State & Options
  filterOptions: LeadFilterOptions | null = null;
  isLoadingFilterOptions = false;
  showMoreFilters = false;

  backendFilters: BackendLeadFilters = {
    otp_validation: '',
    city: '',
    branch: '',
    class: '',
    board: '',
    class_category: '',
    reservation_type: '',
    redirect_from: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
  };

  // Safe sorting columns supported by backend:
  // ['id', 'entrydate', 'name', 'phone', 'city', 'branch', 'class', 'otp_validation', 'utm_source']
  readonly backendSortableColumns = new Set([
    'id',
    'entrydate',
    'name',
    'phone',
    'city',
    'branch',
    'class',
    'otp_validation',
    'utm_source',
  ]);

  // Primary filters shown directly in the top toolbar
  readonly primaryFilterKeys = new Set([
    'otp_validation',
    'city',
    'cities',
    'branch',
    'branches',
    'class',
    'classes',
  ]);

  // Param mapping between backend filter-options keys and API query params
  readonly filterKeyToParamMap: Record<string, string> = {
    cities: 'city',
    city: 'city',
    branches: 'branch',
    branch: 'branch',
    boards: 'board',
    board: 'board',
    classes: 'class',
    class: 'class',
    reservation_types: 'reservation_type',
    reservation_type: 'reservation_type',
    utm_sources: 'utm_source',
    utm_source: 'utm_source',
    utm_mediums: 'utm_medium',
    utm_medium: 'utm_medium',
    utm_campaigns: 'utm_campaign',
    utm_campaign: 'utm_campaign',
    otp_validation: 'otp_validation',
    redirect_from: 'redirect_from',
    class_category: 'class_category',
  };

  get cityOptions(): string[] {
    return this.filterOptions?.['cities'] || this.filterOptions?.['city'] || [];
  }

  get branchOptions(): string[] {
    return this.filterOptions?.['branches'] || this.filterOptions?.['branch'] || [];
  }

  get classOptions(): string[] {
    return this.filterOptions?.['classes'] || this.filterOptions?.['class'] || [];
  }

  get boardOptions(): string[] {
    return this.filterOptions?.['boards'] || this.filterOptions?.['board'] || [];
  }

  sortKey: string | null = 'id';
  sortOrder: 'asc' | 'desc' | null = 'desc';

  // Lead Details Drawer / Modal state
  selectedLeadForDetail: LeadItem | null = null;
  isLoadingLeadDetail = false;

  readonly defaultColumns: ColumnConfig[] = [
    { key: 'sno', label: '#', visible: true, optional: true },
    { key: 'id', label: 'ID', visible: true, optional: true },
    { key: 'entrydate', label: 'Entry Date', visible: true, optional: true },
    { key: 'name', label: 'Name', visible: true, optional: true },
    { key: 'phone', label: 'Phone', visible: true, optional: true },
    { key: 'parent_email', label: 'Email', visible: true, optional: true },
    { key: 'otp_validation', label: 'OTP', visible: true, optional: true },
    { key: 'city', label: 'City', visible: true, optional: true },
    { key: 'branch', label: 'Branch', visible: true, optional: true },
    { key: 'board', label: 'Board', visible: true, optional: true },
    { key: 'class', label: 'Class', visible: true, optional: true },
    { key: 'class_category', label: 'Class Category', visible: true, optional: true },
    { key: 'stream', label: 'Stream', visible: true, optional: true },
    { key: 'course', label: 'Course', visible: true, optional: true },
    { key: 'reservation_type', label: 'Reservation', visible: true, optional: true },
    { key: 'utm_source', label: 'UTM Source', visible: true, optional: true },
    { key: 'utm_campaign', label: 'UTM Campaign', visible: true, optional: true },
    { key: 'utm_medium', label: 'UTM Medium', visible: false, optional: true },
    { key: 'utm_content', label: 'UTM Content', visible: false, optional: true },
    { key: 'utm_term', label: 'UTM Term', visible: false, optional: true },
    { key: 'redirect_from', label: 'Redirect From', visible: false, optional: true },
    { key: 'page_section', label: 'Page Section', visible: false, optional: true },
  ];

  columns: ColumnConfig[] = this.defaultColumns.map((c) => ({ ...c }));
  draggedColIndex: number | null = null;
  dragOverColIndex: number | null = null;

  readonly defaultColWidths: Record<string, number> = {
    sno: 50,
    id: 65,
    entrydate: 140,
    name: 150,
    phone: 110,
    parent_email: 180,
    otp_validation: 85,
    city: 100,
    branch: 110,
    board: 80,
    class: 90,
    class_category: 100,
    stream: 100,
    course: 110,
    reservation_type: 110,
    utm_source: 130,
    utm_campaign: 140,
    utm_medium: 110,
    utm_content: 110,
    utm_term: 110,
    redirect_from: 130,
    page_section: 120,
  };
  colWidths: Record<string, number> = { ...this.defaultColWidths };
  private resizingColKey: string | null = null;
  private startX = 0;
  private startWidth = 0;

  colVisibility: Record<string, boolean> = {};
  visibleColumns: ColumnConfig[] = [];
  visibleColumnCount = 0;
  activeModuleLabel = '';
  cachedDisplayedPages: number[] = [];

  get activeModule(): LeadModule | undefined {
    return this.modules.find((m) => m.key === this.selectedModuleKey);
  }

  ngOnInit(): void {
    this.loadColumnPrefs();
    this.loadColWidths();
    this.updateColumnCache();

    this.fetchSub = this.fetchTrigger$
      .pipe(
        switchMap((params) =>
          this.leadService.getLeads(params as any).pipe(
            catchError((err) => {
              console.error('Fetch leads error:', err);
              return of({
                success: false,
                message: 'Failed to load leads from server.',
                data: [] as LeadItem[],
                meta: {} as LeadMeta,
              });
            })
          )
        )
      )
      .subscribe((response) => {
        this.isLoadingLeads = false;
        if (response.success) {
          this.leads = response.data || [];
          this.meta = response.meta ?? {
            page: this.currentPage,
            per_page: this.perPage,
            total: this.leads.length,
            filtered: this.leads.length,
            total_pages: 1,
          };
          this.pageCache.set(this.currentCacheKey, {
            leads: this.leads,
            meta: this.meta,
          });
        } else {
          this.leads = [];
          this.loadError = response.message || 'Unable to load leads.';
        }
        this.updateDisplayedPages();
        this.cdr.markForCheck();
      });

    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.clearPageCache();
        this.fetchLeads();
      });

    this.excludeSearchSub = this.excludeSearchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((term) => {
        this.excludeSearchTerm = term;
        this.currentPage = 1;
        this.clearPageCache();
        this.fetchLeads();
      });

    this.exactDuplicateSub = this.exactDuplicateSubject
      .pipe(debounceTime(350))
      .subscribe(() => {
        this.currentPage = 1;
        this.clearPageCache();
        this.fetchLeads();
      });

    this.dateSub = this.dateSubject
      .pipe(debounceTime(400))
      .subscribe(() => {
        this.currentPage = 1;
        this.clearPageCache();
        this.fetchLeads();
      });

    this.loadModules();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.excludeSearchSub?.unsubscribe();
    this.exactDuplicateSub?.unsubscribe();
    this.fetchSub?.unsubscribe();
    this.dateSub?.unsubscribe();
    this.fetchTrigger$.complete();
    this.searchSubject.complete();
    this.excludeSearchSubject.complete();
    this.exactDuplicateSubject.complete();
    this.dateSubject.complete();

    document.removeEventListener('mousemove', this.onResizing);
    document.removeEventListener('mouseup', this.onResizeEnd);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('#columns-dropdown-wrapper')) {
      if (this.isColumnsDropdownOpen) {
        this.isColumnsDropdownOpen = false;
        this.cdr.markForCheck();
      }
    }
  }

  toggleColumn(key: string): void {
    const col = this.columns.find((c) => c.key === key);
    if (col) {
      col.visible = !col.visible;
      this.saveColumnPrefs();
      this.updateColumnCache();
      this.cdr.markForCheck();
    }
  }

  private updateColumnCache(): void {
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

  private loadColumnPrefs(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.order)) {
          const map = new Map(this.defaultColumns.map((c) => [c.key, { ...c }]));
          const reordered: ColumnConfig[] = [];
          
          // If 'sno' is not in saved order, make sure it is placed first
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
          // Append any remaining default columns that might not have been in saved order
          for (const col of map.values()) {
            if (parsed.visibility && parsed.visibility[col.key] !== undefined) {
              col.visible = Boolean(parsed.visibility[col.key]);
            }
            reordered.push(col);
          }
          this.columns = reordered;
        } else if (parsed && typeof parsed === 'object') {
          // Legacy format: Record<string, boolean>
          this.columns = this.defaultColumns.map((c) => ({
            ...c,
            visible: parsed[c.key] !== undefined ? Boolean(parsed[c.key]) : c.visible,
          }));
        }
      }
    } catch {}
  }

  private saveColumnPrefs(): void {
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

  onColumnDragStart(event: DragEvent, index: number): void {
    this.draggedColIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onColumnDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.draggedColIndex === null) return;
    if (this.dragOverColIndex !== index) {
      this.dragOverColIndex = index;
      this.cdr.markForCheck();
    }
  }

  onColumnDragLeave(event: DragEvent, index: number): void {
    const target = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as Node | null;
    if (!target.contains(related)) {
      if (this.dragOverColIndex === index) {
        this.dragOverColIndex = null;
        this.cdr.markForCheck();
      }
    }
  }

  onColumnDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    if (this.draggedColIndex === null || this.draggedColIndex === targetIndex) {
      this.draggedColIndex = null;
      this.dragOverColIndex = null;
      return;
    }

    const item = this.columns.splice(this.draggedColIndex, 1)[0];
    this.columns.splice(targetIndex, 0, item);

    this.draggedColIndex = null;
    this.dragOverColIndex = null;

    this.saveColumnPrefs();
    this.updateColumnCache();
    this.cdr.markForCheck();
  }

  onColumnDragEnd(): void {
    this.draggedColIndex = null;
    this.dragOverColIndex = null;
    this.cdr.markForCheck();
  }

  moveColumn(index: number, direction: 'up' | 'down', event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= this.columns.length) return;

    const item = this.columns.splice(index, 1)[0];
    this.columns.splice(targetIndex, 0, item);

    this.saveColumnPrefs();
    this.updateColumnCache();
    this.cdr.markForCheck();
  }

  resetColumnOrder(): void {
    this.columns = this.defaultColumns.map((c) => ({ ...c }));
    this.saveColumnPrefs();
    this.updateColumnCache();
    this.toastService.success('Column order and visibility reset to default.');
    this.cdr.markForCheck();
  }

  toggleAllColumns(selectAll: boolean): void {
    this.columns.forEach((c) => (c.visible = selectAll));
    if (!selectAll && this.columns.length > 0) {
      this.columns[0].visible = true;
    }
    this.saveColumnPrefs();
    this.updateColumnCache();
    this.cdr.markForCheck();
  }

  onResizeStart(event: MouseEvent, colKey: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingColKey = colKey;
    this.startX = event.clientX;
    const th = (event.target as HTMLElement).closest('th');
    this.startWidth = th ? th.offsetWidth : (this.colWidths[colKey] || 100);
    document.addEventListener('mousemove', this.onResizing);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  private onResizing = (event: MouseEvent): void => {
    if (!this.resizingColKey) return;
    const delta = event.clientX - this.startX;
    const newWidth = Math.max(45, this.startWidth + delta);
    this.colWidths[this.resizingColKey] = newWidth;
    this.cdr.markForCheck();
  };

  private onResizeEnd = (): void => {
    if (this.resizingColKey) {
      this.saveColWidths();
      this.resizingColKey = null;
    }
    document.removeEventListener('mousemove', this.onResizing);
    document.removeEventListener('mouseup', this.onResizeEnd);
    this.cdr.markForCheck();
  };

  private loadColWidths(): void {
    try {
      const saved = localStorage.getItem(this.WIDTHS_STORAGE_KEY);
      if (saved) {
        this.colWidths = { ...this.defaultColWidths, ...JSON.parse(saved) };
      }
    } catch {}
  }

  private saveColWidths(): void {
    try {
      localStorage.setItem(this.WIDTHS_STORAGE_KEY, JSON.stringify(this.colWidths));
    } catch {}
  }

  resetColWidths(): void {
    this.colWidths = { ...this.defaultColWidths };
    this.saveColWidths();
    this.cdr.markForCheck();
  }

  loadModules(): void {
    this.isLoadingModules = true;
    this.cdr.markForCheck();

    this.leadService.getModules().subscribe({
      next: (response) => {
        this.isLoadingModules = false;
        if (response.success && Array.isArray(response.data)) {
          this.modules = response.data;

          this.routeSub = this.route.queryParams.subscribe((params) => {
            const requestedModule = params['module'];
            if (requestedModule && this.modules.some((m) => m.key === requestedModule)) {
              this.selectedModuleKey = requestedModule;
              this.activeModuleLabel = this.modules.find((m) => m.key === requestedModule)?.label ?? '';
              this.currentPage = 1;
              this.loadFilterOptions();
              this.fetchLeads();
            } else {
              this.selectedModuleKey = '';
              this.activeModuleLabel = '';
              this.leads = [];
              this.meta = { page: 1, per_page: this.perPage, total: 0, filtered: 0, total_pages: 1 };
              this.filterOptions = null;
            }
          });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoadingModules = false;
        this.loadError = 'Failed to load lead modules.';
        this.cdr.markForCheck();
        console.error('Load modules error:', err);
      },
    });
  }

  onModuleChange(): void {
    if (!this.selectedModuleKey) {
      this.activeModuleLabel = '';
      this.leads = [];
      this.meta = { page: 1, per_page: this.perPage, total: 0, filtered: 0, total_pages: 1 };
      this.cachedDisplayedPages = [];
      this.filterOptions = null;
      this.clearPageCache();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { module: null },
        queryParamsHandling: 'merge',
      });
      return;
    }

    this.activeModuleLabel = this.modules.find((m) => m.key === this.selectedModuleKey)?.label ?? '';
    this.currentPage = 1;
    this.searchTerm = '';
    this.excludeSearchTerm = '';
    this.exactName = '';
    this.exactPhone = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.resetBackendFilters();
    this.clearPageCache();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { module: this.selectedModuleKey },
      queryParamsHandling: 'merge',
    });

    this.loadFilterOptions();
    this.fetchLeads();
  }

  loadFilterOptions(): void {
    if (!this.selectedModuleKey) return;
    this.isLoadingFilterOptions = true;
    this.leadService.getFilterOptions(this.selectedModuleKey).subscribe({
      next: (res) => {
        this.isLoadingFilterOptions = false;
        if (res.success && res.data) {
          this.filterOptions = res.data;
          // Ensure all returned filter keys exist in backendFilters for two-way binding
          for (const key of Object.keys(res.data)) {
            if (!(key in this.backendFilters)) {
              this.backendFilters[key] = '';
            }
          }
        } else {
          this.filterOptions = null;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoadingFilterOptions = false;
        this.filterOptions = null;
        console.warn('Could not load filter options:', err);
        this.cdr.markForCheck();
      },
    });
  }

  fetchLeads(): void {
    if (!this.selectedModuleKey) return;

    this.loadError = '';
    this.currentCacheKey = this.buildCacheKey();
    const cached = this.pageCache.get(this.currentCacheKey);
    if (cached) {
      this.leads = cached.leads;
      this.meta = cached.meta;
      this.isLoadingLeads = false;
      this.updateDisplayedPages();
      this.cdr.markForCheck();
      return;
    }

    this.isLoadingLeads = true;
    this.cdr.markForCheck();
    this.fetchTrigger$.next(this.buildParams());
  }

  private buildParams(): Record<string, unknown> {
    const params: Record<string, unknown> = {
      module: this.selectedModuleKey,
      page: this.currentPage,
      per_page: this.perPage,
    };
    if (this.searchTerm.trim()) params['search'] = this.searchTerm.trim();
    if (this.excludeSearchTerm.trim()) params['exclude_search'] = this.excludeSearchTerm.trim();
    if (this.exactName.trim()) params['name'] = this.exactName.trim();
    if (this.exactPhone.trim()) params['phone'] = this.exactPhone.trim();
    if (this.dateFrom) params['date_from'] = this.dateFrom;
    if (this.dateTo) params['date_to'] = this.dateTo;

    if (this.sortKey && this.backendSortableColumns.has(this.sortKey)) {
      params['sort_by'] = this.sortKey;
      if (this.sortOrder) params['sort_order'] = this.sortOrder;
    }

    // Dynamically attach all active filters present in backendFilters, mapping to proper query params
    for (const [key, value] of Object.entries(this.backendFilters)) {
      if (typeof value === 'string' && value.trim()) {
        const queryParamKey = this.filterKeyToParamMap[key] || key;
        params[queryParamKey] = value.trim();
      }
    }

    return params;
  }

  private buildCacheKey(): string {
    const p = this.buildParams();
    return Object.keys(p)
      .sort()
      .map((k) => `${k}=${p[k]}`)
      .join('&');
  }

  private clearPageCache(): void {
    this.pageCache.clear();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  onExcludeSearchInput(value: string): void {
    this.excludeSearchTerm = value;
    this.excludeSearchSubject.next(value);
  }

  onExactDuplicateFilterChange(): void {
    this.exactDuplicateSubject.next();
  }

  onDateRangeChange(range: { startDate: string; endDate: string }): void {
    this.dateFrom = range.startDate;
    this.dateTo = range.endDate;
    this.currentPage = 1;
    this.clearPageCache();
    this.fetchLeads();
  }

  onPerPageChange(): void {
    this.currentPage = 1;
    this.clearPageCache();
    this.fetchLeads();
  }

  onBackendFilterChange(): void {
    this.currentPage = 1;
    this.clearPageCache();
    this.fetchLeads();
  }

  resetBackendFilters(): void {
    const resetObj: BackendLeadFilters = {
      otp_validation: '',
      city: '',
      branch: '',
      class: '',
      board: '',
      class_category: '',
      reservation_type: '',
      redirect_from: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
    };
    if (this.filterOptions) {
      for (const key of Object.keys(this.filterOptions)) {
        resetObj[key] = '';
      }
    }
    this.backendFilters = resetObj;
  }

  resetAdvancedFilters(): void {
    for (const key of Object.keys(this.backendFilters)) {
      if (!this.primaryFilterKeys.has(key)) {
        this.backendFilters[key] = '';
      }
    }
    this.exactName = '';
    this.exactPhone = '';
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.excludeSearchTerm = '';
    this.exactName = '';
    this.exactPhone = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.sortKey = 'id';
    this.sortOrder = 'desc';
    this.resetBackendFilters();
    this.currentPage = 1;
    this.clearPageCache();
    this.fetchLeads();
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm.trim() ||
      this.excludeSearchTerm.trim() ||
      this.exactName.trim() ||
      this.exactPhone.trim() ||
      this.dateFrom ||
      this.dateTo ||
      this.activeBackendFilterCount > 0 ||
      this.sortKey !== 'id' ||
      this.sortOrder !== 'desc'
    );
  }

  get activeBackendFilterCount(): number {
    const filterCount = Object.values(this.backendFilters).filter(
      (v) => typeof v === 'string' && v.trim().length > 0
    ).length;
    const exactCount = (this.exactName.trim() ? 1 : 0) + (this.exactPhone.trim() ? 1 : 0);
    return filterCount + exactCount;
  }

  get activeAdvancedFilterCount(): number {
    const backendCount = Object.entries(this.backendFilters).filter(
      ([k, v]) => !this.primaryFilterKeys.has(k) && typeof v === 'string' && v.trim().length > 0
    ).length;
    const exactNameCount = this.exactName.trim() ? 1 : 0;
    const exactPhoneCount = this.exactPhone.trim() ? 1 : 0;
    return backendCount + exactNameCount + exactPhoneCount;
  }

  formatFilterLabel(key: string): string {
    const knownLabels: Record<string, string> = {
      cities: 'City',
      city: 'City',
      branches: 'Branch',
      branch: 'Branch',
      classes: 'Class',
      class: 'Class',
      boards: 'Board',
      board: 'Board',
      reservation_types: 'Reservation Type',
      reservation_type: 'Reservation Type',
      utm_sources: 'UTM Source',
      utm_source: 'UTM Source',
      utm_mediums: 'UTM Medium',
      utm_medium: 'UTM Medium',
      utm_campaigns: 'UTM Campaign',
      utm_campaign: 'UTM Campaign',
      utm_content: 'UTM Content',
      utm_term: 'UTM Term',
      redirect_from: 'Redirect From',
      class_category: 'Class Category',
      otp_validation: 'OTP Status',
      page_section: 'Page Section',
    };

    if (knownLabels[key]) {
      return knownLabels[key];
    }

    return key
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  get advancedFilterGroups(): DynamicFilterOptionGroup[] {
    if (!this.filterOptions) return [];

    const groups: DynamicFilterOptionGroup[] = [];
    for (const [key, rawOptions] of Object.entries(this.filterOptions)) {
      if (this.primaryFilterKeys.has(key)) continue;
      if (!Array.isArray(rawOptions) || rawOptions.length === 0) continue;

      const cleanOptions = rawOptions
        .filter((opt): opt is string => opt !== null && opt !== undefined && String(opt).trim().length > 0)
        .map((opt) => String(opt).trim());

      if (cleanOptions.length > 0) {
        groups.push({
          key,
          label: this.formatFilterLabel(key),
          options: cleanOptions,
        });
      }
    }
    return groups;
  }

  toggleMoreFilters(): void {
    this.showMoreFilters = !this.showMoreFilters;
    this.cdr.markForCheck();
  }

  get displayedLeads(): LeadItem[] {
    return this.leads;
  }

  isSortable(key: string): boolean {
    return this.backendSortableColumns.has(key);
  }

  toggleSort(key: string): void {
    if (!this.backendSortableColumns.has(key)) return;

    if (this.sortKey !== key) {
      this.sortKey = key;
      this.sortOrder = key === 'entrydate' ? 'desc' : 'asc';
    } else if (this.sortOrder === 'asc') {
      this.sortOrder = 'desc';
    } else if (this.sortOrder === 'desc') {
      this.sortOrder = 'asc';
    } else {
      this.sortOrder = 'desc';
    }

    this.currentPage = 1;
    this.clearPageCache();
    this.fetchLeads();
  }

  goToPage(page: number): void {
    const totalPages = this.meta.total_pages || 1;
    if (page < 1 || page > totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.fetchLeads();
  }

  private updateDisplayedPages(): void {
    const totalPages = this.meta.total_pages || 1;
    const current = this.currentPage;
    const pages: number[] = [];
    let start = Math.max(1, current - 2);
    let end = Math.min(totalPages, current + 2);
    if (current <= 3) end = Math.min(totalPages, 5);
    if (current >= totalPages - 2) start = Math.max(1, totalPages - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    this.cachedDisplayedPages = pages;
  }

  getCellValue(lead: LeadItem, key: string): string {
    const val = (lead as unknown as Record<string, unknown>)[key];
    return val !== null && val !== undefined && val !== '' ? String(val) : '—';
  }

  getSerialNumber(index: number): number {
    const page = this.meta.page || this.currentPage || 1;
    const perPage = this.meta.per_page || this.perPage || 25;
    return ((page - 1) * perPage) + index + 1;
  }

  openLeadDetail(lead: LeadItem): void {
    this.selectedLeadForDetail = lead;
    if (lead.id && this.selectedModuleKey) {
      this.isLoadingLeadDetail = true;
      this.leadService.getLeadById(lead.id, this.selectedModuleKey).subscribe({
        next: (res) => {
          this.isLoadingLeadDetail = false;
          if (res.success && res.data) {
            this.selectedLeadForDetail = res.data;
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoadingLeadDetail = false;
          console.warn('Could not fetch full lead details:', err);
          this.cdr.markForCheck();
        },
      });
    }
    this.cdr.markForCheck();
  }

  closeLeadDetail(): void {
    this.selectedLeadForDetail = null;
    this.isLoadingLeadDetail = false;
    this.cdr.markForCheck();
  }

  exportCsv(): void {
    if (!this.selectedModuleKey || this.isExporting) return;

    this.isExporting = true;
    this.cdr.markForCheck();

    const fullParams = this.buildParams();
    delete fullParams['page'];
    delete fullParams['per_page'];

    this.leadService.exportLeads(fullParams as LeadQueryParams).subscribe({
      next: (blob) => {
        this.isExporting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_${this.selectedModuleKey}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toastService.success('Lead export downloaded successfully.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isExporting = false;
        this.toastService.error('Failed to export leads.');
        this.cdr.markForCheck();
        console.error('Export error:', err);
      },
    });
  }
}