import { LeadItem } from '../../../services/lead.service';
import {
  isOtpVerified,
  isTestLead,
  normalizePhone,
} from '../../leads/utils/lead-filters.util';
import {
  AdsDashboardCalculationResult,
  AdsDashboardFilterState,
  AdsDashboardMetrics,
  BranchPerformanceItem,
  CampaignPerformanceItem,
  CourseBreakdownItem,
  DailyTrendItem,
  HourlyInflowItem,
  SourceBreakdownItem,
  TodayPulseMetrics,
} from '../models/ads-dashboard.model';

export function extractLeadDateStr(lead: LeadItem): string {
  if (!lead.entrydate) return '';
  return lead.entrydate.split(' ')[0] || '';
}

export function extractLeadCourse(lead: LeadItem): string {
  const c = lead.course?.trim();
  if (c) return c;
  const cl = lead.class?.trim();
  if (cl) return cl;
  const s = lead.stream?.trim();
  if (s) return s;
  const b = lead.board?.trim();
  if (b) return b;
  return 'General Admission';
}

export function formatLocalDateToYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function calculateAdsDashboard(
  rawLeads: LeadItem[],
  filters: AdsDashboardFilterState
): AdsDashboardCalculationResult {
  // 1. Collect all distinct courses across raw leads
  const courseSet = new Set<string>();
  for (const l of rawLeads) {
    courseSet.add(extractLeadCourse(l));
  }
  const availableCourses = Array.from(courseSet).sort();

  // 2. Compute Today Pulse Metrics (Real-time daily monitoring)
  const now = new Date();
  const todayStr = formatLocalDateToYMD(now);
  const yest = new Date();
  yest.setDate(now.getDate() - 1);
  const yestStr = formatLocalDateToYMD(yest);

  const todayLeadsRaw = rawLeads.filter((l) => extractLeadDateStr(l) === todayStr);
  const yestLeadsRaw = rawLeads.filter((l) => extractLeadDateStr(l) === yestStr);

  // Today hygiene
  const todayTestCount = todayLeadsRaw.filter((l) => isTestLead(l)).length;
  const todayCleanLeads = todayLeadsRaw.filter((l) => !isTestLead(l));
  const todayTotal = todayCleanLeads.length;

  const todayPhoneCounts = new Map<string, number>();
  for (const l of todayCleanLeads) {
    const p = normalizePhone(l.phone);
    if (p) todayPhoneCounts.set(p, (todayPhoneCounts.get(p) || 0) + 1);
  }

  let todayVerified = 0;
  let todayDuplicate = 0;
  for (const l of todayCleanLeads) {
    if (isOtpVerified(l)) todayVerified++;
    const p = normalizePhone(l.phone);
    if (p && (todayPhoneCounts.get(p) || 0) > 1) {
      todayDuplicate++;
    }
  }

  const todayPending = Math.max(0, todayTotal - todayVerified);
  const yestCleanTotal = yestLeadsRaw.filter((l) => !isTestLead(l)).length;
  const vsYesterdayDiff = todayTotal - yestCleanTotal;
  const vsYesterdayPercent =
    yestCleanTotal > 0
      ? `${vsYesterdayDiff >= 0 ? '+' : ''}${((vsYesterdayDiff / yestCleanTotal) * 100).toFixed(1)}%`
      : todayTotal > 0
      ? `+100%`
      : '0.0%';

  const todayPulse: TodayPulseMetrics = {
    totalToday: todayTotal,
    verifiedToday: todayVerified,
    verifiedRateToday: todayTotal > 0 ? Number(((todayVerified / todayTotal) * 100).toFixed(1)) : 0,
    pendingToday: todayPending,
    pendingRateToday: todayTotal > 0 ? Number(((todayPending / todayTotal) * 100).toFixed(1)) : 0,
    duplicateToday: todayDuplicate,
    duplicateRateToday: todayTotal > 0 ? Number(((todayDuplicate / todayTotal) * 100).toFixed(1)) : 0,
    testToday: todayTestCount,
    testRateToday: todayLeadsRaw.length > 0 ? Number(((todayTestCount / todayLeadsRaw.length) * 100).toFixed(1)) : 0,
    vsYesterdayTotal: yestCleanTotal,
    vsYesterdayDiff,
    vsYesterdayPercent,
    isPositiveTrend: vsYesterdayDiff >= 0,
  };

  // 3. Filter leads by Date Range
  let rangeLeads = rawLeads;
  if (filters.dateFrom && filters.dateTo) {
    rangeLeads = rangeLeads.filter((l) => {
      const d = extractLeadDateStr(l);
      return d >= filters.dateFrom && d <= filters.dateTo;
    });
  }

  // 4. Filter by Course
  if (filters.selectedCourse) {
    rangeLeads = rangeLeads.filter((l) => extractLeadCourse(l) === filters.selectedCourse);
  }

  // 5. Test Leads Hygiene
  const testCountInRange = rangeLeads.filter((l) => isTestLead(l)).length;
  if (filters.excludeTest) {
    rangeLeads = rangeLeads.filter((l) => !isTestLead(l));
  }

  // 6. Compute Phone Frequencies in the range
  const phoneFreq = new Map<string, number>();
  for (const l of rangeLeads) {
    const p = normalizePhone(l.phone);
    if (p) phoneFreq.set(p, (phoneFreq.get(p) || 0) + 1);
  }

  // Deduplication filtering
  let filteredLeads: LeadItem[] = [];
  const seenPhones = new Set<string>();

  if (filters.duplicateMode === 'unique_only') {
    for (const l of rangeLeads) {
      const p = normalizePhone(l.phone);
      if (!p) {
        filteredLeads.push(l);
      } else if (!seenPhones.has(p)) {
        seenPhones.add(p);
        filteredLeads.push(l);
      }
    }
  } else if (filters.duplicateMode === 'duplicates_only') {
    for (const l of rangeLeads) {
      const p = normalizePhone(l.phone);
      if (p && (phoneFreq.get(p) || 0) > 1) {
        filteredLeads.push(l);
      }
    }
  } else {
    // 'all'
    filteredLeads = rangeLeads;
  }

  // 7. Calculate Aggregations & Daily Averages
  const totalLeads = filteredLeads.length;

  // Calculate calendar days
  let calendarDaysCount = 1;
  if (filters.dateFrom && filters.dateTo) {
    const d1 = new Date(filters.dateFrom).getTime();
    const d2 = new Date(filters.dateTo).getTime();
    calendarDaysCount = Math.max(1, Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
  }

  const activeDatesSet = new Set<string>();
  let otpVerifiedCount = 0;
  let duplicateCount = 0;

  for (const l of filteredLeads) {
    const d = extractLeadDateStr(l);
    if (d) activeDatesSet.add(d);

    if (isOtpVerified(l)) otpVerifiedCount++;

    const p = normalizePhone(l.phone);
    if (p && (phoneFreq.get(p) || 0) > 1) {
      duplicateCount++;
    }
  }

  const activeDaysCount = Math.max(1, activeDatesSet.size);
  const otpPendingCount = Math.max(0, totalLeads - otpVerifiedCount);
  const uniqueCount = Math.max(0, totalLeads - duplicateCount);

  const divisor = calendarDaysCount;
  const avgLeadsPerDay = Number((totalLeads / divisor).toFixed(1));
  const avgOtpVerifiedPerDay = Number((otpVerifiedCount / divisor).toFixed(1));
  const avgOtpPendingPerDay = Number((otpPendingCount / divisor).toFixed(1));
  const avgUniquePerDay = Number((uniqueCount / divisor).toFixed(1));
  const avgDuplicatesPerDay = Number((duplicateCount / divisor).toFixed(1));

  const otpVerifiedRate = totalLeads > 0 ? Number(((otpVerifiedCount / totalLeads) * 100).toFixed(1)) : 0;
  const otpPendingRate = totalLeads > 0 ? Number(((otpPendingCount / totalLeads) * 100).toFixed(1)) : 0;
  const uniqueRate = totalLeads > 0 ? Number(((uniqueCount / totalLeads) * 100).toFixed(1)) : 0;
  const duplicateRate = totalLeads > 0 ? Number(((duplicateCount / totalLeads) * 100).toFixed(1)) : 0;
  const testRate = totalLeads + testCountInRange > 0 ? Number(((testCountInRange / (totalLeads + testCountInRange)) * 100).toFixed(1)) : 0;

  const metrics: AdsDashboardMetrics = {
    totalLeads,
    avgLeadsPerDay,
    calendarDaysCount,
    activeDaysCount,
    otpVerifiedCount,
    otpVerifiedRate,
    avgOtpVerifiedPerDay,
    otpPendingCount,
    otpPendingRate,
    avgOtpPendingPerDay,
    uniqueCount,
    uniqueRate,
    avgUniquePerDay,
    duplicateCount,
    duplicateRate,
    avgDuplicatesPerDay,
    testCount: testCountInRange,
    testRate,
  };

  // 8. Course Breakdown
  const courseMap = new Map<string, { total: number; verified: number; duplicate: number }>();
  for (const l of filteredLeads) {
    const c = extractLeadCourse(l);
    const existing = courseMap.get(c) || { total: 0, verified: 0, duplicate: 0 };
    existing.total++;
    if (isOtpVerified(l)) existing.verified++;
    const p = normalizePhone(l.phone);
    if (p && (phoneFreq.get(p) || 0) > 1) {
      existing.duplicate++;
    }
    courseMap.set(c, existing);
  }

  const courseBreakdown: CourseBreakdownItem[] = Array.from(courseMap.entries())
    .map(([courseName, val]) => ({
      courseName,
      totalLeads: val.total,
      avgLeadsPerDay: Number((val.total / divisor).toFixed(1)),
      verifiedCount: val.verified,
      verifiedRate: val.total > 0 ? Number(((val.verified / val.total) * 100).toFixed(1)) : 0,
      duplicateCount: val.duplicate,
      duplicateRate: val.total > 0 ? Number(((val.duplicate / val.total) * 100).toFixed(1)) : 0,
      sharePercent: totalLeads > 0 ? Number(((val.total / totalLeads) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalLeads - a.totalLeads);

  // 9. Source Breakdown (UTM Sources / Ad Channels)
  const sourceMap = new Map<string, { count: number; verified: number }>();
  for (const l of filteredLeads) {
    let s = (l.utm_source || '').trim();
    if (!s) s = 'Direct / Organic';
    const existing = sourceMap.get(s) || { count: 0, verified: 0 };
    existing.count++;
    if (isOtpVerified(l)) existing.verified++;
    sourceMap.set(s, existing);
  }

  const palette = ['bg-[#8c7ae6]', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-slate-400'];
  let colorIdx = 0;
  const sourceBreakdown: SourceBreakdownItem[] = Array.from(sourceMap.entries())
    .map(([source, val]) => ({
      source,
      count: val.count,
      percentage: totalLeads > 0 ? Number(((val.count / totalLeads) * 100).toFixed(1)) : 0,
      verifiedCount: val.verified,
      verifiedRate: val.count > 0 ? Number(((val.verified / val.count) * 100).toFixed(1)) : 0,
      colorClass: palette[colorIdx++ % palette.length],
    }))
    .sort((a, b) => b.count - a.count);

  // 10. Daily Trend Chart
  const dateMap = new Map<string, { total: number; verified: number; duplicate: number }>();
  for (const l of filteredLeads) {
    const d = extractLeadDateStr(l);
    if (!d) continue;
    const existing = dateMap.get(d) || { total: 0, verified: 0, duplicate: 0 };
    existing.total++;
    if (isOtpVerified(l)) existing.verified++;
    const p = normalizePhone(l.phone);
    if (p && (phoneFreq.get(p) || 0) > 1) {
      existing.duplicate++;
    }
    dateMap.set(d, existing);
  }

  const sortedDates = Array.from(dateMap.keys()).sort();
  let maxDaily = 0;
  for (const countObj of dateMap.values()) {
    if (countObj.total > maxDaily) maxDaily = countObj.total;
  }

  const dailyTrend: DailyTrendItem[] = sortedDates.map((dateStr) => {
    const val = dateMap.get(dateStr)!;
    const parts = dateStr.split('-');
    const dayLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
    const heightPercent = maxDaily > 0 ? Math.max(12, Math.round((val.total / maxDaily) * 100)) : 15;
    return {
      date: dateStr,
      dayLabel,
      total: val.total,
      verified: val.verified,
      pending: Math.max(0, val.total - val.verified),
      duplicate: val.duplicate,
      heightPercent,
    };
  });

  // 11. Hourly Distribution (Dayparting Inflow Heatmap)
  const hourMap = new Map<number, { count: number; verified: number }>();
  for (let h = 0; h < 24; h++) {
    hourMap.set(h, { count: 0, verified: 0 });
  }

  for (const l of filteredLeads) {
    if (!l.entrydate) continue;
    const timePart = l.entrydate.split(' ')[1];
    if (timePart) {
      const h = parseInt(timePart.split(':')[0], 10);
      if (!isNaN(h) && h >= 0 && h < 24) {
        const item = hourMap.get(h)!;
        item.count++;
        if (isOtpVerified(l)) item.verified++;
      }
    }
  }

  let maxHourCount = 0;
  for (const v of hourMap.values()) {
    if (v.count > maxHourCount) maxHourCount = v.count;
  }

  const hourlyDistribution: HourlyInflowItem[] = Array.from(hourMap.entries()).map(([hour, val]) => {
    const label = `${String(hour).padStart(2, '0')}:00`;
    const heightPercent = maxHourCount > 0 ? Math.max(8, Math.round((val.count / maxHourCount) * 100)) : 8;
    const verifiedRate = val.count > 0 ? Number(((val.verified / val.count) * 100).toFixed(1)) : 0;
    return {
      hour,
      label,
      count: val.count,
      verifiedCount: val.verified,
      verifiedRate,
      heightPercent,
    };
  });

  // 12. Campaign Attribution Matrix (UTM Campaign & Source)
  const campaignMap = new Map<string, { source: string; total: number; verified: number; duplicate: number }>();
  for (const l of filteredLeads) {
    const campaign = (l.utm_campaign || '').trim() || 'General Inflow / Direct';
    const source = (l.utm_source || '').trim() || 'Direct';
    const key = `${source}___${campaign}`;

    const existing = campaignMap.get(key) || { source, total: 0, verified: 0, duplicate: 0 };
    existing.total++;
    if (isOtpVerified(l)) existing.verified++;
    const p = normalizePhone(l.phone);
    if (p && (phoneFreq.get(p) || 0) > 1) {
      existing.duplicate++;
    }
    campaignMap.set(key, existing);
  }

  const campaignBreakdown: CampaignPerformanceItem[] = Array.from(campaignMap.entries())
    .map(([key, val]) => {
      const campaign = key.split('___')[1] || key;
      const verifiedRate = val.total > 0 ? Number(((val.verified / val.total) * 100).toFixed(1)) : 0;
      const duplicateRate = val.total > 0 ? Number(((val.duplicate / val.total) * 100).toFixed(1)) : 0;
      const sharePercent = totalLeads > 0 ? Number(((val.total / totalLeads) * 100).toFixed(1)) : 0;
      return {
        campaign,
        source: val.source,
        totalLeads: val.total,
        verifiedCount: val.verified,
        verifiedRate,
        duplicateCount: val.duplicate,
        duplicateRate,
        sharePercent,
      };
    })
    .sort((a, b) => b.totalLeads - a.totalLeads);

  // 13. Campus & Branch Performance Matrix
  const branchMap = new Map<string, { city: string; total: number; verified: number }>();
  for (const l of filteredLeads) {
    const branch = (l.branch || '').trim() || 'Central Admissions';
    const city = (l.city || '').trim() || 'Kolkata';
    const key = `${city}___${branch}`;

    const existing = branchMap.get(key) || { city, total: 0, verified: 0 };
    existing.total++;
    if (isOtpVerified(l)) existing.verified++;
    branchMap.set(key, existing);
  }

  const branchBreakdown: BranchPerformanceItem[] = Array.from(branchMap.entries())
    .map(([key, val]) => {
      const branch = key.split('___')[1] || key;
      const verifiedRate = val.total > 0 ? Number(((val.verified / val.total) * 100).toFixed(1)) : 0;
      const sharePercent = totalLeads > 0 ? Number(((val.total / totalLeads) * 100).toFixed(1)) : 0;
      return {
        branch,
        city: val.city,
        totalLeads: val.total,
        verifiedCount: val.verified,
        verifiedRate,
        sharePercent,
      };
    })
    .sort((a, b) => b.totalLeads - a.totalLeads);

  return {
    metrics,
    todayPulse,
    filteredLeads,
    courseBreakdown,
    sourceBreakdown,
    dailyTrend,
    hourlyDistribution,
    campaignBreakdown,
    branchBreakdown,
    availableCourses,
  };
}

