import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { HeaderSectionComponent } from '../sections/header/header-section.component';
import { BannerSectionComponent } from '../sections/banner/banner-section.component';
import { ClassesComponent, ClassesConfig } from '../sections/classes/classes.component';
import { WhyUs, WhyUsConfig } from '../sections/why-us/why-us';
import { FacilitiesComponent, FacilitiesConfig } from '../sections/facilities/facilities.component';
import { ImageSectionComponent, ImageSectionConfig } from '../sections/image-section/image-section.component';
import { ParentsSayComponent, ParentsSayConfig } from '../sections/parents-say/parents-say.component';
import { AcademicResultsComponent, AcademicResultsConfig } from '../sections/academic-results/academic-results.component';
import { RightSchoolComponent, RightSchoolConfig } from '../sections/right-school/right-school.component';
import { CourseComponent, CourseConfig } from '../sections/course/course.component';
import { FaqSectionComponent, FaqConfig } from '../sections/faq/faq-section.component';
import { LimitedSeatsComponent, LimitedSeatsConfig } from '../sections/limited-seats/limited-seats.component';
import { ClonePageModalComponent } from '../shared/clone-page-modal/clone-page-modal.component';
import { PageScopeFormComponent } from './page-scope-form/page-scope-form.component';
import { PageRevisionPanelComponent } from './page-revision-panel/page-revision-panel.component';

import {
  LogoConfig,
  SectionConfig,
  normalizeImageUrl,
} from '../models/dynamic-page.model';
import {
  CreateDynamicPageRequest,
  PageBuilderSection,
  DynamicPageStatus,
} from '../../../services/dynamic-page.service';
import { environment } from '../../../../environments/environment';
import { MediaService } from '../../../services/media.service';
import { BranchService } from '../../../services/branch.service';
import { populateSectionsFromBackend } from '../models/dynamic-page.deserializer';
import { resetSectionsToDefaults } from '../models/dynamic-page-snapshot.util';
import {
  getDefaultAcademicResults,
  getDefaultBanner,
  getDefaultClasses,
  getDefaultCourse,
  getDefaultFacilities,
  getDefaultFaq,
  getDefaultImageSection,
  getDefaultLimitedSeats,
  getDefaultLogos,
  getDefaultParentsSay,
  getDefaultRightSchool,
  getDefaultSections,
  getDefaultWhyUs,
} from '../models/dynamic-page.defaults';
import {
  CityOption,
  BranchOption,
  ClassOption,
  PageRevision,
  ConfirmModalState,
} from '../models/dynamic-page-builder.types';
import { DynamicPageMediaHandler } from '../services/dynamic-page-media.handler';
import { DynamicPageRevisionHandler } from '../services/dynamic-page-revision.handler';
import { DynamicPageCreationService } from '../services/dynamic-page-creation.service';
import { DynamicPageWorkflowService } from '../services/dynamic-page-workflow.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDeleteModalComponent } from '../../../components/confirm-delete-modal/confirm-delete-modal.component';

import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/topbar/topbar.component';

@Component({
  selector: 'app-add-dynamic-page',
  standalone: true,
  imports: [
    FormsModule,
    SidebarComponent,
    TopbarComponent,
    HeaderSectionComponent,
    BannerSectionComponent,
    ClassesComponent,
    WhyUs,
    FacilitiesComponent,
    ImageSectionComponent,
    ParentsSayComponent,
    AcademicResultsComponent,
    RightSchoolComponent,
    CourseComponent,
    FaqSectionComponent,
    LimitedSeatsComponent,
    ClonePageModalComponent,
    PageScopeFormComponent,
    PageRevisionPanelComponent,
    ConfirmDeleteModalComponent,
  ],
  templateUrl: './add-dynamic-page.component.html',
})
export class AddDynamicPageComponent implements OnInit {
  protected readonly Number = Number;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly creationService = inject(DynamicPageCreationService);
  private readonly workflowService = inject(DynamicPageWorkflowService);
  private readonly mediaHandler = inject(DynamicPageMediaHandler);
  private readonly revisionHandler = inject(DynamicPageRevisionHandler);
  private readonly mediaService = inject(MediaService);
  private readonly branchService = inject(BranchService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly domainName = environment.publicWebBaseUrl;

  selectedCityId: number | null = null;
  selectedBranchId: number | null = null;
  selectedClassId: number | null = null;

  generatedSlug = '';
  pageCreated = false;
  createdPageId: number | null = null;
  isCreatingPage = false;
  isSavingConfiguration = false;
  isPublishing = false;
  isCreatingDraft = false;
  isSavingMetadata = false;
  isLoadingPageData = false;

  pageTitle = '';
  seoTitle = '';
  seoDescription = '';
  isIndexed = false;
  pageType = '';
  editingPageId: number | null = null;
  pageStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';

  cities: CityOption[] = [];
  branches: BranchOption[] = [];
  classes: ClassOption[] = [];

  revisions: PageRevision[] = [];
  selectedRevisionId: number | null = null;
  private mediaDictionary: unknown = null;
  savingSectionKey: string | null = null;
  saveProgressText = '';
  showUnpublishModal = false;
  confirmModal: ConfirmModalState = {
    show: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    danger: false,
    action: () => {},
  };

  // Section Configurations
  logos: LogoConfig[] = getDefaultLogos();
  banner = getDefaultBanner();
  sections: SectionConfig[] = getDefaultSections();
  activeEditingSectionKey = '';
  classesConfig: ClassesConfig = getDefaultClasses();
  whyUs: WhyUsConfig = getDefaultWhyUs();
  course: CourseConfig = getDefaultCourse();
  rightSchool: RightSchoolConfig = getDefaultRightSchool();
  academicResults: AcademicResultsConfig = getDefaultAcademicResults();
  parentsSay: ParentsSayConfig = getDefaultParentsSay();
  imageSection: ImageSectionConfig = getDefaultImageSection();
  facilities: FacilitiesConfig = getDefaultFacilities();
  faq: FaqConfig = getDefaultFaq();
  limitedSeatsConfig: LimitedSeatsConfig = getDefaultLimitedSeats();

  getActiveSectionTitle(): string {
    return this.sections.find((s) => s.key === this.activeEditingSectionKey)?.title || '';
  }

  getActiveSectionsCount(): number {
    return this.sections.filter((s) => s.active).length;
  }

  isSectionOpen(key: string): boolean {
    return this.activeEditingSectionKey === key;
  }

  toggleSectionAccordion(key: string): void {
    if (this.activeEditingSectionKey === key) {
      // If already open, close it
      this.activeEditingSectionKey = '';
    } else {
      // Auto close any other open section and open this one
      this.activeEditingSectionKey = key;
      this.scrollToSection(key);
    }
  }

  setActiveEditingSection(key: string): void {
    if (this.activeEditingSectionKey === key) {
      this.activeEditingSectionKey = '';
    } else {
      this.activeEditingSectionKey = key;
      this.scrollToSection(key);
    }
  }

  closeAllSections(): void {
    this.activeEditingSectionKey = '';
  }

  expandFirstSection(): void {
    if (this.sections.length > 0) {
      this.activeEditingSectionKey = this.sections[0].key;
      this.scrollToSection(this.sections[0].key);
    }
  }

  scrollToSection(key: string): void {
    setTimeout(() => {
      const el = document.getElementById('section-accordion-' + key);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }

  saveActiveSection(): void {
    if (!this.activeEditingSectionKey) {
      this.showToast('Notice', 'Please open a section to save.', null, 'warning');
      return;
    }
    this.saveSection(this.activeEditingSectionKey);
  }

  get availableBranches(): BranchOption[] {
    return this.selectedCityId === null ? [] : this.branches.filter((b) => b.city_id === this.selectedCityId);
  }

  get canCreatePage(): boolean {
    return this.selectedCityId !== null;
  }

  ngOnInit(): void {
    this.loadMasterData();
  }

  private loadMasterData(): void {
    this.creationService.loadMasterData().subscribe({
      next: (data) => {
        this.cities = data.cities;
        this.branches = data.branches;
        this.classes = data.classes;
        this.cdr.detectChanges();
        this.handleRouteParams();
      },
      error: () => {
        this.showToast('Load Error', 'Failed to load master dropdown data.', null, 'error');
      },
    });
  }

  private handleRouteParams(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null) {
        this.resetAddPage();
        return;
      }

      const pageId = Number(id);
      if (Number.isNaN(pageId)) {
        this.showToast('Invalid URL', 'The specified page ID is invalid.', null, 'error');
        return;
      }

      this.editingPageId = pageId;
      this.createdPageId = pageId;
      this.loadPageBuilderData();
    });
  }

  onCityChange(): void {
    this.selectedBranchId = null;
    this.selectedClassId = null;

    if (this.selectedCityId !== null) {
      this.branchService.getBranches({ city_id: this.selectedCityId, limit: 500 }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const fetched: BranchOption[] = res.data.map((b) => ({
              id: Number(b.id),
              city_id: Number(b.city_id),
              name: b.name,
              slug: b.slug,
            }));
            const existingIds = new Set(this.branches.map((b) => Number(b.id)));
            const newBranches = fetched.filter((b) => !existingIds.has(Number(b.id)));
            if (newBranches.length > 0) {
              this.branches = [...this.branches, ...newBranches];
              this.cdr.detectChanges();
            }
          }
        },
        error: () => {},
      });
    }

    this.generateSlug();
  }

  onBranchChange(): void {
    this.selectedClassId = null;
    this.generateSlug();
  }

  onClassChange(): void {
    this.generateSlug();
  }

  generateSlug(): void {
    const city = this.cities.find((c) => c.id === this.selectedCityId);
    const branch = this.branches.find((b) => b.id === this.selectedBranchId);
    const selectedClass = this.classes.find((cl) => cl.id === this.selectedClassId);
    this.generatedSlug = this.creationService.computeSlug(city, branch, selectedClass);
  }

  createPage(): void {
    if (!this.canCreatePage || this.isCreatingPage || this.pageCreated) {
      return;
    }

    const city = this.cities.find((c) => c.id === this.selectedCityId);
    const branch = this.branches.find((b) => b.id === this.selectedBranchId);
    const selectedClass = this.classes.find((cl) => cl.id === this.selectedClassId);

    if (!city) {
      this.showToast('Validation Error', 'Please select a city first.', null, 'warning');
      return;
    }

    if (selectedClass && !branch) {
      this.showToast('Validation Error', 'Please select a branch before selecting a class.', null, 'warning');
      return;
    }

    this.isCreatingPage = true;
    this.generateSlug();

    if (branch && selectedClass) {
      this.pageTitle = `${city.name} - ${branch.name} - ${selectedClass.name}`;
      this.pageType = 'City + Branch + Class';
    } else if (branch) {
      this.pageTitle = `${city.name} - ${branch.name}`;
      this.pageType = 'City + Branch';
    } else {
      this.pageTitle = city.name;
      this.pageType = 'City';
    }

    const payload = this.creationService.buildCreatePagePayload(
      city,
      branch,
      selectedClass,
      this.pageTitle,
      this.generatedSlug,
      this.seoTitle,
      this.seoDescription,
      this.isIndexed
    );

    this.creationService.createPage(payload).subscribe((res) => {
      this.isCreatingPage = false;
      if (!res.success) {
        this.showToast(
          res.isConflict ? 'Creation Notice' : 'Page Creation Failed',
          res.message || 'Page creation failed.',
          null,
          res.isConflict ? 'warning' : 'error'
        );
        this.cdr.detectChanges();
        return;
      }

      if (res.pageId) {
        this.createdPageId = res.pageId;
        this.editingPageId = res.pageId;
        if (res.revisionId) {
          this.selectedRevisionId = res.revisionId;
        }
        this.pageCreated = true;
        this.showToast(
          'Page Created',
          `${this.pageTitle} created with Draft Revision #${res.revisionId ?? 1}.`,
          res.pageId,
          'success'
        );
        this.loadPageBuilderData();
      } else {
        this.pageCreated = true;
        this.cdr.detectChanges();
      }
    });
  }

  private loadPageBuilderData(): void {
    if (!this.createdPageId) return;

    this.isLoadingPageData = true;
    this.cdr.detectChanges();

    this.creationService.loadPageBuilderData(this.createdPageId).subscribe((res) => {
      this.isLoadingPageData = false;
      if (!res.success || !res.page) {
        this.showToast('Load Failed', res.message || 'Failed to load page builder data.', null, 'error');
        this.cdr.detectChanges();
        return;
      }

      const page = res.page;
      this.mediaDictionary = res.media;
      if (res.media && typeof res.media === 'object') {
        const rawMedia = res.media as Record<string, { id?: number | string; public_url?: string; url?: string }>;
        for (const [k, v] of Object.entries(rawMedia)) {
          if (v && typeof v === 'object') {
            const url = v.public_url || v.url;
            const mid = v.id ?? k;
            if (url && mid) {
              this.mediaService.registerMedia(mid, url);
            }
          }
        }
      }
      this.revisions = res.revisions ?? [];

      const draftRev = this.revisions.find((r) => r.status === 'DRAFT');
      const selectedRev = draftRev || this.revisions[0];

      const rawStatus = String(page.status ?? 'ACTIVE').toUpperCase();
      this.pageStatus = rawStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      this.createdPageId = page.id !== undefined ? Number(page.id) : this.createdPageId;
      this.editingPageId = this.createdPageId;
      this.pageCreated = true;

      this.selectedCityId = page.city_id != null ? Number(page.city_id) : null;
      this.selectedBranchId = page.branch_id != null ? Number(page.branch_id) : null;
      this.selectedClassId = page.class_id != null ? Number(page.class_id) : null;
      this.pageType = this.selectedClassId !== null ? 'City + Branch + Class' : (this.selectedBranchId !== null ? 'City + Branch' : 'City');

      this.generateSlug();
      this.applyRevisionData(selectedRev, Array.isArray(res.sections) && res.sections.length > 0 ? res.sections : null);
      this.cdr.detectChanges();
    });
  }

  private applyRevisionData(rev: PageRevision | undefined, fallbackSections?: PageBuilderSection[] | null): void {
    if (!rev) return;
    if (rev.id !== undefined) this.selectedRevisionId = Number(rev.id);
    this.pageTitle = rev.title ?? this.pageTitle;
    this.seoTitle = rev.seo_title ?? this.seoTitle;
    this.seoDescription = rev.seo_description ?? this.seoDescription;

    const revUnknown = rev as unknown as Record<string, unknown>;
    if (revUnknown['is_indexed'] !== undefined && revUnknown['is_indexed'] !== null) {
      this.isIndexed = Boolean(revUnknown['is_indexed']);
    } else if (revUnknown['robots']) {
      this.isIndexed = !String(revUnknown['robots']).toLowerCase().includes('noindex');
    } else {
      this.isIndexed = false;
    }
    const sections = fallbackSections ?? (revUnknown?.['sections'] as PageBuilderSection[] | undefined);
    if (Array.isArray(sections) && sections.length > 0) {
      const mergedMedia = {
        ...(typeof this.mediaDictionary === 'object' && this.mediaDictionary ? (this.mediaDictionary as Record<string, unknown>) : {}),
        ...this.mediaService.getAllMedia(),
      };
      populateSectionsFromBackend(sections, this, mergedMedia);
      this.hydrateAllSectionsMedia(sections);
    }
  }

  /**
   * Scans draft section contents for any media_ids not yet returned in page media map,
   * and fetches their public URLs from /backend/media/{id}
   */
  private hydrateAllSectionsMedia(sections: PageBuilderSection[]): void {
    const mediaIdsToFetch: number[] = [];
    const scan = (val: unknown) => {
      if (!val || typeof val !== 'object') return;
      if (Array.isArray(val)) {
        for (const item of val) scan(item);
        return;
      }
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (
          (k.toLowerCase().includes('media_id') || k.toLowerCase().includes('mediaid')) &&
          typeof v === 'number' &&
          Number.isInteger(v) &&
          v > 0
        ) {
          if (!this.mediaService.getMedia(v)) {
            mediaIdsToFetch.push(v);
          }
        } else if (typeof v === 'object') {
          scan(v);
        }
      }
    };

    for (const sec of sections) {
      scan(sec.content);
    }

    const uniqueIds = Array.from(new Set(mediaIdsToFetch));
    if (uniqueIds.length === 0) return;

    for (const id of uniqueIds) {
      this.mediaService.getMediaById(id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const d = res.data as Record<string, unknown>;
            const rawUrl = String(
              d['public_url'] ??
              d['url'] ??
              d['file_url'] ??
              d['path'] ??
              d['relative_path'] ??
              (d['media'] as Record<string, unknown>)?.['url'] ??
              (d['media'] as Record<string, unknown>)?.['public_url'] ??
              ''
            ).trim();
            if (rawUrl) {
              const url = normalizeImageUrl(rawUrl);
              this.mediaService.registerMedia(id, url);
              const merged = { ...this.mediaService.getAllMedia() };
              populateSectionsFromBackend(sections, this, merged);
              this.cdr.detectChanges();
            }
          }
        },
      });
    }
  }

  onRevisionChange(revId: number | string | null): void {
    if (revId == null) return;
    this.applyRevisionData(this.revisions.find((r) => Number(r.id) === Number(revId)));
    this.cdr.detectChanges();
  }

  cdrDetectChanges(): void {
    this.cdr.detectChanges();
  }

  savePageConfiguration(): void {
    this.workflowService.savePageConfiguration(this as any);
  }

  createDraftRevision(): void {
    this.workflowService.createDraftRevision(this as any);
  }

  isCloneModalOpen = false;

  openCloneModal(): void {
    this.isCloneModalOpen = true;
  }

  onPageCloned(event: { pageId: number; revisionId?: number | null }): void {
    this.isCloneModalOpen = false;
    this.showToast(
      'Page Cloned Successfully',
      `New Page #${event.pageId} created with Version 1 Draft. Opening for review...`,
      event.pageId,
      'success'
    );
    this.router.navigate(['/dynamic-pages/edit', event.pageId]);
  }

  isUnpublishing = false;

  get hasPublishedRevision(): boolean {
    return this.revisions.some((r) => r.status === 'PUBLISHED');
  }

  confirmUnpublishPage(): void {
    if (this.editingPageId) this.showUnpublishModal = true;
  }

  unpublishPage(): void {
    if (!this.editingPageId) return;

    this.isUnpublishing = true;
    this.cdr.detectChanges();

    this.revisionHandler.unpublishPage(this.editingPageId).subscribe((res) => {
      this.isUnpublishing = false;
      this.showUnpublishModal = false;
      if (!res.success) {
        this.showToast('Unpublish Failed', res.message || 'Failed to unpublish page.', this.editingPageId, 'error');
        this.cdr.detectChanges();
        return;
      }

      this.showToast('Page Unpublished', 'The published revision has been archived and cache invalidated.', this.editingPageId, 'success');
      this.loadPageBuilderData();
    });
  }

  publishDraftRevision(): void {
    this.workflowService.publishDraftRevision(this as any);
  }

  discardDraftRevision(): void {
    this.workflowService.discardDraftRevision(this as any);
  }

  togglePageStatus(): void {
    if (this.editingPageId === null) return;
    const nextStatus: DynamicPageStatus = this.pageStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    this.revisionHandler.updatePageStatus(this.editingPageId, nextStatus).subscribe((res) => {
      if (!res.success) {
        this.showToast('Status Update Failed', res.message || 'Failed to update page status.', this.editingPageId, 'error');
        return;
      }
      this.pageStatus = nextStatus;
      this.showToast('Page Status Updated', `${this.pageTitle} is now ${nextStatus === 'ACTIVE' ? 'Active' : 'Inactive'}.`, this.editingPageId, 'success');
      this.cdr.detectChanges();
    });
  }

  saveDraftMetadata(): void {
    if (this.editingPageId === null || this.selectedRevisionId === null) {
      this.showToast('Notice', 'Page ID or Revision ID is missing.', null, 'warning');
      return;
    }

    this.isSavingMetadata = true;
    this.cdr.detectChanges();

    this.revisionHandler
      .updateMetadata(this.editingPageId, this.selectedRevisionId, this.pageTitle, this.seoTitle, this.seoDescription, this.isIndexed)
      .subscribe((res) => {
        this.isSavingMetadata = false;
        if (!res.success) {
          this.showToast('Update Failed', res.message || 'Draft metadata update failed.', this.editingPageId, 'error');
          this.cdr.detectChanges();
          return;
        }
        this.showToast('Metadata Updated', 'Draft details updated successfully.', this.editingPageId, 'success');
        this.loadPageBuilderData();
      });
  }

  uploadLogoMedia = (file: File, onSuccess: (mediaId: number, url: string) => void): void => {
    this.mediaHandler.uploadMediaFile(
      file,
      (mediaId, url) => {
        onSuccess(mediaId, url);
        this.showToast('Image Uploaded', `Image saved (Media ID #${mediaId})`, null, 'success');
      },
      (errorMsg) => this.showToast('Upload Failed', errorMsg, null, 'error')
    );
  };

  copyPageUrl(): void {
    const fullUrl = `${this.domainName}${this.generatedSlug}`;
    navigator.clipboard?.writeText(fullUrl).then(() => {
      this.showToast('Copied to Clipboard', fullUrl, this.editingPageId, 'info');
    });
  }

  openPageUrl(): void {
    const fullUrl = `${this.domainName}${this.generatedSlug}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }

  previewDraft(): void {
    const pageId = this.editingPageId ?? this.createdPageId;
    const revisionId = this.selectedRevisionId;

    if (!pageId || !revisionId) {
      this.showToast(
        'Preview Unavailable',
        'Please save the page and select a draft revision first.',
        pageId ?? undefined,
        'warning'
      );
      return;
    }

    const token =
      localStorage.getItem(environment.tokenStorageKey) ??
      sessionStorage.getItem(environment.tokenStorageKey) ??
      '';

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    const previewOrigin =
      environment.previewBaseUrl ||
      (isLocalhost ? 'http://localhost:3000' : environment.publicWebBaseUrl);

    const previewUrl = `${previewOrigin}/preview/${pageId}/${revisionId}${
      token ? `?token=${encodeURIComponent(token)}` : ''
    }`;

    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  }

  resetAddPage(): void {
    this.editingPageId = null;
    this.createdPageId = null;
    this.selectedCityId = null;
    this.selectedBranchId = null;
    this.selectedClassId = null;

    this.generatedSlug = '';
    this.pageCreated = false;
    this.pageTitle = '';
    this.pageType = '';
    this.isCreatingPage = false;

    this.showUnpublishModal = false;

    resetSectionsToDefaults(this);
    this.cdr.detectChanges();
  }

  onLimitedSeatsChange(config: LimitedSeatsConfig): void {
    this.limitedSeatsConfig = config;
  }

  toggleSection(section: SectionConfig): void {
    section.active = !section.active;
    if (this.editingPageId && this.selectedRevisionId) {
      this.saveSection(section.key, true);
    }
  }

  saveSection(sectionKey: string, isToggle = false): void {
    if (!sectionKey) {
      if (!isToggle) {
        this.showToast('Notice', 'Please open a section to save.', null, 'warning');
      }
      return;
    }
    this.workflowService.saveSection(this as any, sectionKey, isToggle);
  }

  getSectionNumber(key: string): string {
    const index = this.sections.findIndex((s) => s.key === key);
    return String(index + 1).padStart(2, '0');
  }

  showToast(
    title: string,
    message: string,
    pageId: number | null = null,
    type: 'success' | 'error' | 'warning' | 'info' = 'success'
  ): void {
    const text = pageId ? `${title}: ${message} (ID #${pageId})` : `${title}: ${message}`;
    if (type === 'error') {
      this.toastService.error(text);
    } else if (type === 'warning') {
      this.toastService.warning(text);
    } else if (type === 'info') {
      this.toastService.info(text);
    } else {
      this.toastService.success(text);
    }
  }

  goBackToList(): void {
    this.router.navigate(['/dynamic-pages']);
  }
}
