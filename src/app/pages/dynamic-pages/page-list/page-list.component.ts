import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicPage } from '../models/dynamic-page.model';
import { City } from '../../../services/city.service';
import { Branch } from '../../../services/branch.service';
import { ClassMaster } from '../../../services/class.service';
import { PageQueryParams } from '../../../services/dynamic-page.service';

@Component({
  selector: 'app-page-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './page-list.component.html',
})
export class PageListComponent {
  @Input() pages: DynamicPage[] = [];
  @Input() cities: City[] = [];
  @Input() branches: Branch[] = [];
  @Input() classes: ClassMaster[] = [];

  @Output() addPage = new EventEmitter<void>();
  @Output() editPage = new EventEmitter<DynamicPage>();
  @Output() duplicatePage = new EventEmitter<DynamicPage>();
  @Output() deletePage = new EventEmitter<DynamicPage>();
  @Output() statusChange = new EventEmitter<{
    page: DynamicPage;
    status: 'ACTIVE' | 'INACTIVE';
  }>();
  @Output() filterChange = new EventEmitter<PageQueryParams>();

  // Filter criteria
  searchTerm = '';
  selectedCityId: string | number = '';
  selectedBranchId: string | number = '';
  selectedClassId: string | number = '';
  selectedStatus: string = '';

  currentPage = 1;
  readonly pageSize = 15;

  get availableBranches(): Branch[] {
    if (!this.selectedCityId) {
      return this.branches;
    }
    return this.branches.filter((b) => String(b.city_id) === String(this.selectedCityId));
  }

  get sortedPages(): DynamicPage[] {
    return [...this.pages].sort((first, second) => {
      const firstTime = new Date(first.createdAt).getTime();
      const secondTime = new Date(second.createdAt).getTime();
      return secondTime - firstTime;
    });
  }

  get filteredPages(): DynamicPage[] {
    let result = this.sortedPages;

    if (this.selectedCityId) {
      result = result.filter((p) => String(p.cityId) === String(this.selectedCityId));
    }

    if (this.selectedBranchId) {
      result = result.filter((p) => String(p.branchId) === String(this.selectedBranchId));
    }

    if (this.selectedClassId) {
      result = result.filter((p) => String(p.classId) === String(this.selectedClassId));
    }

    if (this.selectedStatus) {
      const target = this.selectedStatus.toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive';
      result = result.filter((p) => p.status === target);
    }

    const search = this.searchTerm.trim().toLowerCase();
    if (search) {
      result = result.filter(
        (page) =>
          page.title.toLowerCase().includes(search) ||
          page.slug.toLowerCase().includes(search) ||
          (page.canonicalPath?.toLowerCase().includes(search) ?? false) ||
          (page.scopeKey?.toLowerCase().includes(search) ?? false) ||
          page.cityName.toLowerCase().includes(search) ||
          (page.branchName?.toLowerCase().includes(search) ?? false) ||
          (page.className?.toLowerCase().includes(search) ?? false),
      );
    }

    return result;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPages.length / this.pageSize) || 1;
  }

  get paginatedPages(): DynamicPage[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredPages.slice(startIndex, endIndex);
  }

  get pageNumbers(): number[] {
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

  get showingStart(): number {
    if (this.filteredPages.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredPages.length);
  }

  onCityChange(): void {
    this.selectedBranchId = '';
    this.onFilterChange();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    const params: PageQueryParams = {};
    if (this.selectedCityId) params.city_id = this.selectedCityId;
    if (this.selectedBranchId) params.branch_id = this.selectedBranchId;
    if (this.selectedClassId) params.class_id = this.selectedClassId;
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.searchTerm.trim()) params.search = this.searchTerm.trim();

    this.filterChange.emit(params);
  }

  togglePageStatus(page: DynamicPage): void {
    const nextStatus: 'ACTIVE' | 'INACTIVE' = page.status === 'Active' ? 'INACTIVE' : 'ACTIVE';
    this.statusChange.emit({
      page,
      status: nextStatus,
    });
  }

  goToPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      return;
    }
    this.currentPage = pageNumber;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}
