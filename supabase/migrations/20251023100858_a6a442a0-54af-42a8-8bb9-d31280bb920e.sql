-- Phase 2: Populate subject_id for existing records

-- Update grades table by matching with subjects
UPDATE grades g
SET subject_id = s.id
FROM subjects s
WHERE g.subject = s.subject_name
  AND g.class_name = s.class_name
  AND g.school_year = s.school_year
  AND g.semester = s.semester
  AND g.teacher_id = s.teacher_id
  AND g.subject_id IS NULL;

-- Update assessments table by matching with subjects
UPDATE assessments a
SET subject_id = s.id
FROM subjects s
WHERE a.subject = s.subject_name
  AND a.class_name = s.class_name
  AND a.school_year = s.school_year
  AND a.semester = s.semester
  AND a.teacher_id = s.teacher_id
  AND a.subject_id IS NULL;