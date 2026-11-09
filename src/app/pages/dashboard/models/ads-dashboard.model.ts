import { LeadItem } from '../../../services/lead.service';

export type AdsTimeframePreset = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'custom';
export type AdsReportingMode = 'total' | 'average';
export type AdsDuplicateFilterMode = 'unique_only' | 'all' | 'duplicates_only';

export interface AdsDashboardFilterState {
  selectedModuleKey: string;
  timeframe: AdsTimeframePreset;
  dateFrom: string;
  dateTo: string;
  selectedCourse: string; // '' means all courses/classes
  excludeTest: boolean;   // default: true
  duplicateMode: AdsDuplicateFilterMode; // default: 'unique_only'
  reportMode: AdsReportingMode;          // default: 'total'
}

export interface AdsDashboardMetrics {
  totalLeads: number;
  avgLeadsPerDay: number;
  calendarDaysCount: number;
  activeDaysCount: number;

  // OTP Verified metrics
  otpVerifiedCount: number;
  otpVerifiedRate: number;
  avgOtpVerifiedPerDay: number;

  // OTP Pending metrics
  otpPendingCount: number;
  otpPendingRate: number;
  avgOtpPendingPerDay: number;

  // Unique vs Duplicate metrics
  uniqueCount: number;
  uniqueRate: number;
  avgUniquePerDay: number;

  duplicateCount: number;
  duplicateRate: number;
  avgDuplicatesPerDay: number;

  // Test leads
  testCount: number;
  testRate: number;
}

export interface TodayPulseMetrics {
  totalToday: number;
  verifiedToday: number;
  verifiedRateToday: number;
  pendingToday: number;
  pendingRateToday: number;
  duplicateToday: number;
  duplicateRateToday: number;
  testToday: number;
  testRateToday: number;
  vsYesterdayTotal: number;
  vsYesterdayDiff: number;
  vsYesterdayPercent: string;
  isPositiveTrend: boolean;
}

export interface CourseBreakdownItem {
  courseName: string;
  totalLeads: number;
  avgLeadsPerDay: number;
  verifiedCount: number;
  verifiedRate: number;
  duplicateCount: number;
  duplicateRate: number;
  sharePercent: number;
}

export interface SourceBreakdownItem {
  source: string;
  count: number;
  percentage: number;
  verifiedCount: number;
  verifiedRate: number;
  colorClass: string;
}

export interface DailyTrendItem {
  date: string;
  dayLabel: string;
  total: number;
  verified: number;
  pending: number;
  duplicate: number;
  heightPercent: number;
}

export interface HourlyInflowItem {
  hour: number;
  label: string;
  count: number;
  verifiedCount: number;
  verifiedRate: number;
  heightPercent: number;
}

export interface CampaignPerformanceItem {
  campaign: string;
  source: string;
  totalLeads: number;
  verifiedCount: number;
  verifiedRate: number;
  duplicateCount: number;
  duplicateRate: number;
  sharePercent: number;
}

export interface BranchPerformanceItem {
  branch: string;
  city: string;
  totalLeads: number;
  verifiedCount: number;
  verifiedRate: number;
  sharePercent: number;
}

export interface AdsDashboardCalculationResult {
  metrics: AdsDashboardMetrics;
  todayPulse: TodayPulseMetrics;
  filteredLeads: LeadItem[];
  courseBreakdown: CourseBreakdownItem[];
  sourceBreakdown: SourceBreakdownItem[];
  dailyTrend: DailyTrendItem[];
  hourlyDistribution: HourlyInflowItem[];
  campaignBreakdown: CampaignPerformanceItem[];
  branchBreakdown: BranchPerformanceItem[];
  availableCourses: string[];
}

