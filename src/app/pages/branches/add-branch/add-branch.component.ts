import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import {
  City,
  CityService,
} from '../../../services/city.service';

import {
  BranchService,
  CreateBranchRequest,
} from '../../../services/branch.service';

import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/topbar/topbar.component';

@Component({
  selector: 'app-add-branch',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    TopbarComponent,
  ],
  templateUrl: './add-branch.component.html',
})
export class AddBranchComponent implements OnInit, OnDestroy {
  cities: City[] = [];
  selectedCityId: number | string | null = null;

  branchName = '';
  branchSlug = '';
  branchStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  sortOrder = 0;

  isSaving = false;

  // Toast state
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToastMessage = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly cityService: CityService,
    private readonly branchService: BranchService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCities();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  private loadCities(): void {
    this.cityService.getCities().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cities = response.data;
          this.cdr.detectChanges();
        }
      },
      error: () => {},
    });
  }

  generateSlug(): void {
    this.branchSlug = this.branchName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  saveBranch(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.showToast('Please fill all required fields.', 'error');
      return;
    }

    if (!this.selectedCityId) {
      this.showToast('Please select a valid city.', 'error');
      return;
    }

    const name = this.branchName.trim();
    const slug = (this.branchSlug || this.branchName).toLowerCase().trim().replace(/\s+/g, '-');

    if (!name) {
      this.showToast('Please enter branch name.', 'error');
      return;
    }

    const payload: CreateBranchRequest = {
      city_id: this.selectedCityId,
      name,
      slug,
      status: this.branchStatus,
      sort_order: Number(this.sortOrder) || 0,
    };

    this.isSaving = true;
    this.cdr.detectChanges();

    this.branchService.createBranch(payload).subscribe({
      next: (response) => {
        this.isSaving = false;

        if (!response.success) {
          this.showToast(response.message || 'Failed to create branch.', 'error');
          this.cdr.detectChanges();
          return;
        }

        this.showToast(response.message || 'Branch created successfully.', 'success');

        // After success: navigate to branch list to refresh master rows
        setTimeout(() => {
          this.router.navigate(['/branches']);
        }, 800);
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.isSaving = false;
        const msg = error.error?.message || 'Unable to create branch. Please try again.';
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
    this.router.navigate(['/branches']);
  }
}