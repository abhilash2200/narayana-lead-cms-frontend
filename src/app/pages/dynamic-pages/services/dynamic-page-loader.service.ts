import { Injectable, inject } from '@angular/core';
import { DynamicPageCreationService } from './dynamic-page-creation.service';
import { MediaService } from '../../../services/media.service';
import { DynamicPageMediaHydrator } from './dynamic-page-media.hydrator';
import { populateSectionsFromBackend } from '../models/dynamic-page.deserializer';
import { PageRevision } from '../models/dynamic-page-builder.types';
import { PageBuilderSection } from '../../../services/dynamic-page.service';

export interface PageDataLoaderContext {
  pageTitle: string;
  seoTitle: string;
  seoDescription: string;
  isIndexed: boolean;
  pageType: string;
  pageStatus: 'ACTIVE' | 'INACTIVE';
  selectedCityId: number | null;
  selectedBranchId: number | null;
  selectedClassId: number | null;
  createdPageId: number | null;
  editingPageId: number | null;
  selectedRevisionId: number | null;
  pageCreated: boolean;
  revisions: PageRevision[];
  generateSlug(): void;
  cdrDetectChanges(): void;
  showToast(title: string, message: string, pageId?: number | null, type?: 'success' | 'error' | 'warning' | 'info'): void;
}

@Injectable({
  providedIn: 'root',
})
export class DynamicPageLoaderService {
  private readonly creationService = inject(DynamicPageCreationService);
  private readonly mediaService = inject(MediaService);
  private readonly mediaHydrator = inject(DynamicPageMediaHydrator);

  load(
    pageId: number,
    ctx: PageDataLoaderContext & any,
    onMediaDictionaryLoaded?: (media: unknown) => void
  ): void {
    ctx.isLoadingPageData = true;
    ctx.cdrDetectChanges();

    this.creationService.loadPageBuilderData(pageId).subscribe((res) => {
      ctx.isLoadingPageData = false;
      if (!res.success || !res.page) {
        ctx.showToast('Load Failed', res.message || 'Failed to load page builder data.', null, 'error');
        ctx.cdrDetectChanges();
        return;
      }

      const page = res.page;
      onMediaDictionaryLoaded?.(res.media);
      if (res.media && typeof res.media === 'object') {
        const rawMedia = res.media as Record<string, { id?: number | string; public_url?: string; url?: string }>;
        for (const [k, v] of Object.entries(rawMedia)) {
          if (v && typeof v === 'object') {
            const url = v.public_url || v.url;
            const mid = v.id ?? k;
            if (url && mid) this.mediaService.registerMedia(mid, url);
          }
        }
      }

      ctx.revisions = res.revisions ?? [];
      const draftRev = ctx.revisions.find((r: PageRevision) => r.status === 'DRAFT');
      const selectedRev = draftRev || ctx.revisions[0];

      const rawStatus = String(page.status ?? 'ACTIVE').toUpperCase();
      ctx.pageStatus = rawStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      ctx.createdPageId = page.id !== undefined ? Number(page.id) : ctx.createdPageId;
      ctx.editingPageId = ctx.createdPageId;
      ctx.pageCreated = true;

      ctx.selectedCityId = page.city_id != null ? Number(page.city_id) : null;
      ctx.selectedBranchId = page.branch_id != null ? Number(page.branch_id) : null;
      ctx.selectedClassId = page.class_id != null ? Number(page.class_id) : null;
      ctx.pageType = ctx.selectedClassId !== null ? 'City + Branch + Class' : (ctx.selectedBranchId !== null ? 'City + Branch' : 'City');

      ctx.generateSlug();
      this.applyRevision(
        selectedRev,
        Array.isArray(res.sections) && res.sections.length > 0 ? res.sections : null,
        ctx,
        res.media
      );
      ctx.cdrDetectChanges();
    });
  }

  applyRevision(
    rev: PageRevision | undefined,
    fallbackSections: PageBuilderSection[] | null | undefined,
    ctx: PageDataLoaderContext & any,
    mediaDictionary?: unknown
  ): void {
    if (!rev) return;
    if (rev.id !== undefined) ctx.selectedRevisionId = Number(rev.id);
    ctx.pageTitle = rev.title ?? ctx.pageTitle;
    ctx.seoTitle = rev.seo_title ?? ctx.seoTitle;
    ctx.seoDescription = rev.seo_description ?? ctx.seoDescription;

    const revUnknown = rev as unknown as Record<string, unknown>;
    if (revUnknown['is_indexed'] !== undefined && revUnknown['is_indexed'] !== null) {
      ctx.isIndexed = Boolean(revUnknown['is_indexed']);
    } else if (revUnknown['robots']) {
      ctx.isIndexed = !String(revUnknown['robots']).toLowerCase().includes('noindex');
    } else {
      ctx.isIndexed = false;
    }

    const sections = fallbackSections ?? (revUnknown?.['sections'] as PageBuilderSection[] | undefined);
    if (Array.isArray(sections) && sections.length > 0) {
      const mergedMedia = {
        ...(typeof mediaDictionary === 'object' && mediaDictionary ? (mediaDictionary as Record<string, unknown>) : {}),
        ...this.mediaService.getAllMedia(),
      };
      populateSectionsFromBackend(sections, ctx, mergedMedia);
      this.mediaHydrator.hydrateAllSectionsMedia(sections, ctx, () => ctx.cdrDetectChanges());
    }
  }
}
