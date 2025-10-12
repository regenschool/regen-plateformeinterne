import { describe, it, expect } from 'vitest';
import { studentSchema, gradeSchema, subjectSchema } from './validation';

describe('validation', () => {
  describe('studentSchema', () => {
    it('should validate a correct student', () => {
      const validStudent = {
        first_name: 'John',
        last_name: 'Doe',
        class_name: 'M1A',
        photo_url: 'https://example.com/photo.jpg',
        birth_date: '2000-01-01',
        academic_background: 'Sciences Po',
        company: 'Google',
        special_needs: '',
      };

      expect(() => studentSchema.parse(validStudent)).not.toThrow();
    });

    it('should reject student with empty first name', () => {
      const invalidStudent = {
        first_name: '',
        last_name: 'Doe',
        class_name: 'M1A',
      };

      expect(() => studentSchema.parse(invalidStudent)).toThrow();
    });

    it('should reject student with first name > 100 characters', () => {
      const invalidStudent = {
        first_name: 'a'.repeat(101),
        last_name: 'Doe',
        class_name: 'M1A',
      };

      expect(() => studentSchema.parse(invalidStudent)).toThrow();
    });

    it('should reject invalid URL in photo_url', () => {
      const invalidStudent = {
        first_name: 'John',
        last_name: 'Doe',
        class_name: 'M1A',
        photo_url: 'not-a-url',
      };

      expect(() => studentSchema.parse(invalidStudent)).toThrow();
    });

    it('should allow optional fields to be empty', () => {
      const validStudent = {
        first_name: 'John',
        last_name: 'Doe',
        class_name: 'M1A',
        photo_url: '',
        birth_date: null,
        academic_background: '',
        company: '',
        special_needs: '',
      };

      expect(() => studentSchema.parse(validStudent)).not.toThrow();
    });
  });

  describe('gradeSchema', () => {
    it('should validate a correct grade', () => {
      const validGrade = {
        grade: 15,
        max_grade: 20,
        weighting: 1,
        assessment_type: 'exam',
        subject: 'Mathématiques',
        class_name: 'M1A',
        school_year: '2025-2026',
      };

      expect(() => gradeSchema.parse(validGrade)).not.toThrow();
    });

    it('should reject grade > max_grade', () => {
      const invalidGrade = {
        grade: 25,
        max_grade: 20,
        weighting: 1,
        assessment_type: 'exam',
        subject: 'Mathématiques',
        class_name: 'M1A',
        school_year: '2025-2026',
      };

      expect(() => gradeSchema.parse(invalidGrade)).toThrow();
    });

    it('should reject negative grade', () => {
      const invalidGrade = {
        grade: -5,
        max_grade: 20,
        weighting: 1,
        assessment_type: 'exam',
        subject: 'Mathématiques',
        class_name: 'M1A',
        school_year: '2025-2026',
      };

      expect(() => gradeSchema.parse(invalidGrade)).toThrow();
    });

    it('should reject empty subject', () => {
      const invalidGrade = {
        grade: 15,
        max_grade: 20,
        weighting: 1,
        assessment_type: 'exam',
        subject: '',
        class_name: 'M1A',
        school_year: '2025-2026',
      };

      expect(() => gradeSchema.parse(invalidGrade)).toThrow();
    });
  });

  describe('subjectSchema', () => {
    it('should validate a correct subject', () => {
      const validSubject = {
        subject_name: 'Mathématiques',
        teacher_name: 'M. Dupont',
        class_name: 'M1A',
        school_year: '2025-2026',
        semester: 'S1',
      };

      expect(() => subjectSchema.parse(validSubject)).not.toThrow();
    });

    it('should reject empty subject name', () => {
      const invalidSubject = {
        subject_name: '',
        teacher_name: 'M. Dupont',
        class_name: 'M1A',
        school_year: '2025-2026',
        semester: 'S1',
      };

      expect(() => subjectSchema.parse(invalidSubject)).toThrow();
    });

    it('should reject subject name > 100 characters', () => {
      const invalidSubject = {
        subject_name: 'a'.repeat(101),
        teacher_name: 'M. Dupont',
        class_name: 'M1A',
        school_year: '2025-2026',
        semester: 'S1',
      };

      expect(() => subjectSchema.parse(invalidSubject)).toThrow();
    });
  });
});
