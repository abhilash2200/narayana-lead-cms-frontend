import { Injectable, inject } from '@angular/core';
import { MediaService, MediaUploadResponse } from '../../../services/media.service';
import { normalizeImageUrl } from '../models/dynamic-page.model';

@Injectable({
  providedIn: 'root',
})
export class DynamicPageMediaHandler {
  private readonly mediaService = inject(MediaService);

  uploadMediaFile(
    file: File,
    onSuccess: (mediaId: number, url: string) => void,
    onError: (errorMessage: string) => void,
    onComplete?: () => void
  ): void {
    this.mediaService.uploadMedia(file).subscribe({
      next: (res: MediaUploadResponse) => {
        if (onComplete) onComplete();

        if (!res.success || !res.data) {
          onError(res.message || 'Image upload failed. Please try again.');
          return;
        }

        const d = res.data;
        const mediaId = Number(d.media_id ?? d.id);
        const rawImageUrl = String(
          d.public_url ??
          d.url ??
          d['file_url'] ??
          d.relative_path ??
          d.path ??
          ''
        );
        const imageUrl = normalizeImageUrl(rawImageUrl);

        if (!Number.isInteger(mediaId) || mediaId <= 0) {
          onError('Image uploaded, but invalid Media ID was returned.');
          return;
        }

        onSuccess(mediaId, imageUrl);
      },
      error: () => {
        if (onComplete) onComplete();
        onError('Failed to upload image. Please check network and file size.');
      },
    });
  }

  deleteMediaFile(
    mediaId: number,
    onSuccess: () => void,
    onError: (errorMessage: string) => void
  ): void {
    if (!Number.isInteger(mediaId) || mediaId <= 0) {
      onError('Invalid media ID.');
      return;
    }

    this.mediaService.deleteMedia(mediaId).subscribe({
      next: (res) => {
        if (res.success) {
          onSuccess();
        } else {
          onError(res.message || 'Failed to delete image.');
        }
      },
      error: () => {
        onError('Unable to delete image. It might be referenced by other sections.');
      },
    });
  }
}
