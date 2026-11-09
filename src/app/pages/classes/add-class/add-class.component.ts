import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ClassService,
  CreateClassRequest,
} from '../../../services/class.service';

import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/topbar/topbar.component';

@Component({
  selector: 'app-add-class',
  standalone: true,
  imports: [FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './add-class.component.html',
})
export class AddClassComponent implements OnDestroy {
  name = '';
  slug = '';
  status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  sortOrder = 0;

  saving = false;
  submitted = false;

  // Toast state
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly classService: ClassService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
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
    this.submitted = true;

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

    const payload: CreateClassRequest = {
      name: className,
      slug: classSlug,
      status: this.status,
      sort_order: Number(this.sortOrder) || 0,
    };

    this.saving = true;
    this.cdr.detectChanges();

    this.classService.createClass(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.success) {
          this.showToast(response.message || 'Failed to create class.', 'error');
          this.cdr.detectChanges();
          return;
        }

        this.showToast(response.message || 'Class created successfully.', 'success');

        // Refresh master list after brief toast display
        setTimeout(() => {
          this.router.navigate(['/classes']);
        }, 800);
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.saving = false;
        const msg = error.error?.message || 'Unable to create class. Please try again.';
        this.showToast(msg, 'error');
        this.cdr.detectChanges();
      },
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
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
