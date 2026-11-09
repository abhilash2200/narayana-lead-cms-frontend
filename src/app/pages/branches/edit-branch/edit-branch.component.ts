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
import {
  FormsModule,
} from '@angular/forms';

import {
  City,
  CityService,
} from '../../../services/city.service';

import {
  BranchService,
  UpdateBranchRequest,
} from '../../../services/branch.service';

import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/topbar/topbar.component';

@Component({
  selector: 'app-edit-branch',
  standalone: true,
  imports: [
    FormsModule,
    SidebarComponent,
    TopbarComponent,
  ],
  templateUrl: './edit-branch.component.html',
})
export class EditBranchComponent implements OnInit, OnDestroy {
  cities: City[] = [];

  branchId: string | number | null = null;
  selectedCityId: string | number | null = null;
  selectedCityName = '';

  branchName = '';
  branchSlug = '';
  branchStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  sortOrder = 0;

  isLoading = true;
  isSaving = false;
  isDeleting = false;
  showDeleteConfirm = false;
  errorMessage = '';

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cityService: CityService,
    private readonly branchService: BranchService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadCities();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (!id) {
        this.isLoading = false;
        this.errorMessage = 'Branch ID is missing.';
        return;
      }

      this.branchId = id;
      this.loadBranch(id);
    });
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
          this.updateSelectedCityName();
        }
      },
      error: () => { },
    });
  }

  private loadBranch(id: string | number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.branchService.getBranchById(id).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response.success || !response.data) {
          this.errorMessage = response.message || 'Unable to load branch.';
          this.cdr.detectChanges();
          return;
        }

        const branch = response.data;
        this.selectedCityId = branch.city_id;
        this.branchName = branch.name ?? '';
        this.branchSlug = branch.slug ?? '';
        this.branchStatus = branch.status ?? 'ACTIVE';
        this.sortOrder = Number(branch.sort_order ?? 0);

        this.updateSelectedCityName();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Unable to load branch details.';
        this.cdr.detectChanges();
      },
    });
  }

  updateSelectedCityName(): void {
    if (this.selectedCityId === null || this.selectedCityId === undefined) {
      this.selectedCityName = '';
      this.cdr.detectChanges();
      return;
    }

    const city = this.cities.find((item) => String(item.id) === String(this.selectedCityId));
    this.selectedCityName = city?.name ?? '';
    this.cdr.detectChanges();
  }

  generateSlug(): void {
    this.branchSlug = this.branchName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  saveBranch(): void {
    if (this.branchId === null || !this.selectedCityId) {
      this.showToastMessage('Please select a valid city.', 'error');
      return;
    }

    const name = this.branchName.trim();
    const slug = (this.branchSlug || this.branchName).toLowerCase().trim().replace(/\s+/g, '-');

    if (!name) {
      this.showToastMessage('Please enter branch name.', 'error');
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const payload: UpdateBranchRequest = {
      city_id: this.selectedCityId,
      name,
      slug,
      status: this.branchStatus,
      sort_order: Number(this.sortOrder) || 0,
    };

    this.branchService.updateBranch(this.branchId, payload).subscribe({
      next: (response) => {
        this.isSaving = false;

        if (!response.success) {
          this.showToastMessage(response.message || 'Unable to update branch.', 'error');
          this.cdr.detectChanges();
          return;
        }

        if (response.data && typeof response.data === 'object') {
          this.selectedCityId = response.data.city_id;
          this.branchName = response.data.name;
          this.branchSlug = response.data.slug;
          this.branchStatus = response.data.status;
          this.sortOrder = Number(response.data.sort_order ?? 0);
          this.updateSelectedCityName();
        }

        this.showToastMessage(response.message || 'Branch updated successfully.', 'success');

        setTimeout(() => {
          this.router.navigate(['/branches']);
        }, 800);
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.isSaving = false;
        const msg = error.error?.message || 'Unable to update branch. Please try again.';
        this.showToastMessage(msg, 'error');
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

  deleteBranch(): void {
    if (this.branchId === null || this.isDeleting) {
      return;
    }

    this.isDeleting = true;

    this.branchService.deleteBranch(this.branchId).subscribe({
      next: (response) => {
        this.isDeleting = false;
        this.showDeleteConfirm = false;

        this.showToastMessage(response.message || 'BRANCH deleted.', 'success');

        setTimeout(() => {
          this.router.navigate(['/branches']);
        }, 800);
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.isDeleting = false;
        this.showDeleteConfirm = false;

        if (error.status === 409) {
          this.showToastMessage(
            error.error?.message ||
            'Referenced branch cannot be deleted because it is linked to records. We suggest editing and marking it as Inactive.',
            'error',
          );
        } else {
          this.showToastMessage(
            error.error?.message || 'Unable to delete branch. Please try again.',
            'error',
          );
        }
        this.cdr.detectChanges();
      },
    });
  }

  private showToastMessage(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();

    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3500);
  }

  goBack(): void {
    this.router.navigate(['/branches']);
  }
}