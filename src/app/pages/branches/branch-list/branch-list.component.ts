import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  Branch,
  BranchService,
} from '../../../services/branch.service';
import {
  City,
  CityService,
} from '../../../services/city.service';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/topbar/topbar.component';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [SidebarComponent, TopbarComponent, FormsModule],
  templateUrl: './branch-list.component.html',
})
export class BranchListComponent implements OnInit, OnDestroy {
  branches: Branch[] = [];
  cities: City[] = [];

  // Filter state
  searchTerm = '';
  selectedCityId: string | number = '';

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
  branchToDelete: Branch | null = null;
  deletingBranchId: number | string | null = null;

  constructor(
    private readonly branchService: BranchService,
    private readonly cityService: CityService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCities();
    this.loadBranches(1);
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  get filteredBranches(): Branch[] {
    let list = this.branches;

    if (this.selectedCityId) {
      list = list.filter((b) => String(b.city_id) === String(this.selectedCityId));
    }

    if (!this.searchTerm.trim()) {
      return list;
    }

    const term = this.searchTerm.toLowerCase().trim();
    return list.filter((b) => {
      const cityName = this.getCityName(b.city_id).toLowerCase();
      return (
        b.name.toLowerCase().includes(term) ||
        b.slug.toLowerCase().includes(term) ||
        cityName.includes(term)
      );
    });
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

  loadCities(): void {
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

  loadBranches(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.currentPage = page;

    const params: { city_id?: number | string; page: number; limit: number } = {
      page,
      limit: this.pageSize,
    };

    if (this.selectedCityId) {
      params.city_id = this.selectedCityId;
    }

    this.branchService.getBranches(params).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response.success) {
          this.errorMessage = response.message || 'Unable to load branches.';
          this.cdr.detectChanges();
          return;
        }

        this.branches = response.data || [];

        if (response.meta) {
          this.totalItems = Number(response.meta['total'] ?? this.branches.length);
          this.currentPage = Number(response.meta['page'] ?? page);
          this.pageSize = Number(response.meta['limit'] ?? 20);
        } else {
          this.totalItems = this.branches.length;
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Unable to load branches. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  onCityFilterChange(): void {
    this.loadBranches(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.loadBranches(page);
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

  getCityName(cityId: number | string): string {
    const city = this.cities.find((item) => String(item.id) === String(cityId));
    return city?.name ?? '—';
  }

  goToAddBranch(): void {
    this.router.navigate(['/branches/add']);
  }

  editBranch(id: number | string): void {
    this.router.navigate(['/branches/edit', id]);
  }

  confirmDelete(branch: Branch): void {
    this.branchToDelete = branch;
  }

  cancelDelete(): void {
    if (this.deletingBranchId !== null) {
      return;
    }
    this.branchToDelete = null;
  }

  deleteBranch(): void {
    if (this.branchToDelete === null || this.deletingBranchId !== null) {
      return;
    }

    const branch = this.branchToDelete;
    this.deletingBranchId = branch.id;

    this.branchService.deleteBranch(branch.id).subscribe({
      next: (response) => {
        this.deletingBranchId = null;
        this.branchToDelete = null;

        this.branches = this.branches.filter((item) => String(item.id) !== String(branch.id));
        this.totalItems = Math.max(0, this.totalItems - 1);

        this.showToast(response.message || 'Branch deleted successfully.', 'success');
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.deletingBranchId = null;
        this.branchToDelete = null;

        if (error.status === 409) {
          this.showToast(
            error.error?.message ||
              'Referenced branch cannot be deleted because it is linked to classes or pages. We suggest marking it as Inactive.',
            'warning',
          );
        } else {
          this.showToast(
            error.error?.message || 'Unable to delete branch. Please try again.',
            'error',
          );
        }
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