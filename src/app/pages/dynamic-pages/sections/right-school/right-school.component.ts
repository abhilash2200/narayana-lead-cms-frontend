import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';

export interface RightSchoolCard {
  id: number;
  image: string;
  mediaId?: number | null;
  heading: string;
  paragraph: string;
}

export interface RightSchoolConfig {
  sectionHeading: string;
  sectionSubHeading: string;
  cards: RightSchoolCard[];
  isActive: boolean;
  desktopActive: boolean;
  mobileActive: boolean;
}

@Component({
  selector: 'app-right-school',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ImageUploadComponent,
  ],
  templateUrl: './right-school.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class RightSchoolComponent {
  @Input() rightSchool: RightSchoolConfig = {
    sectionHeading: 'Right School',
    sectionSubHeading:
      'Choose the right school for your child.',
    cards: [
      {
        id: 1,
        image: '',
        heading: '',
        paragraph: '',
      },
    ],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };

  @Output() rightSchoolChange =
    new EventEmitter<RightSchoolConfig>();

  isSectionOpen = false;
  openCardId: number | null = null;

  private nextCardId = 2;

  toggleSection(): void {
    this.isSectionOpen = !this.isSectionOpen;
  }

  toggleActive(): void {
    this.rightSchool.isActive =
      !this.rightSchool.isActive;

    this.emitChange();
  }

  toggleDesktop(): void {
    this.rightSchool.desktopActive =
      !this.rightSchool.desktopActive;

    this.emitChange();
  }

  toggleMobile(): void {
    this.rightSchool.mobileActive =
      !this.rightSchool.mobileActive;

    this.emitChange();
  }

  toggleCard(cardId: number): void {
    this.openCardId =
      this.openCardId === cardId
        ? null
        : cardId;
  }

  isCardOpen(cardId: number): boolean {
    return this.openCardId === cardId;
  }

  addCard(): void {
    const newCard: RightSchoolCard = {
      id: this.nextCardId++,
      image: '',
      heading: '',
      paragraph: '',
    };

    this.rightSchool.cards.push(newCard);

    this.openCardId = newCard.id;

    this.emitChange();
  }

  removeCard(cardId: number): void {
    this.rightSchool.cards =
      this.rightSchool.cards.filter(
        (card) => card.id !== cardId
      );

    if (this.openCardId === cardId) {
      this.openCardId =
        this.rightSchool.cards[0]?.id ?? null;
    }

    this.emitChange();
  }

  onCardImageChange(
    cardId: number,
    image: string
  ): void {
    const card =
      this.rightSchool.cards.find(
        (item) => item.id === cardId
      );

    if (!card) {
      return;
    }

    card.image = image;

    this.emitChange();
  }

  onCardMediaIdChange(cardId: number, mediaId: number | null): void {
    const card = this.rightSchool.cards.find((item) => item.id === cardId);
    if (!card) return;
    card.mediaId = mediaId;
    this.emitChange();
  }

  emitChange(): void {
    this.rightSchoolChange.emit({
      sectionHeading:
        this.rightSchool.sectionHeading,

      sectionSubHeading:
        this.rightSchool.sectionSubHeading,

      cards:
        this.rightSchool.cards.map(
          (card) => ({
            ...card,
          })
        ),

      isActive:
        this.rightSchool.isActive,

      desktopActive:
        this.rightSchool.desktopActive,

      mobileActive:
        this.rightSchool.mobileActive,
    });
  }
}