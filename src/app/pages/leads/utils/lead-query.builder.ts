import {
  BackendLeadFilters,
  DynamicFilterOptionGroup,
} from '../models/lead-filter.types';
import { LeadFilterOptions, LeadQueryParams } from '../../../services/lead.service';
import { FILTER_KEY_TO_PARAM_MAP } from '../models/lead-columns.config';

export const PREFERRED_FILTER_ORDER = [
  'otp_validation',
  'cities',
  'city',
  'branches',
  'branch',
  'classes',
  'class',
  'boards',
  'board',
  'class_category',
  'reservation_types',
  'reservation_type',
  'redirect_from',
  'utm_sources',
  'utm_source',
  'utm_mediums',
  'utm_medium',
  'utm_campaigns',
  'utm_campaign',
];

export function formatFilterLabel(key: string): string {
  if (key === 'otp_validation') return 'OTP Status';
  if (key === 'class_category') return 'Class Category';
  if (key === 'reservation_types' || key === 'reservation_type') return 'Reservation Type';
  if (key === 'redirect_from') return 'Redirect From';
  if (key.startsWith('utm_')) {
    const part = key.replace('utm_', '').replace(/s$/, '');
    return `UTM ${part.charAt(0).toUpperCase() + part.slice(1)}`;
  }
  return key
    .replace(/s$/, '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function buildAdvancedFilterGroups(
  filterOptions: LeadFilterOptions | null,
  primaryFilterKeys: Set<string>
): DynamicFilterOptionGroup[] {
  if (!filterOptions) return [];

  const groups: DynamicFilterOptionGroup[] = [];
  for (const [key, rawOptions] of Object.entries(filterOptions)) {
    if (primaryFilterKeys.has(key)) continue;
    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
      const validOptions = rawOptions
        .filter((opt): opt is string => typeof opt === 'string' && opt.trim().length > 0)
        .map((opt) => opt.trim());

      if (validOptions.length > 0) {
        groups.push({
          key,
          label: formatFilterLabel(key),
          options: validOptions,
        });
      }
    }
  }

  groups.sort((a, b) => {
    const idxA = PREFERRED_FILTER_ORDER.indexOf(a.key);
    const idxB = PREFERRED_FILTER_ORDER.indexOf(b.key);
    const posA = idxA === -1 ? 999 : idxA;
    const posB = idxB === -1 ? 999 : idxB;
    return posA - posB;
  });

  return groups;
}

export function constructLeadQueryParams(options: {
  selectedModuleKey: string;
  currentPage: number;
  perPage: number;
  phoneMode: string;
  nameMode?: string;
  searchTerm?: string;
  excludeSearchTerm?: string;
  exactName?: string;
  exactPhone?: string;
  dateFrom?: string;
  dateTo?: string;
  sortKey?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  backendFilters: BackendLeadFilters;
}): LeadQueryParams {
  const params: Record<string, unknown> = {
    module: options.selectedModuleKey,
    page: options.currentPage,
    per_page: options.perPage,
    phone_mode: options.phoneMode,
    name_mode: options.nameMode || 'all',
  };

  if (options.searchTerm?.trim()) params['search'] = options.searchTerm.trim();
  if (options.excludeSearchTerm?.trim()) params['exclude_search'] = options.excludeSearchTerm.trim();
  if (options.exactName?.trim()) params['name'] = options.exactName.trim();
  if (options.exactPhone?.trim()) params['phone'] = options.exactPhone.trim();
  if (options.dateFrom) params['date_from'] = options.dateFrom;
  if (options.dateTo) params['date_to'] = options.dateTo;
  if (options.sortKey) params['sort_by'] = options.sortKey;
  if (options.sortOrder) params['sort_order'] = options.sortOrder;

  for (const [key, val] of Object.entries(options.backendFilters)) {
    if (typeof val === 'string' && val.trim().length > 0) {
      const paramKey = FILTER_KEY_TO_PARAM_MAP[key] || key;
      params[paramKey] = val.trim();
    }
  }

  return params as LeadQueryParams;
}

export function computeActiveBackendFilterCount(
  backendFilters: BackendLeadFilters,
  exactName: string,
  exactPhone: string
): number {
  const filterCount = Object.values(backendFilters).filter(
    (v) => typeof v === 'string' && v.trim().length > 0
  ).length;
  return filterCount + (exactName.trim() ? 1 : 0) + (exactPhone.trim() ? 1 : 0);
}

export function computeActiveAdvancedFilterCount(
  backendFilters: BackendLeadFilters,
  primaryFilterKeys: Set<string>,
  exactName: string,
  exactPhone: string,
  excludeSearchTerm: string,
  excludeTest: boolean
): number {
  const backendCount = Object.entries(backendFilters).filter(
    ([k, v]) => !primaryFilterKeys.has(k) && typeof v === 'string' && v.trim().length > 0
  ).length;
  const exactNameCount = exactName.trim() ? 1 : 0;
  const exactPhoneCount = exactPhone.trim() ? 1 : 0;
  const excludeCount = excludeSearchTerm.trim() && !excludeTest ? 1 : 0;
  return backendCount + exactNameCount + exactPhoneCount + excludeCount;
}

export function computeHasActiveFilters(state: {
  searchTerm: string;
  excludeSearchTerm: string;
  excludeTest: boolean;
  exactName: string;
  exactPhone: string;
  phoneMode: string;
  nameMode?: string;
  dateFrom: string;
  dateTo: string;
  activeBackendFilterCount: number;
  sortKey: string | null;
  sortOrder: 'asc' | 'desc' | null;
}): boolean {
  return Boolean(
    state.searchTerm.trim() ||
    state.excludeSearchTerm.trim() ||
    state.excludeTest ||
    state.exactName.trim() ||
    state.exactPhone.trim() ||
    state.phoneMode !== 'all' ||
    (state.nameMode && state.nameMode !== 'all') ||
    state.dateFrom ||
    state.dateTo ||
    state.activeBackendFilterCount > 0 ||
    (state.sortKey && state.sortKey !== 'id') ||
    (state.sortOrder && state.sortOrder !== 'desc')
  );
}

export function cycleSortOrder(
  currentKey: string | null,
  currentOrder: 'asc' | 'desc' | null,
  newKey: string
): { key: string; order: 'asc' | 'desc' } {
  if (currentKey !== newKey) {
    return { key: newKey, order: newKey === 'entrydate' ? 'desc' : 'asc' };
  }
  if (currentOrder === 'asc') return { key: newKey, order: 'desc' };
  if (currentOrder === 'desc') return { key: newKey, order: 'asc' };
  return { key: newKey, order: 'desc' };
}
