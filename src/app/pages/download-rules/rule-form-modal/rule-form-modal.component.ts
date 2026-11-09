import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  inject, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { City } from '../../../services/city.service';
import { Branch } from '../../../services/branch.service';
import { ClassMaster } from '../../../services/class.service';
import { ManagedDocumentItem } from '../../../services/document.service';
import {
  CreateDownloadRulePayload,
  DownloadRuleItem,
} from '../../../services/download-rule.service';

@Component({
  selector: 'app-rule-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './rule-form-modal.component.html',
})
export class RuleFormModalComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  readonly Number = Number;

  @Input() rule: DownloadRuleItem | null = null;
  @Input() cities: City[] = [];
  @Input() branches: Branch[] = [];
  @Input() classes: ClassMaster[] = [];
  @Input() documents: ManagedDocumentItem[] = [];
  @Input() isSubmitting = false;
  @Input() formError = '';

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<CreateDownloadRulePayload>();

  isEditing = false;
  editingRuleId: string | number | null = null;

  formIntent = 'ENQUIRY';
  formOutcomeType: 'DOCUMENT' | 'URL' = 'DOCUMENT';
  formCityId: number = 0;
  formBranchId: number = 0;
  formClassId: number = 0;
  formDocumentId: number = 0;
  formRedirectUrl = '';
  formPriority: number = 0;
  formStartsAt = '';
  formEndsAt = '';
  formStatus = 'ACTIVE';

  readonly commonIntents = ['ENQUIRY', 'BROCHURE', 'FEES', 'CALLBACK'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rule']) {
      if (this.rule) {
        this.isEditing = true;
        this.editingRuleId = this.rule.id ?? null;
        this.formIntent = this.rule.intent || 'ENQUIRY';
        this.formOutcomeType = this.rule.redirect_url && !this.rule.document_id ? 'URL' : 'DOCUMENT';
        this.formCityId = Number(this.rule.city_id || 0);
        this.formBranchId = Number(this.rule.branch_id || 0);
        this.formClassId = Number(this.rule.class_id || 0);
        this.formDocumentId = Number(this.rule.document_id || 0);
        this.formRedirectUrl = this.rule.redirect_url || '';
        this.formPriority = Number(this.rule.priority || 0);
        this.formStartsAt = this.rule.starts_at ? this.toInputDatetime(this.rule.starts_at) : '';
        this.formEndsAt = this.rule.ends_at ? this.toInputDatetime(this.rule.ends_at) : '';
        this.formStatus = this.rule.status || 'ACTIVE';
      } else {
        this.isEditing = false;
        this.editingRuleId = null;
        this.formIntent = 'ENQUIRY';
        this.formOutcomeType = 'DOCUMENT';
        this.formCityId = 0;
        this.formBranchId = 0;
        this.formClassId = 0;
        this.formDocumentId = this.documents.length > 0 ? Number(this.documents[0].id) : 0;
        this.formRedirectUrl = '';
        this.formPriority = 0;
        this.formStartsAt = '';
        this.formEndsAt = '';
        this.formStatus = 'ACTIVE';
      }
    }
  }

  onCityChange(): void {
    if (this.formCityId && Number(this.formCityId) !== 0) {
      const branchValid = this.branches.some(
        (b) => Number(b.id) === Number(this.formBranchId) && Number(b.city_id) === Number(this.formCityId)
      );
      if (!branchValid) {
        this.formBranchId = 0;
      }
    } else {
      this.formBranchId = 0;
    }
  }

  get isIntentSupported(): boolean {
    const intent = this.formIntent.trim().toUpperCase();
    return this.commonIntents.includes(intent);
  }

  get isFormValid(): boolean {
    if (!this.formIntent || !this.formIntent.trim()) return false;
    if (this.formOutcomeType === 'DOCUMENT') {
      return Number(this.formDocumentId) > 0;
    }
    if (this.formOutcomeType === 'URL') {
      return !!this.formRedirectUrl && this.formRedirectUrl.trim().startsWith('https://');
    }
    return false;
  }

  get filteredBranchesForForm(): Branch[] {
    if (!this.formCityId || Number(this.formCityId) === 0) return this.branches;
    return this.branches.filter((b) => Number(b.city_id) === Number(this.formCityId));
  }

  submit(): void {
    if (!this.isFormValid) return;

    const payload: CreateDownloadRulePayload = {
      intent: this.formIntent.trim().toUpperCase(),
      city_id: Number(this.formCityId) > 0 ? Number(this.formCityId) : null,
      branch_id: Number(this.formBranchId) > 0 ? Number(this.formBranchId) : null,
      class_id: Number(this.formClassId) > 0 ? Number(this.formClassId) : null,
      document_id: this.formOutcomeType === 'DOCUMENT' && Number(this.formDocumentId) > 0 ? Number(this.formDocumentId) : null,
      redirect_url: this.formOutcomeType === 'URL' && this.formRedirectUrl.trim() ? this.formRedirectUrl.trim() : null,
      priority: Number(this.formPriority) || 0,
      starts_at: this.toSqlDatetime(this.formStartsAt),
      ends_at: this.toSqlDatetime(this.formEndsAt),
      status: this.formStatus,
    };
    this.submitted.emit(payload);
  }

  private toInputDatetime(isoStr: string): string {
    try {
      const d = new Date(isoStr);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch { return ''; }
  }

  private toSqlDatetime(val: string): string | null {
    if (!val) return null;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
      return null;
    }
  }
}
