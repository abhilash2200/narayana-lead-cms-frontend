import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiRequestOptions } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  /**
   * Resolves the complete URL for an endpoint path.
   * If endpoint starts with http:// or https://, it is used as-is.
   */
  resolveUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }
    if (endpoint.startsWith('/api/')) {
      return endpoint;
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  /**
   * Convert key-value object to HttpParams, filtering out null/undefined values.
   */
  buildParams(params?: HttpParams | Record<string, unknown>): HttpParams {
    if (!params) {
      return new HttpParams();
    }
    if (params instanceof HttpParams) {
      return params;
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((val) => {
            httpParams = httpParams.append(key, String(val));
          });
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    });

    return httpParams;
  }

  /**
   * HTTP GET
   */
  get<T>(endpoint: string, params?: Record<string, unknown>, options?: ApiRequestOptions): Observable<T> {
    const url = this.resolveUrl(endpoint);
    const httpParams = options?.params
      ? this.buildParams(options.params)
      : this.buildParams(params);

    return this.http.get<T>(url, {
      ...options,
      params: httpParams,
    });
  }

  /**
   * HTTP POST
   */
  post<T>(endpoint: string, body: unknown = {}, options?: ApiRequestOptions): Observable<T> {
    const url = this.resolveUrl(endpoint);
    const httpParams = options?.params ? this.buildParams(options.params) : undefined;

    return this.http.post<T>(url, body, {
      ...options,
      params: httpParams,
    });
  }

  /**
   * HTTP PUT
   */
  put<T>(endpoint: string, body: unknown = {}, options?: ApiRequestOptions): Observable<T> {
    const url = this.resolveUrl(endpoint);
    const httpParams = options?.params ? this.buildParams(options.params) : undefined;

    return this.http.put<T>(url, body, {
      ...options,
      params: httpParams,
    });
  }

  /**
   * HTTP PATCH
   */
  patch<T>(endpoint: string, body: unknown = {}, options?: ApiRequestOptions): Observable<T> {
    const url = this.resolveUrl(endpoint);
    const httpParams = options?.params ? this.buildParams(options.params) : undefined;

    return this.http.patch<T>(url, body, {
      ...options,
      params: httpParams,
    });
  }

  /**
   * HTTP DELETE
   */
  delete<T>(endpoint: string, params?: Record<string, unknown>, options?: ApiRequestOptions): Observable<T> {
    const url = this.resolveUrl(endpoint);
    const httpParams = options?.params
      ? this.buildParams(options.params)
      : this.buildParams(params);

    return this.http.delete<T>(url, {
      ...options,
      params: httpParams,
    });
  }

  /**
   * HTTP GET BLOB (for file/CSV downloads)
   */
  getBlob(endpoint: string, params?: Record<string, unknown>): Observable<Blob> {
    const url = this.resolveUrl(endpoint);
    const httpParams = this.buildParams(params);
    return this.http.get(url, {
      params: httpParams,
      responseType: 'blob',
    });
  }
}
