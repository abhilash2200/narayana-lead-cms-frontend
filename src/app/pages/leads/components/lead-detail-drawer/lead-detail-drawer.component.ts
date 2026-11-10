import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeadItem } from '../../../../services/lead.service';

@Component({
  selector: 'app-lead-detail-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './lead-detail-drawer.component.html',
})
export class LeadDetailDrawerComponent {
  @Input() lead: LeadItem | null = null;
  @Input() moduleLabel = '';
  @Input() isLoading = false;

  @Output() close = new EventEmitter<void>();
  @Output() inspectPhone = new EventEmitter<string>();

  onClose(): void {
    this.close.emit();
  }

  onInspectPhone(phone: string): void {
    this.inspectPhone.emit(phone);
    this.onClose();
  }
}
