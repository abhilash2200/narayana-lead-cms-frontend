import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../core/services/api.service';
import { API_ENDPOINTS } from '../core/constants/api-endpoints';
import { ApiResponse } from '../core/models/api-response.model';
import { DynamicPage } from '../pages/dynamic-pages/models/dynamic-page.model';

export interface BackendPageItem {
  id: string | number;
  city_id: string | number;
  branch_id: string | number | null;
  class_id: string | number | null;
  scope_key: string;
  canonical_path: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  created_by?: string | number;
  updated_by?: string | number;
  created_at?: string;
  updated_at?: string;
  city_name?: string;
  branch_name?: string | null;
  class_name?: string | null;
}

export interface PageQueryParams {
  city_id?: string | number;
  branch_id?: string | number;
  class_id?: string | number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type DynamicPagesResponse =
  ApiResponse<BackendPageItem[]>;

export interface CreateDynamicPageRequest {
  city_id: number;
  branch_id: number | null;
  class_id: number | null;
  title: string;
  slug?: string;
  canonical_path?: string;
  status?: string;
  seo_title: string;
  seo_description: string;
  is_indexed?: boolean;
  robots?: string;
}

export type DynamicPageStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ARCHIVED';

export interface UpdatePageStatusRequest {
  status: DynamicPageStatus;
}

export type UpdatePageStatusResponse = ApiResponse<CreatePageData | string | unknown>;

export interface PageRevisionItem {
  id: string | number;
  page_id: string | number;
  version_no: string | number;
  title: string;
  seo_title: string;
  seo_description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  published_at?: string | null;
  created_by?: string | number;
  updated_by?: string | number;
  created_at?: string;
  updated_at?: string;
  sections?: unknown[];
}

export interface CreatePageData {
  page: BackendPageItem;
  revisions: PageRevisionItem[];
  media: unknown[];
}

export type CreateDynamicPageResponse =
  ApiResponse<CreatePageData>;

export interface ClonePageRequest {
  source_revision_id: number;
  city_id: number;
  branch_id?: number | null;
  class_id?: number | null;
  title: string;
  seo_title?: string;
  seo_description?: string;
  is_indexed?: boolean;
  robots?: string;
}

export type ClonePageResponse = ApiResponse<CreatePageData | Record<string, unknown>>;

export type PageBuilderResponse =
  ApiResponse<unknown>;

/**
 * Create draft revision request
 */
export interface CreateDraftRevisionRequest {
  source_revision_id?: number | null;
  title?: string;
  seo_title?: string;
  seo_description?: string;
}

/**
 * Create draft revision response
 */
export interface CreateDraftRevisionResponse {
  success: boolean;
  message: string;
  data: unknown;
  meta: Record<string, unknown>;
}

export interface UpdateDraftMetadataRequest {
  source_revision_id?: number | null;
  title?: string;
  seo_title?: string;
  seo_description?: string;
  is_indexed?: boolean;
  robots?: string;
}

export interface UpdateDraftMetadataResponse {
  success: boolean;
  message: string;
  data: unknown;
  meta: Record<string, unknown>;
}

export interface PageBuilderSection {
  section_type:
    | 'HEADER'
    | 'BANNER'
    | 'CLASSES'
    | 'WHY_US'
    | 'COURSES'
    | 'RIGHT_SCHOOL'
    | 'ACADEMIC_RESULTS'
    | 'IMAGE_SECTION'
    | 'PARENTS_SAY'
    | 'FACILITIES'
    | 'FAQ'
    | 'LIMITED_SEATS'
    | string;
  is_enabled: boolean;
  sort_order: number;
  content: Record<string, unknown>;
}

export interface SavePageBuilderSectionsRequest {
  sections: PageBuilderSection[];
}

export interface SavePageBuilderSectionsResponse {
  success: boolean;
  message: string;
  data: unknown;
  meta: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class DynamicPageService {
  private readonly api = inject(ApiService);

  /**
   * Fetch list of dynamic landing pages, optionally filtered by scope or search
   */
  getDynamicPages(params?: PageQueryParams): Observable<DynamicPagesResponse> {
    return this.api.get<DynamicPagesResponse>(
      API_ENDPOINTS.PAGES.BASE,
      params as Record<string, unknown>
    );
  }

  /**
   * Create a new dynamic landing page
   */
  createDynamicPage(payload: CreateDynamicPageRequest): Observable<CreateDynamicPageResponse> {
    return this.api.post<CreateDynamicPageResponse>(API_ENDPOINTS.PAGES.BASE, payload);
  }

  /**
   * Fetch page builder configuration data by page ID
   */
  getPageBuilderData(pageId: number | string): Observable<PageBuilderResponse> {
    return this.api.get<PageBuilderResponse>(API_ENDPOINTS.PAGES.BY_ID(pageId));
  }

  /**
   * Update dynamic page status
   */
  updatePageStatus(pageId: number | string, status: DynamicPageStatus): Observable<UpdatePageStatusResponse> {
    const payload: UpdatePageStatusRequest = { status };
    return this.api.put<UpdatePageStatusResponse>(API_ENDPOINTS.PAGES.BY_ID(pageId), payload);
  }

  /**
   * Create a new draft revision
   */
  createDraftRevision(
    pageId: number,
    payload: CreateDraftRevisionRequest = {},
  ): Observable<CreateDraftRevisionResponse> {
    return this.api.post<CreateDraftRevisionResponse>(
      API_ENDPOINTS.PAGES.REVISIONS(pageId),
      payload,
    );
  }

  /**
   * Update draft metadata
   */
  updateDraftMetadata(
    pageId: number,
    revisionId: number,
    payload: UpdateDraftMetadataRequest,
  ): Observable<UpdateDraftMetadataResponse> {
    return this.api.put<UpdateDraftMetadataResponse>(
      API_ENDPOINTS.PAGES.REVISION_BY_ID(pageId, revisionId),
      payload,
    );
  }

  /**
   * Discard draft revision
   */
  discardDraftRevision(
    pageId: number,
    revisionId: number,
  ): Observable<UpdateDraftMetadataResponse> {
    return this.api.delete<UpdateDraftMetadataResponse>(
      API_ENDPOINTS.PAGES.REVISION_BY_ID(pageId, revisionId),
    );
  }

  /**
   * Publish draft revision
   */
  publishDraftRevision(
    pageId: number,
    revisionId: number,
  ): Observable<UpdateDraftMetadataResponse> {
    return this.api.post<UpdateDraftMetadataResponse>(
      API_ENDPOINTS.PAGES.PUBLISH_REVISION(pageId, revisionId),
      {},
    );
  }

  /**
   * Unpublish page
   */
  unpublishPage(pageId: number): Observable<ApiResponse<unknown>> {
    return this.api.post<ApiResponse<unknown>>(API_ENDPOINTS.PAGES.UNPUBLISH(pageId), {});
  }

  /**
   * Save page builder sections
   */
  savePageBuilderSections(
    pageId: number,
    revisionId: number,
    payload: SavePageBuilderSectionsRequest,
  ): Observable<SavePageBuilderSectionsResponse> {
    return this.api.put<SavePageBuilderSectionsResponse>(
      API_ENDPOINTS.PAGES.REVISION_SECTIONS(pageId, revisionId),
      payload,
    );
  }

  /**
   * Upload media file (delegates to POST /backend/media)
   */
  uploadMedia(file: File): Observable<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<ApiResponse<unknown>>(API_ENDPOINTS.MEDIA.BASE, formData);
  }

  /**
   * Clone a page and create version 1 Draft copying source revision and its sections
   */
  clonePage(
    pageId: number | string,
    payload: ClonePageRequest
  ): Observable<ClonePageResponse> {
    return this.api.post<ClonePageResponse>(
      API_ENDPOINTS.PAGES.CLONE(pageId),
      payload
    );
  }
}