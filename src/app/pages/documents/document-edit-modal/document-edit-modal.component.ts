import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagedDocumentItem } from '../../../services/document.service';

export interface DocumentEditPayload {
  name: string;
  download_filename: string;
  status: string;
}

@Component({
  selector: 'app-document-edit-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-edit-modal.component.html',
})
export class DocumentEditModalComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() doc!: ManagedDocumentItem;
  @Input() isUpdating = false;
  @Input() updateError = '';

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<DocumentEditPayload>();
  @Output() deleteRequested = new EventEmitter<ManagedDocumentItem>();
  @Output() retireRequested = new EventEmitter<ManagedDocumentItem>();

  editName = '';
  editDownloadFilename = '';
  editStatus = 'ACTIVE';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['doc'] && this.doc) {
      this.editName = this.doc.name || '';
      this.editDownloadFilename = this.doc.download_filename || '';
      this.editStatus = this.doc.status || 'ACTIVE';
    }
  }

  submit(): void {
    if (!this.editName.trim()) return;
    this.saved.emit({
      name: this.editName.trim(),
      download_filename: this.editDownloadFilename.trim(),
      status: this.editStatus,
    });
  }

  formatBytes(bytes?: string | number): string {
    const num = Number(bytes);
    if (!num || isNaN(num) || num <= 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
