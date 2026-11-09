import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  ClassMaster,
  ClassService,
} from '../../../services/class.service';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/topbar/topbar.component';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [SidebarComponent, TopbarComponent, FormsModule],
  templateUrl: './class-list.component.html',
})
export class ClassListComponent implements OnInit, OnDestroy {
  classes: ClassMaster[] = [];

  // Filter state
  searchTerm = '';

  // Pagination state
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;

  isLoading = false;
  errorMessage = '';

  // Toast state
  toastMessage = '';
  toastType: 'success' | 'warning' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Deletion state
  classToDelete: ClassMaster | null = null;
  deletingClassId: number | string | null = null;

  constructor(
    private readonly classService: ClassService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadClasses(1);
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  get filteredClasses(): ClassMaster[] {
    if (!this.searchTerm.trim()) {
      return this.classes;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.classes.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term),
    );
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  get startIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const range: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }

  loadClasses(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.currentPage = page;

    this.classService
      .getClasses({
        page,
        limit: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if (!response.success) {
            this.errorMessage = response.message || 'Unable to load classes.';
            this.cdr.detectChanges();
            return;
          }

          this.classes = response.data || [];

          if (response.meta) {
            this.totalItems = Number(response.meta['total'] ?? this.classes.length);
            this.currentPage = Number(response.meta['page'] ?? page);
            this.pageSize = Number(response.meta['limit'] ?? 20);
          } else {
            this.totalItems = this.classes.length;
          }

          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Unable to load classes. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.loadClasses(page);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  goToAddClass(): void {
    this.router.navigate(['/classes/add']);
  }

  editClass(item: ClassMaster): void {
    this.router.navigate(['/classes/edit', item.id]);
  }

  confirmDelete(item: ClassMaster): void {
    this.classToDelete = item;
  }

  cancelDelete(): void {
    if (this.deletingClassId !== null) {
      return;
    }
    this.classToDelete = null;
  }

  deleteClass(): void {
    if (this.classToDelete === null || this.deletingClassId !== null) {
      return;
    }

    const item = this.classToDelete;
    this.deletingClassId = item.id;

    this.classService.deleteClass(item.id).subscribe({
      next: (response) => {
        this.deletingClassId = null;
        this.classToDelete = null;

        this.classes = this.classes.filter(
          (c) => String(c.id) !== String(item.id),
        );
        this.totalItems = Math.max(0, this.totalItems - 1);

        this.showToast(response.message || 'CLASS deleted.', 'success');
        this.cdr.detectChanges();
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.deletingClassId = null;
        this.classToDelete = null;

        if (error.status === 409) {
          this.showToast(
            error.error?.message ||
              'Referenced class cannot be deleted because it is linked to pages or admission configurations. We suggest marking it as Inactive.',
            'warning',
          );
        } else {
          this.showToast(
            error.error?.message || 'Unable to delete class. Please try again.',
            'error',
          );
        }
        this.cdr.detectChanges();
      },
    });
  }

  private showToast(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.detectChanges();

    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3500);
  }
}