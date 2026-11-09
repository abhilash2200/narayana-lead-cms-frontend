import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';
import { DateRangePickerComponent } from '../../components/date-range-picker/date-range-picker.component';
import { ToastService } from '../../core/services/toast.service';
import { LeadItem, LeadModule, LeadService } from '../../services/lead.service';
import {
  AdsDashboardCalculationResult,
  AdsDashboardFilterState,
  AdsDuplicateFilterMode,
  AdsReportingMode,
  AdsTimeframePreset,
} from './models/ads-dashboard.model';
import {
  calculateAdsDashboard,
  extractLeadCourse,
  formatLocalDateToYMD,
} from './utils/ads-dashboard-calculator.util';
import { generateAdsDashboardMockLeads } from './utils/ads-dashboard-mock.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TopbarComponent,
    SidebarComponent,
    DateRangePickerComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly leadService = inject(LeadService);
  protected readonly cdr = inject(ChangeDetectorRef);

  private readonly MODULE_STORAGE_KEY = 'ads_dashboard_selected_module';
  private fetchSub?: Subscription;

  // Modules & Data State
  isDemoMode = true; // Default to rich demo data as requested by user
  modules: LeadModule[] = [];
  isLoadingModules = false;
  isLoadingLeads = false;
  loadError = '';

  // Raw leads cache for currently selected module
  rawLeads: LeadItem[] = [];

  // Filter & Control State (Default: Today view as requested)
  filterState: AdsDashboardFilterState = {
    selectedModuleKey: '',
    timeframe: 'today',
    dateFrom: '',
    dateTo: '',
    selectedCourse: '',
    excludeTest: true,
    duplicateMode: 'unique_only',
    reportMode: 'total',
  };

  // Calculation Results
  calculationResult: AdsDashboardCalculationResult | null = null;

  // UI helpers
  readonly todayFormattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  ngOnInit(): void {
    const today = formatLocalDateToYMD(new Date());
    this.filterState.dateFrom = today;
    this.filterState.dateTo = today;
    this.loadModules();
  }

  ngOnDestroy(): void {
    this.fetchSub?.unsubscribe();
  }

  loadModules(): void {
    if (this.isDemoMode) {
      this.modules = [
        { key: 'wbnarayanaschools.in', label: 'wbnarayanaschools.in (All Pages)', match: 'exact', value: 'wbnarayanaschools.in' },
        { key: 'admissions.narayanaschools.in', label: 'admissions.narayanaschools.in (Admissions Portal)', match: 'exact', value: 'admissions.narayanaschools.in' },
        { key: 'kolkata.narayanaschools.in', label: 'kolkata.narayanaschools.in (Kolkata Campuses)', match: 'exact', value: 'kolkata.narayanaschools.in' },
      ];
      const savedModuleKey = localStorage.getItem(this.MODULE_STORAGE_KEY);
      if (savedModuleKey && this.modules.some((m) => m.key === savedModuleKey)) {
        this.filterState.selectedModuleKey = savedModuleKey;
      } else {
        this.filterState.selectedModuleKey = this.modules[0].key;
      }
      this.loadDemoLeads();
      return;
    }

    this.isLoadingModules = true;
    this.loadError = '';
    this.cdr.markForCheck();

    this.leadService.getModules().subscribe({
      next: (res) => {
        this.isLoadingModules = false;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.modules = res.data;

          const savedModuleKey = localStorage.getItem(this.MODULE_STORAGE_KEY);
          if (savedModuleKey && this.modules.some((m) => m.key === savedModuleKey)) {
            this.filterState.selectedModuleKey = savedModuleKey;
          } else {
            this.filterState.selectedModuleKey = this.modules[0].key;
          }

          this.fetchLeadsForModule();
        } else {
          this.loadError = 'No lead data modules found for this organization.';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.isLoadingModules = false;
        this.loadError = 'Failed to load lead modules from server.';
        console.error('Error loading lead modules:', err);
        this.cdr.markForCheck();
      },
    });
  }

  toggleDemoMode(): void {
    this.isDemoMode = !this.isDemoMode;
    if (this.isDemoMode) {
      if (this.modules.length === 0) {
        this.loadModules();
      } else {
        this.loadDemoLeads();
      }
      this.toast.info('Switched to Demo Analytics Mode (Realistic Dummy Data).');
    } else {
      this.fetchLeadsForModule();
      this.toast.info('Switched to Live API Data Feed.');
    }
    this.cdr.markForCheck();
  }

  loadDemoLeads(): void {
    this.isLoadingLeads = false;
    this.loadError = '';
    this.rawLeads = generateAdsDashboardMockLeads();
    this.recalculate();
  }

  onModuleChange(): void {
    if (!this.filterState.selectedModuleKey) return;
    localStorage.setItem(this.MODULE_STORAGE_KEY, this.filterState.selectedModuleKey);
    if (this.isDemoMode) {
      this.loadDemoLeads();
    } else {
      this.fetchLeadsForModule();
    }
  }

  fetchLeadsForModule(): void {
    if (this.isDemoMode) {
      this.loadDemoLeads();
      return;
    }

    if (!this.filterState.selectedModuleKey) return;

    this.isLoadingLeads = true;
    this.loadError = '';
    this.fetchSub?.unsubscribe();
    this.cdr.markForCheck();

    // Fetch leads for module (using standard supported batch limit 100)
    this.fetchSub = this.leadService
      .getLeads({
        module: this.filterState.selectedModuleKey,
        per_page: 100,
        page: 1,
      })
      .subscribe({
        next: (res) => {
          this.isLoadingLeads = false;
          if (res.success && Array.isArray(res.data)) {
            this.rawLeads = res.data;
          } else {
            this.rawLeads = [];
          }
          this.recalculate();
        },
        error: (err) => {
          this.isLoadingLeads = false;
          this.loadError = 'Could not load leads for the selected module from API.';
          console.error('Error fetching leads:', err);
          this.recalculate();
        },
      });
  }

  setTimeframe(tf: AdsTimeframePreset): void {
    this.filterState.timeframe = tf;
    const now = new Date();
    const todayStr = formatLocalDateToYMD(now);

    switch (tf) {
      case 'today':
        this.filterState.dateFrom = todayStr;
        this.filterState.dateTo = todayStr;
        break;

      case 'yesterday': {
        const yest = new Date();
        yest.setDate(now.getDate() - 1);
        const yestStr = formatLocalDateToYMD(yest);
        this.filterState.dateFrom = yestStr;
        this.filterState.dateTo = yestStr;
        break;
      }

      case '7d': {
        const start7 = new Date();
        start7.setDate(now.getDate() - 6);
        this.filterState.dateFrom = formatLocalDateToYMD(start7);
        this.filterState.dateTo = todayStr;
        break;
      }

      case '30d': {
        const start30 = new Date();
        start30.setDate(now.getDate() - 29);
        this.filterState.dateFrom = formatLocalDateToYMD(start30);
        this.filterState.dateTo = todayStr;
        break;
      }

      case 'this_month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        this.filterState.dateFrom = formatLocalDateToYMD(firstDay);
        this.filterState.dateTo = formatLocalDateToYMD(lastDay);
        break;
      }

      case 'custom':
        // Custom dates are controlled via DateRangePickerComponent
        break;
    }

    this.recalculate();
  }

  onCustomDateRangeChange(range: { startDate: string; endDate: string }): void {
    if (!range.startDate || !range.endDate) return;
    this.filterState.timeframe = 'custom';
    this.filterState.dateFrom = range.startDate;
    this.filterState.dateTo = range.endDate;
    this.recalculate();
  }

  onCourseFilterChange(course: string): void {
    this.filterState.selectedCourse = course;
    this.recalculate();
  }

  toggleExcludeTest(): void {
    this.filterState.excludeTest = !this.filterState.excludeTest;
    this.recalculate();
  }

  setDuplicateMode(mode: AdsDuplicateFilterMode): void {
    this.filterState.duplicateMode = mode;
    this.recalculate();
  }

  setReportMode(mode: AdsReportingMode): void {
    this.filterState.reportMode = mode;
    this.cdr.markForCheck();
  }

  private recalculate(): void {
    this.calculationResult = calculateAdsDashboard(this.rawLeads, this.filterState);
    this.cdr.markForCheck();
  }

  get selectedModuleLabel(): string {
    const mod = this.modules.find((m) => m.key === this.filterState.selectedModuleKey);
    return mod ? mod.label : 'Select Lead Module';
  }

  navigateToLeads(): void {
    this.router.navigate(['/leads'], {
      queryParams: { module: this.filterState.selectedModuleKey },
    });
  }

  navigateToAddPage(): void {
    this.router.navigate(['/dynamic-pages/add']);
  }

  exportSummary(): void {
    if (!this.calculationResult || this.calculationResult.filteredLeads.length === 0) {
      this.toast.error('No lead records available to export for the current filters.');
      return;
    }

    const leads = this.calculationResult.filteredLeads;
    const headers = [
      'ID',
      'Entry Date',
      'Student Name',
      'Phone',
      'Parent Email',
      'Course/Class',
      'City',
      'Branch',
      'OTP Validation',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
    ];

    const rows = leads.map((l) => [
      `"${l.id ?? ''}"`,
      `"${l.entrydate ?? ''}"`,
      `"${(l.name ?? '').replace(/"/g, '""')}"`,
      `"${l.phone ?? ''}"`,
      `"${l.parent_email ?? ''}"`,
      `"${extractLeadCourse(l).replace(/"/g, '""')}"`,
      `"${(l.city ?? '').replace(/"/g, '""')}"`,
      `"${(l.branch ?? '').replace(/"/g, '""')}"`,
      `"${l.otp_validation ?? ''}"`,
      `"${(l.utm_source ?? '').replace(/"/g, '""')}"`,
      `"${(l.utm_medium ?? '').replace(/"/g, '""')}"`,
      `"${(l.utm_campaign ?? '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `ads_leads_${this.filterState.selectedModuleKey}_${this.filterState.dateFrom}_to_${this.filterState.dateTo}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toast.success(`Exported ${leads.length} leads successfully as CSV.`);
  }

  formatNumber(val: number): string {
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'k';
    }
    return new Intl.NumberFormat('en-IN').format(val);
  }
}
