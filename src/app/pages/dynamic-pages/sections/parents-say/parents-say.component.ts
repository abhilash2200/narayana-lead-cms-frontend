import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';

export interface ParentReview {
  id: number;
  image: string;
  mediaId?: number | null;
  name: string;
  location: string;
  review: string;
  rating: number;
}

export interface ParentsSayConfig {
  reviews: ParentReview[];
  isActive: boolean;
  desktopActive: boolean;
  mobileActive: boolean;
}

@Component({
  selector: 'app-parents-say',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ImageUploadComponent,
  ],
  templateUrl: './parents-say.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ParentsSayComponent {

  @Input() parentsSay: ParentsSayConfig = {
    reviews: [
      {
        id: 1,
        image: '',
        name: '',
        location: '',
        review: '',
        rating: 5,
      },
    ],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };

  @Output() parentsSayChange =
    new EventEmitter<ParentsSayConfig>();

  isSectionOpen = false;

  openReviewId: number | null = null;

  private nextReviewId = 2;

  stars: number[] = [1, 2, 3, 4, 5];

  toggleSection(): void {
    this.isSectionOpen = !this.isSectionOpen;
  }

  toggleActive(): void {
    this.parentsSay.isActive =
      !this.parentsSay.isActive;

    this.emitChange();
  }

  toggleDesktop(): void {
    this.parentsSay.desktopActive =
      !this.parentsSay.desktopActive;

    this.emitChange();
  }

  toggleMobile(): void {
    this.parentsSay.mobileActive =
      !this.parentsSay.mobileActive;

    this.emitChange();
  }

  toggleReview(reviewId: number): void {
    this.openReviewId =
      this.openReviewId === reviewId
        ? null
        : reviewId;
  }

  isReviewOpen(reviewId: number): boolean {
    return this.openReviewId === reviewId;
  }

  addReview(): void {
    const newReview: ParentReview = {
      id: this.nextReviewId++,
      image: '',
      name: '',
      location: '',
      review: '',
      rating: 5,
    };

    this.parentsSay.reviews.push(newReview);

    this.openReviewId = newReview.id;

    this.emitChange();
  }

  removeReview(reviewId: number): void {
    this.parentsSay.reviews =
      this.parentsSay.reviews.filter(
        (review) => review.id !== reviewId
      );

    if (this.openReviewId === reviewId) {
      this.openReviewId =
        this.parentsSay.reviews[0]?.id ?? null;
    }

    this.emitChange();
  }

  onReviewImageChange(
    reviewId: number,
    image: string
  ): void {
    const review =
      this.parentsSay.reviews.find(
        (item) => item.id === reviewId
      );

    if (!review) {
      return;
    }

    review.image = image;

    this.emitChange();
  }

  onReviewMediaIdChange(reviewId: number, mediaId: number | null): void {
    const review = this.parentsSay.reviews.find((item) => item.id === reviewId);
    if (!review) return;
    review.mediaId = mediaId;
    this.emitChange();
  }

  updateName(
    reviewId: number,
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const review =
      this.parentsSay.reviews.find(
        (item) => item.id === reviewId
      );

    if (!review) {
      return;
    }

    review.name = input.value;

    this.emitChange();
  }

  updateLocation(
    reviewId: number,
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const review =
      this.parentsSay.reviews.find(
        (item) => item.id === reviewId
      );

    if (!review) {
      return;
    }

    review.location = input.value;

    this.emitChange();
  }

  updateReviewText(
    reviewId: number,
    event: Event
  ): void {
    const textarea =
      event.target as HTMLTextAreaElement;

    const review =
      this.parentsSay.reviews.find(
        (item) => item.id === reviewId
      );

    if (!review) {
      return;
    }

    review.review = textarea.value;

    this.emitChange();
  }

  setRating(
    reviewId: number,
    rating: number
  ): void {
    const review =
      this.parentsSay.reviews.find(
        (item) => item.id === reviewId
      );

    if (!review) {
      return;
    }

    review.rating = rating;

    this.emitChange();
  }

  emitChange(): void {
    this.parentsSayChange.emit({
      reviews: this.parentsSay.reviews.map(
        (review) => ({
          ...review,
        })
      ),
      isActive: this.parentsSay.isActive,
      desktopActive:
        this.parentsSay.desktopActive,
      mobileActive:
        this.parentsSay.mobileActive,
    });
  }
}