import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  CityService,
  CreateCityRequest,
} from '../../../services/city.service';

import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/topbar/topbar.component';

@Component({
  selector: 'app-add-city',
  standalone: true,
  imports: [FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './add-city.component.html',
})
export class AddCityComponent implements OnDestroy {
  cityName = '';
  citySlug = '';
  status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  sortOrder = 0;

  isSaving = false;
  errorMessage = '';
  successMessage = '';

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToastMessage = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  private isSlugManuallyEdited = false;

  constructor(
    private readonly cityService: CityService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  onNameChange(): void {
    if (!this.isSlugManuallyEdited) {
      this.citySlug = this.normalizeSlug(this.cityName);
    }
  }

  onSlugChange(): void {
    this.isSlugManuallyEdited = this.citySlug.trim().length > 0;
  }

  private normalizeSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  saveCity(): void {
    const name = this.cityName.trim();
    const slug = (this.citySlug || this.normalizeSlug(name)).trim();

    if (!name) {
      this.showToast('Please enter city name.', 'error');
      return;
    }

    if (!slug) {
      this.showToast('Please enter city slug.', 'error');
      return;
    }

    const payload: CreateCityRequest = {
      name,
      slug,
      status: this.status,
      sort_order: Number(this.sortOrder) || 0,
    };

    this.isSaving = true;
    this.cdr.detectChanges();

    this.cityService.createCity(payload).subscribe({
      next: (response) => {
        this.isSaving = false;

        if (!response.success) {
          this.showToast(
            response.message || 'Failed to create city.',
            'error',
          );
          this.cdr.detectChanges();
          return;
        }

        this.showToast(
          response.message || 'City created successfully.',
          'success',
        );

        // After success: navigate to master list to show updated rows
        setTimeout(() => {
          this.router.navigate(['/cities']);
        }, 800);
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.isSaving = false;
        const msg = error.error?.message || 'Unable to create city. Please try again.';
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
    this.showToastMessage = true;
    this.cdr.detectChanges();

    this.toastTimer = setTimeout(() => {
      this.showToastMessage = false;
      this.cdr.detectChanges();
    }, 3500);
  }

  goBack(): void {
    this.router.navigate(['/cities']);
  }
}