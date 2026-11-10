import { normalizeImageUrl } from '../dynamic-page.model';

export type MediaDictionary = Record<
  string,
  { id?: number | string; public_url?: string; url?: string }
>;

export function createMediaMap(rawMedia: unknown): MediaDictionary {
  const map: MediaDictionary = {};
  if (!rawMedia) return map;

  if (Array.isArray(rawMedia)) {
    for (const item of rawMedia) {
      if (item && item.id !== undefined && item.id !== null) {
        map[String(item.id)] = item;
      }
    }
  } else if (typeof rawMedia === 'object') {
    for (const [key, value] of Object.entries(rawMedia as Record<string, unknown>)) {
      if (value && typeof value === 'object') {
        const valObj = value as { id?: number | string; public_url?: string; url?: string };
        map[String(key)] = valObj;
        if (valObj.id !== undefined && valObj.id !== null) {
          map[String(valObj.id)] = valObj;
        }
      }
    }
  }
  return map;
}

export function resolveMediaUrl(
  mediaId: unknown,
  mediaMap: MediaDictionary | undefined,
  fallbackUrl?: string
): string {
  if (mediaId !== null && mediaId !== undefined && mediaMap) {
    const item = mediaMap[String(mediaId)];
    const resolved = item?.public_url || item?.url;
    if (resolved) {
      return normalizeImageUrl(resolved);
    }
  }
  return fallbackUrl ? normalizeImageUrl(fallbackUrl) : '';
}
