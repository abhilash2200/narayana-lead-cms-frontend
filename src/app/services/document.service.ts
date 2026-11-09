import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../core/models/api-response.model';

export interface ManagedDocumentItem {
  id: string | number;
  name: string;
  original_name?: string;
  stored_name?: string;
  relative_path?: string;
  mime_type?: string;
  extension?: string;
  size_bytes?: string | number;
  checksum_sha256?: string;
  download_filename?: string;
  status?: string;
  uploaded_by?: string | number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  [key: string]: unknown;
}

export interface DocumentUploadResponseData {
  id?: number | string;
  document_id?: number | string;
  name?: string;
  download_filename?: string;
  original_filename?: string;
  file_path?: string;
  path?: string;
  file_size?: number;
  mime_type?: string;
  url?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface UpdateDocumentPayload {
  name: string;
  download_filename?: string;
  status?: string;
}

export type DocumentUploadResponse = ApiResponse<DocumentUploadResponseData>;

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly http = inject(HttpClient);

  getDocuments(): Observable<ApiResponse<ManagedDocumentItem[]>> {
    return this.http.get<ApiResponse<ManagedDocumentItem[]>>('/api/v1/backend/documents');
  }

  uploadDocument(name: string, file: File, downloadFilename?: string): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('name', name.trim());
    if (downloadFilename && downloadFilename.trim()) {
      formData.append('download_filename', downloadFilename.trim());
    }
    formData.append('file', file, file.name);

    return this.http.post<DocumentUploadResponse>('/api/v1/backend/documents', formData);
  }

  updateDocument(
    id: string | number,
    payload: UpdateDocumentPayload,
  ): Observable<ApiResponse<ManagedDocumentItem>> {
    return this.http.put<ApiResponse<ManagedDocumentItem>>(
      `/api/v1/backend/documents/${id}`,
      payload,
    );
  }

  deleteDocument(id: string | number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`/api/v1/backend/documents/${id}`);
  }
}
