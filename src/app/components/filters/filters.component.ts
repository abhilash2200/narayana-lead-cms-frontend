import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface LeadFilters {
  selectedLP: string;
  search: string;
  startDate: string;
  endDate: string;
  classCategory: string;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filters.component.html'
})
export class FiltersComponent {

  @Output() filtersChanged = new EventEmitter<LeadFilters>();

  filters: LeadFilters = {
    selectedLP: '',
    search: '',
    startDate: '',
    endDate: '',
    classCategory: '',
  };

  landingPages: string[] = [
    'narayanainternationalschool.net',
    'ccnarayanacoachingcenters.com',
    'ccnarayanacoachingcenters.com (Neet Repeater)',
    'narayanaschoolsodisha.com',
    'narayanaschoolsmadhyapradesh.com',
    'narayanaschoolschhattisgarh.com',
    'narayanaschoolsassam.com',
    'wbnarayanaschools.in',
    'wbnarayanaschools.in (ekidz)',
    'Bhopal LP',
    'Indore LP',
    'gemsakademia.in',
  ];

  get activeFilterCount(): number {
    return Object.values(this.filters).filter(
      (value) => value.trim() !== ''
    ).length;
  }

  emitFilterChange(): void {
    this.filtersChanged.emit({ ...this.filters });
  }

  applyFilters(): void {
    this.filtersChanged.emit({ ...this.filters });
  }

  resetFilters(): void {
    this.filters = {
      selectedLP: '',
      search: '',
      startDate: '',
      endDate: '',
      classCategory: '',
    };

    this.filtersChanged.emit({ ...this.filters });
  }
}