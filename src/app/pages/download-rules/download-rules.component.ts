import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';
import {
  CreateDownloadRulePayload,
  DownloadRuleItem,
  DownloadRuleService,
} from '../../services/download-rule.service';
import { City, CityService } from '../../services/city.service';
import { Branch, BranchService } from '../../services/branch.service';
import { ClassMaster, ClassService } from '../../services/class.service';
import { DocumentService, ManagedDocumentItem } from '../../services/document.service';
import { RuleFormModalComponent } from './rule-form-modal/rule-form-modal.component';
import { ConfirmDeleteModalComponent } from '../../components/confirm-delete-modal/confirm-delete-modal.component';

@Component({
  selector: 'app-download-rules',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TopbarComponent, SidebarComponent, RuleFormModalComponent, ConfirmDeleteModalComponent],
  templateUrl: './download-rules.component.html',
})
export class DownloadRulesComponent implements OnInit {
  private readonly ruleService = inject(DownloadRuleService);
  private readonly cityService = inject(CityService);
  private readonly branchService = inject(BranchService);
  private readonly classService = inject(ClassService);
  private readonly documentService = inject(DocumentService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly Number = Number;

  rules: DownloadRuleItem[] = [];
  isLoading = false;
  loadError = '';
  searchTerm = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  intentFilter: string = 'ALL';

  cities: City[] = [];
  branches: Branch[] = [];
  classes: ClassMaster[] = [];
  documents: ManagedDocumentItem[] = [];

  isModalOpen = false;
  isEditing = false;
  editingRuleId: string | number | null = null;
  editingRuleObj: DownloadRuleItem | null = null;

  formError = '';
  isSubmitting = false;

  isDeleteModalOpen = false;
  deletingRule: DownloadRuleItem | null = null;
  isDeleting = false;
  deleteError = '';

  toastMessage = '';

  readonly skeletonRows = Array(6).fill(0);

  readonly commonIntents = [
    'ENQUIRY',
    'BROCHURE',
    'FEES',
    'CALLBACK',
  ];

  ngOnInit(): void {
    this.loadRules();
    this.loadDropdownData();
  }

  loadRules(): void {
    this.isLoading = true;
    this.loadError = '';
    this.cdr.markForCheck();

    this.ruleService.getRules().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.rules = Array.isArray(res.data) ? res.data : [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError =
          err.error?.message ||
          err.message ||
          'Failed to load download rules list.';
        this.cdr.markForCheck();
      },
    });
  }

  loadDropdownData(): void {
    this.cityService.getCities().subscribe({
      next: (res) => {
        this.cities = Array.isArray(res.data) ? res.data : [];
        this.cdr.markForCheck();
      },
      error: () => {},
    });

    this.branchService.getBranches().subscribe({
      next: (res) => {
        this.branches = Array.isArray(res.data) ? res.data : [];
        this.cdr.markForCheck();
      },
      error: () => {},
    });

    this.classService.getClasses().subscribe({
      next: (res) => {
        this.classes = Array.isArray(res.data) ? res.data : [];
        this.cdr.markForCheck();
      },
      error: () => {},
    });

    this.documentService.getDocuments().subscribe({
      next: (res) => {
        this.documents = Array.isArray(res.data) ? res.data : [];
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  // ─── Computed Getters ──────────────────────────────────────────────────────

  get filteredRules(): DownloadRuleItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.rules.filter((rule) => {
      // Status filter
      // Status filter
      if (this.statusFilter === 'ACTIVE') {
        const ruleStatus = (rule.status || 'ACTIVE').toUpperCase();
        if (ruleStatus !== 'ACTIVE') return false;
      } else if (this.statusFilter === 'INACTIVE') {
        const ruleStatus = (rule.status || 'ACTIVE').toUpperCase();
        if (ruleStatus === 'ACTIVE') return false;
      }

      // Intent filter
      if (this.intentFilter !== 'ALL') {
        if ((rule.intent || '').toUpperCase() !== this.intentFilter) return false;
      }

      // Search term
      if (!term) return true;
      const idMatch = String(rule.id || '').toLowerCase().includes(term);
      const intentMatch = (rule.intent || '').toLowerCase().includes(term);
      const urlMatch = (rule.redirect_url || '').toLowerCase().includes(term);
      const docMatch = String(rule.document_id || '').includes(term);

      return idMatch || intentMatch || urlMatch || docMatch;
    });
  }

  get activeRulesCount(): number {
    return this.rules.filter((r) => (r.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  }

  get inactiveRulesCount(): number {
    return this.rules.filter((r) => (r.status || 'ACTIVE').toUpperCase() !== 'ACTIVE').length;
  }



  // ─── Label Helpers ─────────────────────────────────────────────────────────

  getCityName(cityId?: number | null): string {
    if (!cityId) return 'All Cities';
    const c = this.cities.find((item) => Number(item.id) === Number(cityId));
    return c ? c.name : `City #${cityId}`;
  }

  getBranchName(branchId?: number | null): string {
    if (!branchId) return 'All Branches';
    const b = this.branches.find((item) => Number(item.id) === Number(branchId));
    return b ? b.name : `Branch #${branchId}`;
  }

  getClassName(classId?: number | null): string {
    if (!classId) return 'All Classes';
    const cl = this.classes.find((item) => Number(item.id) === Number(classId));
    return cl ? cl.name : `Class #${classId}`;
  }

  getDocumentTitle(docId?: number | null): string {
    if (!docId) return 'None';
    const d = this.documents.find((item) => Number(item.id) === Number(docId));
    return d ? `${d.name} (${d.download_filename || 'PDF'})` : `Document #${docId}`;
  }

  openAddModal(): void {
    this.editingRuleObj = null;
    this.isEditing = false;
    this.editingRuleId = null;
    this.formError = '';
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  openEditModal(rule: DownloadRuleItem): void {
    this.editingRuleObj = rule;
    this.isEditing = true;
    this.editingRuleId = rule.id ?? null;
    this.formError = '';
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingRuleObj = null;
    this.isEditing = false;
    this.editingRuleId = null;
    this.formError = '';
    this.cdr.markForCheck();
  }

  onRuleFormSubmit(payload: CreateDownloadRulePayload): void {
    this.isSubmitting = true;
    this.formError = '';
    this.cdr.markForCheck();

    if (this.isEditing && this.editingRuleId) {
      this.ruleService.updateRule(this.editingRuleId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeModal();
          this.showToast(`Rule #${this.editingRuleId} updated successfully.`);
          this.loadRules();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.formError = this.extractErrorMessage(err);
          this.cdr.markForCheck();
        },
      });
    } else {
      this.ruleService.createRule(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          const newId = res.data?.id || '';
          this.showToast(`Outcome Rule ${newId ? '#' + newId : ''} created successfully.`);
          this.loadRules();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.formError = this.extractErrorMessage(err);
          this.cdr.markForCheck();
        },
      });
    }
  }

  openDeleteModal(rule: DownloadRuleItem): void {
    this.deletingRule = rule;
    this.deleteError = '';
    this.isDeleteModalOpen = true;
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deletingRule = null;
    this.deleteError = '';
    this.cdr.markForCheck();
  }

  submitDelete(): void {
    if (!this.deletingRule || !this.deletingRule.id) return;
    this.isDeleting = true;
    this.deleteError = '';
    this.cdr.markForCheck();

    this.ruleService.deleteRule(this.deletingRule.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.showToast('Download rule deleted successfully.');
        this.loadRules();
      },
      error: (err) => {
        this.isDeleting = false;
        this.deleteError = err.error?.message || err.message || 'Failed to delete rule.';
        this.cdr.markForCheck();
      },
    });
  }

  private extractErrorMessage(err: unknown): string {
    const e = err as {
      error?: {
        message?: string;
        error?: { message?: string };
        errors?: Record<string, string[] | string>;
      };
      message?: string;
    };
    if (e?.error?.error?.message) {
      return e.error.error.message;
    }
    if (e?.error?.errors && typeof e.error.errors === 'object') {
      const messages = Object.values(e.error.errors).flat();
      if (messages.length) return messages.join(' ');
    }
    return e?.error?.message || e?.message || 'Operation failed.';
  }

  private showToast(msg: string): void {
    this.toastService.success(msg);
  }
}
