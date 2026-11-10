import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageRevision } from '../../models/dynamic-page-builder.types';
import { SectionConfig } from '../../models/dynamic-page.model';

@Component({
  selector: 'app-page-revision-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './page-revision-panel.component.html',
})
export class PageRevisionPanelComponent {
  protected readonly Number = Number;

  @Input() selectedRevisionId: number | null = null;
  @Input() revisions: PageRevision[] = [];
  @Input() isPublishing = false;
  @Input() isCreatingDraft = false;
  @Input() isUnpublishing = false;
  @Input() hasPublishedRevision = false;
  @Input() domainName = '';
  @Input() generatedSlug = '';
  @Input() pageType = '';
  @Input() sections: SectionConfig[] = [];
  @Input() activeEditingSectionKey = '';

  @Output() revisionChanged = new EventEmitter<number | string | null>();
  @Output() publish = new EventEmitter<void>();
  @Output() previewDraft = new EventEmitter<void>();
  @Output() createDraft = new EventEmitter<void>();
  @Output() clonePage = new EventEmitter<void>();
  @Output() unpublishPage = new EventEmitter<void>();
  @Output() discardDraft = new EventEmitter<void>();
  @Output() copyUrl = new EventEmitter<void>();
  @Output() openUrl = new EventEmitter<void>();
  @Output() selectSection = new EventEmitter<string>();

  get currentRevision(): PageRevision | undefined {
    if (this.selectedRevisionId === null) return undefined;
    return this.revisions.find((r) => Number(r.id) === this.selectedRevisionId);
  }
}
