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
} from '../models/dynamic-page.model';
import { environment } from '../../../../environments/environment';
import { BranchService } from '../../../services/branch.service';
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
import { DynamicPageCreationService } from '../services/dynamic-page-creation.service';
import { DynamicPageWorkflowService } from '../services/dynamic-page-workflow.service';
import { DynamicPageOperationsService } from '../services/dynamic-page-operations.service';
import { DynamicPageLoaderService } from '../services/dynamic-page-loader.service';
import { DynamicPageAccordionManager } from '../services/dynamic-page-accordion.manager';
import {
  copyDynamicPageUrl,
  openDynamicPageUrl,
  buildPreviewUrl,
} from '../services/dynamic-page-navigation.helper';
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
  private readonly operationsService = inject(DynamicPageOperationsService);
  private readonly loaderService = inject(DynamicPageLoaderService);
  private readonly mediaHandler = inject(DynamicPageMediaHandler);
  private readonly branchService = inject(BranchService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly accordion = new DynamicPageAccordionManager();

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

  logos: LogoConfig[] = getDefaultLogos();
  banner = getDefaultBanner();
  sections: SectionConfig[] = getDefaultSections();
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

  get activeEditingSectionKey(): string { return this.accordion.activeEditingSectionKey; }
  set activeEditingSectionKey(val: string) { this.accordion.activeEditingSectionKey = val; }

  getActiveSectionTitle(): string { return this.accordion.getActiveSectionTitle(this.sections); }
  getActiveSectionsCount(): number { return this.accordion.getActiveSectionsCount(this.sections); }
  isSectionOpen(key: string): boolean { return this.accordion.isSectionOpen(key); }
  toggleSectionAccordion(key: string): void { this.accordion.toggleSectionAccordion(key); }
  setActiveEditingSection(key: string): void { this.accordion.setActiveEditingSection(key); }
  closeAllSections(): void { this.accordion.closeAllSections(); }
  expandFirstSection(): void { this.accordion.expandFirstSection(this.sections); }
  scrollToSection(key: string): void { this.accordion.scrollToSection(key); }
  getSectionNumber(key: string): string { return this.accordion.getSectionNumber(this.sections, key); }

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
      this.branchService.getBranches({ city_id: this.selectedCityId, per_page: 100, limit: 100 }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const fetched = res.data.map((b) => ({
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
    if (!this.canCreatePage || this.isCreatingPage || this.pageCreated) return;

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

    this.operationsService
      .createPageFromScope({
        city,
        branch,
        selectedClass,
        pageTitle: this.pageTitle,
        generatedSlug: this.generatedSlug,
        seoTitle: this.seoTitle,
        seoDescription: this.seoDescription,
        isIndexed: this.isIndexed,
      })
      .subscribe((res) => {
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
          if (res.revisionId) this.selectedRevisionId = res.revisionId;
          this.pageCreated = true;
          this.showToast('Page Created', `${this.pageTitle} created with Draft Revision #${res.revisionId ?? 1}.`, res.pageId, 'success');
          this.loadPageBuilderData();
        } else {
          this.pageCreated = true;
          this.cdr.detectChanges();
        }
      });
  }

  loadPageBuilderData(): void {
    if (!this.createdPageId) return;
    this.loaderService.load(this.createdPageId, this, (media) => {
      this.mediaDictionary = media;
    });
  }

  onRevisionChange(revId: number | string | null): void {
    if (revId == null) return;
    const rev = this.revisions.find((r) => Number(r.id) === Number(revId));
    this.loaderService.applyRevision(rev, null, this, this.mediaDictionary);
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

    this.operationsService.unpublish(this.editingPageId).subscribe((res) => {
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
    this.operationsService.toggleStatus(this.editingPageId, this.pageStatus).subscribe((res) => {
      if (!res.success) {
        this.showToast('Status Update Failed', res.message || 'Failed to update page status.', this.editingPageId, 'error');
        return;
      }
      this.pageStatus = this.pageStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      this.showToast('Page Status Updated', `${this.pageTitle} is now ${this.pageStatus === 'ACTIVE' ? 'Active' : 'Inactive'}.`, this.editingPageId, 'success');
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

    this.operationsService
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
    copyDynamicPageUrl(this.domainName, this.generatedSlug, (url) => {
      this.showToast('Copied to Clipboard', url, this.editingPageId, 'info');
    });
  }

  openPageUrl(): void {
    openDynamicPageUrl(this.domainName, this.generatedSlug);
  }

  previewDraft(): void {
    const pageId = this.editingPageId ?? this.createdPageId;
    const revisionId = this.selectedRevisionId;

    if (!pageId || !revisionId) {
      this.showToast('Preview Unavailable', 'Please save the page and select a draft revision first.', pageId ?? undefined, 'warning');
      return;
    }
    const previewUrl = buildPreviewUrl(pageId, revisionId);
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
      if (!isToggle) this.showToast('Notice', 'Please open a section to save.', null, 'warning');
      return;
    }
    this.workflowService.saveSection(this as any, sectionKey, isToggle);
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
