import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

export interface CityOption {
  name: string;
  branches: string[];
}

export interface PageSelectorConfig {
  city: string;
  branch: string;
  className: string;
  url: string;
}

@Component({
  selector: 'app-page-selector',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './page-selector.component.html',
})
export class PageSelectorComponent {

  @Output() pageCreatedChange =
    new EventEmitter<PageSelectorConfig>();

  cities: CityOption[] = [
    {
      name: 'Kolkata',
      branches: [
        'Joka',
        'Khidderpore',
        'Maheshtala',
        'New Town',
        'New Market',
        'Ramchandrapur',
        'Silpara',
        'Sonarpur',
        'Park Circus',
      ],
    },
    {
      name: 'Bardhaman',
      branches: [
        'Andal',
        'Asansol',
        'Bardhaman',
        'Durgapur',
      ],
    },
    {
      name: 'Darjeeling',
      branches: [
        'Dagapur',
        'Siliguri',
        'Darjeeling',
        'Fulbari',
      ],
    },
    {
      name: 'North 24 Parganas',
      branches: [
        'Basirhat',
        'Barasat',
        'Kalyani Express',
      ],
    },
  ];

  classes: string[] = [
    'Nursery',
    'LKG',
    'UKG',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
    'Class 11',
    'Class 12',
  ];

  selectedCity = '';
  selectedBranch = '';
  selectedClass = '';

  availableBranches: string[] = [];

  generatedUrl = '';
  copied = false;
  pageCreated = false;

  private readonly domainName = environment.publicWebBaseUrl.replace(/\/?$/, '/');

  onCityChange(): void {
    const city = this.cities.find(
      (item) => item.name === this.selectedCity
    );

    this.availableBranches = city?.branches ?? [];

    this.selectedBranch = '';
    this.selectedClass = '';

    this.updateGeneratedUrl();
  }

  onBranchChange(): void {
    this.selectedClass = '';
    this.updateGeneratedUrl();
  }

  onClassChange(): void {
    this.updateGeneratedUrl();
  }

  updateGeneratedUrl(): void {
    if (!this.selectedCity || !this.selectedBranch) {
      this.generatedUrl = '';
      return;
    }

    const citySlug = this.createSlug(this.selectedCity);
    const branchSlug = this.createSlug(this.selectedBranch);

    let url =
      `${this.domainName}${citySlug}/${branchSlug}`;

    if (this.selectedClass) {
      const classSlug = this.createSlug(this.selectedClass);

      url += `/${classSlug}`;
    }

    this.generatedUrl = url;
    this.copied = false;
    this.pageCreated = false;
  }

  createSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  get canCreatePage(): boolean {
    return !!this.selectedCity && !!this.selectedBranch;
  }

  addDynamicPage(): void {
    if (!this.canCreatePage) {
      return;
    }

    const pageConfig: PageSelectorConfig = {
      city: this.selectedCity,
      branch: this.selectedBranch,
      className: this.selectedClass,
      url: this.generatedUrl,
    };

    this.pageCreated = true;

    this.pageCreatedChange.emit(pageConfig);
  }

  copyUrl(): void {
    if (!this.generatedUrl) {
      return;
    }

    navigator.clipboard
      .writeText(this.generatedUrl)
      .then(() => {
        this.copied = true;

        setTimeout(() => {
          this.copied = false;
        }, 1500);
      })
      .catch(() => {
        this.copied = false;
      });
  }
}