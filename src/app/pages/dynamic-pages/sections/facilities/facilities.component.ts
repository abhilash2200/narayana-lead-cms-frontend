import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';

export interface FacilityItem {
  id: number;
  image: string;
  mediaId?: number | null;
  heading: string;
  paragraph: string;
}

export interface FacilitiesConfig {
  sectionHeading: string;
  sectionSubHeading: string;
  facilities: FacilityItem[];
  isActive: boolean;
  desktopActive: boolean;
  mobileActive: boolean;
}

@Component({
  selector: 'app-facilities-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ImageUploadComponent,
  ],
  templateUrl: './facilities.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class FacilitiesComponent {
  @Input() facilities: FacilitiesConfig = {
    sectionHeading: 'Our Facilities',
    sectionSubHeading:
      'Explore the facilities designed to provide students with a comfortable and enriching environment.',
    facilities: [
      {
        id: 1,
        image: '',
        heading: 'Smart Classrooms',
        paragraph:
          'Modern classrooms equipped with technology to create an engaging and interactive learning environment.',
      },
    ],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };

  @Output() facilitiesChange =
    new EventEmitter<FacilitiesConfig>();

  isSectionOpen = false;
  openFacilityId: number | null = null;

  private nextFacilityId = 2;

  toggleSection(): void {
    this.isSectionOpen = !this.isSectionOpen;
  }

  toggleActive(): void {
    this.facilities.isActive =
      !this.facilities.isActive;

    this.emitChange();
  }

  toggleDesktop(): void {
    this.facilities.desktopActive =
      !this.facilities.desktopActive;

    this.emitChange();
  }

  toggleMobile(): void {
    this.facilities.mobileActive =
      !this.facilities.mobileActive;

    this.emitChange();
  }

  toggleFacility(facilityId: number): void {
    this.openFacilityId =
      this.openFacilityId === facilityId
        ? null
        : facilityId;
  }

  isFacilityOpen(facilityId: number): boolean {
    return this.openFacilityId === facilityId;
  }

  addFacility(): void {
    const newFacility: FacilityItem = {
      id: this.nextFacilityId++,
      image: '',
      heading: '',
      paragraph: '',
    };

    this.facilities.facilities.push(newFacility);

    this.openFacilityId = newFacility.id;

    this.emitChange();
  }

  removeFacility(facilityId: number): void {
    this.facilities.facilities =
      this.facilities.facilities.filter(
        (facility) => facility.id !== facilityId
      );

    if (this.openFacilityId === facilityId) {
      this.openFacilityId =
        this.facilities.facilities[0]?.id ?? null;
    }

    this.emitChange();
  }

  onFacilityImageChange(
    facilityId: number,
    image: string
  ): void {
    const facility =
      this.facilities.facilities.find(
        (item) => item.id === facilityId
      );

    if (!facility) {
      return;
    }

    facility.image = image;

    this.emitChange();
  }

  onFacilityMediaIdChange(facilityId: number, mediaId: number | null): void {
    const facility = this.facilities.facilities.find((item) => item.id === facilityId);
    if (!facility) return;
    facility.mediaId = mediaId;
    this.emitChange();
  }

  emitChange(): void {
    this.facilitiesChange.emit({
      sectionHeading:
        this.facilities.sectionHeading,
      sectionSubHeading:
        this.facilities.sectionSubHeading,
      facilities:
        this.facilities.facilities.map(
          (facility) => ({
            ...facility,
          })
        ),
      isActive: this.facilities.isActive,
      desktopActive:
        this.facilities.desktopActive,
      mobileActive:
        this.facilities.mobileActive,
    });
  }
}