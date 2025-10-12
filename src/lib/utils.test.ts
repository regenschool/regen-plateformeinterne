import { describe, it, expect } from 'vitest';
import { cn, calculateAge } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should handle undefined and null', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
    });
  });

  describe('calculateAge', () => {
    it('should return null for null input', () => {
      expect(calculateAge(null)).toBeNull();
    });

    it('should calculate age correctly', () => {
      const birthDate = '2000-01-01';
      const age = calculateAge(birthDate);
      const expectedAge = new Date().getFullYear() - 2000;
      
      expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
      expect(age).toBeLessThanOrEqual(expectedAge);
    });

    it('should handle birthday not yet occurred this year', () => {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const birthDate = `${today.getFullYear() - 25}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
      
      const age = calculateAge(birthDate);
      expect(age).toBe(24); // Birthday not yet occurred
    });

    it('should handle birthday already occurred this year', () => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const birthDate = `${today.getFullYear() - 25}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
      
      const age = calculateAge(birthDate);
      expect(age).toBe(25); // Birthday already occurred
    });

    it('should handle leap year birth dates', () => {
      const birthDate = '2000-02-29';
      const age = calculateAge(birthDate);
      
      expect(age).toBeGreaterThanOrEqual(24);
      expect(age).toBeLessThanOrEqual(25);
    });
  });
});
