import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';

export interface AcademicResult {
  id: number;
  image: string;
  mediaId?: number | null;
  studentName: string;
  marks: string;
  boardName: string;
  buttonText: string;
  buttonUrl: string;
}

export interface AcademicResultsConfig {
  sectionHeading: string;
  sectionSubHeading: string;
  results: AcademicResult[];
  isActive: boolean;
  desktopActive: boolean;
  mobileActive: boolean;
}

@Component({
  selector: 'app-academic-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ImageUploadComponent,
  ],
  templateUrl: './academic-results.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class AcademicResultsComponent {
  @Input() academicResults: AcademicResultsConfig = {
    sectionHeading: 'Academic Results',
    sectionSubHeading:
      'Our students outstanding academic achievements.',
    results: [
      {
        id: 1,
        image: '',
        studentName: '',
        marks: '',
        boardName: '',
        buttonText: '',
        buttonUrl: '',
      },
    ],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };

  @Output() academicResultsChange =
    new EventEmitter<AcademicResultsConfig>();

  isSectionOpen = false;
  openResultId: number | null = null;

  private nextResultId = 2;

  toggleSection(): void {
    this.isSectionOpen = !this.isSectionOpen;
  }

  toggleActive(): void {
    this.academicResults.isActive =
      !this.academicResults.isActive;

    this.emitChange();
  }

  toggleDesktop(): void {
    this.academicResults.desktopActive =
      !this.academicResults.desktopActive;

    this.emitChange();
  }

  toggleMobile(): void {
    this.academicResults.mobileActive =
      !this.academicResults.mobileActive;

    this.emitChange();
  }

  toggleResult(resultId: number): void {
    this.openResultId =
      this.openResultId === resultId
        ? null
        : resultId;
  }

  isResultOpen(resultId: number): boolean {
    return this.openResultId === resultId;
  }

  addResult(): void {
    const newResult: AcademicResult = {
      id: this.nextResultId++,
      image: '',
      studentName: '',
      marks: '',
      boardName: '',
      buttonText: '',
      buttonUrl: '',
    };

    this.academicResults.results.push(newResult);

    this.openResultId = newResult.id;

    this.emitChange();
  }

  removeResult(resultId: number): void {
    this.academicResults.results =
      this.academicResults.results.filter(
        (result) => result.id !== resultId
      );

    if (this.openResultId === resultId) {
      this.openResultId =
        this.academicResults.results[0]?.id ?? null;
    }

    this.emitChange();
  }

  onResultImageChange(
    resultId: number,
    image: string
  ): void {
    const result =
      this.academicResults.results.find(
        (item) => item.id === resultId
      );

    if (!result) {
      return;
    }

    result.image = image;

    this.emitChange();
  }

  onResultMediaIdChange(resultId: number, mediaId: number | null): void {
    const result = this.academicResults.results.find((item) => item.id === resultId);
    if (!result) return;
    result.mediaId = mediaId;
    this.emitChange();
  }

  emitChange(): void {
    this.academicResultsChange.emit({
      sectionHeading:
        this.academicResults.sectionHeading,

      sectionSubHeading:
        this.academicResults.sectionSubHeading,

      results:
        this.academicResults.results.map(
          (result) => ({
            ...result,
          })
        ),

      isActive:
        this.academicResults.isActive,

      desktopActive:
        this.academicResults.desktopActive,

      mobileActive:
        this.academicResults.mobileActive,
    });
  }
}