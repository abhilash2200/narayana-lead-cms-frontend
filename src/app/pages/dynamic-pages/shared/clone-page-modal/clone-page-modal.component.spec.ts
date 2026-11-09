import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ClonePageModalComponent,
  ScopeCityItem,
  ScopeBranchItem,
  ScopeClassItem,
} from './clone-page-modal.component';
import { BranchService } from '../../../../services/branch.service';
import { DynamicPageService } from '../../../../services/dynamic-page.service';

describe('ClonePageModalComponent', () => {
  let component: ClonePageModalComponent;
  let fixture: ComponentFixture<ClonePageModalComponent>;
  let branchService: BranchService;
  let dynamicPageService: DynamicPageService;

  const mockCities: ScopeCityItem[] = [
    { id: 2, name: 'Kolkata', slug: 'kolkata' },
    { id: 6, name: 'Bardhaman', slug: 'bardhaman' },
  ];

  const mockInitialBranches: ScopeBranchItem[] = [
    { id: 1, city_id: 2, name: 'Saltlake', slug: 'saltlake' },
    { id: 13, city_id: 6, name: 'Andal', slug: 'andal' },
    { id: 14, city_id: 6, name: 'Asansol', slug: 'asansol' },
  ];

  const mockClasses: ScopeClassItem[] = [
    { id: 4, name: 'E-KIDZ-N (Nursery)', slug: 'e-kidz-n-nursery' },
    { id: 5, name: 'Class 1', slug: 'class-1' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClonePageModalComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ClonePageModalComponent);
    component = fixture.componentInstance;
    branchService = TestBed.inject(BranchService);
    dynamicPageService = TestBed.inject(DynamicPageService);

    component.cities = [...mockCities];
    component.branches = [...mockInitialBranches];
    component.classes = [...mockClasses];
  });

  it('should create the clone page modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch and sync all branches for a city when targetCityId changes', () => {
    const fullBardhamanBranches = [
      { id: 13, city_id: 6, name: 'Andal', slug: 'andal', status: 'ACTIVE' as const, sort_order: 1 },
      { id: 14, city_id: 6, name: 'Asansol', slug: 'asansol', status: 'ACTIVE' as const, sort_order: 2 },
      { id: 15, city_id: 6, name: 'Bardhaman', slug: 'bardhaman', status: 'ACTIVE' as const, sort_order: 3 },
      { id: 16, city_id: 6, name: 'Durgapur', slug: 'durgapur', status: 'ACTIVE' as const, sort_order: 4 },
    ];

    vi.spyOn(branchService, 'getBranches').mockReturnValue(
      of({ success: true, message: 'OK', data: fullBardhamanBranches })
    );

    component.targetCityId = 6;
    component.onCityChange();

    expect(branchService.getBranches).toHaveBeenCalledWith({ city_id: 6, limit: 500 });
    expect(component.availableBranches.length).toBe(4);
    expect(component.availableBranches.map((b) => b.name)).toEqual([
      'Andal',
      'Asansol',
      'Bardhaman',
      'Durgapur',
    ]);
  });

  it('should auto-sync title, seoTitle, and seoDescription when target city is selected', () => {
    vi.spyOn(branchService, 'getBranches').mockReturnValue(
      of({ success: true, message: 'OK', data: [] })
    );

    component.targetCityId = 6; // Bardhaman
    component.onCityChange();

    expect(component.title).toBe('Bardhaman');
    expect(component.seoTitle).toBe('Narayana School Bardhaman');
    expect(component.seoDescription).toBe('Admission information for Narayana Schools in Bardhaman.');
  });

  it('should overwrite stale source city description (e.g. kolkata test) when selecting Bardhaman', () => {
    vi.spyOn(branchService, 'getBranches').mockReturnValue(
      of({ success: true, message: 'OK', data: [] })
    );

    // Stale description from source page revision
    component.seoDescription = 'kolkata test';

    component.targetCityId = 6; // Bardhaman
    component.onCityChange();

    expect(component.seoDescription).toBe('Admission information for Narayana Schools in Bardhaman.');
  });

  it('should auto-sync class and generate full scope title and description when branch is chosen', () => {
    component.sourcePage = {
      id: 59,
      title: 'Kolkata - saltlake - E-KIDZ-N (Nursery)',
      cityId: 2,
      branchId: 1,
      classId: 4, // Nursery
    };

    component.targetCityId = 6;
    component.cityBranches = [
      { id: 13, city_id: 6, name: 'Andal', slug: 'andal' },
    ];

    component.targetBranchId = 13;
    component.onBranchChange();

    // Source class 4 should be auto-selected
    expect(component.targetClassId).toBe(4);
    expect(component.title).toBe('Bardhaman - Andal - E-KIDZ-N (Nursery)');
    expect(component.seoTitle).toBe('Narayana School Andal - E-KIDZ-N (Nursery)');
    expect(component.seoDescription).toBe(
      'Admission information for E-KIDZ-N (Nursery) at Narayana School Andal, Bardhaman.'
    );
    expect(component.targetScopePath).toBe('/bardhaman/andal/e-kidz-n-nursery');
  });

  it('should preserve user custom input if manually edited', () => {
    component.title = 'Custom Page Title';
    component.onTitleInput();

    component.seoTitle = 'Custom SEO Title';
    component.onSeoTitleInput();

    component.seoDescription = 'Custom SEO Description';
    component.onSeoDescriptionInput();

    component.targetCityId = 6;
    component.onCityChange();

    expect(component.title).toBe('Custom Page Title');
    expect(component.seoTitle).toBe('Custom SEO Title');
    expect(component.seoDescription).toBe('Custom SEO Description');
  });
});
