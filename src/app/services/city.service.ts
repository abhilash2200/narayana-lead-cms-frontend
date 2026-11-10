import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay, tap } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { API_ENDPOINTS } from '../core/constants/api-endpoints';
import { ApiResponse } from '../core/models/api-response.model';

export interface City {
  id: number | string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number | string;
  created_by?: number | string;
  updated_by?: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface CityPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  request_id?: string;
}

export type CityResponse = ApiResponse<City[]>;

export interface CityQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateCityRequest {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number | string;
}

export type CreateCityResponse = ApiResponse<City>;

export interface UpdateCityRequest {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number | string;
}

export type UpdateCityResponse = ApiResponse<City>;
export type DeleteCityResponse = ApiResponse<null>;

@Injectable({
  providedIn: 'root',
})
export class CityService {
  private readonly api = inject(ApiService);
  private citiesCache = new Map<string, Observable<CityResponse>>();

  /**
   * Fetch all cities master records (cached in-memory per query signature)
   */
  getCities(params?: CityQueryParams): Observable<CityResponse> {
    const cacheKey = JSON.stringify(params || {});
    let cached$ = this.citiesCache.get(cacheKey);
    if (!cached$) {
      cached$ = this.api.get<CityResponse>(
        API_ENDPOINTS.CITIES.BASE,
        params as Record<string, unknown>
      ).pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((err) => {
          this.citiesCache.delete(cacheKey);
          throw err;
        })
      );
      this.citiesCache.set(cacheKey, cached$);
    }
    return cached$;
  }

  /**
   * Manually invalidate all cached city queries
   */
  clearCache(): void {
    this.citiesCache.clear();
  }

  /**
   * Fetch single city by ID
   */
  getCityById(id: number | string): Observable<CreateCityResponse> {
    return this.api.get<CreateCityResponse>(API_ENDPOINTS.CITIES.BY_ID(id));
  }

  /**
   * Create a new city
   */
  createCity(payload: CreateCityRequest): Observable<CreateCityResponse> {
    return this.api.post<CreateCityResponse>(API_ENDPOINTS.CITIES.BASE, payload).pipe(
      tap(() => this.clearCache())
    );
  }

  /**
   * Update an existing city
   */
  updateCity(id: number | string, payload: UpdateCityRequest): Observable<UpdateCityResponse> {
    return this.api.put<UpdateCityResponse>(API_ENDPOINTS.CITIES.BY_ID(id), payload).pipe(
      tap(() => this.clearCache())
    );
  }

  /**
   * Delete a city by ID
   */
  deleteCity(id: number | string): Observable<DeleteCityResponse> {
    return this.api.delete<DeleteCityResponse>(API_ENDPOINTS.CITIES.BY_ID(id)).pipe(
      tap(() => this.clearCache())
    );
  }
}