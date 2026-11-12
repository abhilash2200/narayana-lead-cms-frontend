import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { API_ENDPOINTS } from '../core/constants/api-endpoints';
import { ApiResponse } from '../core/models/api-response.model';

export interface LeadModule {
  key: string;
  label: string;
  match: string;
  value: string;
}

export interface LeadItem {
  id: string | number;
  entrydate: string;
  name: string;
  parent_email: string;
  phone: string;
  otp_validation: string;
  duplicate_count?: number;
  phone_duplicate_count?: number;
  phone_occurrence_no?: number;
  is_phone_duplicate?: boolean;
  name_duplicate_count?: number;
  name_occurrence_no?: number;
  is_name_duplicate?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string | null;
  utm_term?: string | null;
  redirect_from?: string;
  page_section?: string;
  city?: string;
  branch?: string;
  board?: string;
  reservation_type?: string;
  class?: string;
  class_category?: string;
  stream?: string;
  course?: string;
}

export interface LeadMeta {
  page?: number;
  per_page?: number;
  total?: number;
  filtered?: number;
  total_pages?: number;
  request_id?: string;
}

export interface LeadFilterOptions {
  redirect_from?: string[];
  class_category?: string[];
  cities?: string[];
  city?: string[];
  branches?: string[];
  branch?: string[];
  boards?: string[];
  board?: string[];
  reservation_types?: string[];
  reservation_type?: string[];
  classes?: string[];
  class?: string[];
  utm_sources?: string[];
  utm_source?: string[];
  utm_mediums?: string[];
  utm_medium?: string[];
  utm_campaigns?: string[];
  utm_campaign?: string[];
  otp_validation?: string[];
  [key: string]: string[] | undefined;
}

export interface LeadFilterOptionsResponse {
  success: boolean;
  message?: string;
  data: LeadFilterOptions;
  meta?: {
    request_id?: string;
  };
}

export interface LeadQueryParams {
  module: string;
  page?: number;
  per_page?: number;
  search?: string;
  exclude_search?: string;
  name?: string;
  phone?: string;
  phone_mode?: 'all' | 'unique' | 'duplicates_only';
  name_mode?: 'all' | 'unique' | 'duplicates_only';
  date_from?: string;
  date_to?: string;
  redirect_from?: string;
  class_category?: string;
  otp_validation?: 'VALID' | 'INVALID' | string;
  city?: string;
  branch?: string;
  board?: string;
  reservation_type?: string;
  class?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  sort_by?: 'id' | 'entrydate' | 'name' | 'phone' | 'city' | 'branch' | 'class' | 'otp_validation' | 'utm_source' | string;
  sort_order?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface LeadModulesResponse {
  success: boolean;
  message: string;
  data: LeadModule[];
  meta?: {
    request_id?: string;
  };
}

export interface LeadListResponse {
  success: boolean;
  message: string;
  data: LeadItem[];
  meta: LeadMeta;
}

export interface LeadDetailResponse {
  success: boolean;
  message: string;
  data: LeadItem;
  meta?: {
    request_id?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LeadService {
  private readonly api = inject(ApiService);
  private modulesCache$?: Observable<LeadModulesResponse>;
  private filterOptionsCache = new Map<string, Observable<LeadFilterOptionsResponse>>();

  /**
   * Fetch all supported Lead List navigation modules (cached in-memory)
   * GET /api/v1/backend/leads/modules
   */
  getModules(): Observable<LeadModulesResponse> {
    if (!this.modulesCache$) {
      this.modulesCache$ = this.api.get<LeadModulesResponse>(API_ENDPOINTS.LEADS.MODULES).pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((err) => {
          this.modulesCache$ = undefined;
          throw err;
        })
      );
    }
    return this.modulesCache$;
  }

  /**
   * Invalidate modules cache
   */
  clearModulesCache(): void {
    this.modulesCache$ = undefined;
  }

  /**
   * Fetch distinct filter options for a module (cached per moduleKey)
   * GET /api/v1/backend/leads/filter-options?module={moduleKey}
   */
  getFilterOptions(module: string): Observable<LeadFilterOptionsResponse> {
    const cached$ = this.filterOptionsCache.get(module);
    if (cached$) {
      return cached$;
    }
    const request$ = this.api.get<LeadFilterOptionsResponse>(API_ENDPOINTS.LEADS.FILTER_OPTIONS, { module }).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((err) => {
        this.filterOptionsCache.delete(module);
        throw err;
      })
    );
    this.filterOptionsCache.set(module, request$);
    return request$;
  }

  /**
   * Invalidate filter options cache
   */
  clearFilterOptionsCache(module?: string): void {
    if (module) {
      this.filterOptionsCache.delete(module);
    } else {
      this.filterOptionsCache.clear();
    }
  }

  /**
   * Fetch leads for a specific module with filter/pagination parameters
   * GET /api/v1/backend/leads?module={moduleKey}&page=...&per_page=...
   */
  getLeads(params: LeadQueryParams): Observable<LeadListResponse> {
    return this.api.get<LeadListResponse>(API_ENDPOINTS.LEADS.BASE, params);
  }

  /**
   * Fetch single lead by ID for a module
   * GET /api/v1/backend/leads/{id}?module={moduleKey}
   */
  getLeadById(id: number | string, module: string): Observable<LeadDetailResponse> {
    return this.api.get<LeadDetailResponse>(API_ENDPOINTS.LEADS.BY_ID(id), { module });
  }

  /**
   * Export leads as CSV
   * GET /api/v1/backend/leads/export?module={moduleKey}&...
   */
  exportLeads(params: LeadQueryParams): Observable<Blob> {
    return this.api.getBlob(API_ENDPOINTS.LEADS.EXPORT, params);
  }
}
