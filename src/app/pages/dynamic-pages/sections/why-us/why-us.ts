import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';

interface WhyChooseBox {
  id: number;
  image: string;
  mediaId?: number | null;
  heading: string;
  paragraph: string;
}

export interface WhyUsConfig {
  sectionHeading: string;
  highlightWord?: string;
  headingSuffix?: string;
  sectionSubHeading: string;
  boxes: WhyChooseBox[];
  isActive: boolean;
  desktopActive: boolean;
  mobileActive: boolean;
}

@Component({
  selector: 'app-why-us',
  standalone: true,
  imports: [
    FormsModule,
    ImageUploadComponent,
  ],
  templateUrl: './why-us.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class WhyUs {
  @Input() whyUs: WhyUsConfig = {
    sectionHeading: '',
    highlightWord: '',
    headingSuffix: '',
    sectionSubHeading: '',
    boxes: [],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };

  @Output() whyUsChange =
    new EventEmitter<WhyUsConfig>();

  isSectionOpen = false;
  openBoxId: number | null = null;

  private nextBoxId = 2;

  toggleSection(): void {
    this.isSectionOpen = !this.isSectionOpen;
  }

  toggleActive(): void {
    this.whyUs.isActive =
      !this.whyUs.isActive;

    this.emitChange();
  }

  toggleDesktop(): void {
    this.whyUs.desktopActive =
      !this.whyUs.desktopActive;

    this.emitChange();
  }

  toggleMobile(): void {
    this.whyUs.mobileActive =
      !this.whyUs.mobileActive;

    this.emitChange();
  }

  toggleBox(boxId: number): void {
    this.openBoxId =
      this.openBoxId === boxId
        ? null
        : boxId;
  }

  isBoxOpen(boxId: number): boolean {
    return this.openBoxId === boxId;
  }

  addBox(): void {
    const newBox: WhyChooseBox = {
      id: this.nextBoxId++,
      image: '',
      heading: '',
      paragraph: '',
    };

    this.whyUs.boxes.push(newBox);

    this.openBoxId = newBox.id;

    this.emitChange();
  }

  removeBox(boxId: number): void {
    this.whyUs.boxes =
      this.whyUs.boxes.filter(
        (box) => box.id !== boxId
      );

    if (this.openBoxId === boxId) {
      this.openBoxId =
        this.whyUs.boxes[0]?.id ?? null;
    }

    this.emitChange();
  }

  onBoxImageChange(
    boxId: number,
    image: string
  ): void {
    const box =
      this.whyUs.boxes.find(
        (item) => item.id === boxId
      );

    if (!box) {
      return;
    }

    box.image = image;

    this.emitChange();
  }

  onBoxMediaIdChange(boxId: number, mediaId: number | null): void {
    const box = this.whyUs.boxes.find((item) => item.id === boxId);
    if (!box) {
      return;
    }
    box.mediaId = mediaId;
    this.emitChange();
  }

  emitChange(): void {
    this.whyUsChange.emit({
      sectionHeading:
        this.whyUs.sectionHeading,

      highlightWord:
        this.whyUs.highlightWord,

      headingSuffix:
        this.whyUs.headingSuffix,

      sectionSubHeading:
        this.whyUs.sectionSubHeading,

      boxes:
        this.whyUs.boxes.map(
          (box) => ({
            ...box,
          })
        ),

      isActive:
        this.whyUs.isActive,

      desktopActive:
        this.whyUs.desktopActive,

      mobileActive:
        this.whyUs.mobileActive,
    });
  }
}