import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { API_ENDPOINTS } from '../core/constants/api-endpoints';
import { ApiResponse } from '../core/models/api-response.model';
import { HttpClient } from '@angular/common/http';

export interface MediaUploadResponseData {
  id: number;
  media_id?: number;
  filename?: string;
  original_filename?: string;
  original_name?: string;
  stored_name?: string;
  mime_type?: string;
  file_size?: number;
  url?: string;
  public_url?: string;
  path?: string;
  relative_path?: string;
  [key: string]: unknown;
}

export type MediaUploadResponse = ApiResponse<MediaUploadResponseData>;

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  private readonly mediaCache = new Map<string, { id: number; public_url: string }>();

  /**
   * Register a known media item in the cache
   */
  registerMedia(id: number | string | null | undefined, publicUrl: string): void {
    if (id === null || id === undefined || !publicUrl) return;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) return;
    this.mediaCache.set(String(numericId), { id: numericId, public_url: publicUrl });
  }

  /**
   * Look up a media item in the cache
   */
  getMedia(id: number | string | null | undefined): { id: number; public_url: string } | undefined {
    if (id === null || id === undefined) return undefined;
    return this.mediaCache.get(String(id));
  }

  /**
   * Return a snapshot of all registered media
   */
  getAllMedia(): Record<string, { id: number; public_url: string }> {
    const obj: Record<string, { id: number; public_url: string }> = {};
    for (const [k, v] of this.mediaCache.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  /**
   * Upload an image/file to the backend media store
   * Endpoint: POST /backend/media
   */
  uploadMedia(file: File): Observable<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<MediaUploadResponse>(
      '/api/v1/backend/media',
      formData
    ).pipe(
      tap((res) => {
        if (res.success && res.data) {
          const mediaId = Number(res.data.media_id ?? res.data.id);
          const rawUrl = String(
            res.data.public_url ??
            res.data.url ??
            res.data['file_url'] ??
            res.data.relative_path ??
            res.data.path ??
            ''
          );
          if (Number.isInteger(mediaId) && mediaId > 0 && rawUrl) {
            this.registerMedia(mediaId, rawUrl);
          }
        }
      })
    );
  }

  /**
   * Delete an unreferenced media record by ID
   * Endpoint: DELETE /backend/media/{id}
   */
  deleteMedia(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(
      `/api/v1/backend/media/${id}`
    );
  }

  /**
   * Get media details by ID
   * Endpoint: GET /backend/media/{id}
   */
  getMediaById(id: number): Observable<ApiResponse<MediaUploadResponseData>> {
    return this.api.get<ApiResponse<MediaUploadResponseData>>(
      API_ENDPOINTS.MEDIA.BY_ID(id)
    );
  }
}

