import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  ClassService,
  UpdateClassRequest,
} from '../../../services/class.service';

import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/topbar/topbar.component';

@Component({
  selector: 'app-edit-class',
  standalone: true,
  imports: [
    FormsModule,
    SidebarComponent,
    TopbarComponent,
  ],
  templateUrl: './edit-class.component.html',
})
export class EditClassComponent implements OnInit, OnDestroy {
  classId: string | number | null = null;

  name = '';
  slug = '';
  status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  sortOrder = 0;

  isLoading = true;
  saving = false;
  isDeleting = false;
  showDeleteConfirm = false;
  errorMessage = '';

  // Toast state
  toastMessage = '';
  toastType: 'success' | 'warning' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly classService: ClassService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (!id) {
        this.isLoading = false;
        this.errorMessage = 'Class ID is missing.';
        this.cdr.detectChanges();
        return;
      }

      this.classId = id;
      this.loadClass(id);
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  private loadClass(id: string | number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.classService.getClassById(id).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response.success || !response.data) {
          this.errorMessage = response.message || 'Unable to load class.';
          this.cdr.detectChanges();
          return;
        }

        const data = response.data;
        this.name = String(data.name ?? '');
        this.slug = String(data.slug ?? '');
        this.status = data.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
        this.sortOrder = Number(data.sort_order ?? 0);

        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Unable to load class details.';
        this.cdr.detectChanges();
      },
    });
  }

  generateSlug(): void {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  saveClass(): void {
    if (this.classId === null) {
      this.showToast('Class information is missing.', 'error');
      return;
    }

    const className = this.name.trim();
    const classSlug = (this.slug || this.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    if (!className) {
      this.showToast('Please enter class name.', 'error');
      return;
    }

    if (!classSlug) {
      this.showToast('Please enter class slug.', 'error');
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const payload: UpdateClassRequest = {
      name: className,
      slug: classSlug,
      status: this.status,
      sort_order: Number(this.sortOrder) || 0,
    };

    this.classService.updateClass(this.classId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.success) {
          this.showToast(response.message || 'Unable to update class.', 'error');
          this.cdr.detectChanges();
          return;
        }

        if (response.data) {
          this.name = String(response.data.name ?? '');
          this.slug = String(response.data.slug ?? '');
          this.status = response.data.status ?? 'ACTIVE';
          this.sortOrder = Number(response.data.sort_order ?? 0);
        }

        this.showToast(response.message || 'Class updated successfully.', 'success');

        setTimeout(() => {
          this.router.navigate(['/classes']);
        }, 800);
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.saving = false;
        const msg = error.error?.message || 'Unable to update class. Please try again.';
        this.showToast(msg, 'error');
        this.cdr.detectChanges();
      },
    });
  }

  confirmDelete(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    if (this.isDeleting) {
      return;
    }
    this.showDeleteConfirm = false;
  }

  deleteClass(): void {
    if (this.classId === null || this.isDeleting) {
      return;
    }

    this.isDeleting = true;

    this.classService.deleteClass(this.classId).subscribe({
      next: (response) => {
        this.isDeleting = false;
        this.showDeleteConfirm = false;

        this.showToast(response.message || 'Class deleted successfully.', 'success');

        setTimeout(() => {
          this.router.navigate(['/classes']);
        }, 800);
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.isDeleting = false;
        this.showDeleteConfirm = false;

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

  goBack(): void {
    this.router.navigate(['/classes']);
  }
}
