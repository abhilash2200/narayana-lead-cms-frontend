export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  optional: boolean;
}

export type CustomAnalysisDimension =
  | 'day'
  | 'day_of_week'
  | 'branch'
  | 'city'
  | 'class'
  | 'board'
  | 'utm_source'
  | 'otp_validation';

export type CustomAnalysisTimeframe =
  | 'all'
  | 'today'
  | 'yesterday'
  | '7d'
  | '14d'
  | '30d'
  | 'custom';

export type CustomAnalysisDayFilter =
  | 'all'
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat'
  | 'sun'
  | 'weekdays'
  | 'weekends';

export interface CustomAnalysisBreakdownItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
  otpValidCount: number;
  otpValidRate: number;
  uniquePhoneCount: number;
}

export interface LeadAnalyticsMetrics {
  avgLeadsPerDay: string;
  activeDaysCount: number;
  otpVerifiedRate: string;
  otpVerifiedCount: number;
  uniquePhoneRate: string;
  duplicateRate: string;
  peakDate: string;
  peakCount: number;
  dateSpanLabel: string;
}

export interface CustomAnalysisFilterParams {
  dateFrom?: string;
  dateTo?: string;
  excludeTest: boolean;
  phoneMode: 'all' | 'unique' | 'duplicates_only';
  nameMode?: 'all' | 'unique' | 'duplicates_only';
}
