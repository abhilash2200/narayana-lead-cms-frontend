import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { API_ENDPOINTS } from '../core/constants/api-endpoints';
import { ApiResponse } from '../core/models/api-response.model';

export interface ClassMaster {
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

export interface ClassPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  request_id?: string;
}

export type ClassListResponse = ApiResponse<ClassMaster[]>;

export interface ClassQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateClassRequest {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number | string;
}

export interface UpdateClassRequest {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number | string;
}

export type CreateClassResponse = ApiResponse<ClassMaster>;
export type UpdateClassResponse = ApiResponse<ClassMaster>;
export type DeleteClassResponse = ApiResponse<null>;

@Injectable({
  providedIn: 'root',
})
export class ClassService {
  private readonly api = inject(ApiService);

  /**
   * Fetch all class records, optionally with search or pagination parameters
   */
  getClasses(params?: ClassQueryParams): Observable<ClassListResponse> {
    return this.api.get<ClassListResponse>(
      API_ENDPOINTS.CLASSES.BASE,
      params as Record<string, unknown>
    );
  }

  /**
   * Fetch single class by ID
   */
  getClassById(id: number | string): Observable<CreateClassResponse> {
    return this.api.get<CreateClassResponse>(API_ENDPOINTS.CLASSES.BY_ID(id));
  }

  /**
   * Create a new class
   */
  createClass(payload: CreateClassRequest): Observable<CreateClassResponse> {
    return this.api.post<CreateClassResponse>(API_ENDPOINTS.CLASSES.BASE, payload);
  }

  /**
   * Update class by ID
   */
  updateClass(id: number | string, payload: UpdateClassRequest): Observable<UpdateClassResponse> {
    return this.api.put<UpdateClassResponse>(API_ENDPOINTS.CLASSES.BY_ID(id), payload);
  }

  /**
   * Delete class by ID
   */
  deleteClass(id: number | string): Observable<DeleteClassResponse> {
    return this.api.delete<DeleteClassResponse>(API_ENDPOINTS.CLASSES.BY_ID(id));
  }
}