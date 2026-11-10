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
import { Subscription } from 'rxjs';

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
import { isTestLead } from './utils/lead-filters.util';
import {
  BACKEND_SORTABLE_COLUMNS,
  ColumnConfig,
  DEFAULT_COL_WIDTHS,
  DEFAULT_LEAD_COLUMNS,
  FILTER_KEY_TO_PARAM_MAP,
} from './models/lead-columns.config';
import { LeadColumnManager } from './utils/lead-column-manager';
import {
  BackendLeadFilters,
  DynamicFilterOptionGroup,
} from './models/lead-filter.types';
import {
  buildAdvancedFilterGroups,
  computeActiveAdvancedFilterCount,
  computeActiveBackendFilterCount,
  computeHasActiveFilters,
  constructLeadQueryParams,
  cycleSortOrder,
  formatFilterLabel,
} from './utils/lead-query.builder';
import {
  computeDisplayedPages,
  computeSerialNumber,
  downloadBlobAsFile,
  extractCellValue,
} from './utils/lead-table.util';
import { LeadDetailDrawerComponent } from './components/lead-detail-drawer/lead-detail-drawer.component';
import { LeadColumnsDropdownComponent } from './components/lead-columns-dropdown/lead-columns-dropdown.component';
import { LeadDataCoordinator } from './services/lead-data.coordinator';

export type { ColumnConfig, BackendLeadFilters, DynamicFilterOptionGroup };

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
    LeadDetailDrawerComponent,
    LeadColumnsDropdownComponent,
  ],
  templateUrl: './leads.component.html',
})
export class LeadsComponent implements OnInit, OnDestroy {
  private readonly leadService = inject(LeadService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly cdr = inject(ChangeDetectorRef);
  private readonly coordinator = inject(LeadDataCoordinator);

  readonly columnManager = new LeadColumnManager();
  private routeSub?: Subscription;

  readonly skeletonRows = Array(10).fill(0);

  // Module state
  modules: LeadModule[] = [];
  selectedModuleKey = '';
  isLoadingModules = false;
  activeModuleLabel = '';

  // Leads list & pagination
  leads: LeadItem[] = [];
  meta: LeadMeta = { page: 1, per_page: 25, total: 0, filtered: 0, total_pages: 1 };
  isLoadingLeads = false;
  loadError = '';
  cachedDisplayedPages: number[] = [];

  get displayedLeads(): LeadItem[] {
    return this.leads;
  }

  // Filter & Query state
  searchTerm = '';
  excludeSearchTerm = '';
  excludeTest = false;
  exactName = '';
  exactPhone = '';
  phoneMode: 'all' | 'unique' | 'duplicates_only' = 'all';
  dateFrom = '';
  dateTo = '';
  perPage = 25;
  currentPage = 1;
  isExporting = false;

  // Dropdown open state
  isColumnsDropdownOpen = false;
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

  readonly backendSortableColumns = BACKEND_SORTABLE_COLUMNS;
  readonly primaryFilterKeys = new Set<string>();
  readonly filterKeyToParamMap = FILTER_KEY_TO_PARAM_MAP;
  readonly defaultColumns = DEFAULT_LEAD_COLUMNS;
  readonly defaultColWidths = DEFAULT_COL_WIDTHS;

  get columns(): ColumnConfig[] { return this.columnManager.columns; }
  set columns(val: ColumnConfig[]) { this.columnManager.columns = val; this.columnManager.updateColumnCache(); }
  get visibleColumns(): ColumnConfig[] { return this.columnManager.visibleColumns; }
  get visibleColumnCount(): number { return this.columnManager.visibleColumnCount; }
  get colVisibility(): Record<string, boolean> { return this.columnManager.colVisibility; }
  get colWidths(): Record<string, number> { return this.columnManager.colWidths; }
  set colWidths(val: Record<string, number>) { this.columnManager.colWidths = val; }
  get draggedColIndex(): number | null { return this.columnManager.draggedColIndex; }
  set draggedColIndex(val: number | null) { this.columnManager.draggedColIndex = val; }
  get dragOverColIndex(): number | null { return this.columnManager.dragOverColIndex; }
  set dragOverColIndex(val: number | null) { this.columnManager.dragOverColIndex = val; }

  get cityOptions(): string[] { return this.filterOptions?.['cities'] || this.filterOptions?.['city'] || []; }
  get branchOptions(): string[] { return this.filterOptions?.['branches'] || this.filterOptions?.['branch'] || []; }
  get classOptions(): string[] { return this.filterOptions?.['classes'] || this.filterOptions?.['class'] || []; }
  get boardOptions(): string[] { return this.filterOptions?.['boards'] || this.filterOptions?.['board'] || []; }

  sortKey: string | null = 'id';
  sortOrder: 'asc' | 'desc' | null = 'desc';

  selectedLeadForDetail: LeadItem | null = null;
  isLoadingLeadDetail = false;

  get activeModule(): LeadModule | undefined {
    return this.modules.find((m) => m.key === this.selectedModuleKey);
  }

  ngOnInit(): void {
    this.columnManager.loadColumnPrefs();
    this.columnManager.loadColWidths();
    this.columnManager.updateColumnCache();

    this.coordinator.init({
      onFetchStart: () => {
        this.isLoadingLeads = true;
        this.loadError = '';
        this.cdr.markForCheck();
      },
      onFetchSuccess: (data, meta, key) => {
        this.isLoadingLeads = false;
        this.leads = data;
        this.meta = meta;
        this.coordinator.setCache(key, { leads: data, meta });
        this.updateDisplayedPages();
        this.cdr.markForCheck();
      },
      onFetchError: (error) => {
        this.isLoadingLeads = false;
        this.leads = [];
        this.loadError = error;
        this.updateDisplayedPages();
        this.cdr.markForCheck();
      },
      onSearchChange: (term) => {
        this.searchTerm = term;
        this.onFilterTrigger();
      },
      onExcludeSearchChange: (term) => {
        this.excludeSearchTerm = term;
        this.onFilterTrigger();
      },
      onExactDuplicateChange: () => this.onFilterTrigger(),
      onDateChange: () => this.onFilterTrigger(),
    });

    this.loadModules();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.coordinator.destroy();
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

  toggleColumn(key: string): void { this.columnManager.toggleColumn(key); this.cdr.markForCheck(); }
  onColumnDragStart(e: DragEvent, idx: number): void { this.columnManager.draggedColIndex = idx; e.dataTransfer?.setData('text/plain', idx.toString()); }
  onColumnDragOver(e: DragEvent, idx: number): void { e.preventDefault(); if (this.columnManager.dragOverColIndex !== idx) { this.columnManager.dragOverColIndex = idx; this.cdr.markForCheck(); } }
  onColumnDragLeave(e: DragEvent, idx: number): void { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) { this.columnManager.dragOverColIndex = null; this.cdr.markForCheck(); } }
  onColumnDrop(e: DragEvent, idx: number): void { e.preventDefault(); this.columnManager.handleDrop(idx); this.cdr.markForCheck(); }
  onColumnDragEnd(): void { this.columnManager.draggedColIndex = null; this.columnManager.dragOverColIndex = null; this.cdr.markForCheck(); }
  moveColumn(idx: number, dir: 'up' | 'down', e?: Event): void { e?.stopPropagation(); e?.preventDefault(); this.columnManager.moveColumn(idx, dir); this.cdr.markForCheck(); }
  resetColumnOrder(): void { this.columnManager.resetColumnOrder(); this.cdr.markForCheck(); }
  toggleAllColumns(visible: boolean): void { this.columnManager.toggleAllColumns(visible); this.cdr.markForCheck(); }
  onResizeStart(e: MouseEvent, key: string): void { this.columnManager.startResize(e, key, () => this.cdr.markForCheck()); }
  resetColWidths(): void { this.columnManager.resetColWidths(); this.cdr.markForCheck(); }

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

    const matched = this.modules.find((m) => m.key === this.selectedModuleKey);
    this.activeModuleLabel = matched ? matched.label : this.selectedModuleKey;
    this.resetFilters();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { module: this.selectedModuleKey },
      queryParamsHandling: 'merge',
    });

    this.loadFilterOptions();
  }

  loadFilterOptions(): void {
    if (!this.selectedModuleKey) return;
    this.isLoadingFilterOptions = true;
    this.cdr.markForCheck();

    this.leadService.getFilterOptions(this.selectedModuleKey).subscribe({
      next: (response) => {
        this.isLoadingFilterOptions = false;
        if (response.success && response.data) {
          this.filterOptions = response.data;
          for (const key of Object.keys(response.data)) {
            if (!(key in this.backendFilters)) {
              this.backendFilters[key] = '';
            }
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoadingFilterOptions = false;
        console.error('Load filter options error:', err);
        this.cdr.markForCheck();
      },
    });
  }

  fetchLeads(): void {
    if (!this.selectedModuleKey) return;

    const params = this.buildParams();
    const cacheKey = JSON.stringify(params);

    if (this.coordinator.hasCache(cacheKey)) {
      const cached = this.coordinator.getCache(cacheKey)!;
      this.leads = cached.leads;
      this.meta = cached.meta;
      this.updateDisplayedPages();
      this.cdr.markForCheck();
      return;
    }

    this.coordinator.triggerFetch(params);
  }

  buildParams(): LeadQueryParams {
    return constructLeadQueryParams({
      selectedModuleKey: this.selectedModuleKey,
      currentPage: this.currentPage,
      perPage: this.perPage,
      phoneMode: this.phoneMode,
      searchTerm: this.searchTerm,
      excludeSearchTerm: this.excludeSearchTerm,
      exactName: this.exactName,
      exactPhone: this.exactPhone,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      sortKey: this.sortKey,
      sortOrder: this.sortOrder,
      backendFilters: this.backendFilters,
    });
  }

  clearPageCache(): void {
    this.coordinator.clearCache();
  }

  private onFilterTrigger(): void {
    this.currentPage = 1;
    this.clearPageCache();
    this.fetchLeads();
  }

  onSearchInput(term: string): void { this.coordinator.dispatchSearch(term); }
  onExcludeSearchInput(term: string): void { this.coordinator.dispatchExcludeSearch(term); }
  onExactDuplicateFilterChange(): void { this.coordinator.dispatchExactDuplicate(); }

  onDateRangeChange(range: { startDate: string; endDate: string }): void {
    this.dateFrom = range.startDate;
    this.dateTo = range.endDate;
    this.coordinator.dispatchDate();
  }

  onPerPageChange(): void { this.onFilterTrigger(); }
  onBackendFilterChange(): void { this.onFilterTrigger(); }

  resetBackendFilters(): void {
    for (const key of Object.keys(this.backendFilters)) {
      this.backendFilters[key] = '';
    }
  }

  resetAdvancedFilters(): void {
    for (const key of Object.keys(this.backendFilters)) {
      if (!this.primaryFilterKeys.has(key)) {
        this.backendFilters[key] = '';
      }
    }
    this.exactName = '';
    this.exactPhone = '';
    this.excludeSearchTerm = '';
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.excludeSearchTerm = '';
    this.excludeTest = false;
    this.exactName = '';
    this.exactPhone = '';
    this.phoneMode = 'all';
    this.dateFrom = '';
    this.dateTo = '';
    this.sortKey = 'id';
    this.sortOrder = 'desc';
    this.resetBackendFilters();
    this.onFilterTrigger();
  }

  get hasActiveFilters(): boolean {
    return computeHasActiveFilters({
      searchTerm: this.searchTerm,
      excludeSearchTerm: this.excludeSearchTerm,
      excludeTest: this.excludeTest,
      exactName: this.exactName,
      exactPhone: this.exactPhone,
      phoneMode: this.phoneMode,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      activeBackendFilterCount: this.activeBackendFilterCount,
      sortKey: this.sortKey,
      sortOrder: this.sortOrder,
    });
  }

  toggleExcludeTest(): void {
    this.excludeTest = !this.excludeTest;
    this.excludeSearchTerm = this.excludeTest ? 'test' : '';
    this.onFilterTrigger();
  }

  isLeadTest(lead: LeadItem): boolean { return isTestLead(lead); }

  get testLeadsCount(): number {
    return this.leads.filter((l) => isTestLead(l)).length;
  }

  get duplicateLeadsCount(): number {
    return this.leads.filter(
      (l) =>
        Boolean(l.is_phone_duplicate) ||
        Boolean(l.phone_duplicate_count && l.phone_duplicate_count > 1) ||
        Boolean(l.duplicate_count && l.duplicate_count > 1)
    ).length;
  }

  onPhoneModeChange(mode?: 'all' | 'unique' | 'duplicates_only'): void {
    if (mode) {
      this.phoneMode = mode;
    }
    this.onFilterTrigger();
  }

  inspectDuplicatePhone(phone: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!phone) return;
    this.exactPhone = phone.trim();
    this.phoneMode = 'all';
    this.onFilterTrigger();
    this.toastService.info(`Inspecting all records for phone: ${this.exactPhone}`);
  }

  clearExactPhoneFilter(): void {
    this.exactPhone = '';
    this.onFilterTrigger();
  }

  get activeBackendFilterCount(): number {
    return computeActiveBackendFilterCount(this.backendFilters, this.exactName, this.exactPhone);
  }

  get activeAdvancedFilterCount(): number {
    return computeActiveAdvancedFilterCount(
      this.backendFilters,
      this.primaryFilterKeys,
      this.exactName,
      this.exactPhone,
      this.excludeSearchTerm,
      this.excludeTest
    );
  }

  formatFilterLabel(key: string): string { return formatFilterLabel(key); }
  get advancedFilterGroups(): DynamicFilterOptionGroup[] {
    return buildAdvancedFilterGroups(this.filterOptions, this.primaryFilterKeys);
  }

  toggleMoreFilters(): void { this.showMoreFilters = !this.showMoreFilters; }
  isSortable(key: string): boolean { return this.backendSortableColumns.has(key); }

  toggleSort(key: string): void {
    if (!this.backendSortableColumns.has(key)) return;
    const next = cycleSortOrder(this.sortKey, this.sortOrder, key);
    this.sortKey = next.key;
    this.sortOrder = next.order;
    this.onFilterTrigger();
  }

  goToPage(page: number): void {
    const totalPages = this.meta.total_pages || 1;
    if (page < 1 || page > totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.fetchLeads();
  }

  private updateDisplayedPages(): void {
    this.cachedDisplayedPages = computeDisplayedPages(this.currentPage, this.meta.total_pages || 1);
  }

  getCellValue(lead: LeadItem, key: string): string { return extractCellValue(lead, key); }
  getSerialNumber(index: number): number {
    return computeSerialNumber(this.meta.page || this.currentPage || 1, this.meta.per_page || this.perPage || 25, index);
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
        const filename = `leads_${this.selectedModuleKey}_${new Date().toISOString().split('T')[0]}.csv`;
        downloadBlobAsFile(blob, filename);
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
