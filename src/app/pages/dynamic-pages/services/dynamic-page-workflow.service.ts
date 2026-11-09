import { Injectable, inject } from '@angular/core';
import { DynamicPageRevisionHandler } from './dynamic-page-revision.handler';
import { ToastService } from '../../../core/services/toast.service';
import { buildAll12Sections, buildSingleSection } from '../models/dynamic-page.serializer';
import {
  LogoConfig,
  SectionConfig,
} from '../models/dynamic-page.model';
import {
  PageRevision,
  ConfirmModalState,
} from '../models/dynamic-page-builder.types';
import { PageBuilderSection } from '../../../services/dynamic-page.service';

export interface WorkflowTarget {
  editingPageId: number | null;
  selectedRevisionId: number | null;
  selectedCityId: number | null;
  selectedBranchId: number | null;
  selectedClassId: number | null;
  revisions: PageRevision[];
  sections: SectionConfig[];
  logos: LogoConfig[];
  banner: unknown;
  classesConfig?: unknown;
  whyUs: unknown;
  course: unknown;
  rightSchool: unknown;
  academicResults: unknown;
  parentsSay: unknown;
  imageSection: unknown;
  facilities: unknown;
  faq: unknown;
  limitedSeatsConfig: unknown;
  pageTitle: string;
  seoTitle: string;
  seoDescription: string;
  isIndexed?: boolean;
  isSavingConfiguration: boolean;
  saveProgressText: string;
  isPublishing: boolean;
  isCreatingDraft: boolean;
  savingSectionKey: string | null;
  confirmModal: ConfirmModalState;
  showToast(title: string, message: string, pageId?: number | null, type?: 'success' | 'error' | 'warning' | 'info'): void;
  loadPageBuilderData(): void;
  cdrDetectChanges(): void;
}

@Injectable({
  providedIn: 'root',
})
export class DynamicPageWorkflowService {
  private readonly revisionHandler = inject(DynamicPageRevisionHandler);
  private readonly toastService = inject(ToastService);

  compile12Sections(ctx: WorkflowTarget): PageBuilderSection[] {
    return buildAll12Sections({
      logos: ctx.logos,
      banner: ctx.banner as any,
      classesConfig: ctx.classesConfig as any,
      whyUs: ctx.whyUs as any,
      course: ctx.course as any,
      rightSchool: ctx.rightSchool as any,
      academicResults: ctx.academicResults as any,
      parentsSay: ctx.parentsSay as any,
      imageSection: ctx.imageSection as any,
      facilities: ctx.facilities as any,
      faq: ctx.faq as any,
      limitedSeatsConfig: ctx.limitedSeatsConfig as any,
      sections: ctx.sections,
    });
  }

  savePageConfiguration(ctx: WorkflowTarget): void {
    if (ctx.editingPageId === null) {
      ctx.showToast('Validation Error', 'Please create the page first.', null, 'warning');
      return;
    }

    if (!ctx.selectedCityId) {
      ctx.showToast('Validation Error', 'Please select a city first.', null, 'warning');
      return;
    }

    if (ctx.selectedClassId && !ctx.selectedBranchId) {
      ctx.showToast('Validation Error', 'Please select a branch before selecting a class.', null, 'warning');
      return;
    }

    const hasEnabledSection = ctx.sections.some((s) => s.active);
    if (!hasEnabledSection) {
      ctx.showToast('Validation Error', 'At least one section must be enabled before saving.', null, 'warning');
      return;
    }

    const selectedRevision = ctx.revisions.find(
      (r) => Number(r.id) === ctx.selectedRevisionId
    );

    if (selectedRevision && selectedRevision.status !== 'DRAFT') {
      const existingDraft = ctx.revisions.find((r) => r.status === 'DRAFT');

      if (existingDraft) {
        ctx.confirmModal = {
          show: true,
          title: 'Switch to Draft Revision?',
          message: `Version ${selectedRevision.version_no} is ${selectedRevision.status} and cannot be edited directly. Switch to Draft Version ${existingDraft.version_no} to save your changes?`,
          confirmText: 'Switch & Save',
          cancelText: 'Cancel',
          danger: false,
          action: () => {
            ctx.confirmModal.show = false;
            ctx.selectedRevisionId = Number(existingDraft.id);
            ctx.cdrDetectChanges();
            this.performSaveSections(ctx, ctx.editingPageId!, Number(existingDraft.id));
          },
        };
        ctx.cdrDetectChanges();
        return;
      }

      ctx.confirmModal = {
        show: true,
        title: 'Create New Draft Revision?',
        message: `Version ${selectedRevision.version_no} is ${selectedRevision.status}. A new Draft revision must be created to make changes. Proceed to create a new Draft?`,
        confirmText: 'Create Draft & Save',
        cancelText: 'Cancel',
        danger: false,
        action: () => {
          ctx.confirmModal.show = false;
          ctx.isSavingConfiguration = true;
          ctx.cdrDetectChanges();
          this.revisionHandler
            .createDraft(ctx.editingPageId!, selectedRevision)
            .subscribe((res) => {
              if (!res.success) {
                ctx.isSavingConfiguration = false;
                ctx.showToast('Draft Error', res.message || 'Failed to create draft revision.', ctx.editingPageId, 'error');
                return;
              }
              const draftData = res.data as { revisions?: PageRevision[]; revision_id?: number; id?: number };
              const draftRev = draftData.revisions?.find((r) => r.status === 'DRAFT') || draftData.revisions?.[0];
              const newDraftId = Number(draftRev?.id || draftData.revision_id || draftData.id);

              if (newDraftId) {
                ctx.selectedRevisionId = newDraftId;
                this.performSaveSections(ctx, ctx.editingPageId!, newDraftId);
              } else {
                ctx.isSavingConfiguration = false;
                ctx.loadPageBuilderData();
              }
            });
        },
      };
      return;
    }

    if (!ctx.selectedRevisionId) {
      ctx.showToast('Validation Error', 'No draft revision selected.', null, 'warning');
      return;
    }

    this.performSaveSections(ctx, ctx.editingPageId, ctx.selectedRevisionId);
  }

  performSaveSections(ctx: WorkflowTarget, pageId: number, revisionId: number): void {
    ctx.isSavingConfiguration = true;
    ctx.saveProgressText = 'Preparing section updates...';
    const all12Sections = this.compile12Sections(ctx);

    this.revisionHandler
      .saveRevisionSections(
        {
          pageId,
          revisionId,
          title: ctx.pageTitle,
          seoTitle: ctx.seoTitle,
          seoDescription: ctx.seoDescription,
          isIndexed: ctx.isIndexed ?? false,
          sections: all12Sections,
        },
        (current, total, sectionType) => {
          ctx.saveProgressText = `Saving section ${current}/${total} (${sectionType})...`;
          ctx.cdrDetectChanges();
        }
      )
      .subscribe({
        next: (result) => {
          ctx.isSavingConfiguration = false;
          ctx.saveProgressText = '';
          if (!result.success) {
            ctx.showToast('Save Error', result.message || 'Failed to save page sections.', pageId, 'error');
            ctx.cdrDetectChanges();
            return;
          }

          ctx.showToast('Configuration Saved', 'All 12 sections saved to draft revision.', pageId, 'success');
          ctx.loadPageBuilderData();
        },
        error: () => {
          ctx.isSavingConfiguration = false;
          ctx.saveProgressText = '';
          ctx.showToast('Save Error', 'Failed to save page sections. Please check inputs.', pageId, 'error');
          ctx.cdrDetectChanges();
        },
      });
  }

  createDraftRevision(ctx: WorkflowTarget): void {
    if (ctx.editingPageId === null) {
      ctx.showToast('Validation Error', 'Page ID is missing.', null, 'warning');
      return;
    }

    const sourceRevision =
      ctx.revisions.find((r) => Number(r.id) === ctx.selectedRevisionId) ||
      ctx.revisions[0];

    ctx.isCreatingDraft = true;

    this.revisionHandler.createDraft(ctx.editingPageId, sourceRevision).subscribe({
      next: (res) => {
        ctx.isCreatingDraft = false;
        if (!res.success) {
          ctx.showToast('Draft Error', res.message || 'Failed to create draft revision.', ctx.editingPageId, 'error');
          return;
        }

        ctx.showToast('Draft Created', 'New draft revision created successfully.', ctx.editingPageId, 'success');
        ctx.loadPageBuilderData();
      },
      error: () => {
        ctx.isCreatingDraft = false;
        ctx.showToast('Draft Error', 'Failed to create draft revision.', ctx.editingPageId, 'error');
      },
    });
  }

  publishDraftRevision(ctx: WorkflowTarget): void {
    if (ctx.editingPageId === null || ctx.selectedRevisionId === null) {
      ctx.showToast('Notice', 'Please select a revision first.', null, 'warning');
      return;
    }

    const selectedRevision = ctx.revisions.find(
      (r) => Number(r.id) === ctx.selectedRevisionId
    );

    if (!selectedRevision) {
      ctx.showToast('Notice', 'Selected revision not found.', null, 'warning');
      return;
    }

    if (selectedRevision.status !== 'DRAFT') {
      ctx.showToast('Notice', `Only DRAFT revisions can be published (v${selectedRevision.version_no} is ${selectedRevision.status}).`, ctx.editingPageId, 'warning');
      return;
    }

    const hasEnabled = ctx.sections.some((s) => s.active);
    if (!hasEnabled) {
      ctx.showToast('Validation Error', 'At least one section must be enabled before publishing.', null, 'warning');
      return;
    }

    ctx.confirmModal = {
      show: true,
      title: 'Publish Version?',
      message: `Are you sure you want to publish Version ${selectedRevision.version_no}? This will make it live immediately on the public URL and archive any prior published version.`,
      confirmText: 'Publish Now',
      cancelText: 'Cancel',
      danger: false,
      action: () => {
        ctx.confirmModal.show = false;
        ctx.isPublishing = true;
        ctx.cdrDetectChanges();
        const all12Sections = this.compile12Sections(ctx);

        this.revisionHandler
          .publishRevision({
            pageId: ctx.editingPageId!,
            revisionId: Number(selectedRevision.id),
            title: ctx.pageTitle,
            seoTitle: ctx.seoTitle,
            seoDescription: ctx.seoDescription,
            isIndexed: ctx.isIndexed ?? false,
            sections: all12Sections,
          })
          .subscribe({
            next: (res) => {
              ctx.isPublishing = false;
              if (!res.success) {
                ctx.showToast('Publish Failed', res.message || 'Failed to publish revision.', ctx.editingPageId, 'error');
                ctx.cdrDetectChanges();
                return;
              }

              ctx.showToast('Published Successfully', `Version ${selectedRevision.version_no} is now live!`, ctx.editingPageId, 'success');
              ctx.loadPageBuilderData();
            },
            error: () => {
              ctx.isPublishing = false;
              ctx.showToast('Publish Error', 'Failed to publish revision. Please check all sections.', ctx.editingPageId, 'error');
              ctx.cdrDetectChanges();
            },
          });
      },
    };
    ctx.cdrDetectChanges();
  }

  discardDraftRevision(ctx: WorkflowTarget): void {
    if (ctx.editingPageId === null || ctx.selectedRevisionId === null) {
      ctx.showToast('Notice', 'Please select a revision first.', null, 'warning');
      return;
    }

    const selectedRevision = ctx.revisions.find(
      (r) => Number(r.id) === ctx.selectedRevisionId
    );

    if (!selectedRevision || selectedRevision.status !== 'DRAFT') {
      ctx.showToast('Notice', 'Only DRAFT revisions can be discarded.', null, 'warning');
      return;
    }

    ctx.confirmModal = {
      show: true,
      title: 'Discard Draft Revision?',
      message: `Are you sure you want to permanently discard Version ${selectedRevision.version_no}? Its configured sections will also be removed.`,
      confirmText: 'Discard Draft',
      cancelText: 'Cancel',
      danger: true,
      action: () => {
        ctx.confirmModal.show = false;
        ctx.cdrDetectChanges();
        this.revisionHandler
          .discardDraft(ctx.editingPageId!, Number(selectedRevision.id))
          .subscribe({
            next: (res) => {
              if (!res.success) {
                ctx.showToast('Discard Failed', res.message || 'Failed to discard draft revision.', ctx.editingPageId, 'error');
                ctx.cdrDetectChanges();
                return;
              }

              ctx.showToast('Draft Discarded', `Draft revision v${selectedRevision.version_no} was discarded.`, ctx.editingPageId, 'info');
              ctx.loadPageBuilderData();
            },
            error: () => {
              ctx.showToast('Discard Error', 'Failed to discard draft revision.', ctx.editingPageId, 'error');
              ctx.cdrDetectChanges();
            },
          });
      },
    };
    ctx.cdrDetectChanges();
  }

  saveSection(ctx: WorkflowTarget, sectionKey: string, isToggle = false): void {
    if (ctx.editingPageId === null) {
      if (!isToggle) {
        ctx.showToast('Notice', 'Please create the page first.', null, 'warning');
      }
      return;
    }

    if (!ctx.selectedRevisionId) {
      if (!isToggle) {
        ctx.showToast('Notice', 'Please select a revision first.', null, 'warning');
      }
      return;
    }

    const selectedRevision = ctx.revisions.find(
      (r) => Number(r.id) === ctx.selectedRevisionId
    );

    if (selectedRevision && selectedRevision.status !== 'DRAFT') {
      const existingDraft = ctx.revisions.find((r) => r.status === 'DRAFT');

      if (existingDraft) {
        ctx.confirmModal = {
          show: true,
          title: 'Switch to Draft Revision?',
          message: `Version ${selectedRevision.version_no} is ${selectedRevision.status} and cannot be edited directly. Switch to Draft Version ${existingDraft.version_no} to save changes?`,
          confirmText: 'Switch & Save',
          cancelText: 'Cancel',
          danger: false,
          action: () => {
            ctx.confirmModal.show = false;
            ctx.selectedRevisionId = Number(existingDraft.id);
            ctx.cdrDetectChanges();
            this.saveSection(ctx, sectionKey, isToggle);
          },
        };
        ctx.cdrDetectChanges();
        return;
      }

      ctx.confirmModal = {
        show: true,
        title: 'Create New Draft Revision?',
        message: `Version ${selectedRevision.version_no} is ${selectedRevision.status}. A new Draft revision must be created to make changes. Proceed to create a new Draft?`,
        confirmText: 'Create Draft & Save',
        cancelText: 'Cancel',
        danger: false,
        action: () => {
          ctx.confirmModal.show = false;
          ctx.savingSectionKey = sectionKey;
          ctx.cdrDetectChanges();
          this.revisionHandler
            .createDraft(ctx.editingPageId!, selectedRevision)
            .subscribe((res) => {
              if (!res.success) {
                ctx.savingSectionKey = null;
                ctx.showToast('Draft Error', res.message || 'Failed to create draft revision.', ctx.editingPageId, 'error');
                return;
              }
              const draftData = res.data as { revisions?: PageRevision[]; revision_id?: number; id?: number };
              const draftRev = draftData.revisions?.find((r) => r.status === 'DRAFT') || draftData.revisions?.[0];
              const newDraftId = Number(draftRev?.id || draftData.revision_id || draftData.id);

              if (newDraftId) {
                ctx.selectedRevisionId = newDraftId;
                this.saveSection(ctx, sectionKey, isToggle);
              } else {
                ctx.savingSectionKey = null;
                ctx.loadPageBuilderData();
              }
            });
        },
      };
      ctx.cdrDetectChanges();
      return;
    }

    const all12Sections = this.compile12Sections(ctx);
    const singleSection = buildSingleSection(sectionKey, {
      logos: ctx.logos,
      banner: ctx.banner as any,
      classesConfig: ctx.classesConfig as any,
      whyUs: ctx.whyUs as any,
      course: ctx.course as any,
      rightSchool: ctx.rightSchool as any,
      academicResults: ctx.academicResults as any,
      parentsSay: ctx.parentsSay as any,
      imageSection: ctx.imageSection as any,
      facilities: ctx.facilities as any,
      faq: ctx.faq as any,
      limitedSeatsConfig: ctx.limitedSeatsConfig as any,
      sections: ctx.sections,
    });

    ctx.savingSectionKey = sectionKey;

    this.revisionHandler
      .saveAllSections(ctx.editingPageId, ctx.selectedRevisionId, all12Sections)
      .subscribe({
        next: (result) => {
          ctx.savingSectionKey = null;
          if (!result.success) {
            ctx.showToast(
              'Section Save Error',
              result.message || `Failed to save ${singleSection?.section_type || sectionKey}.`,
              ctx.editingPageId,
              'error'
            );
          } else {
            const stateText = singleSection?.is_enabled ? 'Active' : 'Inactive';
            const typeName = singleSection?.section_type || sectionKey.toUpperCase();
            ctx.showToast(
              'Section Updated',
              isToggle
                ? `${typeName} section is now ${stateText}.`
                : `${typeName} section saved to draft. (Publish version to update live site)`,
              ctx.editingPageId,
              'success'
            );
            ctx.loadPageBuilderData();
          }
          ctx.cdrDetectChanges();
        },
        error: () => {
          ctx.savingSectionKey = null;
          ctx.showToast(
            'Section Save Error',
            `Failed to save ${singleSection?.section_type || sectionKey}.`,
            ctx.editingPageId,
            'error'
          );
          ctx.cdrDetectChanges();
        },
      });
  }
}
