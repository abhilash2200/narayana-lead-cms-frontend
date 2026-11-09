import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  City,
  CityService,
} from '../../../services/city.service';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/topbar/topbar.component';

@Component({
  selector: 'app-city-list',
  standalone: true,
  imports: [SidebarComponent, TopbarComponent, FormsModule],
  templateUrl: './city-list.component.html',
})
export class CityListComponent implements OnInit, OnDestroy {
  cities: City[] = [];
  searchTerm = '';

  // Pagination state
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;

  isLoading = true;
  errorMessage = '';

  // Toast notification state
  toastMessage = '';
  toastType: 'success' | 'warning' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  cityToDelete: City | null = null;
  deletingCityId: number | string | null = null;

  constructor(
    private readonly cityService: CityService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadCities(1);
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  get filteredCities(): City[] {
    if (!this.searchTerm.trim()) {
      return this.cities;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.cities.filter(
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

  loadCities(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.currentPage = page;

    this.cityService.getCities({ page, limit: this.pageSize }).subscribe({
      next: (response) => {
        if (!response.success) {
          this.errorMessage = response.message || 'Unable to load cities.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        this.cities = response.data || [];

        if (response.meta) {
          this.totalItems = Number(response.meta['total'] ?? this.cities.length);
          this.currentPage = Number(response.meta['page'] ?? page);
          this.pageSize = Number(response.meta['limit'] ?? 20);
        } else {
          this.totalItems = this.cities.length;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Unable to load cities. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.loadCities(page);
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

  goToAddCity(): void {
    this.router.navigate(['/cities/add']);
  }

  editCity(id: number | string): void {
    this.router.navigate(['/cities/edit', id]);
  }

  confirmDelete(city: City): void {
    this.cityToDelete = city;
  }

  cancelDelete(): void {
    if (this.deletingCityId !== null) {
      return;
    }
    this.cityToDelete = null;
  }

  deleteCity(): void {
    if (this.cityToDelete === null || this.deletingCityId !== null) {
      return;
    }

    const city = this.cityToDelete;
    this.deletingCityId = city.id;

    this.cityService.deleteCity(city.id).subscribe({
      next: (response) => {
        this.deletingCityId = null;
        this.cityToDelete = null;

        this.cities = this.cities.filter((item) => String(item.id) !== String(city.id));
        this.totalItems = Math.max(0, this.totalItems - 1);

        this.showToast(response.message || 'City deleted successfully.', 'success');
      },
      error: (error: { status?: number; error?: { message?: string } }) => {
        this.deletingCityId = null;
        this.cityToDelete = null;

        if (error.status === 409) {
          this.showToast(
            error.error?.message ||
            'Referenced city cannot be deleted because it is linked to records. We suggest editing and marking it as Inactive.',
            'warning',
          );
        } else {
          this.showToast(
            error.error?.message || 'Unable to delete city. Please try again.',
            'error',
          );
        }
      },
    });
  }

  showToast(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
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