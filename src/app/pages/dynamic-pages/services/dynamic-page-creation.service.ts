import { Injectable, inject } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { City, CityService } from '../../../services/city.service';
import { Branch, BranchService } from '../../../services/branch.service';
import { ClassMaster, ClassService } from '../../../services/class.service';
import {
  CreateDynamicPageRequest,
  DynamicPageService,
  PageBuilderSection,
} from '../../../services/dynamic-page.service';
import {
  CityOption,
  BranchOption,
  ClassOption,
  PageRevision,
} from '../models/dynamic-page-builder.types';

export interface MasterDataResult {
  cities: CityOption[];
  branches: BranchOption[];
  classes: ClassOption[];
}

export interface CreatePageResult {
  success: boolean;
  pageId: number | null;
  revisionId: number | null;
  message?: string;
  isConflict?: boolean;
}

export interface PageBuilderDataResult {
  success: boolean;
  page?: {
    id?: number | string;
    city_id?: number | string | null;
    branch_id?: number | string | null;
    class_id?: number | string | null;
    title?: string;
    seo_title?: string;
    seo_description?: string;
    status?: string;
  };
  revisions?: PageRevision[];
  sections?: PageBuilderSection[];
  media?: unknown;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DynamicPageCreationService {
  private readonly cityService = inject(CityService);
  private readonly branchService = inject(BranchService);
  private readonly classService = inject(ClassService);
  private readonly dynamicPageService = inject(DynamicPageService);

  loadMasterData(): Observable<MasterDataResult> {
    return forkJoin({
      citiesRes: this.cityService.getCities().pipe(catchError(() => of({ success: false, data: [] as City[] }))),
      branchesRes: this.branchService.getBranches({ per_page: 100, limit: 100 }).pipe(catchError(() => of({ success: false, data: [] as Branch[] }))),
      classesRes: this.classService.getClasses().pipe(catchError(() => of({ success: false, data: [] as ClassMaster[] }))),
    }).pipe(
      map(({ citiesRes, branchesRes, classesRes }) => ({
        cities: (citiesRes.data || []).map((city) => ({
          id: Number(city.id),
          name: city.name,
          slug: city.slug,
        })),
        branches: (branchesRes.data || []).map((branch) => ({
          id: Number(branch.id),
          city_id: Number(branch.city_id),
          name: branch.name,
          slug: branch.slug,
        })),
        classes: (classesRes.data || []).map((item) => ({
          id: Number(item.id),
          name: item.name,
          slug: item.slug,
        })),
      }))
    );
  }

  computeSlug(
    city?: CityOption,
    branch?: BranchOption,
    selectedClass?: ClassOption
  ): string {
    if (!city) return '';
    if (!branch) return `/${city.slug}`;
    if (selectedClass) return `/${city.slug}/${branch.slug}/${selectedClass.slug}`;
    return `/${city.slug}/${branch.slug}`;
  }

  buildCreatePagePayload(
    city: CityOption,
    branch: BranchOption | undefined,
    selectedClass: ClassOption | undefined,
    pageTitle: string,
    generatedSlug: string,
    seoTitle?: string,
    seoDescription?: string,
    isIndexed: boolean = false
  ): CreateDynamicPageRequest {
    const cleanSlug = generatedSlug.startsWith('/') ? generatedSlug.substring(1) : generatedSlug;
    return {
      city_id: Number(city.id),
      branch_id: branch ? Number(branch.id) : null,
      class_id: selectedClass ? Number(selectedClass.id) : null,
      title: pageTitle,
      slug: cleanSlug,
      canonical_path: generatedSlug,
      status: 'ACTIVE',
      seo_title: seoTitle || pageTitle,
      seo_description: seoDescription || pageTitle,
      is_indexed: isIndexed,
      robots: isIndexed ? 'index, follow' : 'noindex, nofollow',
    };
  }


  createPage(payload: CreateDynamicPageRequest): Observable<CreatePageResult> {
    return this.dynamicPageService.createDynamicPage(payload).pipe(
      map((response) => {
        if (!response.success) {
          return {
            success: false,
            pageId: null,
            revisionId: null,
            message: response.message || 'Page creation failed.',
          };
        }

        let newPageId: number | null = null;
        let newRevisionId: number | null = null;

        if (response.data && typeof response.data === 'object') {
          const d = response.data as unknown as Record<string, unknown>;
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
        } else if (response.data !== undefined && response.data !== null) {
          newPageId = Number(response.data) || null;
        }

        return {
          success: true,
          pageId: newPageId,
          revisionId: newRevisionId,
          message: response.message,
        };
      }),
      catchError((error: { status?: number; error?: { message?: string } }) => {
        const isConflict = error.status === 409;
        const msg = isConflict
          ? 'This City / Branch / Class page already exists.'
          : (error.error?.message || 'Unable to create page. Please try again.');
        return of({
          success: false,
          pageId: null,
          revisionId: null,
          message: msg,
          isConflict,
        });
      })
    );
  }

  loadPageBuilderData(pageId: number): Observable<PageBuilderDataResult> {
    return this.dynamicPageService.getPageBuilderData(pageId).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          return {
            success: false,
            message: response.message || 'Failed to load page builder data.',
          };
        }

        const data = response.data as unknown as Record<string, unknown>;
        return {
          success: true,
          page: (data['page'] as PageBuilderDataResult['page']) ?? undefined,
          revisions: (data['revisions'] as PageRevision[]) ?? [],
          sections: (data['sections'] as PageBuilderSection[]) ?? [],
          media: data['media'] ?? null,
        };
      }),
      catchError((err: { error?: { message?: string }; message?: string }) =>
        of({
          success: false,
          message: err.error?.message || err.message || 'Failed to load page builder data.',
        })
      )
    );
  }
}
