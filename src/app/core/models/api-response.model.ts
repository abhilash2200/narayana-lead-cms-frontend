import { HttpHeaders, HttpParams } from '@angular/common/http';

/**
 * Standard backend API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta;
}

/**
 * Metadata in API responses (pagination, filters, counts, etc.)
 */
export type ApiMeta = Record<string, unknown>;

/**
 * Normalized API error format passed to consumers
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]> | string[];
  raw?: unknown;
}

/**
 * Optional configuration for ApiService HTTP calls
 */
export interface ApiRequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, unknown>;
  reportProgress?: boolean;
  withCredentials?: boolean;
}
