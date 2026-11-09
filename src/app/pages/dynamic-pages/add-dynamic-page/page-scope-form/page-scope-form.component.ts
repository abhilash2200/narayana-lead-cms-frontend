import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CityOption,
  BranchOption,
  ClassOption,
  PageRevision,
} from '../../models/dynamic-page-builder.types';

@Component({
  selector: 'app-page-scope-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './page-scope-form.component.html',
})
export class PageScopeFormComponent {
  protected readonly Number = Number;

  @Input() cities: CityOption[] = [];
  @Input() availableBranches: BranchOption[] = [];
  @Input() classes: ClassOption[] = [];

  @Input() selectedCityId: number | null = null;
  @Output() selectedCityIdChange = new EventEmitter<number | null>();

  @Input() selectedBranchId: number | null = null;
  @Output() selectedBranchIdChange = new EventEmitter<number | null>();

  @Input() selectedClassId: number | null = null;
  @Output() selectedClassIdChange = new EventEmitter<number | null>();

  @Input() pageTitle = '';
  @Output() pageTitleChange = new EventEmitter<string>();

  @Input() seoTitle = '';
  @Output() seoTitleChange = new EventEmitter<string>();

  @Input() seoDescription = '';
  @Output() seoDescriptionChange = new EventEmitter<string>();

  @Input() isIndexed = false;
  @Output() isIndexedChange = new EventEmitter<boolean>();

  @Input() domainName = '';
  @Input() generatedSlug = '';
  @Input() pageCreated = false;
  @Input() selectedRevisionId: number | null = null;
  @Input() revisions: PageRevision[] = [];
  @Input() canCreatePage = false;
  @Input() isCreatingPage = false;
  @Input() isSavingMetadata = false;

  @Output() cityChanged = new EventEmitter<void>();
  @Output() branchChanged = new EventEmitter<void>();
  @Output() classChanged = new EventEmitter<void>();
  @Output() create = new EventEmitter<void>();
  @Output() saveMetadata = new EventEmitter<void>();
  @Output() discardDraft = new EventEmitter<void>();
  @Output() copyUrl = new EventEmitter<void>();
  @Output() openUrl = new EventEmitter<void>();
  @Output() previewDraft = new EventEmitter<void>();

  onCitySelect(val: number | null): void {
    this.selectedCityId = val;
    this.selectedCityIdChange.emit(val);
    this.cityChanged.emit();
  }

  onBranchSelect(val: number | null): void {
    this.selectedBranchId = val;
    this.selectedBranchIdChange.emit(val);
    this.branchChanged.emit();
  }

  onClassSelect(val: number | null): void {
    this.selectedClassId = val;
    this.selectedClassIdChange.emit(val);
    this.classChanged.emit();
  }

  onTitleInput(val: string): void {
    this.pageTitle = val;
    this.pageTitleChange.emit(val);
  }

  onSeoTitleInput(val: string): void {
    this.seoTitle = val;
    this.seoTitleChange.emit(val);
  }

  onSeoDescriptionInput(val: string): void {
    this.seoDescription = val;
    this.seoDescriptionChange.emit(val);
  }

  onIndexToggle(val: boolean): void {
    this.isIndexed = val;
    this.isIndexedChange.emit(val);
  }
}
