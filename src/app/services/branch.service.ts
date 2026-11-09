import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { API_ENDPOINTS } from '../core/constants/api-endpoints';
import { ApiResponse } from '../core/models/api-response.model';

export interface Branch {
  id: number | string;
  city_id: number | string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number | string;
  created_by?: number | string;
  updated_by?: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface BranchPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  request_id?: string;
}

export type BranchResponse = ApiResponse<Branch[]>;

export interface BranchQueryParams {
  city_id?: number | string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateBranchRequest {
  city_id: number | string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number | string;
}

export type CreateBranchResponse = ApiResponse<Branch>;

export interface UpdateBranchRequest {
  city_id: number | string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number | string;
}

export type UpdateBranchResponse = ApiResponse<Branch>;
export type DeleteBranchResponse = ApiResponse<null>;

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private readonly api = inject(ApiService);

  /**
   * Fetch all branches, optionally filtered by city or pagination params
   */
  getBranches(params?: BranchQueryParams): Observable<BranchResponse> {
    return this.api.get<BranchResponse>(
      API_ENDPOINTS.BRANCHES.BASE,
      params as Record<string, unknown>
    );
  }

  /**
   * Fetch single branch by ID
   */
  getBranchById(id: number | string): Observable<CreateBranchResponse> {
    return this.api.get<CreateBranchResponse>(API_ENDPOINTS.BRANCHES.BY_ID(id));
  }

  /**
   * Create a new branch
   */
  createBranch(payload: CreateBranchRequest): Observable<CreateBranchResponse> {
    return this.api.post<CreateBranchResponse>(API_ENDPOINTS.BRANCHES.BASE, payload);
  }

  /**
   * Update branch by ID
   */
  updateBranch(id: number | string, payload: UpdateBranchRequest): Observable<UpdateBranchResponse> {
    return this.api.put<UpdateBranchResponse>(API_ENDPOINTS.BRANCHES.BY_ID(id), payload);
  }

  /**
   * Delete branch by ID
   */
  deleteBranch(id: number | string): Observable<DeleteBranchResponse> {
    return this.api.delete<DeleteBranchResponse>(API_ENDPOINTS.BRANCHES.BY_ID(id));
  }
}
