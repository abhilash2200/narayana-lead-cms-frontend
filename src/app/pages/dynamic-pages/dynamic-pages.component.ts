import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';

import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';
import { PageListComponent } from './page-list/page-list.component';
import { ClonePageModalComponent } from './shared/clone-page-modal/clone-page-modal.component';
import { DynamicPage } from './models/dynamic-page.model';
import { BackendPageItem, DynamicPageService, PageQueryParams } from '../../services/dynamic-page.service';
import { City, CityService } from '../../services/city.service';
import { Branch, BranchService } from '../../services/branch.service';
import { ClassMaster, ClassService } from '../../services/class.service';
import { getDefaultPageConfiguration } from './models/dynamic-page.defaults';

import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-dynamic-pages',
  standalone: true,
  imports: [SidebarComponent, TopbarComponent, PageListComponent, ClonePageModalComponent],
  templateUrl: './dynamic-pages.component.html',
})
export class DynamicPagesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly dynamicPageService = inject(DynamicPageService);
  private readonly cityService = inject(CityService);
  private readonly branchService = inject(BranchService);
  private readonly classService = inject(ClassService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);

  createdPages: DynamicPage[] = [];
  cities: City[] = [];
  branches: Branch[] = [];
  classes: ClassMaster[] = [];

  isLoading = false;
  errorMessage = '';

  // Delete Page Modal State
  isDeleteModalOpen = false;
  deletingPage: DynamicPage | null = null;
  isDeleting = false;

  // Clone Page Modal State
  isCloneModalOpen = false;
  cloningPage: DynamicPage | null = null;

  ngOnInit(): void {
    this.loadAllData();
  }



  /**
   * Concurrently load all master entities (cities, branches, classes)
   * and dynamic pages using forkJoin to maximize speed and eliminate cascading latency.
   */
  loadAllData(params?: PageQueryParams): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    forkJoin({
      citiesRes: this.cityService.getCities().pipe(catchError(() => of({ success: false, data: [] as City[] }))),
      branchesRes: this.branchService.getBranches({ limit: 1000 }).pipe(catchError(() => of({ success: false, data: [] as Branch[] }))),
      classesRes: this.classService.getClasses().pipe(catchError(() => of({ success: false, data: [] as ClassMaster[] }))),
      pagesRes: this.dynamicPageService.getDynamicPages(params),
    }).subscribe({
      next: ({ citiesRes, branchesRes, classesRes, pagesRes }) => {
        this.isLoading = false;

        this.cities = citiesRes.data || [];
        this.branches = branchesRes.data || [];
        this.classes = classesRes.data || [];

        if (!pagesRes.success) {
          this.errorMessage = pagesRes.message || 'Unable to load dynamic pages.';
          this.cdr.detectChanges();
          return;
        }

        this.createdPages = (pagesRes.data || [])
          .filter((page) => String((page as unknown as Record<string, unknown>)['status'] || '').toUpperCase() !== 'ARCHIVED')
          .map((page) => this.mapApiPage(page));
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Unable to load dynamic pages. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Refreshes pages list with optional filter parameters
   */
  loadPagesWithFilter(params?: PageQueryParams): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.dynamicPageService.getDynamicPages(params).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (!response.success) {
          this.errorMessage = response.message || 'Unable to load pages.';
          this.cdr.detectChanges();
          return;
        }

        this.createdPages = (response.data || [])
          .filter((page) => String((page as unknown as Record<string, unknown>)['status'] || '').toUpperCase() !== 'ARCHIVED')
          .map((page) => this.mapApiPage(page));
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Unable to load dynamic pages. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Maps raw backend page response into strongly-typed DynamicPage model
   */
  private mapApiPage(page: BackendPageItem | DynamicPage): DynamicPage {
    const raw = page as unknown as Record<string, unknown>;
    const rawId = raw['id'] ?? (page as DynamicPage).id;
    const pageId = Number(rawId);

    const cityIdVal = raw['city_id'] ?? (page as DynamicPage).cityId;
    const branchIdVal = raw['branch_id'] !== undefined ? raw['branch_id'] : (page as DynamicPage).branchId;
    const classIdVal = raw['class_id'] !== undefined ? raw['class_id'] : (page as DynamicPage).classId;

    const cityId = Number(cityIdVal);
    const branchId = branchIdVal !== null && branchIdVal !== undefined && branchIdVal !== '' ? Number(branchIdVal) : null;
    const classId = classIdVal !== null && classIdVal !== undefined && classIdVal !== '' ? Number(classIdVal) : null;

    const cityName = String(raw['city_name'] ?? this.cities.find((c) => Number(c.id) === cityId)?.name ?? '');
    const branchName = raw['branch_name']
      ? String(raw['branch_name'])
      : (branchId !== null ? this.branches.find((b) => Number(b.id) === branchId)?.name ?? null : null);
    const className = raw['class_name']
      ? String(raw['class_name'])
      : (classId !== null ? this.classes.find((cl) => Number(cl.id) === classId)?.name ?? null : null);

    const canonicalPath = String(raw['canonical_path'] ?? (page as DynamicPage).slug ?? '');
    const scopeKey = String(raw['scope_key'] ?? `${cityId}:${branchId ?? 0}:${classId ?? 0}`);

    let title = String(raw['title'] ?? (page as DynamicPage).title ?? '').trim();
    if (!title) {
      if (branchName && className) {
        title = `${cityName} - ${branchName} - ${className}`;
      } else if (branchName) {
        title = `${cityName} - ${branchName}`;
      } else {
        title = cityName || canonicalPath;
      }
    }

    const rawStatus = String(raw['status'] ?? (page as DynamicPage).status ?? 'ACTIVE').toUpperCase();

    return {
      id: pageId,
      title,
      slug: canonicalPath,
      scopeKey,
      canonicalPath,
      cityId,
      cityName,
      branchId,
      branchName,
      classId,
      className,
      status: rawStatus === 'ACTIVE' ? 'Active' : 'Inactive',
      createdAt: String(raw['created_at'] ?? (page as DynamicPage).createdAt ?? new Date().toISOString()),
      updatedAt: String(raw['updated_at'] ?? (page as DynamicPage).updatedAt ?? new Date().toISOString()),
      pageConfiguration: (page as DynamicPage).pageConfiguration ?? getDefaultPageConfiguration(),
    };
  }

  startAddPage(): void {
    this.router.navigate(['/dynamic-pages/add']);
  }

  onEditPage(page: DynamicPage): void {
    this.router.navigate(['/dynamic-pages/edit', page.id]);
  }

  onDuplicatePage(page: DynamicPage): void {
    this.cloningPage = page;
    this.isCloneModalOpen = true;
  }

  onPageCloned(event: { pageId: number; revisionId?: number | null }): void {
    this.isCloneModalOpen = false;
    this.cloningPage = null;
    this.showToast(
      'Page Cloned Successfully',
      `New Page #${event.pageId} created with Version 1 Draft. Opening for review...`,
      event.pageId,
      'success'
    );
    this.router.navigate(['/dynamic-pages/edit', event.pageId]);
  }

  onDeletePage(page: DynamicPage): void {
    this.deletingPage = page;
    this.isDeleteModalOpen = true;
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.isDeleteModalOpen = false;
    this.deletingPage = null;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.deletingPage || !this.deletingPage.id) return;
    const pageId = Number(this.deletingPage.id);
    const title = this.deletingPage.title || `Page #${pageId}`;
    this.isDeleting = true;
    this.cdr.detectChanges();

    this.dynamicPageService.updatePageStatus(pageId, 'ARCHIVED').subscribe({
      next: (res) => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.deletingPage = null;

        if (res.success) {
          this.createdPages = this.createdPages.filter((p) => Number(p.id) !== pageId);
          this.toastService.success(`Page #${pageId} "${title}" deleted successfully.`);
          this.cdr.detectChanges();
        } else {
          this.toastService.error(res.message || 'Failed to delete page.');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isDeleting = false;
        this.toastService.error(err.error?.message || 'Failed to delete page. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  onPageStatusChange(event: {
    page: DynamicPage;
    status: 'ACTIVE' | 'INACTIVE';
  }): void {
    const pageId = Number(event.page.id);

    if (!pageId) {
      this.showToast('Invalid Request', 'Invalid page ID.', null, 'error');
      return;
    }

    this.dynamicPageService
      .updatePageStatus(pageId, event.status)
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.showToast(
              'Status Update Failed',
              response.message || 'Page status update failed.',
              pageId,
              'error',
            );
            return;
          }

          event.page.status = event.status === 'ACTIVE' ? 'Active' : 'Inactive';

          this.showToast(
            'Status Updated Successfully',
            `${event.page.title} is now ${event.status === 'ACTIVE' ? 'Active' : 'Inactive'}. ${event.status === 'INACTIVE' ? 'Inactive page becomes publicly unavailable.' : ''}`,
            pageId,
            'success',
          );

          // Refresh page list
          this.loadAllData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.showToast(
            'Status Update Error',
            error.error?.message || 'Unable to update page status. Please try again.',
            pageId,
            'error',
          );
        },
      });
  }

  showToast(
    title: string,
    message: string,
    pageId: number | null,
    type: 'success' | 'warning' | 'error' = 'success',
  ): void {
    if (type === 'success') {
      this.toastService.success(message, title);
    } else if (type === 'warning') {
      this.toastService.warning(message, title);
    } else {
      this.toastService.error(message, title);
    }
  }
}