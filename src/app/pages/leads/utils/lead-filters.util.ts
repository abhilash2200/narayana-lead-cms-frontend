import { LeadItem } from '../../../services/lead.service';

/**
 * Normalizes phone numbers to standard 10 digits for accurate deduplication.
 */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

/**
 * Normalizes lead names for accurate deduplication (lowercase, trimmed, collapsed whitespace).
 */
export function normalizeName(name?: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Detects if a lead is a dummy or test record based on common keywords and test numbers.
 */
export function isTestLead(lead: LeadItem, testKeyword = 'test'): boolean {
  const raw = testKeyword.trim().toLowerCase();
  const defaultKeywords = ['test', 'demo', 'dummy', 'sample', 'testing', 'trial'];
  const keywords = raw ? Array.from(new Set([raw, ...defaultKeywords])) : defaultKeywords;

  const name = (lead.name || '').toLowerCase();
  const email = (lead.parent_email || '').toLowerCase();
  const phone = (lead.phone || '').trim();

  const matchesWord = keywords.some(
    (k) => name.includes(k) || email.includes(k)
  );

  const isDummyPhone =
    /^([0-9])\1{9}$/.test(phone) ||
    phone === '1234567890' ||
    phone === '9876543210' ||
    phone === '0123456789';

  return matchesWord || isDummyPhone;
}

/**
 * Computes a frequency map of normalized phone numbers across a lead list.
 */
export function computePhoneCounts(leads: LeadItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const p = normalizePhone(lead.phone);
    if (p) {
      counts.set(p, (counts.get(p) || 0) + 1);
    }
  }
  return counts;
}

/**
 * Computes a frequency map of normalized names across a lead list.
 */
export function computeNameCounts(leads: LeadItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const n = normalizeName(lead.name);
    if (n) {
      counts.set(n, (counts.get(n) || 0) + 1);
    }
  }
  return counts;
}

/**
 * Checks if a lead has a verified OTP status.
 */
export function isOtpVerified(lead: LeadItem): boolean {
  const otp = lead.otp_validation;
  return (
    otp === 'VALID' ||
    otp === 'Valid' ||
    otp === 'Verified' ||
    otp === '1'
  );
}

/**
 * Counts leads with duplicate phone submissions.
 */
export function computeDuplicatePhoneLeadsCount(leads: LeadItem[]): number {
  return leads.filter(
    (l) =>
      Boolean(l.is_phone_duplicate) ||
      Boolean(l.phone_duplicate_count && l.phone_duplicate_count > 1) ||
      Boolean(l.duplicate_count && l.duplicate_count > 1)
  ).length;
}

/**
 * Counts leads with duplicate name submissions.
 */
export function computeDuplicateNameLeadsCount(leads: LeadItem[]): number {
  return leads.filter(
    (l) =>
      Boolean(l.is_name_duplicate) ||
      Boolean(l.name_duplicate_count && l.name_duplicate_count > 1)
  ).length;
}

