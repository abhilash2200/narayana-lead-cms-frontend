import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DynamicPageRevisionHandler } from './dynamic-page-revision.handler';
import { DynamicPageCreationService, CreatePageResult } from './dynamic-page-creation.service';
import {
  CityOption,
  BranchOption,
  ClassOption,
} from '../models/dynamic-page-builder.types';
import { DynamicPageStatus } from '../../../services/dynamic-page.service';

@Injectable({
  providedIn: 'root',
})
export class DynamicPageOperationsService {
  private readonly revisionHandler = inject(DynamicPageRevisionHandler);
  private readonly creationService = inject(DynamicPageCreationService);

  createPageFromScope(options: {
    city: CityOption;
    branch?: BranchOption;
    selectedClass?: ClassOption;
    pageTitle: string;
    generatedSlug: string;
    seoTitle?: string;
    seoDescription?: string;
    isIndexed?: boolean;
  }): Observable<CreatePageResult> {
    const payload = this.creationService.buildCreatePagePayload(
      options.city,
      options.branch,
      options.selectedClass,
      options.pageTitle,
      options.generatedSlug,
      options.seoTitle,
      options.seoDescription,
      options.isIndexed
    );
    return this.creationService.createPage(payload);
  }

  unpublish(pageId: number) {
    return this.revisionHandler.unpublishPage(pageId);
  }

  toggleStatus(pageId: number, currentStatus: 'ACTIVE' | 'INACTIVE') {
    const nextStatus: DynamicPageStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.revisionHandler.updatePageStatus(pageId, nextStatus);
  }

  updateMetadata(
    pageId: number,
    revisionId: number,
    title: string,
    seoTitle: string,
    seoDescription: string,
    isIndexed: boolean
  ) {
    return this.revisionHandler.updateMetadata(
      pageId,
      revisionId,
      title,
      seoTitle,
      seoDescription,
      isIndexed
    );
  }
}
