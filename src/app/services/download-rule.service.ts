import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../core/models/api-response.model';

export interface DownloadRuleItem {
  id?: string | number;
  intent: string;
  city_id?: number | null;
  branch_id?: number | null;
  class_id?: number | null;
  document_id?: number | null;
  redirect_url?: string | null;
  priority?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  [key: string]: unknown;
}

export interface CreateDownloadRulePayload {
  intent: string;
  city_id?: number | null;
  branch_id?: number | null;
  class_id?: number | null;
  document_id?: number | null;
  redirect_url?: string | null;
  priority?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class DownloadRuleService {
  private readonly http = inject(HttpClient);

  getRules(): Observable<ApiResponse<DownloadRuleItem[]>> {
    return this.http.get<ApiResponse<DownloadRuleItem[]>>('/api/v1/backend/download-rules');
  }

  createRule(payload: CreateDownloadRulePayload): Observable<ApiResponse<DownloadRuleItem>> {
    return this.http.post<ApiResponse<DownloadRuleItem>>('/api/v1/backend/download-rules', payload);
  }

  updateRule(id: string | number, payload: Partial<CreateDownloadRulePayload>): Observable<ApiResponse<DownloadRuleItem>> {
    return this.http.put<ApiResponse<DownloadRuleItem>>(`/api/v1/backend/download-rules/${id}`, payload);
  }

  deleteRule(id: string | number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`/api/v1/backend/download-rules/${id}`);
  }
}
