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
  DocumentService,
  DocumentUploadResponseData,
  ManagedDocumentItem,
} from '../../services/document.service';
import { DocumentUploadModalComponent } from './document-upload-modal/document-upload-modal.component';
import { DocumentEditModalComponent, DocumentEditPayload } from './document-edit-modal/document-edit-modal.component';
import { ConfirmDeleteModalComponent } from '../../components/confirm-delete-modal/confirm-delete-modal.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TopbarComponent, SidebarComponent, DocumentUploadModalComponent, DocumentEditModalComponent, ConfirmDeleteModalComponent],
  templateUrl: './documents.component.html',
})
export class DocumentsComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  documents: ManagedDocumentItem[] = [];
  isLoading = false;
  loadError = '';
  searchTerm = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  isUploadOpen = false;
  name = '';
  downloadFilename = '';
  selectedFile: File | null = null;
  dragOver = false;

  isUploading = false;
  uploadError = '';
  successData: DocumentUploadResponseData | null = null;
  copiedId: string | number | null = null;

  isEditOpen = false;
  editingDoc: ManagedDocumentItem | null = null;
  editName = '';
  editDownloadFilename = '';
  editStatus = 'ACTIVE';
  isUpdating = false;
  updateError = '';
  toastMessage = '';

  isDeleteModalOpen = false;
  deletingDoc: ManagedDocumentItem | null = null;
  isDeleting = false;
  deleteError = '';

  readonly skeletonRows = Array(6).fill(0);

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.loadError = '';
    this.cdr.markForCheck();

    this.documentService.getDocuments().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.documents = Array.isArray(res.data) ? res.data : [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError =
          err.error?.message ||
          err.message ||
          'Failed to load documents list. Please check your credentials.';
        this.cdr.markForCheck();
      },
    });
  }

  get filteredDocuments(): ManagedDocumentItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.documents.filter((doc) => {
      // Status filter
      if (this.statusFilter !== 'ALL') {
        const docStatus = (doc.status || 'ACTIVE').toUpperCase();
        if (docStatus !== this.statusFilter) return false;
      }

      // Search filter
      if (!term) return true;
      const idMatch = String(doc.id || '').toLowerCase().includes(term);
      const nameMatch = (doc.name || '').toLowerCase().includes(term);
      const dlMatch = (doc.download_filename || '').toLowerCase().includes(term);
      const origMatch = (doc.original_name || '').toLowerCase().includes(term);

      return idMatch || nameMatch || dlMatch || origMatch;
    });
  }

  get activeCount(): number {
    return this.documents.filter((d) => (d.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  }

  // ─── Upload Handlers ───────────────────────────────────────────────────────

  openUploadDrawer(): void {
    this.isUploadOpen = true;
    this.uploadError = '';
    this.successData = null;
    this.cdr.markForCheck();
  }

  closeUploadDrawer(): void {
    this.isUploadOpen = false;
    this.resetUploadForm();
    this.cdr.markForCheck();
  }

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
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      this.uploadError = 'Only PDF files are supported. Please select a valid .pdf file.';
      this.selectedFile = null;
      this.cdr.markForCheck();
      return;
    }

    this.selectedFile = file;

    if (!this.downloadFilename) {
      this.downloadFilename = file.name;
    }

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

    if (!this.name.trim()) {
      this.uploadError = 'Document name is required.';
      return;
    }

    if (!this.selectedFile) {
      this.uploadError = 'Please select a PDF file to upload.';
      return;
    }

    this.isUploading = true;
    this.cdr.markForCheck();

    this.documentService
      .uploadDocument(this.name, this.selectedFile, this.downloadFilename)
      .subscribe({
        next: (res) => {
          this.isUploading = false;
          const returnedData = res.data || (res as unknown as DocumentUploadResponseData);
          this.successData = returnedData;
          this.selectedFile = null;
          this.name = '';
          this.downloadFilename = '';
          this.loadDocuments();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isUploading = false;
          this.uploadError = err.error?.message || err.message || 'Failed to upload PDF document. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  onUploaded(data: DocumentUploadResponseData): void {
    this.showToast(`Document #${data.id ?? data.document_id} uploaded successfully.`);
    this.loadDocuments();
  }

  onEditSaved(payload: DocumentEditPayload): void {
    if (!this.editingDoc) return;
    this.updateError = '';
    this.isUpdating = true;
    this.cdr.markForCheck();
    this.documentService.updateDocument(this.editingDoc.id, payload).subscribe({
      next: () => {
        this.isUpdating = false;
        const id = this.editingDoc?.id;
        this.closeEditModal();
        this.showToast(`Document #${id} updated successfully.`);
        this.loadDocuments();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isUpdating = false;
        this.updateError = err.error?.message || err.message || 'Failed to update document.';
        this.cdr.markForCheck();
      },
    });
  }

  resetUploadForm(): void {
    this.name = '';
    this.downloadFilename = '';
    this.selectedFile = null;
    this.uploadError = '';
    this.cdr.markForCheck();
  }

  copyToClipboard(text?: string | number): void {
    if (!text && text !== 0) return;
    navigator.clipboard.writeText(String(text)).then(() => {
      this.copiedId = text;
      this.cdr.markForCheck();
      setTimeout(() => {
        if (this.copiedId === text) {
          this.copiedId = null;
          this.cdr.markForCheck();
        }
      }, 2000);
    });
  }

  openEditModal(doc: ManagedDocumentItem): void {
    this.editingDoc = doc;
    this.editName = doc.name || '';
    this.editDownloadFilename = doc.download_filename || '';
    this.editStatus = doc.status || 'ACTIVE';
    this.updateError = '';
    this.isEditOpen = true;
    this.cdr.markForCheck();
  }

  closeEditModal(): void {
    this.isEditOpen = false;
    this.editingDoc = null;
    this.updateError = '';
    this.cdr.markForCheck();
  }

  submitUpdate(): void {
    if (!this.editingDoc) return;
    this.updateError = '';

    if (!this.editName.trim()) {
      this.updateError = 'Document name cannot be empty.';
      return;
    }

    this.isUpdating = true;
    this.cdr.markForCheck();

    const payload = {
      name: this.editName.trim(),
      download_filename: this.editDownloadFilename.trim(),
      status: this.editStatus,
    };

    this.documentService.updateDocument(this.editingDoc.id, payload).subscribe({
      next: (res) => {
        this.isUpdating = false;
        this.isEditOpen = false;
        this.showToast(`Document #${this.editingDoc?.id} updated successfully.`);
        this.editingDoc = null;
        this.loadDocuments();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isUpdating = false;
        this.updateError =
          err.error?.message ||
          err.message ||
          'Failed to update document. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  safelyRetire(doc: ManagedDocumentItem): void {
    if (!confirm(`Are you sure you want to retire document #${doc.id} ("${doc.name}")?`)) {
      return;
    }

    this.documentService
      .updateDocument(doc.id, {
        name: doc.name,
        download_filename: doc.download_filename,
        status: 'INACTIVE',
      })
      .subscribe({
        next: () => {
          this.showToast(`Document #${doc.id} retired successfully.`);
          this.loadDocuments();
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to retire document.');
          this.cdr.markForCheck();
        },
      });
  }

  openDeleteModal(doc: ManagedDocumentItem): void {
    this.deletingDoc = doc;
    this.deleteError = '';
    this.isDeleteModalOpen = true;
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deletingDoc = null;
    this.deleteError = '';
    this.cdr.markForCheck();
  }

  submitDelete(): void {
    if (!this.deletingDoc) return;
    this.isDeleting = true;
    this.deleteError = '';
    this.cdr.markForCheck();

    const docId = this.deletingDoc.id;
    this.documentService.deleteDocument(docId).subscribe({
      next: (res) => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        if (this.isEditOpen && this.editingDoc?.id === docId) {
          this.closeEditModal();
        }
        this.showToast(res.message || 'Document marked deleted; physical file retained.');
        this.deletingDoc = null;
        this.loadDocuments();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDeleting = false;
        this.deleteError =
          err.error?.message ||
          err.message ||
          'Failed to delete document. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  private showToast(msg: string): void {
    this.toastService.success(msg);
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
