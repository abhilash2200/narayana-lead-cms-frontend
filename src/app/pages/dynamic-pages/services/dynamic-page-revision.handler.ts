import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, catchError, switchMap, map } from 'rxjs';
import {
  DynamicPageService,
  PageBuilderSection,
  DynamicPageStatus,
} from '../../../services/dynamic-page.service';
import { PageRevision } from '../models/dynamic-page-builder.types';

export interface SaveRevisionPayload {
  pageId: number;
  revisionId: number;
  title: string;
  seoTitle: string;
  seoDescription: string;
  isIndexed?: boolean;
  sections: PageBuilderSection[];
}

export interface HandlerResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class DynamicPageRevisionHandler {
  private readonly dynamicPageService = inject(DynamicPageService);

  /**
   * Save all sections together in one request as required by backend:
   * PUT /backend/pages/{pageId}/revisions/{revisionId}/sections
   * (Section Save API replaces the complete section list, so always send all sections).
   */
  saveAllSections(
    pageId: number,
    revisionId: number,
    sections: PageBuilderSection[]
  ): Observable<HandlerResult> {
    return this.dynamicPageService
      .savePageBuilderSections(pageId, revisionId, {
        sections,
      })
      .pipe(
        map((res) => ({
          success: res.success,
          message: res.message || 'All sections saved successfully.',
          data: res.data,
        })),
        catchError((err: { error?: { message?: string; details?: unknown; error?: { message?: string; details?: unknown } }; message?: string }) => {
          let errorMsg = err.error?.message || err.error?.error?.message || err.message || 'Failed to save page sections.';
          const rawDetails = err.error?.details || err.error?.error?.details;
          if (rawDetails && typeof rawDetails === 'object') {
            const detailEntries = Object.entries(rawDetails);
            if (detailEntries.length > 0) {
              const detailsFormatted = detailEntries
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
                .join('; ');
              errorMsg = `${errorMsg} (${detailsFormatted})`;
            }
          }
          return of({
            success: false,
            message: errorMsg,
          });
        })
      );
  }

  /**
   * Save a single section (delegates to saving all sections or single section)
   */
  saveSingleSection(
    pageId: number,
    revisionId: number,
    section: PageBuilderSection
  ): Observable<HandlerResult> {
    return this.dynamicPageService
      .savePageBuilderSections(pageId, revisionId, {
        sections: [section],
      })
      .pipe(
        map((res) => ({
          success: res.success,
          message: res.message || `${section.section_type} saved successfully.`,
          data: res.data,
        })),
        catchError((err: { error?: { message?: string; details?: unknown; error?: { message?: string; details?: unknown } }; message?: string }) => {
          let errorMsg = err.error?.message || err.error?.error?.message || err.message || `Failed to save ${section.section_type} section.`;
          const rawDetails = err.error?.details || err.error?.error?.details;
          if (rawDetails && typeof rawDetails === 'object') {
            const detailEntries = Object.entries(rawDetails);
            if (detailEntries.length > 0) {
              const detailsFormatted = detailEntries
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
                .join('; ');
              errorMsg = `${errorMsg} (${detailsFormatted})`;
            }
          }
          return of({
            success: false,
            message: errorMsg,
          });
        })
      );
  }

  /**
   * Update draft metadata and save all 12 sections together in one request
   */
  saveRevisionSections(
    payload: SaveRevisionPayload,
    onProgress?: (current: number, total: number, sectionType: string) => void
  ): Observable<HandlerResult> {
    if (onProgress) {
      onProgress(1, 1, 'ALL_SECTIONS');
    }

    return this.dynamicPageService
      .updateDraftMetadata(payload.pageId, payload.revisionId, {
        title: payload.title,
        seo_title: payload.seoTitle,
        seo_description: payload.seoDescription,
        is_indexed: payload.isIndexed ?? false,
        robots: (payload.isIndexed ?? false) ? 'index, follow' : 'noindex, nofollow',
      })
      .pipe(
        catchError(() => of({ success: true })),
        switchMap(() =>
          this.saveAllSections(
            payload.pageId,
            payload.revisionId,
            payload.sections
          )
        )
      );
  }

  /**
   * Create a new draft revision
   */
  createDraft(
    pageId: number,
    sourceRevision?: PageRevision | null
  ): Observable<HandlerResult> {
    const payload = sourceRevision
      ? {
          source_revision_id: Number(sourceRevision.id),
          title: sourceRevision.title,
          seo_title: sourceRevision.seo_title,
          seo_description: sourceRevision.seo_description,
        }
      : {};

    return this.dynamicPageService.createDraftRevision(pageId, payload).pipe(
      map((res) => ({
        success: res.success,
        message: res.message,
        data: res.data,
      })),
      catchError((err: { error?: { message?: string }; message?: string }) =>
        of({
          success: false,
          message: err.error?.message || err.message || 'Failed to create draft revision.',
        })
      )
    );
  }

  /**
   * Save all 12 sections and then publish the target draft revision
   */
  publishRevision(payload: SaveRevisionPayload): Observable<HandlerResult> {
    return this.saveAllSections(
      payload.pageId,
      payload.revisionId,
      payload.sections
    ).pipe(
      switchMap((saveRes) => {
        if (!saveRes.success) {
          return of(saveRes);
        }
        return this.dynamicPageService
          .publishDraftRevision(payload.pageId, payload.revisionId)
          .pipe(
            map((res) => ({
              success: res.success,
              message: res.message || 'Revision published successfully.',
              data: res.data,
            })),
            catchError((err: { error?: { message?: string; error?: { message?: string; details?: { missing_section_types?: string[] } } }; message?: string }) => {
              const missingTypes = err.error?.error?.details?.missing_section_types;
              let errMsg = err.error?.error?.message || err.error?.message || err.message || 'Failed to publish revision.';
              if (missingTypes && missingTypes.length > 0) {
                errMsg = `${errMsg} (Missing: ${missingTypes.join(', ')})`;
              }
              return of({
                success: false,
                message: errMsg,
              });
            })
          );
      })
    );
  }

  /**
   * Discard a draft revision
   */
  discardDraft(pageId: number, revisionId: number): Observable<HandlerResult> {
    return this.dynamicPageService.discardDraftRevision(pageId, revisionId).pipe(
      map((res) => ({
        success: res.success,
        message: res.message,
      })),
      catchError((err: { error?: { message?: string }; message?: string }) =>
        of({
          success: false,
          message: err.error?.message || err.message || 'Failed to discard draft revision.',
        })
      )
    );
  }

  /**
   * Update page active/inactive status
   */
  updatePageStatus(pageId: number, status: DynamicPageStatus): Observable<HandlerResult> {
    return this.dynamicPageService.updatePageStatus(pageId, status).pipe(
      map((res) => ({
        success: res.success,
        message: res.message,
        data: res.data,
      })),
      catchError((err: { error?: { message?: string }; message?: string }) =>
        of({
          success: false,
          message: err.error?.message || err.message || 'Failed to update page status.',
        })
      )
    );
  }

  /**
   * Update draft metadata only
   */
  updateMetadata(
    pageId: number,
    revisionId: number,
    title: string,
    seoTitle: string,
    seoDescription: string,
    isIndexed: boolean = false
  ): Observable<HandlerResult> {
    return this.dynamicPageService
      .updateDraftMetadata(pageId, revisionId, {
        source_revision_id: revisionId,
        title,
        seo_title: seoTitle,
        seo_description: seoDescription,
        is_indexed: isIndexed,
        robots: isIndexed ? 'index, follow' : 'noindex, nofollow',
      })
      .pipe(
        map((res) => ({
          success: res.success,
          message: res.message,
        })),
        catchError((err: { error?: { message?: string }; message?: string }) =>
          of({
            success: false,
            message: err.error?.message || err.message || 'Failed to update draft metadata.',
          })
        )
      );
  }

  /**
   * Unpublish a page
   */
  unpublishPage(pageId: number): Observable<HandlerResult> {
    return this.dynamicPageService.unpublishPage(pageId).pipe(
      map((res) => ({
        success: res.success,
        message: res.message,
        data: res.data,
      })),
      catchError((err: { error?: { message?: string }; message?: string }) =>
        of({
          success: false,
          message: err.error?.message || err.message || 'Failed to unpublish page.',
        })
      )
    );
  }
}
