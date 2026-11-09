import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'dynamic-pages',
    loadComponent: () =>
      import('./pages/dynamic-pages/dynamic-pages.component').then(
        (m) => m.DynamicPagesComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'dynamic-pages/add',
    loadComponent: () =>
      import('./pages/dynamic-pages/add-dynamic-page/add-dynamic-page.component').then(
        (m) => m.AddDynamicPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'dynamic-pages/edit/:id',
    loadComponent: () =>
      import('./pages/dynamic-pages/add-dynamic-page/add-dynamic-page.component').then(
        (m) => m.AddDynamicPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'dynamic-pages/preview/:id',
    loadComponent: () =>
      import('./pages/dynamic-page-preview/dynamic-page-preview.component').then(
        (m) => m.DynamicPagePreviewComponent,
      ),
  },
  {
    path: 'dynamic-pages/preview/:slug',
    loadComponent: () =>
      import('./pages/dynamic-page-preview/dynamic-page-preview.component').then(
        (m) => m.DynamicPagePreviewComponent,
      ),
  },
  {
    path: 'leads',
    loadComponent: () =>
      import('./pages/leads/leads.component').then((m) => m.LeadsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./pages/documents/documents.component').then(
        (m) => m.DocumentsComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'download-rules',
    loadComponent: () =>
      import('./pages/download-rules/download-rules.component').then(
        (m) => m.DownloadRulesComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'cities',
    loadComponent: () =>
      import('./pages/cities/city-list/city-list.component').then(
        (m) => m.CityListComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'cities/add',
    loadComponent: () =>
      import('./pages/cities/add-city/add-city.component').then((m) => m.AddCityComponent),
    canActivate: [authGuard],
  },
  {
    path: 'cities/edit/:id',
    loadComponent: () =>
      import('./pages/cities/edit-city/edit-city.component').then(
        (m) => m.EditCityComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'branches',
    loadComponent: () =>
      import('./pages/branches/branch-list/branch-list.component').then(
        (m) => m.BranchListComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'branches/add',
    loadComponent: () =>
      import('./pages/branches/add-branch/add-branch.component').then(
        (m) => m.AddBranchComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'branches/edit/:id',
    loadComponent: () =>
      import('./pages/branches/edit-branch/edit-branch.component').then(
        (m) => m.EditBranchComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admission-configuration',
    loadComponent: () =>
      import('./pages/admission-configuration/admission-configuration').then(
        (m) => m.AdmissionConfiguration,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admission-options',
    redirectTo: 'admission-configuration',
    pathMatch: 'full',
  },
  {
    path: 'classes',
    loadComponent: () =>
      import('./pages/classes/class-list/class-list.component').then(
        (m) => m.ClassListComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'classes/add',
    loadComponent: () =>
      import('./pages/classes/add-class/add-class.component').then(
        (m) => m.AddClassComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'classes/edit/:id',
    loadComponent: () =>
      import('./pages/classes/edit-class/edit-class.component').then(
        (m) => m.EditClassComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
