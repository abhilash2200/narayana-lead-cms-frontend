import { Injectable, inject } from '@angular/core';
import { PageBuilderSection } from '../../../services/dynamic-page.service';
import { MediaService } from '../../../services/media.service';
import { normalizeImageUrl } from '../models/dynamic-page.model';
import { populateSectionsFromBackend } from '../models/dynamic-page.deserializer';

@Injectable({
  providedIn: 'root',
})
export class DynamicPageMediaHydrator {
  private readonly mediaService = inject(MediaService);

  /**
   * Scans draft section contents for any media_ids not yet returned in page media map,
   * and fetches their public URLs from /backend/media/{id}
   */
  hydrateAllSectionsMedia(
    sections: PageBuilderSection[],
    targetState: any,
    onUpdated?: () => void
  ): void {
    const mediaIdsToFetch: number[] = [];
    const scan = (val: unknown) => {
      if (!val || typeof val !== 'object') return;
      if (Array.isArray(val)) {
        for (const item of val) scan(item);
        return;
      }
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (
          (k.toLowerCase().includes('media_id') || k.toLowerCase().includes('mediaid')) &&
          typeof v === 'number' &&
          Number.isInteger(v) &&
          v > 0
        ) {
          if (!this.mediaService.getMedia(v)) {
            mediaIdsToFetch.push(v);
          }
        } else if (typeof v === 'object') {
          scan(v);
        }
      }
    };

    for (const sec of sections) {
      scan(sec.content);
    }

    const uniqueIds = Array.from(new Set(mediaIdsToFetch));
    if (uniqueIds.length === 0) return;

    for (const id of uniqueIds) {
      this.mediaService.getMediaById(id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const d = res.data as Record<string, unknown>;
            const rawUrl = String(
              d['public_url'] ??
                d['url'] ??
                d['file_url'] ??
                d['path'] ??
                d['relative_path'] ??
                (d['media'] as Record<string, unknown>)?.['url'] ??
                (d['media'] as Record<string, unknown>)?.['public_url'] ??
                ''
            ).trim();
            if (rawUrl) {
              const url = normalizeImageUrl(rawUrl);
              this.mediaService.registerMedia(id, url);
              const merged = { ...this.mediaService.getAllMedia() };
              populateSectionsFromBackend(sections, targetState, merged);
              onUpdated?.();
            }
          }
        },
      });
    }
  }
}
