import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-delete-modal.component.html',
})
export class ConfirmDeleteModalComponent {
  @Input() title = 'Confirm Delete';
  @Input() apiEndpoint = '';
  @Input() message = 'Are you sure you want to delete this item?';
  @Input() noticeText = '';
  @Input() isDeleting = false;
  @Input() deleteError = '';

  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
}
