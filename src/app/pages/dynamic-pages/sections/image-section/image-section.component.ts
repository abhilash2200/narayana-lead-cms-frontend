import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';

export interface ImageSectionConfig {
  desktopImage: string;
  mobileImage: string;
  desktop_media_id?: number | null;
  mobile_media_id?: number | null;
  mediaId?: number | null;
  isActive: boolean;
  desktopActive: boolean;
  mobileActive: boolean;
}

@Component({
  selector: 'app-image-section',
  standalone: true,
  imports: [
    ImageUploadComponent,
  ],
  templateUrl: './image-section.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ImageSectionComponent {

  @Input() imageSection: ImageSectionConfig = {
    desktopImage: '',
    mobileImage: '',
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };

  @Output() imageSectionChange =
    new EventEmitter<ImageSectionConfig>();

  isSectionOpen = false;

  toggleSection(): void {
    this.isSectionOpen = !this.isSectionOpen;
  }

  toggleActive(): void {
    this.imageSection.isActive =
      !this.imageSection.isActive;

    this.emitChange();
  }

  toggleDesktop(): void {
    this.imageSection.desktopActive =
      !this.imageSection.desktopActive;

    this.emitChange();
  }

  toggleMobile(): void {
    this.imageSection.mobileActive =
      !this.imageSection.mobileActive;

    this.emitChange();
  }

  onDesktopImageChange(image: string): void {
    this.imageSection.desktopImage = image;

    this.emitChange();
  }

  onDesktopMediaIdChange(mediaId: number | null): void {
    this.imageSection.desktop_media_id = mediaId;
    this.emitChange();
  }

  onMobileImageChange(image: string): void {
    this.imageSection.mobileImage = image;

    this.emitChange();
  }

  onMobileMediaIdChange(mediaId: number | null): void {
    this.imageSection.mobile_media_id = mediaId;
    this.emitChange();
  }

  emitChange(): void {
    this.imageSectionChange.emit({
      desktopImage:
        this.imageSection.desktopImage,

      mobileImage:
        this.imageSection.mobileImage,

      desktop_media_id:
        this.imageSection.desktop_media_id,

      mobile_media_id:
        this.imageSection.mobile_media_id,

      isActive:
        this.imageSection.isActive,

      desktopActive:
        this.imageSection.desktopActive,

      mobileActive:
        this.imageSection.mobileActive,
    });
  }
}