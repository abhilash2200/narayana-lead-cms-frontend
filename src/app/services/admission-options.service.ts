
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { API_ENDPOINTS } from '../core/constants/api-endpoints';



export type AdmissionOptionStatus = 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';

export interface CreateAdmissionOptionRequest {
  city_id: number;
  branch_id: number;
  board_code: string;
  board_name: string;
  reservation_code: string;
  reservation_name: string;
  class_id: number;
  status: AdmissionOptionStatus | string;
  sort_order: number;
}

export interface AdmissionOption {
  id: number | string;
  city_id: number;
  branch_id: number;
  board_code: string;
  board_name: string;
  reservation_code: string;
  reservation_name: string;
  class_id: number;
  status: AdmissionOptionStatus | string;
  sort_order: number;
  city_name?: string;
  branch_name?: string;
  class_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdmissionOptionsResponse {
  success: boolean;
  message: string;
  data: AdmissionOption[];
  meta: {
    request_id?: string;
  };
}

export interface SingleAdmissionOptionResponse {
  success: boolean;
  message: string;
  data: AdmissionOption;
  meta: {
    request_id?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdmissionOptionsService {
  private readonly api = inject(ApiService);

  getAdmissionOptions(): Observable<AdmissionOptionsResponse> {
    return this.api.get<AdmissionOptionsResponse>(
      API_ENDPOINTS.ADMISSION_OPTIONS.BASE
    );
  }

  createAdmissionOption(
    payload: CreateAdmissionOptionRequest
  ): Observable<AdmissionOptionsResponse> {
    return this.api.post<AdmissionOptionsResponse>(
      API_ENDPOINTS.ADMISSION_OPTIONS.BASE,
      payload
    );
  }

  updateAdmissionOption(
    id: number | string,
    payload: CreateAdmissionOptionRequest
  ): Observable<AdmissionOptionsResponse> {
    return this.api.put<AdmissionOptionsResponse>(
      API_ENDPOINTS.ADMISSION_OPTIONS.BY_ID(id),
      payload
    );
  }

  archiveAdmissionOption(
    id: number | string
  ): Observable<{
    success: boolean;
    message: string;
    data: unknown;
    meta?: Record<string, unknown>;
  }> {
    return this.api.delete<{
      success: boolean;
      message: string;
      data: unknown;
      meta?: Record<string, unknown>;
    }>(API_ENDPOINTS.ADMISSION_OPTIONS.BY_ID(id));
  }

  activateAdmissionOption(
    option: AdmissionOption
  ): Observable<AdmissionOptionsResponse> {
    const payload: CreateAdmissionOptionRequest = {
      city_id: Number(option.city_id),
      branch_id: Number(option.branch_id),
      board_code: option.board_code,
      board_name: option.board_name,
      reservation_code: option.reservation_code,
      reservation_name: option.reservation_name,
      class_id: Number(option.class_id),
      status: 'ACTIVE',
      sort_order: Number(option.sort_order),
    };
    return this.updateAdmissionOption(option.id, payload);
  }
}