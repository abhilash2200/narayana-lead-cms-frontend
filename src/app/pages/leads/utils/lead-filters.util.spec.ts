import {
  computeNameCounts,
  computePhoneCounts,
  isTestLead,
  normalizeName,
  normalizePhone,
} from './lead-filters.util';
import { LeadItem } from '../../../services/lead.service';

describe('lead-filters.util', () => {
  describe('normalizeName', () => {
    it('should return empty string if name is undefined or empty', () => {
      expect(normalizeName()).toBe('');
      expect(normalizeName('')).toBe('');
      expect(normalizeName('   ')).toBe('');
    });

    it('should trim, lowercase, and collapse multiple spaces', () => {
      expect(normalizeName('  John   Doe  ')).toBe('john doe');
      expect(normalizeName('Alice')).toBe('alice');
      expect(normalizeName('RAHUL  SHARMA')).toBe('rahul sharma');
    });
  });

  describe('computeNameCounts', () => {
    it('should compute frequency of normalized names', () => {
      const leads = [
        { id: 1, name: 'John Doe' },
        { id: 2, name: ' john   doe ' },
        { id: 3, name: 'Jane Smith' },
        { id: 4, name: '' },
      ] as LeadItem[];

      const counts = computeNameCounts(leads);
      expect(counts.get('john doe')).toBe(2);
      expect(counts.get('jane smith')).toBe(1);
      expect(counts.has('')).toBe(false);
    });
  });

  describe('normalizePhone', () => {
    it('should normalize phone numbers to last 10 digits', () => {
      expect(normalizePhone('+91 9876543210')).toBe('9876543210');
      expect(normalizePhone('9876543210')).toBe('9876543210');
      expect(normalizePhone('')).toBe('');
    });
  });
});
