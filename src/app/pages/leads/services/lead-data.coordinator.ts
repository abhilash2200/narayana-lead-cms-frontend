import { Injectable, inject } from '@angular/core';
import { Subject, Subscription, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs/operators';
import {
  LeadItem,
  LeadMeta,
  LeadQueryParams,
  LeadService,
} from '../../../services/lead.service';

export interface LeadFetchResult {
  success: boolean;
  leads: LeadItem[];
  meta: LeadMeta;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LeadDataCoordinator {
  private readonly leadService = inject(LeadService);

  private readonly pageCache = new Map<string, { leads: LeadItem[]; meta: LeadMeta }>();
  private readonly fetchTrigger$ = new Subject<LeadQueryParams>();
  private readonly searchSubject = new Subject<string>();
  private readonly excludeSearchSubject = new Subject<string>();
  private readonly exactDuplicateSubject = new Subject<void>();
  private readonly dateSubject = new Subject<void>();

  private fetchSub?: Subscription;
  private searchSub?: Subscription;
  private excludeSub?: Subscription;
  private duplicateSub?: Subscription;
  private dateSub?: Subscription;

  init(callbacks: {
    onFetchStart: () => void;
    onFetchSuccess: (leads: LeadItem[], meta: LeadMeta, cacheKey: string) => void;
    onFetchError: (error: string) => void;
    onSearchChange: (term: string) => void;
    onExcludeSearchChange: (term: string) => void;
    onExactDuplicateChange: () => void;
    onDateChange: () => void;
  }): void {
    this.fetchSub = this.fetchTrigger$
      .pipe(
        switchMap((params) => {
          callbacks.onFetchStart();
          return this.leadService.getLeads(params as any).pipe(
            catchError((err) => {
              console.error('Fetch leads error:', err);
              return of({
                success: false,
                message: 'Failed to load leads from server.',
                data: [] as LeadItem[],
                meta: {} as LeadMeta,
              });
            })
          );
        })
      )
      .subscribe((res) => {
        if (res.success) {
          const leads = res.data || [];
          const meta = res.meta ?? {
            page: 1,
            per_page: 25,
            total: leads.length,
            filtered: leads.length,
            total_pages: 1,
          };
          callbacks.onFetchSuccess(leads, meta, JSON.stringify(this.currentParams));
        } else {
          callbacks.onFetchError(res.message || 'Unable to load leads.');
        }
      });

    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((t) => callbacks.onSearchChange(t));

    this.excludeSub = this.excludeSearchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((t) => callbacks.onExcludeSearchChange(t));

    this.duplicateSub = this.exactDuplicateSubject
      .pipe(debounceTime(350))
      .subscribe(() => callbacks.onExactDuplicateChange());

    this.dateSub = this.dateSubject
      .pipe(debounceTime(400))
      .subscribe(() => callbacks.onDateChange());
  }

  private currentParams: LeadQueryParams | null = null;

  triggerFetch(params: LeadQueryParams): void {
    this.currentParams = params;
    this.fetchTrigger$.next(params);
  }

  dispatchSearch(term: string): void { this.searchSubject.next(term); }
  dispatchExcludeSearch(term: string): void { this.excludeSearchSubject.next(term); }
  dispatchExactDuplicate(): void { this.exactDuplicateSubject.next(); }
  dispatchDate(): void { this.dateSubject.next(); }

  hasCache(key: string): boolean { return this.pageCache.has(key); }
  getCache(key: string): { leads: LeadItem[]; meta: LeadMeta } | undefined { return this.pageCache.get(key); }
  setCache(key: string, data: { leads: LeadItem[]; meta: LeadMeta }): void { this.pageCache.set(key, data); }
  clearCache(): void { this.pageCache.clear(); }

  destroy(): void {
    this.fetchSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.excludeSub?.unsubscribe();
    this.duplicateSub?.unsubscribe();
    this.dateSub?.unsubscribe();
  }
}
