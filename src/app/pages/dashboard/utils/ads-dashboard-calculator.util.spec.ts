import { LeadItem } from '../../../services/lead.service';
import { AdsDashboardFilterState } from '../models/ads-dashboard.model';
import {
  calculateAdsDashboard,
  extractLeadCourse,
} from './ads-dashboard-calculator.util';

describe('AdsDashboardCalculator', () => {
  const mockLeads: LeadItem[] = [
    {
      id: 1,
      entrydate: '2026-06-10 10:00:00',
      name: 'John Doe',
      parent_email: 'john@example.com',
      phone: '9830012345',
      otp_validation: 'Verified',
      course: 'BBA',
      utm_source: 'Google',
    },
    {
      id: 2,
      entrydate: '2026-06-10 11:00:00',
      name: 'Jane Smith',
      parent_email: 'jane@example.com',
      phone: '9830012346',
      otp_validation: 'Pending',
      course: 'BCA',
      utm_source: 'Facebook',
    },
    {
      id: 3,
      entrydate: '2026-06-11 12:00:00',
      name: 'Duplicate John',
      parent_email: 'john.duplicate@example.com',
      phone: '9830012345', // duplicate phone of lead 1
      otp_validation: 'Verified',
      course: 'BBA',
      utm_source: 'Google',
    },
    {
      id: 4,
      entrydate: '2026-06-12 13:00:00',
      name: 'Test Lead Record',
      parent_email: 'test@test.com',
      phone: '1234567890', // dummy/test phone
      otp_validation: 'Verified',
      course: 'MBA',
      utm_source: 'Google',
    },
    {
      id: 5,
      entrydate: '2026-06-13 14:00:00',
      name: 'Sam Wilson',
      parent_email: 'sam@example.com',
      phone: '9830012347',
      otp_validation: 'Verified',
      class: 'Class 10',
      utm_source: 'Instagram',
    },
  ];

  const defaultFilter: AdsDashboardFilterState = {
    selectedModuleKey: 'wbnarayana',
    timeframe: 'custom',
    dateFrom: '2026-06-10',
    dateTo: '2026-06-13',
    selectedCourse: '',
    excludeTest: true,
    duplicateMode: 'all',
    reportMode: 'total',
  };

  it('should exclude test leads by default', () => {
    const res = calculateAdsDashboard(mockLeads, defaultFilter);
    expect(res.filteredLeads.some((l) => l.name === 'Test Lead Record')).toBe(false);
    expect(res.metrics.testCount).toBe(1);
    expect(res.filteredLeads.length).toBe(4);
  });

  it('should calculate unique leads when duplicateMode is unique_only', () => {
    const res = calculateAdsDashboard(mockLeads, {
      ...defaultFilter,
      duplicateMode: 'unique_only',
    });
    // Duplicate phone 9830012345 should only appear once
    const phones = res.filteredLeads.map((l) => l.phone);
    expect(phones.filter((p) => p === '9830012345').length).toBe(1);
    expect(res.filteredLeads.length).toBe(3);
  });

  it('should filter by course correctly', () => {
    const res = calculateAdsDashboard(mockLeads, {
      ...defaultFilter,
      selectedCourse: 'BBA',
    });
    expect(res.filteredLeads.every((l) => extractLeadCourse(l) === 'BBA')).toBe(true);
    expect(res.filteredLeads.length).toBe(2);
  });

  it('should calculate daily averages across date range', () => {
    // Range 2026-06-10 to 2026-06-13 is 4 calendar days. With test lead excluded, there are 4 clean leads.
    const res = calculateAdsDashboard(mockLeads, defaultFilter);
    expect(res.metrics.calendarDaysCount).toBe(4);
    expect(res.metrics.avgLeadsPerDay).toBe(1); // 4 leads / 4 days = 1.0
  });

  it('should collect available courses', () => {
    const res = calculateAdsDashboard(mockLeads, defaultFilter);
    expect(res.availableCourses).toContain('BBA');
    expect(res.availableCourses).toContain('BCA');
    expect(res.availableCourses).toContain('MBA');
    expect(res.availableCourses).toContain('Class 10');
  });

  it('should compute hourly, campaign, and branch breakdowns', () => {
    const res = calculateAdsDashboard(mockLeads, defaultFilter);
    expect(res.hourlyDistribution.length).toBe(24);
    expect(Array.isArray(res.campaignBreakdown)).toBe(true);
    expect(Array.isArray(res.branchBreakdown)).toBe(true);
  });
});
