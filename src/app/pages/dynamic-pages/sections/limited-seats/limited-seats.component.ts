import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';

export interface LimitedSeatsLogo {
  id: number;
  name: string;
  image: string;
  mediaId?: number | null;
}

export interface LimitedSeatsCard {
  id: number;
  title: string;
  label: string;
  value: string;
  image: string;
  mediaId?: number | null;
}

export interface LimitedSeatsConfig {
  backgroundImage?: string;
  backgroundMediaId?: number | null;
  background_media_id?: number | null;
  image: string;
  mediaId?: number | null;
  feature_media_id?: number | null;
  heading: string;
  subHeading: string;
  buttonText: string;
  cards?: LimitedSeatsCard[];
  logos?: LimitedSeatsLogo[];
  schoolName: string;
  numberOfSchools: string;
  isActive: boolean;
  desktopActive: boolean;
  mobileActive: boolean;
}

@Component({
  selector: 'app-limited-seats-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ImageUploadComponent,
  ],
  templateUrl: './limited-seats.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class LimitedSeatsComponent implements OnInit {

  @Input() limitedSeats: LimitedSeatsConfig = {
    backgroundImage: '',
    backgroundMediaId: null,
    background_media_id: null,
    image: '',
    heading: 'Limited seats available for 2027-28 academic year.',
    subHeading: 'Secure your spot today!',
    buttonText: 'Download Brochure',
    cards: [
      {
        id: 1,
        title: 'Narayana Schools',
        label: 'Pan India Campuses',
        value: '300+',
        image: '',
        mediaId: null,
      },
      {
        id: 2,
        title: 'Student Body',
        label: 'Enrolled Students',
        value: '100,000+',
        image: '',
        mediaId: null,
      },
    ],
    logos: [],
    schoolName: 'Narayana Schools',
    numberOfSchools: '300+',
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };

  @Output() limitedSeatsChange =
    new EventEmitter<LimitedSeatsConfig>();

  isSectionOpen = false;

  activeSubSection: 'content' | 'cards' | null = 'content';

  get isContentOpen(): boolean {
    return this.activeSubSection === 'content';
  }

  get isCardsOpen(): boolean {
    return this.activeSubSection === 'cards';
  }

  openCardId: number | null = 1;

  private nextCardId = 3;

  ngOnInit(): void {
    this.ensureCards();
  }

  ensureCards(): void {
    if (!this.limitedSeats.cards || this.limitedSeats.cards.length === 0) {
      this.limitedSeats.cards = [
        {
          id: 1,
          title: this.limitedSeats.schoolName || 'Narayana Schools',
          label: 'Pan India Campuses',
          value: this.limitedSeats.numberOfSchools || '300+',
          image: '',
          mediaId: null,
        },
        {
          id: 2,
          title: 'Student Body',
          label: 'Enrolled Students',
          value: '100,000+',
          image: '',
          mediaId: null,
        },
      ];
      this.nextCardId = 3;
    } else {
      const maxId = Math.max(...this.limitedSeats.cards.map((c) => c.id), 0);
      this.nextCardId = maxId + 1;
    }
  }

  toggleSection(): void {
    this.isSectionOpen = !this.isSectionOpen;
  }

  toggleActive(): void {
    this.limitedSeats.isActive = !this.limitedSeats.isActive;
    this.emitChange();
  }

  toggleDesktop(): void {
    this.limitedSeats.desktopActive = !this.limitedSeats.desktopActive;
    this.emitChange();
  }

  toggleMobile(): void {
    this.limitedSeats.mobileActive = !this.limitedSeats.mobileActive;
    this.emitChange();
  }

  toggleContent(): void {
    this.activeSubSection = this.activeSubSection === 'content' ? null : 'content';
  }

  toggleCards(): void {
    this.activeSubSection = this.activeSubSection === 'cards' ? null : 'cards';
  }

  toggleCard(cardId: number): void {
    this.openCardId = this.openCardId === cardId ? null : cardId;
  }

  isCardOpen(cardId: number): boolean {
    return this.openCardId === cardId;
  }

  addCard(): void {
    this.ensureCards();
    const newCard: LimitedSeatsCard = {
      id: this.nextCardId++,
      title: '',
      label: '',
      value: '',
      image: '',
      mediaId: null,
    };

    this.limitedSeats.cards!.push(newCard);
    this.activeSubSection = 'cards';
    this.openCardId = newCard.id;

    this.emitChange();
  }

  removeCard(cardId: number): void {
    if (!this.limitedSeats.cards) return;
    this.limitedSeats.cards = this.limitedSeats.cards.filter(
      (card) => card.id !== cardId
    );

    if (this.openCardId === cardId) {
      this.openCardId = this.limitedSeats.cards[0]?.id ?? null;
    }

    this.emitChange();
  }

  onBackgroundImageChange(image: string): void {
    this.limitedSeats.backgroundImage = image;
    this.emitChange();
  }

  onBackgroundMediaIdChange(mediaId: number | null): void {
    this.limitedSeats.backgroundMediaId = mediaId;
    this.limitedSeats.background_media_id = mediaId;
    this.emitChange();
  }

  onImageChange(image: string): void {
    this.limitedSeats.image = image;
    this.emitChange();
  }

  onMediaIdChange(mediaId: number | null): void {
    this.limitedSeats.mediaId = mediaId;
    this.limitedSeats.feature_media_id = mediaId;
    this.emitChange();
  }

  onCardImageChange(cardId: number, image: string): void {
    const card = this.limitedSeats.cards?.find((item) => item.id === cardId);
    if (!card) return;
    card.image = image;
    this.emitChange();
  }

  onCardMediaIdChange(cardId: number, mediaId: number | null): void {
    const card = this.limitedSeats.cards?.find((item) => item.id === cardId);
    if (!card) return;
    card.mediaId = mediaId;
    this.emitChange();
  }

  emitChange(): void {
    const firstCard = this.limitedSeats.cards?.[0];
    if (firstCard) {
      if (firstCard.title) this.limitedSeats.schoolName = firstCard.title;
      if (firstCard.value) this.limitedSeats.numberOfSchools = firstCard.value;
    }

    this.limitedSeatsChange.emit({
      ...this.limitedSeats,
      cards: (this.limitedSeats.cards || []).map((card) => ({
        ...card,
      })),
      logos: (this.limitedSeats.logos || []).map((logo) => ({
        ...logo,
      })),
    });
  }
}
