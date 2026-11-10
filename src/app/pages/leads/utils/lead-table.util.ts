import { LeadItem } from '../../../services/lead.service';

export function computeDisplayedPages(currentPage: number, totalPages: number): number[] {
  const pages: number[] = [];
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);
  if (currentPage <= 3) end = Math.min(totalPages, 5);
  if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export function computeSerialNumber(page: number, perPage: number, index: number): number {
  return ((page - 1) * perPage) + index + 1;
}

export function extractCellValue(lead: LeadItem, key: string): string {
  const val = (lead as unknown as Record<string, unknown>)[key];
  return val !== null && val !== undefined && val !== '' ? String(val) : '—';
}

export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
