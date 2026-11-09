import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService, DocumentUploadResponseData } from '../../../services/document.service';

@Component({
  selector: 'app-document-upload-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-upload-modal.component.html',
})
export class DocumentUploadModalComponent {
  private readonly documentService = inject(DocumentService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Output() closed = new EventEmitter<void>();
  @Output() uploaded = new EventEmitter<DocumentUploadResponseData>();

  name = '';
  downloadFilename = '';
  selectedFile: File | null = null;
  dragOver = false;
  isUploading = false;
  uploadError = '';
  successData: DocumentUploadResponseData | null = null;
  copiedId: string | number | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  private validateAndSetFile(file: File): void {
    this.uploadError = '';
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      this.uploadError = 'Only PDF files are supported. Please select a valid .pdf file.';
      this.selectedFile = null;
      this.cdr.markForCheck();
      return;
    }
    this.selectedFile = file;
    if (!this.downloadFilename) this.downloadFilename = file.name;
    if (!this.name) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      this.name = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }
    this.cdr.markForCheck();
  }

  removeFile(): void {
    this.selectedFile = null;
    this.cdr.markForCheck();
  }

  submitUpload(): void {
    this.uploadError = '';
    this.successData = null;
    if (!this.name.trim()) { this.uploadError = 'Document name is required.'; return; }
    if (!this.selectedFile) { this.uploadError = 'Please select a PDF file to upload.'; return; }

    this.isUploading = true;
    this.cdr.markForCheck();

    this.documentService.uploadDocument(this.name, this.selectedFile, this.downloadFilename).subscribe({
      next: (res) => {
        this.isUploading = false;
        const data = res.data || (res as unknown as DocumentUploadResponseData);
        this.successData = data;
        this.selectedFile = null;
        this.name = '';
        this.downloadFilename = '';
        this.uploaded.emit(data);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isUploading = false;
        this.uploadError = err.error?.message || err.message || 'Failed to upload PDF document.';
        this.cdr.markForCheck();
      },
    });
  }

  copyToClipboard(text?: string | number): void {
    if (!text && text !== 0) return;
    navigator.clipboard.writeText(String(text)).then(() => {
      this.copiedId = text;
      this.cdr.markForCheck();
      setTimeout(() => { this.copiedId = null; this.cdr.markForCheck(); }, 2000);
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

  close(): void {
    this.closed.emit();
  }
}
