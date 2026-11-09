import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';

export interface ClassListItem {
  id: number;
  text: string;
}

export interface ClassCard {
  id: number;
  image: string;
  mediaId?: number | null;
  heading: string;
  subHeading: string;
  h3Heading: string;
  listItems: ClassListItem[];
  button1Text: string;
  button1Url: string;
  button2Text: string;
  button2Url: string;
}

export interface ClassesConfig {
  sectionHeading: string;
  sectionSubHeading: string;
  cards: ClassCard[];
  isActive: boolean;
  desktopActive: boolean;
  mobileActive: boolean;
}

@Component({
  selector: 'app-classes-section',
  standalone: true,
  imports: [
    FormsModule,
    ImageUploadComponent,
  ],
  templateUrl: './classes.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ClassesComponent {
  @Input() classes: ClassesConfig = {
    sectionHeading: 'Explore Our Classes',
    sectionSubHeading:
      'Choose the right programme for your child',

    cards: [
      {
        id: 1,
        image: '',
        heading: 'Class 5',
        subHeading: 'Foundation Programme',
        h3Heading: 'What Students Learn',

        listItems: [
          {
            id: 1,
            text: 'Mathematics',
          },
          {
            id: 2,
            text: 'Science',
          },
          {
            id: 3,
            text: 'English',
          },
        ],

        button1Text: 'Explore',
        button1Url: '#',
        button2Text: 'Apply Now',
        button2Url: '#',
      },
    ],

    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };

  @Output() classesChange =
    new EventEmitter<ClassesConfig>();

  isSectionOpen = false;

  openCardId: number | null = null;

  private nextCardId = 2;
  private nextListItemId = 4;

  toggleSection(): void {
    this.isSectionOpen =
      !this.isSectionOpen;
  }

  toggleActive(): void {
    this.classes.isActive =
      !this.classes.isActive;

    this.emitChange();
  }

  toggleDesktop(): void {
    this.classes.desktopActive =
      !this.classes.desktopActive;

    this.emitChange();
  }

  toggleMobile(): void {
    this.classes.mobileActive =
      !this.classes.mobileActive;

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

  addClass(): void {
    const newCard: ClassCard = {
      id: this.nextCardId++,
      image: '',
      heading: '',
      subHeading: '',
      h3Heading: '',

      listItems: [
        {
          id: this.nextListItemId++,
          text: '',
        },
      ],

      button1Text: '',
      button1Url: '',
      button2Text: '',
      button2Url: '',
    };

    this.classes.cards.push(newCard);

    this.openCardId = newCard.id;

    this.emitChange();
  }

  removeClass(cardId: number): void {
    this.classes.cards =
      this.classes.cards.filter(
        (card) => card.id !== cardId
      );

    if (this.openCardId === cardId) {
      this.openCardId =
        this.classes.cards[0]?.id ?? null;
    }

    this.emitChange();
  }

  addListItem(cardId: number): void {
    const card =
      this.classes.cards.find(
        (item) => item.id === cardId
      );

    if (!card) {
      return;
    }

    card.listItems.push({
      id: this.nextListItemId++,
      text: '',
    });

    this.emitChange();
  }

  removeListItem(
    cardId: number,
    itemId: number
  ): void {
    const card =
      this.classes.cards.find(
        (item) => item.id === cardId
      );

    if (!card) {
      return;
    }

    if (card.listItems.length <= 1) {
      return;
    }

    card.listItems =
      card.listItems.filter(
        (item) => item.id !== itemId
      );

    this.emitChange();
  }

  onCardImageChange(
    cardId: number,
    image: string
  ): void {
    const card =
      this.classes.cards.find(
        (item) => item.id === cardId
      );

    if (!card) {
      return;
    }

    card.image = image;

    this.emitChange();
  }

  onCardMediaIdChange(cardId: number, mediaId: number | null): void {
    const card = this.classes.cards.find((item) => item.id === cardId);
    if (!card) return;
    card.mediaId = mediaId;
    this.emitChange();
  }

  emitChange(): void {
    this.classesChange.emit({
      sectionHeading:
        this.classes.sectionHeading,

      sectionSubHeading:
        this.classes.sectionSubHeading,

      cards:
        this.classes.cards.map(
          (card) => ({
            ...card,

            listItems:
              card.listItems.map(
                (item) => ({
                  ...item,
                })
              ),
          })
        ),

      isActive:
        this.classes.isActive,

      desktopActive:
        this.classes.desktopActive,

      mobileActive:
        this.classes.mobileActive,
    });
  }
}