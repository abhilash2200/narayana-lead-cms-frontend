import { environment } from '../../../../environments/environment';

export function copyDynamicPageUrl(
  domainName: string,
  generatedSlug: string,
  onCopied: (url: string) => void
): void {
  const fullUrl = `${domainName}${generatedSlug}`;
  navigator.clipboard?.writeText(fullUrl).then(() => {
    onCopied(fullUrl);
  });
}

export function openDynamicPageUrl(domainName: string, generatedSlug: string): void {
  const fullUrl = `${domainName}${generatedSlug}`;
  window.open(fullUrl, '_blank', 'noopener,noreferrer');
}

export function buildPreviewUrl(
  pageId: number,
  revisionId: number
): string {
  const token =
    localStorage.getItem(environment.tokenStorageKey) ??
    sessionStorage.getItem(environment.tokenStorageKey) ??
    '';

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const previewOrigin =
    environment.previewBaseUrl ||
    (isLocalhost ? 'http://localhost:3000' : environment.publicWebBaseUrl);

  return `${previewOrigin}/preview/${pageId}/${revisionId}${
    token ? `?token=${encodeURIComponent(token)}` : ''
  }`;
}
