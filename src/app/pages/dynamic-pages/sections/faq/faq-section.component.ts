import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export interface FaqConfig {
  sectionHeading: string;
  sectionSubHeading: string;
  faqs: FaqItem[];
  isActive: boolean;
  desktopActive: boolean;
  mobileActive: boolean;
}

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './faq-section.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class FaqSectionComponent {
  @Input() faq: FaqConfig = {
    sectionHeading: 'Frequently Asked Questions',
    sectionSubHeading:
      'Find answers to commonly asked questions.',
    faqs: [
      {
        id: 1,
        question: 'What is the admission process?',
        answer:
          'Please contact our admission team to know more about the admission process.',
      },
    ],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };

  @Output() faqChange =
    new EventEmitter<FaqConfig>();

  isSectionOpen = false;
  openFaqId: number | null = null;

  private nextFaqId = 2;

  toggleSection(): void {
    this.isSectionOpen = !this.isSectionOpen;
  }

  toggleActive(): void {
    this.faq.isActive =
      !this.faq.isActive;

    this.emitChange();
  }

  toggleDesktop(): void {
    this.faq.desktopActive =
      !this.faq.desktopActive;

    this.emitChange();
  }

  toggleMobile(): void {
    this.faq.mobileActive =
      !this.faq.mobileActive;

    this.emitChange();
  }

  toggleFaq(faqId: number): void {
    this.openFaqId =
      this.openFaqId === faqId
        ? null
        : faqId;
  }

  isFaqOpen(faqId: number): boolean {
    return this.openFaqId === faqId;
  }

  addFaq(): void {
    const newFaq: FaqItem = {
      id: this.nextFaqId++,
      question: '',
      answer: '',
    };

    this.faq.faqs.push(newFaq);

    this.openFaqId = newFaq.id;

    this.emitChange();
  }

  removeFaq(faqId: number): void {
    this.faq.faqs =
      this.faq.faqs.filter(
        (item) => item.id !== faqId
      );

    if (this.openFaqId === faqId) {
      this.openFaqId =
        this.faq.faqs[0]?.id ?? null;
    }

    this.emitChange();
  }

  emitChange(): void {
    this.faqChange.emit({
      sectionHeading:
        this.faq.sectionHeading,

      sectionSubHeading:
        this.faq.sectionSubHeading,

      faqs:
        this.faq.faqs.map(
          (item) => ({
            ...item,
          })
        ),

      isActive:
        this.faq.isActive,

      desktopActive:
        this.faq.desktopActive,

      mobileActive:
        this.faq.mobileActive,
    });
  }
}