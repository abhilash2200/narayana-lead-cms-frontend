import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CityService,
  UpdateCityRequest,
} from '../../../services/city.service';

import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/topbar/topbar.component';

@Component({
  selector: 'app-edit-city',
  standalone: true,
  imports: [FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './edit-city.component.html',
})
export class EditCityComponent implements OnInit, OnDestroy {
  cityId: string | number | null = null;

  cityName = '';
  citySlug = '';
  status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  sortOrder = 0;

  isLoading = true;
  isSaving = false;
  errorMessage = '';

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToastMessage = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cityService: CityService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.isLoading = false;
      this.errorMessage = 'City ID is missing.';
      return;
    }

    this.cityId = id;
    this.loadCity(id);
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  loadCity(id: string | number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.cityService.getCityById(id).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.isLoading = false;
          this.errorMessage = response.message || 'Unable to load city details.';
          this.cdr.detectChanges();
          return;
        }

        // Populate form fields
        this.cityName = response.data.name ?? '';
        this.citySlug = response.data.slug ?? '';
        this.status = (response.data.status as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE';
        this.sortOrder = Number(response.data.sort_order ?? 0);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Unable to load city details. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  updateCity(): void {
    if (this.cityId === null) {
      return;
    }

    const name = this.cityName.trim();
    const slug = this.citySlug.trim();

    if (!name) {
      this.showToast('Please enter city name.', 'error');
      return;
    }

    if (!slug) {
      this.showToast('Please enter city slug.', 'error');
      return;
    }

    const payload: UpdateCityRequest = {
      name,
      slug,
      status: this.status,
      sort_order: Number(this.sortOrder) || 0,
    };

    this.isSaving = true;
    this.cdr.detectChanges();

    this.cityService.updateCity(this.cityId, payload).subscribe({
      next: (response) => {
        this.isSaving = false;

        this.showToast(
          response.message || 'City updated successfully.',
          'success',
        );

        setTimeout(() => {
          this.router.navigate(['/cities']);
        }, 800);
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.isSaving = false;
        const msg = error.error?.message || 'Unable to update city. Please try again.';
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