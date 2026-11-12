import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LeadsComponent } from './leads.component';
import { LeadItem, LeadService } from '../../services/lead.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('LeadsComponent', () => {
  let component: LeadsComponent;
  let fixture: ComponentFixture<LeadsComponent>;
  let leadService: LeadService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadsComponent);
    component = fixture.componentInstance;
    leadService = TestBed.inject(LeadService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Backend Filter State & Dynamic Options', () => {
    it('should initialize with empty backendFilters', () => {
      expect(component.backendFilters.otp_validation).toBe('');
      expect(component.backendFilters.city).toBe('');
      expect(component.backendFilters.branch).toBe('');
      expect(component.backendFilters.class).toBe('');
      expect(component.backendFilters.board).toBe('');
      expect(component.backendFilters.utm_source).toBe('');
      expect(component.excludeSearchTerm).toBe('');
      expect(component.exactName).toBe('');
      expect(component.exactPhone).toBe('');
      expect(component.activeBackendFilterCount).toBe(0);
      expect(component.hasActiveFilters).toBe(false);
    });

    it('should correctly count active backend filters and reflect in hasActiveFilters', () => {
      component.backendFilters.city = 'Kolkata';
      component.backendFilters.otp_validation = 'VALID';
      expect(component.activeBackendFilterCount).toBe(2);
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should include exclude_search, exact name, and exact phone in buildParams', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      component.searchTerm = 'Animesh';
      component.excludeSearchTerm = 'test';
      component.exactName = 'Test Parent';
      component.exactPhone = '9876543210';
      component.backendFilters['cities'] = 'Kolkata'; // mapped to 'city'
      component.backendFilters['boards'] = 'CBSE'; // mapped to 'board'

      const params = (component as any).buildParams();
      expect(params['search']).toBe('Animesh');
      expect(params['exclude_search']).toBe('test');
      expect(params['name']).toBe('Test Parent');
      expect(params['phone']).toBe('9876543210');
      expect(params['phone_mode']).toBe('all');
      expect(params['name_mode']).toBe('all');
      expect(params['city']).toBe('Kolkata');
      expect(params['board']).toBe('CBSE');
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should reset backend filters on resetBackendFilters', () => {
      component.backendFilters.city = 'Kolkata';
      component.backendFilters.branch = 'Salt Lake';
      component.backendFilters.utm_campaign = 'admission_2026';
      expect(component.activeBackendFilterCount).toBe(3);

      component.resetBackendFilters();
      expect(component.activeBackendFilterCount).toBe(0);
      expect(component.backendFilters.city).toBe('');
      expect(component.backendFilters.branch).toBe('');
      expect(component.backendFilters.utm_campaign).toBe('');
    });

    it('should dynamically generate advancedFilterGroups for any additive backend filter keys', () => {
      component.filterOptions = {
        city: ['Kolkata', 'Howrah'],
        cities: ['Kolkata', 'Howrah'],
        board: ['CBSE', 'ICSE'],
        stream: ['Science', 'Commerce'], // newly added by backend
        academic_session: ['2026-27'], // newly added by backend
        empty_list: [], // should be excluded
      };

      const groups = component.advancedFilterGroups;
      const keys = groups.map((g) => g.key);

      expect(keys).toContain('city');
      expect(keys).toContain('cities');
      expect(keys).toContain('board');
      expect(keys).toContain('stream');
      expect(keys).toContain('academic_session');
      expect(keys).not.toContain('empty_list');

      // Check formatted labels
      const streamGroup = groups.find((g) => g.key === 'stream');
      expect(streamGroup?.label).toBe('Stream');
      expect(streamGroup?.options).toEqual(['Science', 'Commerce']);

      const sessionGroup = groups.find((g) => g.key === 'academic_session');
      expect(sessionGroup?.label).toBe('Academic Session');
    });

    it('should dynamically initialize and include new backend filters in buildParams', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      vi.spyOn(leadService, 'getFilterOptions').mockReturnValue(
        of({
          success: true,
          data: {
            board: ['CBSE'],
            stream: ['Science'],
          },
        })
      );

      component.loadFilterOptions();
      expect('stream' in component.backendFilters).toBe(true);

      // Set value for new filter
      component.backendFilters['stream'] = 'Science';
      expect(component.activeAdvancedFilterCount).toBe(1);

      const params = (component as any).buildParams();
      expect(params['stream']).toBe('Science');

      // Reset advanced filters
      component.resetAdvancedFilters();
      expect(component.backendFilters['stream']).toBe('');
      expect(component.activeAdvancedFilterCount).toBe(0);
    });

    it('should toggle more filters panel', () => {
      expect(component.showMoreFilters).toBe(false);
      component.toggleMoreFilters();
      expect(component.showMoreFilters).toBe(true);
      component.toggleMoreFilters();
      expect(component.showMoreFilters).toBe(false);
    });

    it('should reset all search, exclude search, exact duplicate, date and backend filters on resetFilters', () => {
      component.searchTerm = 'John';
      component.excludeSearchTerm = 'test';
      component.exactName = 'John Doe';
      component.exactPhone = '9876543210';
      component.dateFrom = '2026-03-01';
      component.dateTo = '2026-03-05';
      component.backendFilters.city = 'Kolkata';
      component.sortKey = 'name';
      component.sortOrder = 'asc';
      expect(component.hasActiveFilters).toBe(true);

      component.resetFilters();
      expect(component.searchTerm).toBe('');
      expect(component.excludeSearchTerm).toBe('');
      expect(component.exactName).toBe('');
      expect(component.exactPhone).toBe('');
      expect(component.dateFrom).toBe('');
      expect(component.dateTo).toBe('');
      expect(component.sortKey).toBe('id');
      expect(component.sortOrder).toBe('desc');
      expect(component.activeBackendFilterCount).toBe(0);
      expect(component.hasActiveFilters).toBe(false);
    });
  });

  describe('Backend Sorting & Safety', () => {
    it('should recognize backend-supported sortable columns', () => {
      expect(component.isSortable('id')).toBe(true);
      expect(component.isSortable('entrydate')).toBe(true);
      expect(component.isSortable('name')).toBe(true);
      expect(component.isSortable('phone')).toBe(true);
      expect(component.isSortable('city')).toBe(true);
      expect(component.isSortable('branch')).toBe(true);
      expect(component.isSortable('class')).toBe(true);
      expect(component.isSortable('otp_validation')).toBe(true);
      expect(component.isSortable('utm_source')).toBe(true);

      // Non-supported columns
      expect(component.isSortable('parent_email')).toBe(false);
      expect(component.isSortable('utm_content')).toBe(false);
      expect(component.isSortable('page_section')).toBe(false);
    });

    it('should cycle sort order on supported column and ignore non-supported column', () => {
      component.selectedModuleKey = 'wbnarayanaschools.in';
      component.sortKey = 'id';
      component.sortOrder = 'desc';

      // Toggle name: from initial to asc
      component.toggleSort('name');
      expect(component.sortKey).toBe('name');
      expect(component.sortOrder).toBe('asc');

      // Toggle name again: asc to desc
      component.toggleSort('name');
      expect(component.sortKey).toBe('name');
      expect(component.sortOrder).toBe('desc');

      // Toggle non-supported column: should not change sortKey
      component.toggleSort('parent_email');
      expect(component.sortKey).toBe('name');
      expect(component.sortOrder).toBe('desc');
    });
  });

  describe('Serial Number and Detail Drawer', () => {
    it('should calculate sequential serial number based on pagination meta', () => {
      component.meta = {
        page: 3,
        per_page: 25,
        total: 100,
        filtered: 100,
        total_pages: 4,
      };

      // 1st row on page 3 -> ((3-1)*25) + 0 + 1 = 51
      expect(component.getSerialNumber(0)).toBe(51);
      // 5th row on page 3 -> ((3-1)*25) + 4 + 1 = 55
      expect(component.getSerialNumber(4)).toBe(55);
    });

    it('should open and close lead details drawer', () => {
      const mockLead: LeadItem = {
        id: 42,
        name: 'Suresh Kumar',
        phone: '9876543210',
        entrydate: '2026-03-01 10:00:00',
        parent_email: 'suresh@example.com',
        otp_validation: 'VALID',
        city: 'Kolkata',
      };

      component.selectedModuleKey = 'wbnarayanaschools.in';
      vi.spyOn(leadService, 'getLeadById').mockReturnValue(
        of({
          success: true,
          message: 'Lead fetched',
          data: { ...mockLead, board: 'CBSE' },
        })
      );

      component.openLeadDetail(mockLead);
      expect(component.selectedLeadForDetail).toBeTruthy();
      expect(component.selectedLeadForDetail?.id).toBe(42);
      expect(component.selectedLeadForDetail?.board).toBe('CBSE');

      component.closeLeadDetail();
      expect(component.selectedLeadForDetail).toBeNull();
      expect(component.isLoadingLeadDetail).toBe(false);
    });
  });

  describe('Column Customization & Reordering', () => {
    beforeEach(() => {
      localStorage.clear();
      component.resetColumnOrder();
    });

    it('should move column down and update order', () => {
      expect(component.columns[0].key).toBe('sno');
      expect(component.columns[1].key).toBe('id');

      component.moveColumn(0, 'down');

      expect(component.columns[0].key).toBe('id');
      expect(component.columns[1].key).toBe('sno');
      expect(component.visibleColumns[0].key).toBe('id');
      expect(component.visibleColumns[1].key).toBe('sno');
    });

    it('should move column up and update order', () => {
      component.moveColumn(1, 'up');

      expect(component.columns[0].key).toBe('id');
      expect(component.columns[1].key).toBe('sno');
    });

    it('should reorder columns on drop', () => {
      component.draggedColIndex = 0; // 'sno'
      const fakeEvent = { preventDefault: () => {} } as DragEvent;

      component.onColumnDrop(fakeEvent, 2); // Move 'sno' to index 2

      expect(component.columns[0].key).toBe('id');
      expect(component.columns[1].key).toBe('entrydate');
      expect(component.columns[2].key).toBe('sno');
      expect(component.draggedColIndex).toBeNull();
    });

    it('should save column order and visibility to localStorage and restore on init', () => {
      component.moveColumn(2, 'up');
      component.moveColumn(1, 'up');
      component.toggleColumn('phone');

      const saved = localStorage.getItem('leads_column_prefs');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed.order[0]).toBe('entrydate');
      expect(parsed.visibility['phone']).toBe(false);

      const newFixture = TestBed.createComponent(LeadsComponent);
      const newComp = newFixture.componentInstance;
      newComp.ngOnInit();

      expect(newComp.columns[0].key).toBe('entrydate');
      expect(newComp.columns.find((c) => c.key === 'phone')?.visible).toBe(
        component.columns.find((c) => c.key === 'phone')?.visible
      );
    });

    it('should reset column order and visibility when resetColumnOrder is called', () => {
      component.moveColumn(0, 'down');
      expect(component.columns[0].key).not.toBe('sno');

      component.resetColumnOrder();

      expect(component.columns[0].key).toBe('sno');
      expect(component.columns[1].key).toBe('id');
    });

    it('should toggle all columns visibility', () => {
      component.toggleAllColumns(false);
      // At least 1 column (ID) should remain visible
      expect(component.visibleColumnCount).toBe(1);

      component.toggleAllColumns(true);
      expect(component.visibleColumnCount).toBe(component.columns.length);
    });
  });

  describe('Export CSV & Param Sanitization', () => {
    it('should call exportLeads strictly omitting page and per_page', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      component.searchTerm = 'Priya';
      component.excludeSearchTerm = 'dummy';
      component.exactName = 'Priya Sharma';
      component.exactPhone = '9876543210';
      component.sortKey = 'entrydate';
      component.sortOrder = 'desc';

      let exportedParams: any = null;
      vi.spyOn(leadService, 'exportLeads').mockImplementation((params) => {
        exportedParams = params;
        return of(new Blob(['id,name\n1,Priya'], { type: 'text/csv' }));
      });

      component.exportCsv();

      expect(exportedParams).toBeTruthy();
      expect(exportedParams.page).toBeUndefined();
      expect(exportedParams.per_page).toBeUndefined();
      expect(exportedParams.module).toBe('wbnarayanaschools');
      expect(exportedParams.search).toBe('Priya');
      expect(exportedParams.exclude_search).toBe('dummy');
      expect(exportedParams.name).toBe('Priya Sharma');
      expect(exportedParams.phone).toBe('9876543210');
      expect(exportedParams.phone_mode).toBe('all');
      expect(exportedParams.name_mode).toBe('all');
      expect(exportedParams.sort_by).toBe('entrydate');
      expect(exportedParams.sort_order).toBe('desc');
    });

    it('should export with custom phone_mode', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      component.phoneMode = 'duplicates_only';

      let exportedParams: any = null;
      vi.spyOn(leadService, 'exportLeads').mockImplementation((params) => {
        exportedParams = params;
        return of(new Blob(['id,name\n1,Priya'], { type: 'text/csv' }));
      });

      component.exportCsv();

      expect(exportedParams).toBeTruthy();
      expect(exportedParams.phone_mode).toBe('duplicates_only');
      expect(exportedParams.page).toBeUndefined();
      expect(exportedParams.per_page).toBeUndefined();
    });

    it('should export with custom name_mode', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      component.nameMode = 'unique';

      let exportedParams: any = null;
      vi.spyOn(leadService, 'exportLeads').mockImplementation((params) => {
        exportedParams = params;
        return of(new Blob(['id,name\n1,Priya'], { type: 'text/csv' }));
      });

      component.exportCsv();

      expect(exportedParams).toBeTruthy();
      expect(exportedParams.name_mode).toBe('unique');
    });
  });

  describe('Phone Mode & Duplicate Inspection', () => {
    it('should change phone mode and refresh leads', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      const fetchSpy = vi.spyOn(component as any, 'fetchLeads');

      component.onPhoneModeChange('unique');

      expect(component.phoneMode).toBe('unique');
      expect(component.currentPage).toBe(1);
      expect(fetchSpy).toHaveBeenCalled();
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should inspect duplicate phone by setting exactPhone and resetting phoneMode to all', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      component.phoneMode = 'duplicates_only';
      const fetchSpy = vi.spyOn(component as any, 'fetchLeads');

      component.inspectDuplicatePhone('9000000000');

      expect(component.exactPhone).toBe('9000000000');
      expect(component.phoneMode).toBe('all');
      expect(component.currentPage).toBe(1);
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should clear exactPhone filter and refresh leads', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      component.exactPhone = '9000000000';
      const fetchSpy = vi.spyOn(component as any, 'fetchLeads');

      component.clearExactPhoneFilter();

      expect(component.exactPhone).toBe('');
      expect(component.currentPage).toBe(1);
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe('Name Mode & Duplicate Inspection', () => {
    it('should change name mode and refresh leads', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      const fetchSpy = vi.spyOn(component as any, 'fetchLeads');

      component.onNameModeChange('unique');

      expect(component.nameMode).toBe('unique');
      expect(component.currentPage).toBe(1);
      expect(fetchSpy).toHaveBeenCalled();
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should inspect duplicate name by setting exactName and resetting nameMode to all', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      component.nameMode = 'duplicates_only';
      const fetchSpy = vi.spyOn(component as any, 'fetchLeads');

      component.inspectDuplicateName('Animesh Bir');

      expect(component.exactName).toBe('Animesh Bir');
      expect(component.nameMode).toBe('all');
      expect(component.currentPage).toBe(1);
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should clear exactName filter and refresh leads', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      component.exactName = 'Animesh Bir';
      const fetchSpy = vi.spyOn(component as any, 'fetchLeads');

      component.clearExactNameFilter();

      expect(component.exactName).toBe('');
      expect(component.currentPage).toBe(1);
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should compute duplicateNamesCount correctly', () => {
      component.leads = [
        { id: 1, name: 'Animesh', phone: '111', is_name_duplicate: true, name_duplicate_count: 2 } as any,
        { id: 2, name: 'Priya', phone: '222', is_name_duplicate: false, name_duplicate_count: 1 } as any,
        { id: 3, name: 'Animesh', phone: '333', is_name_duplicate: true, name_duplicate_count: 2 } as any,
      ];

      expect(component.duplicateNamesCount).toBe(2);
    });
  });

  describe('Exclude Test Toggle & Metrics', () => {
    it('should toggle excludeTest and set excludeSearchTerm', () => {
      component.selectedModuleKey = 'wbnarayanaschools';
      const fetchSpy = vi.spyOn(component as any, 'fetchLeads');

      expect(component.excludeTest).toBe(false);
      component.toggleExcludeTest();

      expect(component.excludeTest).toBe(true);
      expect(component.excludeSearchTerm).toBe('test');
      expect(component.currentPage).toBe(1);
      expect(fetchSpy).toHaveBeenCalled();
      expect(component.hasActiveFilters).toBe(true);

      component.toggleExcludeTest();
      expect(component.excludeTest).toBe(false);
      expect(component.excludeSearchTerm).toBe('');
    });

    it('should compute testLeadsCount and duplicateLeadsCount correctly', () => {
      component.leads = [
        { id: 1, name: 'ABC Test', phone: '9000000001', otp_validation: 'VALID', entrydate: '2026-11-10 10:00:00', parent_email: 'p1@example.com' },
        { id: 2, name: 'John Doe', phone: '9000000002', otp_validation: 'VALID', duplicate_count: 2, entrydate: '2026-11-10 10:00:00', parent_email: 'p2@example.com' },
        { id: 3, name: 'Regular User', phone: '9000000003', otp_validation: 'INVALID', entrydate: '2026-11-10 10:00:00', parent_email: 'p3@example.com' },
      ];

      expect(component.testLeadsCount).toBe(1);
      expect(component.duplicateLeadsCount).toBe(1);
      expect(component.isLeadTest(component.leads[0])).toBe(true);
      expect(component.isLeadTest(component.leads[1])).toBe(false);
    });
  });
});
