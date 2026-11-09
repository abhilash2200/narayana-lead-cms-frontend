import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicPage } from '../../models/dynamic-page.model';
import { City } from '../../../../services/city.service';
import { Branch, BranchService } from '../../../../services/branch.service';
import { ClassMaster } from '../../../../services/class.service';
import {
  ClonePageRequest,
  DynamicPageService,
  PageRevisionItem,
} from '../../../../services/dynamic-page.service';

export interface ScopeCityItem {
  id: number | string;
  name: string;
  slug?: string;
}

export interface ScopeBranchItem {
  id: number | string;
  city_id: number | string;
  name: string;
  slug?: string;
}

export interface ScopeClassItem {
  id: number | string;
  name: string;
  slug?: string;
}

export interface ScopeRevisionItem {
  id: string | number;
  version_no?: string | number;
  title?: string;
  status?: string;
  seo_title?: string;
  seo_description?: string;
}

export interface SourcePageSummary {
  id: number;
  title: string;
  cityName?: string;
  branchName?: string | null;
  className?: string | null;
  cityId?: number | string | null;
  branchId?: number | string | null;
  classId?: number | string | null;
  scopeKey?: string;
  canonicalPath?: string;
}

@Component({
  selector: 'app-clone-page-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clone-page-modal.component.html',
})
export class ClonePageModalComponent implements OnChanges {
  private readonly dynamicPageService = inject(DynamicPageService);
  private readonly branchService = inject(BranchService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() isOpen = false;
  @Input() sourcePage: DynamicPage | SourcePageSummary | null = null;
  @Input() sourceRevisionId: number | null = null;
  @Input() revisions: ScopeRevisionItem[] = [];
  @Input() cities: ScopeCityItem[] = [];
  @Input() branches: ScopeBranchItem[] = [];
  @Input() classes: ScopeClassItem[] = [];
  @Input() existingPages: DynamicPage[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() cloned = new EventEmitter<{ pageId: number; revisionId?: number | null }>();

  // Source revisions state
  availableRevisions: ScopeRevisionItem[] = [];
  selectedSourceRevisionId: number | null = null;
  isLoadingRevisions = false;

  // Target scope form
  targetCityId: number | null = null;
  targetBranchId: number | null = null;
  targetClassId: number | null = null;

  // Dynamically loaded branches for the selected city
  cityBranches: ScopeBranchItem[] = [];
  isLoadingBranches = false;

  // Page Details
  title = '';
  seoTitle = '';
  seoDescription = '';

  // Form handling
  isCloning = false;
  errorMessage = '';
  private userEditedTitle = false;
  private userEditedSeoTitle = false;
  private userEditedSeoDescription = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initModal();
    }
  }

  private initModal(): void {
    this.errorMessage = '';
    this.isCloning = false;
    this.userEditedTitle = false;
    this.userEditedSeoTitle = false;
    this.userEditedSeoDescription = false;
    this.isLoadingBranches = false;
    this.cityBranches = [];

    this.targetCityId = null;
    this.targetBranchId = null;
    this.targetClassId = null;
    this.title = '';
    this.seoTitle = '';
    this.seoDescription = '';

    if (!this.sourcePage) return;

    if (this.revisions && this.revisions.length > 0) {
      this.setRevisions(this.revisions);
    } else {
      this.fetchSourceRevisions(this.sourcePage.id);
    }
  }

  get sourceClassId(): number | null {
    if (!this.sourcePage) return null;
    const raw =
      (this.sourcePage as DynamicPage).classId ??
      (this.sourcePage as SourcePageSummary).classId;
    if (raw !== undefined && raw !== null && raw !== '') {
      const num = Number(raw);
      return Number.isNaN(num) ? null : num;
    }
    return null;
  }

  private fetchSourceRevisions(pageId: number): void {
    this.isLoadingRevisions = true;
    this.availableRevisions = [];
    this.cdr.detectChanges();

    this.dynamicPageService.getPageBuilderData(pageId).subscribe({
      next: (res) => {
        this.isLoadingRevisions = false;
        if (res.success && res.data) {
          const data = res.data as { revisions?: PageRevisionItem[] };
          const revs = (data.revisions || []) as PageRevisionItem[];
          this.setRevisions(revs);
        } else {
          this.setRevisions([]);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingRevisions = false;
        this.setRevisions([]);
        this.cdr.detectChanges();
      },
    });
  }

  private setRevisions(revs: ScopeRevisionItem[]): void {
    this.availableRevisions = revs;

    if (this.sourceRevisionId !== null && revs.some((r) => Number(r.id) === this.sourceRevisionId)) {
      this.selectedSourceRevisionId = this.sourceRevisionId;
    } else {
      const published = revs.find((r) => r.status === 'PUBLISHED');
      if (published) {
        this.selectedSourceRevisionId = Number(published.id);
      } else if (revs.length > 0) {
        this.selectedSourceRevisionId = Number(revs[0].id);
      } else {
        this.selectedSourceRevisionId = null;
      }
    }

    const activeRev = revs.find((r) => Number(r.id) === this.selectedSourceRevisionId);
    if (activeRev && !this.userEditedSeoDescription && !this.targetCityId) {
      this.seoDescription = activeRev.seo_description || '';
    }
  }

  onRevisionSelectChange(): void {
    const rev = this.availableRevisions.find((r) => Number(r.id) === Number(this.selectedSourceRevisionId));
    if (rev && !this.userEditedSeoDescription && !this.targetCityId) {
      this.seoDescription = rev.seo_description || '';
    }
  }

  get availableBranches(): ScopeBranchItem[] {
    if (!this.targetCityId) return [];
    if (this.cityBranches.length > 0) {
      return this.cityBranches;
    }
    return this.branches.filter((b) => Number(b.city_id) === Number(this.targetCityId));
  }

  onCityChange(): void {
    this.targetBranchId = null;
    this.targetClassId = null;
    this.cityBranches = [];

    if (this.targetCityId !== null) {
      // Seed immediately with any cached branches matching this city
      const cached = this.branches.filter((b) => Number(b.city_id) === Number(this.targetCityId));
      if (cached.length > 0) {
        this.cityBranches = cached;
      }

      this.isLoadingBranches = true;
      this.branchService.getBranches({ city_id: this.targetCityId, limit: 500 }).subscribe({
        next: (res) => {
          this.isLoadingBranches = false;
          if (res.success && res.data) {
            const fetched: ScopeBranchItem[] = res.data.map((b) => ({
              id: b.id,
              city_id: b.city_id,
              name: b.name,
              slug: b.slug,
            }));
            this.cityBranches = fetched;

            // Merge into this.branches cache so other lookups have them
            const existingIds = new Set(this.branches.map((b) => Number(b.id)));
            const newBranches = fetched.filter((b) => !existingIds.has(Number(b.id)));
            if (newBranches.length > 0) {
              this.branches = [...this.branches, ...newBranches];
            }
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoadingBranches = false;
          this.cdr.detectChanges();
        },
      });
    }

    this.updateAutoTitles();
  }

  onBranchChange(): void {
    this.targetClassId = null;

    // If source page had a class, auto-sync target class if it exists in class master
    const srcClassId = this.sourceClassId;
    if (this.targetBranchId !== null && srcClassId !== null) {
      const classExists = this.classes.some((cl) => Number(cl.id) === Number(srcClassId));
      if (classExists) {
        this.targetClassId = Number(srcClassId);
      }
    }

    this.updateAutoTitles();
  }

  onClassChange(): void {
    this.updateAutoTitles();
  }

  onTitleInput(): void {
    this.userEditedTitle = true;
  }

  onSeoTitleInput(): void {
    this.userEditedSeoTitle = true;
  }

  onSeoDescriptionInput(): void {
    this.userEditedSeoDescription = true;
  }

  private updateAutoTitles(): void {
    const city = this.cities.find((c) => Number(c.id) === Number(this.targetCityId));
    const branch = this.availableBranches.find((b) => Number(b.id) === Number(this.targetBranchId));
    const cls = this.classes.find((cl) => Number(cl.id) === Number(this.targetClassId));

    let autoTitle = '';
    let autoSeoTitle = '';
    let autoSeoDesc = '';

    if (city && branch && cls) {
      autoTitle = `${city.name} - ${branch.name} - ${cls.name}`;
      autoSeoTitle = `Narayana School ${branch.name} - ${cls.name}`;
      autoSeoDesc = `Admission information for ${cls.name} at Narayana School ${branch.name}, ${city.name}.`;
    } else if (city && branch) {
      autoTitle = `${city.name} - ${branch.name}`;
      autoSeoTitle = `Narayana School ${branch.name}`;
      autoSeoDesc = `Admission information for Narayana School at ${branch.name}, ${city.name}.`;
    } else if (city) {
      autoTitle = city.name;
      autoSeoTitle = `Narayana School ${city.name}`;
      autoSeoDesc = `Admission information for Narayana Schools in ${city.name}.`;
    }

    if (!this.userEditedTitle || !this.title) {
      this.title = autoTitle;
    }

    if (!this.userEditedSeoTitle || !this.seoTitle) {
      this.seoTitle = autoSeoTitle;
    }

    // Replace SEO description if user hasn't typed custom text,
    // or if the current description contains stale source text (like "kolkata" when target is "Bardhaman")
    const currentDescLower = (this.seoDescription || '').toLowerCase();
    const isSourceCityStale =
      city && currentDescLower.includes('kolkata') && city.name.toLowerCase() !== 'kolkata';

    if (!this.userEditedSeoDescription || !this.seoDescription || isSourceCityStale) {
      this.seoDescription = autoSeoDesc;
      if (isSourceCityStale) {
        this.userEditedSeoDescription = false;
      }
    }
  }

  get targetScopePath(): string {
    const city = this.cities.find((c) => Number(c.id) === Number(this.targetCityId));
    const branch = this.availableBranches.find((b) => Number(b.id) === Number(this.targetBranchId));
    const cls = this.classes.find((cl) => Number(cl.id) === Number(this.targetClassId));

    if (!city) return '';
    const parts = [city.slug];
    if (branch) parts.push(branch.slug);
    if (branch && cls) parts.push(cls.slug);
    return '/' + parts.filter(Boolean).join('/');
  }

  get isScopeCollision(): boolean {
    if (!this.targetCityId) return false;

    // Same as source page
    if (this.sourcePage) {
      const srcCity = Number(
        this.sourcePage.cityName
          ? this.cities.find((c) => c.name === this.sourcePage?.cityName)?.id
          : (this.sourcePage as DynamicPage).cityId ?? (this.sourcePage as SourcePageSummary).cityId
      );
      const srcBranch =
        (this.sourcePage as DynamicPage).branchId ?? (this.sourcePage as SourcePageSummary).branchId ?? null;
      const srcClass =
        (this.sourcePage as DynamicPage).classId ?? (this.sourcePage as SourcePageSummary).classId ?? null;

      if (
        srcCity === Number(this.targetCityId) &&
        (srcBranch === null ? null : Number(srcBranch)) ===
          (this.targetBranchId === null ? null : Number(this.targetBranchId)) &&
        (srcClass === null ? null : Number(srcClass)) ===
          (this.targetClassId === null ? null : Number(this.targetClassId))
      ) {
        return true;
      }
    }

    // Matches any existing page
    const match = this.existingPages.find((p) => {
      const pBranch = p.branchId === null ? null : Number(p.branchId);
      const pClass = p.classId === null ? null : Number(p.classId);
      const tBranch = this.targetBranchId === null ? null : Number(this.targetBranchId);
      const tClass = this.targetClassId === null ? null : Number(this.targetClassId);

      return (
        Number(p.cityId) === Number(this.targetCityId) &&
        pBranch === tBranch &&
        pClass === tClass
      );
    });

    return !!match;
  }

  get canSubmit(): boolean {
    return (
      !this.isCloning &&
      this.targetCityId !== null &&
      this.selectedSourceRevisionId !== null &&
      this.title.trim().length > 0 &&
      !this.isScopeCollision
    );
  }

  submitClone(): void {
    if (!this.canSubmit || !this.sourcePage) return;

    this.isCloning = true;
    this.errorMessage = '';

    const payload: ClonePageRequest = {
      source_revision_id: Number(this.selectedSourceRevisionId),
      city_id: Number(this.targetCityId),
      branch_id: this.targetBranchId !== null ? Number(this.targetBranchId) : null,
      class_id: this.targetClassId !== null ? Number(this.targetClassId) : null,
      title: this.title.trim(),
      seo_title: (this.seoTitle || this.title).trim(),
      seo_description: (this.seoDescription || this.title).trim(),
      is_indexed: false,
      robots: 'noindex, nofollow',
    };

    this.dynamicPageService.clonePage(this.sourcePage.id, payload).subscribe({
      next: (res) => {
        this.isCloning = false;
        if (!res.success) {
          this.errorMessage = res.message || 'Failed to clone page.';
          this.cdr.detectChanges();
          return;
        }

        let newPageId: number | null = null;
        let newRevisionId: number | null = null;

        if (res.data && typeof res.data === 'object') {
          const d = res.data as Record<string, unknown>;
          const pageObj = (d['page'] as Record<string, unknown>) ?? d;
          newPageId = Number(pageObj['id'] ?? d['page_id'] ?? 0) || null;

          const revisionsArr = (d['revisions'] as Array<Record<string, unknown>>) ?? [];
          newRevisionId =
            Number(
              revisionsArr[0]?.['id'] ??
                d['revision_id'] ??
                d['draft_revision_id'] ??
                (d['revision'] as Record<string, unknown>)?.['id'] ??
                0
            ) || null;
        } else if (res.data !== undefined && res.data !== null) {
          newPageId = Number(res.data) || null;
        }

        if (newPageId) {
          if (newRevisionId) {
            this.dynamicPageService
              .updateDraftMetadata(newPageId, newRevisionId, {
                is_indexed: false,
                robots: 'noindex, nofollow',
              })
              .subscribe({
                next: () => {
                  this.cloned.emit({ pageId: newPageId!, revisionId: newRevisionId });
                  this.closeModal();
                },
                error: () => {
                  this.cloned.emit({ pageId: newPageId!, revisionId: newRevisionId });
                  this.closeModal();
                },
              });
          } else {
            this.cloned.emit({ pageId: newPageId, revisionId: newRevisionId });
            this.closeModal();
          }
        } else {
          this.errorMessage = 'Page cloned, but no new page ID was returned.';
          this.cdr.detectChanges();
        }
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.isCloning = false;
        this.errorMessage =
          err.error?.message || err.message || 'An error occurred while cloning the page.';
        this.cdr.detectChanges();
      },
    });
  }

  closeModal(): void {
    if (this.isCloning) return;
    this.close.emit();
  }
}
